/* Botão "Ver tabela" nos exercícios e nas provas de SQL (Trilhas 1 e 2).

   Descobre de quais tabelas o exercício lê olhando o gabarito — o nome que vem
   depois de FROM, JOIN, INTO ou UPDATE — e, no clique, mostra o conteúdo delas
   como está AGORA no banco da página. Depois de um INSERT/UPDATE seu, a
   mudança já aparece ali.

   Não conhece motor nenhum: quem chama passa a função que roda SQL, porque
   cada trilha tem o seu (SQLite no app.js e na prova da Trilha 1, Postgres no
   app-pg.js e na prova da Trilha 2).

     VerTabela.criar({ sql, executar, esquema? })  ->  { botao, painel } ou null
       sql       o gabarito do exercício
       executar  async (sql) => { colunas, linhas }
       esquema   opcional: o ESQUEMA da trilha, pra mostrar o que é cada tabela

   Expõe window.VerTabela; é um <script> comum, carregado antes do motor. */

(function () {
  "use strict";

  const TABELAS = ["clientes", "produtos", "pedidos", "itens_pedido", "defeitos", "execucoes_teste"];
  const MAX_LINHAS = 1000;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // na ordem em que aparecem, sem repetir. Só vale nome de tabela conhecida:
  // assim "EXTRACT(YEAR FROM data_pedido)" ou o nome de uma CTE não viram tabela.
  function tabelasDe(sql) {
    const limpo = String(sql || "")
      .replace(/--[^\n]*/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/'(?:[^']|'')*'/g, " ");
    const achadas = [];
    const re = /\b(?:FROM|JOIN|INTO|UPDATE)\s+([A-Za-z_][A-Za-z0-9_]*)/gi;
    let m;
    while ((m = re.exec(limpo))) {
      const nome = m[1].toLowerCase();
      if (TABELAS.indexOf(nome) >= 0 && achadas.indexOf(nome) < 0) achadas.push(nome);
    }
    return achadas;
  }

  function celula(v) {
    if (v === null || v === undefined) return "<i style='color:var(--suave)'>NULL</i>";
    if (v instanceof Date) {
      const iso = v.toISOString();
      return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : esc(iso.replace("T", " ").replace(/\.\d+Z$/, ""));
    }
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "object") return esc(JSON.stringify(v));
    return esc(v);
  }

  function blocoTabela(nome, res, info) {
    const cols = info ? new Map(info.colunas.map((c) => [c[0], c])) : null;
    const linhas = res.linhas.slice(0, MAX_LINHAS);
    let h = '<div class="vt-tab"><h4><code>' + esc(nome) + "</code> <span>" +
      res.linhas.length + " linha(s)" +
      (res.linhas.length > linhas.length ? " — mostrando " + MAX_LINHAS : "") +
      "</span></h4>";
    if (info) h += "<p>" + esc(info.desc) + "</p>";
    h += '<div class="vt-rolagem"><table class="dados"><thead><tr>';
    h += res.colunas.map((c) => {
      const d = cols && cols.get(c);
      return "<th" + (d ? ' title="' + esc(d[1] + " — " + d[2]).replace(/"/g, "&quot;") + '"' : "") +
        ">" + esc(c) + "</th>";
    }).join("");
    h += "</tr></thead><tbody>";
    for (const ln of linhas) h += "<tr>" + ln.map((v) => "<td>" + celula(v) + "</td>").join("") + "</tr>";
    h += "</tbody></table></div></div>";
    return h;
  }

  function criar(op) {
    const nomes = tabelasDe(op.sql);
    if (!nomes.length) return null;

    const rotulo = nomes.length === 1 ? "Ver tabela " + nomes[0] : "Ver tabelas (" + nomes.join(", ") + ")";
    const botao = document.createElement("button");
    botao.type = "button";
    botao.textContent = rotulo;

    const painel = document.createElement("div");
    painel.className = "ver-tabela";
    painel.hidden = true;

    async function carregar() {
      painel.innerHTML = '<p class="dica">carregando…</p>';
      let html = "";
      try {
        for (const nome of nomes) {
          const res = await op.executar("SELECT * FROM " + nome + " ORDER BY 1;");
          const info = op.esquema && op.esquema.find((t) => t.tabela === nome);
          html += blocoTabela(nome, res, info);
        }
        html += '<p class="dica vt-rodape">Os dados como estão agora no banco desta página.' +
          (op.esquema ? " Passe o mouse no nome da coluna pra ver o que ela guarda." : "") + "</p>";
      } catch (e) {
        html = '<p class="msg-erro">Não deu pra ler a tabela (' + esc(e.message || e) +
          "). Se o banco ainda está carregando, espere o aviso de pronto e tente de novo.</p>";
      }
      if (!painel.hidden) painel.innerHTML = html;
    }

    botao.addEventListener("click", () => {
      painel.hidden = !painel.hidden;
      botao.textContent = painel.hidden ? rotulo : (nomes.length === 1 ? "Esconder tabela" : "Esconder tabelas");
      if (!painel.hidden) carregar();
    });

    return { botao, painel };
  }

  window.VerTabela = { criar, tabelasDe };
})();
