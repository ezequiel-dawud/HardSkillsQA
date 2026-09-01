/* Motor da parte prática: carrega o SQLite (sql.js) no navegador,
   abre uma cópia do pratica.db e roda as queries que o aluno escrever.
   Nada sai da máquina; o banco vive só na memória da aba. */

let db = null;
let SQL = null;
let bancoOriginal = null; // Uint8Array intacto, pra resetar

// caminhos configuráveis por página (permite o site ter várias trilhas em subpastas)
const ASSETS_BASE = window.ASSETS_BASE || "assets/";
const DB_URL = window.DB_URL || "assets/pratica.db";

// coisas pra rodar sozinhas assim que o banco terminar de carregar (ex.: os exemplos)
const autoRodar = [];

// Estrutura do banco de prática — mostrada num painel em toda página de módulo.
const ESQUEMA = [
  {
    tabela: "clientes", n: 60,
    desc: "Quem compra na loja. 1 linha = 1 cliente.",
    colunas: [
      ["id", "número", "identificador único do cliente (chave primária)"],
      ["nome", "texto", "nome da pessoa"],
      ["email", "texto", "e-mail — único, não repete"],
      ["cidade", "texto", "cidade"],
      ["estado", "texto", "sigla do estado, ex.: 'SP'"],
      ["data_cadastro", "texto AAAA-MM-DD", "quando o cliente se cadastrou"],
      ["ativo", "0 ou 1", "1 = conta ativa, 0 = inativa"],
    ],
  },
  {
    tabela: "produtos", n: 15,
    desc: "O catálogo da loja. 1 linha = 1 produto.",
    colunas: [
      ["id", "número", "identificador único do produto (chave primária)"],
      ["nome", "texto", "nome do produto"],
      ["categoria", "texto", "ex.: 'Perifericos', 'Monitores', 'Armazenamento'"],
      ["preco", "número", "preço de tabela"],
      ["estoque", "número", "quantidade em estoque"],
      ["ativo", "0 ou 1", "1 = à venda, 0 = fora de linha"],
    ],
  },
  {
    tabela: "pedidos", n: 200,
    desc: "Cada compra feita. 1 linha = 1 pedido. Liga em clientes por cliente_id.",
    colunas: [
      ["id", "número", "identificador único do pedido (chave primária)"],
      ["cliente_id", "número → clientes.id", "de quem é o pedido"],
      ["data_pedido", "texto AAAA-MM-DD", "data da compra"],
      ["status", "texto", "novo, pago, enviado, entregue ou cancelado"],
      ["valor_total", "número", "valor do pedido (deveria bater com a soma dos itens)"],
    ],
  },
  {
    tabela: "itens_pedido", n: "~500",
    desc: "As linhas de cada pedido (o carrinho). 1 linha = 1 produto dentro de 1 pedido.",
    colunas: [
      ["id", "número", "identificador único do item (chave primária)"],
      ["pedido_id", "número → pedidos.id", "de qual pedido é este item"],
      ["produto_id", "número → produtos.id", "qual produto"],
      ["quantidade", "número", "quantas unidades"],
      ["preco_unitario", "número", "preço de cada unidade no momento da compra"],
    ],
  },
  {
    tabela: "defeitos", n: 80,
    desc: "Bugs reportados pelo time de QA. 1 linha = 1 defeito.",
    colunas: [
      ["id", "número", "identificador único do defeito (chave primária)"],
      ["titulo", "texto", "resumo do problema"],
      ["modulo", "texto", "login, carrinho, checkout, busca, pagamento ou perfil"],
      ["severidade", "texto", "baixa, media, alta ou critica"],
      ["prioridade", "texto", "P1, P2, P3 ou P4"],
      ["status", "texto", "aberto, em_analise, resolvido, fechado ou reaberto"],
      ["reportado_por", "texto", "qual QA abriu"],
      ["ambiente", "texto", "dev, homolog ou producao"],
      ["data_abertura", "texto AAAA-MM-DD", "quando foi aberto"],
      ["data_fechamento", "texto ou NULL", "quando foi fechado — NULL = ainda aberto"],
    ],
  },
  {
    tabela: "execucoes_teste", n: 600,
    desc: "Cada vez que um caso de teste rodou. 1 linha = 1 execução.",
    colunas: [
      ["id", "número", "identificador único da execução (chave primária)"],
      ["caso_teste", "texto", "código do caso, ex.: 'CT-042'"],
      ["suite", "texto", "regressao, smoke, e2e ou api"],
      ["resultado", "texto", "passou, falhou, bloqueado ou pulado"],
      ["data_execucao", "texto AAAA-MM-DD", "quando rodou"],
      ["duracao_seg", "número", "quanto demorou, em segundos"],
      ["defeito_id", "número → defeitos.id ou NULL", "bug ligado — preenchido quando falhou"],
    ],
  },
];

const statusEl = () => document.getElementById("status-banco");

function setStatus(txt, cor) {
  const el = statusEl();
  if (el) {
    el.textContent = txt;
    if (cor) el.style.color = cor;
  }
}

async function baixar(url, rotulo) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(rotulo + ": HTTP " + r.status + " em " + url);
  return r.arrayBuffer();
}

async function iniciar() {
  try {
    // Baixa o .wasm e o .db nós mesmos e entrega o binário pronto pro sql.js.
    // Assim não dependemos do carregamento interno dele (instantiateStreaming),
    // que em alguns navegadores/extensões trava sem dar erro.
    const [wasmBinary, dbBuf] = await Promise.all([
      baixar(ASSETS_BASE + "sql-wasm.wasm", "motor SQLite (.wasm)"),
      baixar(DB_URL, "banco (pratica.db)"),
    ]);

    const comTimeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("o motor SQLite não respondeu em 20s")), 20000)
    );
    SQL = await Promise.race([
      initSqlJs({ wasmBinary, locateFile: () => ASSETS_BASE + "sql-wasm.wasm" }),
      comTimeout,
    ]);

    const buf = new Uint8Array(dbBuf);
    bancoOriginal = buf;
    db = new SQL.Database(buf);
    setStatus("banco pronto ✓", "var(--ok)");
    document.querySelectorAll("button[data-precisa-banco]").forEach((b) => (b.disabled = false));
    autoRodar.forEach((fn) => fn());
  } catch (e) {
    console.error("[curso-sql] falha ao carregar o banco:", e);
    mostrarAvisoServidor(e);
  }
}

function mostrarAvisoServidor(e) {
  setStatus("banco não carregou", "var(--erro)");
  const div = document.createElement("div");
  div.className = "aviso-servidor";
  div.innerHTML =
    "<strong>O banco não carregou.</strong> Confira:<br>" +
    "1) a página foi aberta por <code>http://localhost:8000</code> (e não com duplo clique)?<br>" +
    "2) o <code>python site/servir.py</code> ainda está rodando no terminal?<br>" +
    "3) se sim para os dois, tente recarregar com <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>, " +
    "ou abra numa janela anônima / outro navegador (Chrome/Edge) sem extensões.<br><br>" +
    "<small>Detalhe técnico (veja também o Console do navegador): " +
    (e && e.message ? e.message : e) + "</small>";
  const alvo = document.querySelector(".container");
  alvo.insertBefore(div, alvo.firstChild.nextSibling);
}

function resetarBanco() {
  if (!SQL || !bancoOriginal) return;
  if (db) db.close();
  db = new SQL.Database(bancoOriginal);
  setStatus("banco resetado ✓ (dados originais de volta)", "var(--ok)");
}

/* roda uma ou mais instruções separadas por ';'. Mostra a última que
   devolver linhas; para INSERT/UPDATE/DELETE mostra quantas linhas mudaram. */
function rodar(sql, destino) {
  destino.innerHTML = "";
  if (!db) {
    destino.innerHTML = '<p class="msg-erro">Banco ainda não carregou.</p>';
    return;
  }
  const texto = sql.trim();
  if (!texto) return;

  try {
    const statements = db.exec(texto); // array de {columns, values}
    if (statements.length > 0) {
      const ultimo = statements[statements.length - 1];
      renderTabela(ultimo, destino);
    } else if (ehConsulta(texto)) {
      // SELECT válido, porém 0 linhas: o sql.js devolve lista vazia
      destino.innerHTML =
        '<p class="msg-vazio">A query rodou sem erro, mas <strong>nenhuma linha</strong> ' +
        "atende às condições. Não é erro de sintaxe — é o filtro do " +
        "<code>WHERE</code> que não bateu com nada. Revise a condição.</p>";
    } else {
      const mudou = db.getRowsModified();
      destino.innerHTML =
        '<p class="msg-ok">OK — comando executado. ' +
        mudou +
        " linha(s) afetada(s).</p>";
    }
  } catch (e) {
    destino.innerHTML =
      '<p class="msg-erro">ERRO SQL: ' + escapar(String(e.message || e)) + "</p>";
  }
}

/* a última instrução é uma consulta (retorna linhas) e não um comando? */
function ehConsulta(sql) {
  const limpo = sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/;\s*$/, "")
    .trim();
  const ultima = limpo.split(";").pop().trim();
  return /^(SELECT|WITH|VALUES|PRAGMA|EXPLAIN)\b/i.test(ultima);
}

function renderTabela(res, destino) {
  if (!res || !res.values || res.values.length === 0) {
    destino.innerHTML =
      '<p class="msg-vazio">A query rodou sem erro, mas <strong>nenhuma linha</strong> ' +
      "atende às condições. Revise o <code>WHERE</code>.</p>";
    return;
  }
  const linhasMostradas = res.values.slice(0, 200);
  let html = '<table class="dados"><thead><tr>';
  html += res.columns.map((c) => "<th>" + escapar(c) + "</th>").join("");
  html += "</tr></thead><tbody>";
  for (const linha of linhasMostradas) {
    html += "<tr>";
    html += linha
      .map((v) => "<td>" + (v === null ? "<i style='color:var(--suave)'>NULL</i>" : escapar(String(v))) + "</td>")
      .join("");
    html += "</tr>";
  }
  html += "</tbody></table>";
  const extra = res.values.length - linhasMostradas.length;
  html +=
    '<p class="contagem">' +
    res.values.length +
    " linha(s)" +
    (extra > 0 ? " (mostrando as primeiras 200)" : "") +
    "</p>";
  destino.innerHTML = html;
}

function escapar(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---- realce de sintaxe nos editores ----------------------------------
   O <textarea> não colore texto, então colocamos um <pre> atrás dele com
   o mesmo texto tokenizado; o textarea fica com a letra transparente e só
   o cursor visível. Palavra reconhecida = palavra colorida: é o sinal de
   que a escrita está certa. */
const SQL_KW = new Set(
  ("SELECT FROM WHERE AND OR NOT NULL IS IN LIKE GLOB BETWEEN ORDER BY GROUP HAVING " +
   "LIMIT OFFSET DISTINCT AS JOIN LEFT RIGHT INNER OUTER FULL CROSS NATURAL ON USING " +
   "UNION ALL EXCEPT INTERSECT INSERT INTO VALUES UPDATE SET DELETE CREATE TEMP TEMPORARY " +
   "TABLE VIEW TRIGGER INDEX DROP ALTER RENAME ADD COLUMN PRIMARY KEY FOREIGN REFERENCES " +
   "DEFAULT UNIQUE CHECK CONSTRAINT AUTOINCREMENT CASE WHEN THEN ELSE END ASC DESC COLLATE " +
   "CAST WITH RECURSIVE EXISTS PRAGMA BEGIN COMMIT ROLLBACK TRANSACTION SAVEPOINT RELEASE " +
   "REPLACE IGNORE").split(/\s+/)
);
const SQL_FN = new Set(
  ("COUNT SUM AVG MIN MAX TOTAL GROUP_CONCAT COALESCE IFNULL NULLIF ROUND ABS LENGTH LOWER " +
   "UPPER TRIM LTRIM RTRIM SUBSTR INSTR DATE TIME DATETIME STRFTIME JULIANDAY TYPEOF RANDOM").split(/\s+/)
);
const SQL_TY = new Set(
  "INTEGER INT TEXT VARCHAR CHAR REAL FLOAT DOUBLE NUMERIC DECIMAL BLOB BOOLEAN".split(/\s+/)
);

function realce(sql) {
  const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([<>=!]+|\|\||[-+*/%,;().])/g;
  let out = "", last = 0, m;
  while ((m = re.exec(sql))) {
    out += escapar(sql.slice(last, m.index));
    last = re.lastIndex;
    if (m[1]) out += '<span class="tk-com">' + escapar(m[1]) + "</span>";
    else if (m[2]) out += '<span class="tk-str">' + escapar(m[2]) + "</span>";
    else if (m[3]) out += '<span class="tk-num">' + escapar(m[3]) + "</span>";
    else if (m[4]) {
      const up = m[4].toUpperCase();
      const cls = SQL_KW.has(up) ? "tk-kw" : SQL_FN.has(up) ? "tk-fn" : SQL_TY.has(up) ? "tk-ty" : "";
      out += cls ? '<span class="' + cls + '">' + escapar(m[4]) + "</span>" : escapar(m[4]);
    } else out += '<span class="tk-op">' + escapar(m[5]) + "</span>";
  }
  out += escapar(sql.slice(last));
  return out;
}

// prefixo das chaves no localStorage (uma "gaveta" por página)
const SALVA_BASE = "curso-sql:" + location.pathname + ":";

function lerSalvo(chave) {
  try { return localStorage.getItem(SALVA_BASE + chave); } catch (e) { return null; }
}
function gravarSalvo(chave, valor) {
  try { localStorage.setItem(SALVA_BASE + chave, valor); } catch (e) {}
}
function limparSalvos() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.indexOf(SALVA_BASE) === 0)
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
}

function realcar(ta, chave) {
  if (!ta || ta.dataset.realce) return;
  ta.dataset.realce = "1";

  // restaura o que o aluno já tinha escrito nesta página
  if (chave) {
    const salvo = lerSalvo(chave);
    if (salvo != null) ta.value = salvo;
  }

  const wrap = document.createElement("div");
  wrap.className = "editor-wrap";
  ta.parentNode.insertBefore(wrap, ta);

  const pre = document.createElement("pre");
  pre.className = "editor-hl";
  pre.setAttribute("aria-hidden", "true");
  const code = document.createElement("code");
  pre.appendChild(code);
  wrap.appendChild(pre);
  wrap.appendChild(ta);

  const sync = () => {
    pre.scrollTop = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
  };
  const pintar = () => {
    code.innerHTML = realce(ta.value + "\n");
    sync();
  };
  const salvar = () => { if (chave) gravarSalvo(chave, ta.value); };
  ta.addEventListener("input", () => { pintar(); salvar(); });
  ta.addEventListener("scroll", sync);

  // repinta/salva também quando o valor é trocado por código (ex.: "Usar essa no editor")
  const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  Object.defineProperty(ta, "value", {
    get() { return desc.get.call(this); },
    set(v) { desc.set.call(this, v); pintar(); salvar(); },
  });

  pintar();
}

/* monta cada exercício a partir do array EXERCICIOS definido na página */
function montarExercicios() {
  const cont = document.getElementById("exercicios");
  if (!cont || typeof EXERCICIOS === "undefined") return;

  EXERCICIOS.forEach((ex) => {
    const card = document.createElement("div");
    card.className = "card exercicio";
    card.id = "ex-" + ex.id;

    const enun = document.createElement("p");
    enun.className = "enunciado";
    enun.innerHTML = '<span class="num">' + ex.id + ")</span> " + ex.enunciado;
    card.appendChild(enun);

    if (ex.dica) {
      const dica = document.createElement("p");
      dica.className = "dica";
      dica.innerHTML = "\u{1F4A1} " + ex.dica;
      card.appendChild(dica);
    }

    const ta = document.createElement("textarea");
    ta.className = "editor";
    ta.spellcheck = false;
    ta.value = ex.inicial || "";
    ta.placeholder = "Escreva sua query aqui...";
    card.appendChild(ta);
    realcar(ta, "ex-" + ex.id);

    const acoes = document.createElement("div");
    acoes.className = "acoes";

    const bRodar = document.createElement("button");
    bRodar.className = "primario";
    bRodar.textContent = "Rodar";
    bRodar.dataset.precisaBanco = "1";
    bRodar.disabled = !db;

    const bResp = document.createElement("button");
    bResp.textContent = "Ver resposta";

    acoes.appendChild(bRodar);
    acoes.appendChild(bResp);
    card.appendChild(acoes);

    const resultado = document.createElement("div");
    resultado.className = "resultado";
    card.appendChild(resultado);

    const gab = document.createElement("div");
    gab.className = "gabarito";
    gab.innerHTML =
      '<h3 style="margin-bottom:6px">Uma resposta possível</h3>' +
      '<pre class="bloco"><code>' +
      escapar(ex.gabarito) +
      "</code></pre>" +
      '<div class="acoes"><button data-usar-gab>Usar essa no editor</button></div>';
    card.appendChild(gab);

    bRodar.addEventListener("click", () => rodar(ta.value, resultado));
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        rodar(ta.value, resultado);
      }
    });
    bResp.addEventListener("click", () => {
      gab.classList.toggle("aberto");
      bResp.textContent = gab.classList.contains("aberto") ? "Esconder resposta" : "Ver resposta";
    });
    gab.querySelector("[data-usar-gab]").addEventListener("click", () => {
      ta.value = ex.gabarito;
      ta.focus();
    });

    cont.appendChild(card);
  });

  // rodapé: apagar o que foi salvo nesta página
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

/* painel "Estrutura do banco" — renderiza em qualquer página que tenha
   <div id="schema-ref"></div> (ou é inserido antes de #exercicios). */
function montarEsquema() {
  let alvo = document.getElementById("schema-ref");
  if (!alvo) {
    const ex = document.getElementById("exercicios");
    if (!ex) return;
    alvo = document.createElement("div");
    ex.parentNode.insertBefore(alvo, ex);
  }

  const abrir = alvo.hasAttribute("data-aberto");
  let html =
    '<details class="schema"' + (abrir ? " open" : "") + ">" +
    "<summary>Estrutura do banco &mdash; as 6 tabelas e suas colunas</summary>" +
    '<div class="schema-corpo">' +
    '<p class="schema-intro">Uma <b>tabela</b> é como uma planilha: as <b>colunas</b> ' +
    "são os campos e cada <b>linha</b> é um registro. Na query você diz de qual tabela " +
    "quer ler escrevendo o nome dela depois de <code>FROM</code> &mdash; por isso " +
    "<code>FROM produtos</code> lê da tabela de produtos. Uma coluna do tipo " +
    "<code>x → outra.id</code> guarda o id de uma linha de outra tabela (é o que os " +
    "<code>JOIN</code> usam pra reconectar tudo).</p>";

  for (const t of ESQUEMA) {
    html +=
      '<div class="schema-tab">' +
      '<h4><code>' + t.tabela + "</code> <span>" + t.n + " linhas</span></h4>" +
      "<p>" + t.desc + "</p>" +
      '<table class="dados"><thead><tr><th>coluna</th><th>tipo</th><th>o que é</th></tr></thead><tbody>';
    for (const c of t.colunas) {
      html +=
        "<tr><td><code>" + c[0] + "</code></td><td>" + escapar(c[1]) + "</td><td>" + escapar(c[2]) + "</td></tr>";
    }
    html += "</tbody></table></div>";
  }
  html += "</div></details>";
  alvo.innerHTML = html;
}

/* exemplos guiados — array window.EXEMPLOS renderizado em #exemplos.
   Cada um já vem preenchido e roda sozinho quando o banco carrega. */
function montarExemplos() {
  const cont = document.getElementById("exemplos");
  if (!cont || typeof EXEMPLOS === "undefined") return;

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
    ta.value = ex.sql;
    card.appendChild(ta);
    realcar(ta, "exemplo-" + i);

    const acoes = document.createElement("div");
    acoes.className = "acoes";
    const bRodar = document.createElement("button");
    bRodar.className = "primario";
    bRodar.textContent = "Rodar";
    bRodar.dataset.precisaBanco = "1";
    bRodar.disabled = !db;
    acoes.appendChild(bRodar);
    card.appendChild(acoes);

    const resultado = document.createElement("div");
    resultado.className = "resultado";
    card.appendChild(resultado);

    bRodar.addEventListener("click", () => rodar(ta.value, resultado));
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        rodar(ta.value, resultado);
      }
    });

    cont.appendChild(card);
    autoRodar.push(() => rodar(ta.value, resultado));
  });
}

/* área de query livre (opcional na página) */
function montarQueryLivre() {
  const btn = document.getElementById("btn-livre");
  const ta = document.getElementById("editor-livre");
  const res = document.getElementById("res-livre");
  if (!btn || !ta || !res) return;
  realcar(ta, "livre");
  btn.dataset.precisaBanco = "1";
  btn.disabled = !db;
  btn.addEventListener("click", () => rodar(ta.value, res));
  ta.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      rodar(ta.value, res);
    }
  });
}

function montarReset() {
  const b = document.getElementById("btn-reset");
  if (!b) return;
  b.addEventListener("click", resetarBanco);
}

document.addEventListener("DOMContentLoaded", () => {
  montarEsquema();
  montarExemplos();
  montarExercicios();
  montarQueryLivre();
  montarReset();
  iniciar();
});
