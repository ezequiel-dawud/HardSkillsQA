/* Conferência automática dos exercícios dos módulos.

   Mesma ideia do corretor das provas (assets/prova-core.js): em vez de comparar
   o TEXTO da query do aluno com o do gabarito, roda as duas no mesmo banco e
   compara os RESULTADOS. Assim qualquer caminho que chegue nas mesmas linhas
   vale — que é como SQL funciona de verdade.

   Regras da comparação:
     - a ordem das COLUNAS importa (peça na ordem do enunciado);
     - a ordem das LINHAS só importa se o gabarito tiver ORDER BY;
     - números são arredondados a 2 casas antes de comparar;
     - NULL casa com NULL.

   Só confere exercício de LEITURA. Se a resposta (ou o gabarito) escreve no
   banco, rodar o gabarito teria efeito colateral — nesses casos o veredito vira
   um aviso neutro.

   Expõe window.Conferir; é um <script> comum, carregado antes de app.js. */

(function () {
  "use strict";

  /* ---- normalização de valores (igual à do prova-core) ------------------ */
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

  function mesmasLinhas(a, b, ordenado) {
    let sa = a.map((r) => JSON.stringify(r));
    let sb = b.map((r) => JSON.stringify(r));
    if (!ordenado) { sa = sa.slice().sort(); sb = sb.slice().sort(); }
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
    return true;
  }

  /* ---- texto da query: é leitura? tem ORDER BY? ------------------------- */
  function semComentariosNemTexto(sql) {
    return String(sql)
      .replace(/--[^\n]*/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/'(?:[^']|'')*'/g, " '…' ");
  }

  const ESCRITA = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|REPLACE|TRUNCATE|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|VACUUM|ATTACH)\b/i;

  function somenteLeitura(sql) {
    const limpo = semComentariosNemTexto(sql);
    if (ESCRITA.test(limpo)) return false;
    return /\b(SELECT|WITH|VALUES)\b/i.test(limpo);
  }

  function pedeOrdem(gabarito) {
    return /\bORDER\s+BY\b/i.test(semComentariosNemTexto(gabarito));
  }

  /* ---- o veredito ------------------------------------------------------- */
  /* esp/got: { colunas, linhas } — linhas é array de arrays. */
  function julgar(esp, got, gabarito) {
    const ordenado = pedeOrdem(gabarito);

    if (got.linhas.length !== esp.linhas.length) {
      return {
        estado: "erro",
        msg: "Ainda não bate: esperava <b>" + esp.linhas.length + " linha(s)</b> e a sua " +
             "query trouxe <b>" + got.linhas.length + "</b>. " +
             (got.linhas.length > esp.linhas.length
               ? "Provavelmente falta uma condição no <code>WHERE</code>."
               : "Provavelmente o filtro está estreito demais."),
      };
    }

    const a = esp.linhas.map(normLinha);
    const b = got.linhas.map(normLinha);

    if (a.length && b.length && a[0].length !== b[0].length) {
      return {
        estado: "erro",
        msg: "As linhas certas, mas o número de colunas não bate: esperava <b>" +
             a[0].length + "</b> e vieram <b>" + b[0].length + "</b>. " +
             "Peça exatamente as colunas do enunciado (a ordem delas conta).",
      };
    }

    if (mesmasLinhas(a, b, ordenado)) {
      return { estado: "ok", msg: "Bate com o esperado. ✓" };
    }

    // certas, mas fora de ordem: aviso, não erro — o conteúdo você acertou
    if (ordenado && mesmasLinhas(a, b, false)) {
      return {
        estado: "ordem",
        msg: "Você trouxe <b>as linhas certas</b>, mas em ordem diferente da pedida. " +
             "Confira o <code>ORDER BY</code> (e o <code>ASC</code>/<code>DESC</code>).",
      };
    }

    return {
      estado: "erro",
      msg: "O número de linhas bate, mas <b>os valores não</b>. Compare uma linha da sua " +
           "tabela com o que o enunciado pede — costuma ser a coluna errada, ou a ordem " +
           "das colunas trocada.",
    };
  }

  /* ---- pintar o veredito na página -------------------------------------- */
  const ICONE = { ok: "✅", ordem: "⚠️", erro: "❌", neutro: "ℹ️" };

  function pintar(el, v) {
    if (!el) return;
    if (!v) { el.className = "veredito"; el.innerHTML = ""; return; }
    el.className = "veredito v-" + v.estado;
    el.innerHTML = '<span class="vd-icone">' + ICONE[v.estado] + "</span> " + v.msg;
  }

  const limpar = (el) => pintar(el, null);

  const NEUTRO_ESCRITA = {
    estado: "neutro",
    msg: "Exercício que <b>escreve</b> no banco — a conferência automática não roda aqui " +
         "(rodar o gabarito mudaria os dados). Confira você mesmo com um <code>SELECT</code> " +
         "e compare com a resposta.",
  };

  window.Conferir = {
    julgar, pintar, limpar, somenteLeitura, pedeOrdem, NEUTRO_ESCRITA,
  };
})();
