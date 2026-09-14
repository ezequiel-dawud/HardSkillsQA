/* Motor da Trilha 4 (Teste de API).
   Sobe uma "API falsa" que responde dentro da própria página — nada de servidor.
   Nos exercícios você escreve um trechinho de JavaScript que faz requisições com
   `api(...)` e confere o resultado com `check(...)`.

   Dentro do editor de cada exercício você tem:
     api(metodo, caminho, corpo?)  -> Promise<{ status, ok, json, text, headers }>
     db                            -> a base crua (window.DADOS): db.produtos, db.pedidos, db.clientes, db.defeitos
     check(rotulo, condicao, obs?) -> registra um resultado (verde se `condicao` for verdadeira)
*/

(function () {
  const DADOS = window.DADOS || { produtos: [], clientes: [], pedidos: [], defeitos: [] };
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  // ---- A API FALSA ------------------------------------------------------
  // Contrato: JSON, status HTTP de mentira mas coerentes. Tem 2 BUGS PLANTADOS
  // de propósito (a trilha ensina a achar) — procure por "BUG PLANTADO".
  function criarAPI(dados) {
    const clonar = (x) => JSON.parse(JSON.stringify(x));

    function resposta(status, corpo) {
      const texto = corpo === undefined ? "" : JSON.stringify(corpo);
      return {
        status,
        ok: status >= 200 && status < 300,
        headers: { "content-type": "application/json" },
        json: corpo === undefined ? null : clonar(corpo),
        text: texto,
      };
    }

    function tratar(metodo, caminho, corpo) {
      const url = new URL(caminho, "http://api.local");
      const partes = url.pathname.split("/").filter(Boolean); // ["produtos","3"]
      const [recurso, id] = partes;
      const q = url.searchParams;

      // ---- /produtos ----
      if (recurso === "produtos" && metodo === "GET") {
        if (id === undefined) {
          let lista = dados.produtos;
          if (q.has("categoria")) lista = lista.filter((p) => p.categoria === q.get("categoria"));
          if (q.has("ativo")) {
            const quer = q.get("ativo") === "1" || q.get("ativo") === "true";
            lista = lista.filter((p) => p.ativo === quer);
          }
          return resposta(200, lista);
        }
        const p = dados.produtos.find((x) => x.id === Number(id));
        if (!p) return resposta(404, { erro: "produto não encontrado" });
        // BUG PLANTADO #1: no item individual, `preco` sai como string ("320.0")
        // em vez de número. Na lista (acima) vai certo. Contrato inconsistente.
        return resposta(200, Object.assign({}, p, { preco: String(p.preco) }));
      }

      // ---- /clientes ----
      if (recurso === "clientes" && metodo === "GET") {
        if (id === undefined) return resposta(200, dados.clientes);
        const c = dados.clientes.find((x) => x.id === Number(id));
        if (!c) return resposta(404, { erro: "cliente não encontrado" });
        if (partes[2] === "pedidos") {
          return resposta(200, dados.pedidos.filter((pd) => pd.cliente_id === c.id));
        }
        return resposta(200, c);
      }

      // ---- /pedidos ----
      if (recurso === "pedidos" && metodo === "GET") {
        if (id === undefined) {
          let lista = dados.pedidos;
          if (q.has("status")) lista = lista.filter((pd) => pd.status === q.get("status"));
          return resposta(200, lista);
        }
        const pd = dados.pedidos.find((x) => x.id === Number(id));
        if (!pd) return resposta(404, { erro: "pedido não encontrado" });
        // BUG PLANTADO #2: o pedido 3 volta com valor_total diferente do que
        // está na base (db.pedidos) — divergência API x banco.
        if (pd.id === 3) return resposta(200, Object.assign({}, pd, { valor_total: pd.valor_total + 100 }));
        return resposta(200, pd);
      }

      // ---- /defeitos ----
      if (recurso === "defeitos") {
        if (metodo === "GET") {
          let lista = dados.defeitos;
          if (q.has("severidade")) lista = lista.filter((d) => d.severidade === q.get("severidade"));
          if (q.has("modulo")) lista = lista.filter((d) => d.modulo === q.get("modulo"));
          return resposta(200, lista);
        }
        if (metodo === "POST") {
          const b = corpo || {};
          if (!b.titulo || !b.severidade) {
            return resposta(400, { erro: "titulo e severidade são obrigatórios" });
          }
          const novo = {
            id: Math.max(0, ...dados.defeitos.map((d) => d.id)) + 1,
            titulo: b.titulo,
            modulo: b.modulo || "desconhecido",
            severidade: b.severidade,
            status: "aberto",
            ambiente: b.ambiente || "dev",
          };
          dados.defeitos.push(novo);
          return resposta(201, novo);
        }
      }

      if (metodo !== "GET" && metodo !== "POST") {
        return resposta(405, { erro: "método não suportado" });
      }
      return resposta(404, { erro: "rota não encontrada: " + metodo + " " + url.pathname });
    }

    return function api(metodo, caminho, corpo) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(tratar(String(metodo).toUpperCase(), caminho, corpo)), 60);
      });
    };
  }

  // um estado "fresco" por página; resetável
  let dadosVivos = JSON.parse(JSON.stringify(DADOS));
  let api = criarAPI(dadosVivos);
  const db = DADOS; // base de referência (imutável) pros cross-checks

  function resetar() {
    dadosVivos = JSON.parse(JSON.stringify(DADOS));
    api = criarAPI(dadosVivos);
  }

  // ---- infra de UI ----------------------------------------------------
  function escapar(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  const SALVA_BASE = "trilha-api:" + location.pathname + ":";
  const lerSalvo = (k) => { try { return localStorage.getItem(SALVA_BASE + k); } catch (e) { return null; } };
  const gravarSalvo = (k, v) => { try { localStorage.setItem(SALVA_BASE + k, v); } catch (e) {} };
  function limparSalvos() {
    try {
      Object.keys(localStorage).filter((k) => k.indexOf(SALVA_BASE) === 0).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }

  async function rodarCodigo(codigo, destino) {
    destino.innerHTML = "";
    const resultados = [];
    const check = (rotulo, cond, obs) => resultados.push({ rotulo, ok: !!cond, obs });
    // um `expect` minúsculo, pra quem preferir esse estilo
    const expect = (valor) => ({
      toBe: (esp) => check("expect " + JSON.stringify(valor) + " === " + JSON.stringify(esp), valor === esp),
      toEqual: (esp) => check("expect (deep)", JSON.stringify(valor) === JSON.stringify(esp)),
    });
    try {
      const fn = new AsyncFunction("api", "db", "check", "expect", codigo);
      await fn(api, db, check, expect);
    } catch (e) {
      destino.innerHTML = '<p class="msg-erro">ERRO JS: ' + escapar(e && e.message ? e.message : e) + "</p>";
      return false;
    }
    if (resultados.length === 0) {
      destino.innerHTML =
        '<p class="msg-vazio">O código rodou, mas não chamou <code>check(...)</code> nenhuma vez. ' +
        "Um teste precisa <b>afirmar</b> algo — ex.: <code>check('status 200', r.status === 200)</code>.</p>";
      return false;
    }
    const todosOk = resultados.every((r) => r.ok);
    let html =
      '<p class="' + (todosOk ? "msg-ok" : "msg-erro") + '" style="font-weight:600">' +
      (todosOk ? "✓ todas as verificações passaram" : "✗ alguma verificação falhou") +
      " (" + resultados.filter((r) => r.ok).length + "/" + resultados.length + ")</p>";
    html += '<table class="dados"><tbody>';
    for (const r of resultados) {
      html +=
        "<tr><td>" + (r.ok ? "✓" : "✗") + "</td><td>" + escapar(r.rotulo) +
        (r.obs !== undefined ? ' <span style="color:var(--suave)">— ' + escapar(r.obs) + "</span>" : "") +
        "</td></tr>";
    }
    html += "</tbody></table>";
    destino.innerHTML = html;
    return todosOk;
  }

  function montarExemplos() {
    const cont = document.getElementById("exemplos");
    const EXEMPLOS = window.EXEMPLOS;
    if (!cont || !Array.isArray(EXEMPLOS)) return;
    EXEMPLOS.forEach((ex, i) => {
      const card = document.createElement("div");
      card.className = "card exercicio";
      if (ex.titulo) {
        const h = document.createElement("p");
        h.className = "enunciado";
        h.innerHTML = "<strong>" + ex.titulo + "</strong>";
        card.appendChild(h);
      }
      if (ex.explica) {
        const p = document.createElement("p");
        p.className = "dica";
        p.innerHTML = ex.explica;
        card.appendChild(p);
      }
      const ta = document.createElement("textarea");
      ta.className = "editor";
      ta.spellcheck = false;
      ta.rows = Math.min(14, (ex.sql.match(/\n/g) || []).length + 2);
      ta.value = ex.sql;
      card.appendChild(ta);

      const acoes = document.createElement("div");
      acoes.className = "acoes";
      const b = document.createElement("button");
      b.className = "primario";
      b.textContent = "Rodar";
      acoes.appendChild(b);
      card.appendChild(acoes);

      const res = document.createElement("div");
      res.className = "resultado";
      card.appendChild(res);

      b.addEventListener("click", () => rodarCodigo(ta.value, res));
      ta.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarCodigo(ta.value, res); }
      });
      cont.appendChild(card);
      // roda sozinho
      setTimeout(() => rodarCodigo(ta.value, res), 100 + i * 50);
    });
  }

  function montarExercicios() {
    const cont = document.getElementById("exercicios");
    const EXERCICIOS = window.EXERCICIOS;
    if (!cont || !Array.isArray(EXERCICIOS)) return;

    if (window.Progresso) Progresso.registrarTotal(EXERCICIOS.length);

    EXERCICIOS.forEach((ex) => {
      const card = document.createElement("div");
      card.className = "card exercicio";
      card.id = "ex-" + ex.id;

      const enun = document.createElement("p");
      enun.className = "enunciado";
      enun.innerHTML = '<span class="num">' + ex.id + ")</span> " + ex.enunciado;
      card.appendChild(enun);

      let dicaBox = null;
      if (ex.dica) {
        dicaBox = document.createElement("div");
        dicaBox.className = "dica-box";
        dicaBox.innerHTML = '<p class="dica">\u{1F4A1} ' + ex.dica + "</p>";
      }

      const ta = document.createElement("textarea");
      ta.className = "editor";
      ta.spellcheck = false;
      const inicial = ex.inicial || "";
      ta.rows = Math.max(6, (inicial.match(/\n/g) || []).length + 2);
      const salvo = lerSalvo("ex-" + ex.id);
      ta.value = salvo != null ? salvo : inicial;
      ta.addEventListener("input", () => gravarSalvo("ex-" + ex.id, ta.value));
      card.appendChild(ta);

      const acoes = document.createElement("div");
      acoes.className = "acoes";
      const bRodar = document.createElement("button");
      bRodar.className = "primario";
      bRodar.textContent = "Rodar";
      let bDica = null;
      if (dicaBox) { bDica = document.createElement("button"); bDica.textContent = "Ver dica"; }
      const bResp = document.createElement("button");
      bResp.textContent = "Ver resposta";
      acoes.appendChild(bRodar);
      if (bDica) acoes.appendChild(bDica);
      acoes.appendChild(bResp);
      card.appendChild(acoes);
      if (dicaBox) card.appendChild(dicaBox);

      const res = document.createElement("div");
      res.className = "resultado";
      card.appendChild(res);

      const gab = document.createElement("div");
      gab.className = "gabarito";
      gab.innerHTML =
        '<h3 style="margin-bottom:6px">Uma resposta possível</h3>' +
        '<pre class="bloco"><code>' + escapar(ex.gabarito) + "</code></pre>" +
        '<div class="acoes"><button data-usar-gab>Usar essa no editor</button></div>';
      card.appendChild(gab);

      // exercício dado como feito quando TODOS os check(...) do aluno passam
      const rodarEMarcar = async () => {
        const ok = await rodarCodigo(ta.value, res);
        if (ok && window.Progresso) Progresso.marcarExercicio(ex.id);
      };
      bRodar.addEventListener("click", rodarEMarcar);
      ta.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarEMarcar(); }
      });
      if (bDica) {
        bDica.addEventListener("click", () => {
          dicaBox.classList.toggle("aberto");
          bDica.textContent = dicaBox.classList.contains("aberto") ? "Esconder dica" : "Ver dica";
        });
      }
      bResp.addEventListener("click", () => {
        gab.classList.toggle("aberto");
        bResp.textContent = gab.classList.contains("aberto") ? "Esconder resposta" : "Ver resposta";
      });
      gab.querySelector("[data-usar-gab]").addEventListener("click", () => { ta.value = ex.gabarito; ta.focus(); });

      cont.appendChild(card);
    });

    const rodape = document.createElement("div");
    rodape.className = "acoes";
    rodape.style.marginTop = "6px";
    const bLimpar = document.createElement("button");
    bLimpar.textContent = "Limpar minhas respostas salvas (nesta página)";
    bLimpar.addEventListener("click", () => {
      if (!confirm("Apagar tudo o que você escreveu nos editores desta página?")) return;
      limparSalvos();
      location.reload();
    });
    rodape.appendChild(bLimpar);
    cont.appendChild(rodape);
  }

  function montarQueryLivre() {
    const btn = document.getElementById("btn-livre");
    const ta = document.getElementById("editor-livre");
    const res = document.getElementById("res-livre");
    if (!btn || !ta || !res) return;
    btn.addEventListener("click", () => rodarCodigo(ta.value, res));
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); rodarCodigo(ta.value, res); }
    });
  }

  function montarReset() {
    const b = document.getElementById("btn-reset");
    if (!b) return;
    b.addEventListener("click", () => {
      resetar();
      b.textContent = "banco resetado ✓";
      setTimeout(() => (b.textContent = "Resetar dados"), 1500);
    });
  }

  function boot() {
    montarExemplos();
    montarExercicios();
    montarQueryLivre();
    montarReset();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
