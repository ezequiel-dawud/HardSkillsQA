/* Motor das PROVAS por módulo (Trilhas SQL e PostgreSQL).
   Não fala com nenhum servidor: usa o mesmo banco que roda no navegador
   (SQLite via sql.js na Trilha 1, Postgres via PGlite na Trilha 2), exposto
   por um adaptador em window.PROVA_MOTOR.

   Cada página de prova define window.PROVA:
     { titulo, trilha, modulo, indiceHref, questoes: [...] }

   Tipos de questão:
     { t:"sql",     enun, dica?, ordenado?, gab }          -> compara o RESULTADO da query
     { t:"escrita", enun, dica?, gab, checa }              -> roda o comando e confere com um SELECT
     { t:"mc",      enun, ops:[...], correta:idx, exp? }   -> múltipla escolha
     { t:"aberta",  enun, dica?, modelo }                   -> resposta escrita, NÃO entra na nota
                                                               (mostra uma resposta modelo pra você se comparar)

   Correção: roda a resposta do aluno E o gabarito no mesmo banco e compara os
   conjuntos de linhas. Nome/apelido de coluna não importa; a ORDEM das colunas
   importa (peça na ordem do enunciado). A ordem das LINHAS só importa quando a
   questão traz ordenado:true. Números são comparados arredondados a 2 casas. */

(function () {
  "use strict";

  const P = window.PROVA;
  const raiz = document.getElementById("prova");
  if (!P || !raiz) return;

  // Prova conceitual (só múltipla escolha / resposta aberta) não precisa de banco:
  // nesse caso um motor de mentira basta pro resto do código não ter caso especial.
  const semBanco = P.questoes.every((q) => q.t === "mc" || q.t === "aberta");
  const M = window.PROVA_MOTOR || (semBanco ? {
    nome: "conceitual",
    pronto: () => Promise.resolve(),
    resetar: async () => {},
    executar: async () => ({ colunas: [], linhas: [] }),
  } : null);
  if (!M) return;

  const CHAVE = "prova:" + location.pathname + ":";
  const guardar = (k, v) => { try { localStorage.setItem(CHAVE + k, v); } catch (e) {} };
  const ler = (k) => { try { return localStorage.getItem(CHAVE + k); } catch (e) { return null; } };
  const limparTudo = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.indexOf(CHAVE) === 0)
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- normalização e comparação de resultados ------------------------- */
  function normCel(v) {
    if (v === null || v === undefined) return "∅";
    if (v instanceof Date) {
      const s = v.toISOString();
      return s.endsWith("T00:00:00.000Z") ? s.slice(0, 10) : s;
    }
    if (typeof v === "boolean") return v ? "t" : "f";
    if (typeof v === "number") return String(Math.round(v * 100) / 100);
    const s = String(v).trim();
    if (s !== "" && !isNaN(Number(s))) return String(Math.round(Number(s) * 100) / 100);
    return s;
  }
  const normLinha = (l) => l.map(normCel);

  function comparar(esp, got, ordenado) {
    if (esp.length !== got.length) {
      return { ok: false, motivo: "esperava " + esp.length + " linha(s), sua query trouxe " + got.length };
    }
    const a = esp.map(normLinha), b = got.map(normLinha);
    if (a[0] && b[0] && a[0].length !== b[0].length) {
      return { ok: false, motivo: "esperava " + a[0].length + " coluna(s), sua query trouxe " + b[0].length };
    }
    let sa = a.map((r) => JSON.stringify(r));
    let sb = b.map((r) => JSON.stringify(r));
    if (!ordenado) { sa = sa.slice().sort(); sb = sb.slice().sort(); }
    for (let i = 0; i < sa.length; i++) {
      if (sa[i] !== sb[i]) {
        return { ok: false, motivo: ordenado
          ? "as linhas certas, mas em ordem diferente da pedida (ou algum valor não bate)"
          : "os valores não batem com o esperado" };
      }
    }
    return { ok: true };
  }

  function tabelaHTML(res, limite) {
    limite = limite || 12;
    const linhas = res.linhas.slice(0, limite);
    let h = '<div class="prova-tab"><table class="dados"><thead><tr>';
    h += res.colunas.map((c) => "<th>" + esc(c) + "</th>").join("");
    h += "</tr></thead><tbody>";
    for (const ln of linhas) {
      h += "<tr>" + ln.map((v) => "<td>" + (v === null || v === undefined
        ? "<i style='color:var(--suave)'>NULL</i>" : esc(String(v))) + "</td>").join("") + "</tr>";
    }
    h += "</tbody></table>";
    const extra = res.linhas.length - linhas.length;
    h += '<p class="contagem">' + res.linhas.length + " linha(s)" +
      (extra > 0 ? " (mostrando " + limite + ")" : "") + "</p></div>";
    return h;
  }

  /* ---- estado -------------------------------------------------------------- */
  const N = P.questoes.length;
  // questões abertas são pra você se comparar com o modelo — não entram na nota
  const NG = P.questoes.filter((q) => q.t !== "aberta").length;
  const respostas = new Array(N).fill("");
  const escolhas = new Array(N).fill(-1);
  const els = []; // { editor?, radios?, veredito, painel }
  let corrigida = false;

  /* ---- montagem --------------------------------------------------------- */
  function montar() {
    const intro = document.createElement("div");
    intro.className = "card prova-intro";
    const temAberta = N !== NG;
    intro.innerHTML =
      "<p style='margin-top:0'><strong>Como funciona.</strong> Responda as " + N +
      " questões e clique <strong>Corrigir prova</strong> no fim. A correção é automática" +
      (semBanco ? "." : ": para as questões de query, o resultado da sua consulta é comparado com o esperado.") +
      "</p><ul style='margin:0'>" +
      (semBanco ? "" :
        "<li>Nome ou apelido de coluna não importa; a <b>ordem das colunas</b> importa — peça na ordem do enunciado.</li>" +
        "<li>A ordem das <b>linhas</b> só é cobrada quando o enunciado pede um <code>ORDER BY</code> específico.</li>") +
      (temAberta ?
        "<li>As questões marcadas como <b>abertas</b> não entram na nota (" + NG + " valem nota): " +
        "elas mostram uma <b>resposta modelo</b> pra você comparar com a sua — escrever bem é parte do trabalho.</li>" : "") +
      "<li>Suas respostas ficam salvas neste navegador." +
      (semBanco ? "" : " Motor: <b>" + esc(M.nome) + "</b>.") + "</li></ul>";
    raiz.appendChild(intro);

    const melhor = ler("melhor");
    if (melhor != null) {
      const b = document.createElement("p");
      b.className = "prova-melhor";
      b.textContent = "Melhor nota até agora nesta prova: " + melhor + "/" + NG;
      raiz.appendChild(b);
    }

    P.questoes.forEach((q, i) => {
      const card = document.createElement("div");
      card.className = "card exercicio prova-q";
      card.id = "q-" + (i + 1);

      const enun = document.createElement("p");
      enun.className = "enunciado";
      enun.innerHTML = '<span class="num">' + (i + 1) + ")</span> " + q.enun;
      card.appendChild(enun);

      const ref = { veredito: null, painel: null };

      if (q.t === "mc") {
        const lista = document.createElement("div");
        lista.className = "prova-ops";
        ref.radios = [];
        // A ordem de EXIBIÇÃO das alternativas é embaralhada a cada carregamento.
        // Sem isso, quem escreve a prova tende a deixar a certa sempre na mesma
        // posição e o aluno aprende a posição, não o conteúdo. `escolhas` e o
        // localStorage continuam guardando o índice ORIGINAL da alternativa.
        const ordem = q.ops.map((_, j) => j);
        for (let k = ordem.length - 1; k > 0; k--) {
          const t = Math.floor(Math.random() * (k + 1));
          const tmp = ordem[k]; ordem[k] = ordem[t]; ordem[t] = tmp;
        }
        ref.ordem = ordem;
        ordem.forEach((orig, pos) => {
          const id = "q" + i + "op" + pos;
          const linha = document.createElement("label");
          linha.className = "prova-op";
          linha.htmlFor = id;
          const r = document.createElement("input");
          r.type = "radio";
          r.name = "q" + i;
          r.id = id;
          r.value = String(orig);
          r.addEventListener("change", () => {
            escolhas[i] = orig;
            guardar("mc" + i, String(orig));
          });
          const sp = document.createElement("span");
          sp.innerHTML = q.ops[orig];
          linha.appendChild(r);
          linha.appendChild(sp);
          lista.appendChild(linha);
          ref.radios[orig] = r; // indexado pelo original, pro restore funcionar
        });
        card.appendChild(lista);
        const salvo = ler("mc" + i);
        if (salvo != null && ref.radios[+salvo]) {
          ref.radios[+salvo].checked = true;
          escolhas[i] = +salvo;
        }
      } else if (q.t === "aberta") {
        const tag = document.createElement("p");
        tag.className = "dica";
        tag.innerHTML = "\u{270D}\u{FE0F} <b>Questão aberta</b> — não entra na nota. " +
          "Escreva com suas palavras; na correção aparece uma resposta modelo pra você comparar.";
        card.appendChild(tag);
        if (q.dica) {
          const d = document.createElement("p");
          d.className = "dica";
          d.innerHTML = "\u{1F4A1} " + q.dica;
          card.appendChild(d);
        }
        const ta = document.createElement("textarea");
        ta.className = "editor editor-texto";
        ta.rows = 5;
        ta.placeholder = "Escreva sua resposta aqui...";
        const salvo = ler("ab" + i);
        if (salvo != null) ta.value = salvo;
        respostas[i] = ta.value;
        ta.addEventListener("input", () => {
          respostas[i] = ta.value;
          guardar("ab" + i, ta.value);
        });
        card.appendChild(ta);
        ref.editor = ta;
      } else {
        if (q.dica) {
          const d = document.createElement("p");
          d.className = "dica";
          d.innerHTML = "\u{1F4A1} " + q.dica;
          card.appendChild(d);
        }
        const ta = document.createElement("textarea");
        ta.className = "editor";
        ta.spellcheck = false;
        ta.placeholder = q.t === "escrita"
          ? "Escreva o comando (INSERT / UPDATE / DELETE) aqui..."
          : "Escreva sua query aqui...";
        const salvo = ler("sql" + i);
        if (salvo != null) ta.value = salvo;
        respostas[i] = ta.value;
        // o campo cresce conforme o texto, em vez de mostrar scroll
        const crescer = () => {
          ta.style.height = "auto";
          ta.style.height = ta.scrollHeight + 2 + "px";
        };
        ta.addEventListener("input", () => {
          respostas[i] = ta.value;
          guardar("sql" + i, ta.value);
          crescer();
        });
        requestAnimationFrame(crescer);
        ta.addEventListener("keydown", (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            provaTeste(i);
          }
        });
        card.appendChild(ta);
        ref.editor = ta;

        const acoes = document.createElement("div");
        acoes.className = "acoes";
        const bt = document.createElement("button");
        bt.textContent = "Testar (ver meu resultado)";
        bt.addEventListener("click", () => provaTeste(i));
        acoes.appendChild(bt);
        // "Ver tabela": o conteúdo das tabelas da questão (assets/ver-tabela.js)
        const verTab = window.VerTabela && VerTabela.criar({ sql: q.gab, executar: M.executar });
        if (verTab) acoes.appendChild(verTab.botao);
        card.appendChild(acoes);
        if (verTab) card.appendChild(verTab.painel);
      }

      const ver = document.createElement("div");
      ver.className = "prova-veredito";
      card.appendChild(ver);
      ref.veredito = ver;

      const painel = document.createElement("div");
      painel.className = "prova-painel";
      card.appendChild(painel);
      ref.painel = painel;

      els.push(ref);
      raiz.appendChild(card);
    });

    const rodape = document.createElement("div");
    rodape.className = "prova-rodape";
    rodape.innerHTML =
      '<button class="primario" id="btn-corrigir">Corrigir prova</button>' +
      '<button id="btn-refazer" hidden>Refazer (mantém respostas)</button>' +
      '<button id="btn-limpar">Limpar minhas respostas</button>';
    raiz.appendChild(rodape);

    const placar = document.createElement("div");
    placar.id = "prova-placar";
    raiz.appendChild(placar);

    document.getElementById("btn-corrigir").addEventListener("click", corrigir);
    document.getElementById("btn-limpar").addEventListener("click", () => {
      if (!confirm("Apagar tudo o que você respondeu nesta prova?")) return;
      limparTudo();
      location.reload();
    });
    document.getElementById("btn-refazer").addEventListener("click", () => {
      corrigida = false;
      els.forEach((r) => { r.veredito.innerHTML = ""; r.veredito.className = "prova-veredito"; r.painel.innerHTML = ""; });
      placar.innerHTML = "";
      document.getElementById("btn-refazer").hidden = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (P.indiceHref) {
      const nav = document.createElement("nav");
      nav.className = "acoes";
      nav.style.marginTop = "28px";
      nav.innerHTML = '<a href="' + P.indiceHref + '"><button>← Índice da trilha</button></a>';
      raiz.appendChild(nav);
    }
  }

  /* ---- "Testar" numa questão (não conta nota, só mostra o retorno) ----- */
  async function provaTeste(i) {
    const q = P.questoes[i];
    const alvo = els[i].painel;
    alvo.innerHTML = '<p class="dica">rodando...</p>';
    const sql = (els[i].editor.value || "").trim();
    if (!sql) { alvo.innerHTML = '<p class="msg-vazio">Escreva algo antes de testar.</p>'; return; }
    try {
      if (q.t === "escrita") {
        await M.resetar();
        await M.executar(sql);
        const r = await M.executar(q.checa);
        await M.resetar();
        alvo.innerHTML = '<p class="dica">Estado depois do seu comando (via <code>' +
          esc(q.checa) + "</code>):</p>" + tabelaHTML(r);
      } else {
        const r = await M.executar(sql);
        alvo.innerHTML = '<p class="dica">Seu resultado:</p>' + tabelaHTML(r);
      }
    } catch (e) {
      alvo.innerHTML = '<p class="msg-erro">ERRO SQL: ' + esc(e.message || e) + "</p>";
      try { await M.resetar(); } catch (x) {}
    }
  }

  /* ---- correção da prova inteira -------------------------------------- */
  async function corrigir() {
    const btn = document.getElementById("btn-corrigir");
    btn.disabled = true;
    btn.textContent = "Corrigindo...";
    let acertos = 0;

    for (let i = 0; i < N; i++) {
      const q = P.questoes[i];
      const ref = els[i];
      let ok = false;
      let detalhe = "";

      try {
        if (q.t === "aberta") {
          const resp = (ref.editor.value || "").trim();
          ref.veredito.className = "prova-veredito " + (resp ? "certo" : "errado");
          ref.veredito.textContent = resp ? "\u{270D} respondida (não entra na nota)" : "\u{270D} em branco";
          ref.painel.innerHTML =
            '<details class="prova-gab" open><summary>Resposta modelo — compare com a sua</summary>' +
            '<div class="modelo">' + q.modelo + "</div></details>";
          continue;
        }
        if (q.t === "mc") {
          ok = escolhas[i] === q.correta;
          // a letra mostrada é a POSIÇÃO exibida nesta rodada, não o índice original
          const posCerta = ref.ordem ? ref.ordem.indexOf(q.correta) : q.correta;
          detalhe = '<p class="dica">Resposta certa: <b>' +
            esc(letra(posCerta)) + ")</b> " + q.ops[q.correta] +
            (q.exp ? "<br>" + q.exp : "") + "</p>";
        } else if (q.t === "escrita") {
          const resp = (ref.editor.value || "").trim();
          if (!resp) throw new Error("em branco");
          await M.resetar();
          await M.executar(resp);
          const got = await M.executar(q.checa);
          await M.resetar();
          await M.executar(q.gab);
          const esp = await M.executar(q.checa);
          await M.resetar();
          const cmp = comparar(esp.linhas, got.linhas, false);
          ok = cmp.ok;
          detalhe = (ok ? "" : '<p class="msg-erro">' + cmp.motivo + "</p>") +
            '<p class="dica">Conferido com <code>' + esc(q.checa) +
            "</code>. Estado esperado:</p>" + tabelaHTML(esp) +
            gabBloco(q.gab);
        } else {
          const resp = (ref.editor.value || "").trim();
          if (!resp) throw new Error("em branco");
          const got = await M.executar(resp);
          const esp = await M.executar(q.gab);
          const cmp = comparar(esp.linhas, got.linhas, !!q.ordenado);
          ok = cmp.ok;
          detalhe = (ok ? "" : '<p class="msg-erro">' + cmp.motivo + "</p>") +
            '<p class="dica">Resultado esperado:</p>' + tabelaHTML(esp) +
            gabBloco(q.gab);
        }
      } catch (e) {
        ok = false;
        detalhe = '<p class="msg-erro">' +
          (String(e.message || e) === "em branco"
            ? "Você não respondeu esta questão."
            : "Sua resposta deu erro: " + esc(e.message || e)) + "</p>" +
          (q.t !== "mc" ? gabBloco(q.gab) : "");
        try { await M.resetar(); } catch (x) {}
      }

      if (ok) acertos++;
      ref.veredito.className = "prova-veredito " + (ok ? "certo" : "errado");
      ref.veredito.textContent = ok ? "✓ certo" : "✗ errado";
      ref.painel.innerHTML = detalhe;
    }

    corrigida = true;
    btn.disabled = false;
    btn.textContent = "Corrigir prova";
    document.getElementById("btn-refazer").hidden = false;

    // floor, não round: 69,6% não pode aparecer como "70%" e ser reprovado no progresso
    const pct = Math.floor((100 * acertos) / NG);
    const passou = pct >= 70;
    const melhorAnt = parseInt(ler("melhor") || "-1", 10);
    if (acertos > melhorAnt) guardar("melhor", String(acertos));
    // alimenta o progresso mostrado no índice da trilha
    if (window.Progresso) Progresso.registrarProva(acertos, NG);

    const placar = document.getElementById("prova-placar");
    placar.className = passou ? "ok" : "abaixo";
    placar.innerHTML =
      "<h2 style='border:0;margin:8px 0'>Nota: " + acertos + "/" + NG + " (" + pct + "%)</h2>" +
      "<p style='margin:0'>" +
      (passou
        ? "Passou. ✅ De 70% pra cima considera-se que o módulo está firme — ele já conta como " +
          "concluído na barra de progresso da trilha."
        : "Abaixo de 70%. Revise o módulo e refaça — as questões erradas mostram o gabarito acima. " +
          "A sua melhor nota já faz a barra da trilha andar um pouco; com 70% o módulo conta inteiro.") +
      "</p>";
    placar.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const letra = (i) => "abcdefghij"[i] || String(i + 1);
  function gabBloco(sql) {
    return '<details class="prova-gab"><summary>Ver um gabarito</summary>' +
      '<pre class="bloco"><code>' + esc(sql) + "</code></pre></details>";
  }

  /* ---- start ---------------------------------------------------------- */
  montar();
  const aviso = document.getElementById("status-banco");
  M.pronto()
    .then(() => { if (aviso) { aviso.textContent = M.nome + " pronto ✓"; aviso.style.color = "var(--ok)"; } })
    .catch((e) => {
      if (aviso) { aviso.textContent = "o banco não carregou: " + (e.message || e); aviso.style.color = "var(--erro)"; }
    });
})();
