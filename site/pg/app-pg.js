/* Motor da Trilha 2 (PostgreSQL).
   Roda um Postgres de verdade dentro do navegador via PGlite (WebAssembly),
   carregado do CDN jsDelivr. Cria o banco a partir de seed.sql e roda as
   queries que o aluno escrever. Nada sai da máquina; o banco vive só na aba.

   É a versão "Postgres" do site/assets/app.js — mesma cara, mesmo editor,
   só troca o motor SQLite pelo Postgres e ajusta o que muda (tipos, datas). */

const PGLITE_URL = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.8/dist/index.js";

let db = null;
let seedSQL = null; // guardado pra poder "Resetar banco"

const autoRodar = []; // exemplos que rodam sozinhos quando o banco fica pronto

/* Estrutura do banco — painel que aparece em toda página de módulo.
   Aqui os tipos são os DO POSTGRES (é a diferença que a trilha ensina). */
const ESQUEMA = [
  {
    tabela: "clientes", n: 60,
    desc: "Quem compra na loja. 1 linha = 1 cliente.",
    colunas: [
      ["id", "integer", "identificador único do cliente (chave primária)"],
      ["nome", "text", "nome da pessoa"],
      ["email", "text", "e-mail — único, não repete"],
      ["cidade", "text", "cidade"],
      ["estado", "text", "sigla do estado, ex.: 'SP'"],
      ["data_cadastro", "date", "quando o cliente se cadastrou — tipo DATE de verdade"],
      ["ativo", "boolean", "TRUE = conta ativa, FALSE = inativa (não é 0/1)"],
    ],
  },
  {
    tabela: "produtos", n: 15,
    desc: "O catálogo da loja. 1 linha = 1 produto.",
    colunas: [
      ["id", "integer", "identificador único do produto (chave primária)"],
      ["nome", "text", "nome do produto"],
      ["categoria", "text", "ex.: 'Perifericos', 'Monitores', 'Armazenamento'"],
      ["preco", "numeric(10,2)", "preço de tabela — numérico exato, não float"],
      ["estoque", "integer", "quantidade em estoque"],
      ["ativo", "boolean", "TRUE = à venda, FALSE = fora de linha"],
    ],
  },
  {
    tabela: "pedidos", n: 200,
    desc: "Cada compra feita. 1 linha = 1 pedido. Liga em clientes por cliente_id.",
    colunas: [
      ["id", "integer", "identificador único do pedido (chave primária)"],
      ["cliente_id", "integer → clientes.id", "de quem é o pedido"],
      ["data_pedido", "date", "data da compra"],
      ["status", "text", "novo, pago, enviado, entregue ou cancelado"],
      ["valor_total", "numeric(10,2)", "valor do pedido"],
    ],
  },
  {
    tabela: "itens_pedido", n: 498,
    desc: "As linhas de cada pedido (o carrinho). 1 linha = 1 produto dentro de 1 pedido.",
    colunas: [
      ["id", "integer", "identificador único do item (chave primária)"],
      ["pedido_id", "integer → pedidos.id", "de qual pedido é este item"],
      ["produto_id", "integer → produtos.id", "qual produto"],
      ["quantidade", "integer", "quantas unidades"],
      ["preco_unitario", "numeric(10,2)", "preço de cada unidade no momento da compra"],
    ],
  },
  {
    tabela: "defeitos", n: 80,
    desc: "Bugs reportados pelo time de QA. 1 linha = 1 defeito.",
    colunas: [
      ["id", "integer", "identificador único do defeito (chave primária)"],
      ["titulo", "text", "resumo do problema"],
      ["modulo", "text", "login, carrinho, checkout, busca, pagamento ou perfil"],
      ["severidade", "text", "baixa, media, alta ou critica"],
      ["prioridade", "text", "P1, P2, P3 ou P4"],
      ["status", "text", "aberto, em_analise, resolvido, fechado ou reaberto"],
      ["reportado_por", "text", "qual QA abriu"],
      ["ambiente", "text", "dev, homolog ou producao"],
      ["data_abertura", "date", "quando foi aberto"],
      ["data_fechamento", "date ou NULL", "quando foi fechado — NULL = ainda aberto"],
    ],
  },
  {
    tabela: "execucoes_teste", n: 600,
    desc: "Cada vez que um caso de teste rodou. 1 linha = 1 execução.",
    colunas: [
      ["id", "integer", "identificador único da execução (chave primária)"],
      ["caso_teste", "text", "código do caso, ex.: 'CT-042'"],
      ["suite", "text", "regressao, smoke, e2e ou api"],
      ["resultado", "text", "passou, falhou, bloqueado ou pulado"],
      ["data_execucao", "date", "quando rodou"],
      ["duracao_seg", "integer", "quanto demorou, em segundos"],
      ["defeito_id", "integer → defeitos.id ou NULL", "bug ligado — preenchido quando falhou"],
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

async function iniciar() {
  try {
    const [pgMod, seedText] = await Promise.all([
      import(PGLITE_URL),
      fetch("seed.sql", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("seed.sql: HTTP " + r.status);
        return r.text();
      }),
    ]);
    const { PGlite } = pgMod;
    seedSQL = seedText;

    const comTimeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("o Postgres (PGlite) não respondeu em 30s")), 30000)
    );
    db = await Promise.race([PGlite.create(), comTimeout]);
    await db.exec(seedSQL);

    setStatus("Postgres pronto ✓", "var(--ok)");
    document.querySelectorAll("button[data-precisa-banco]").forEach((b) => (b.disabled = false));
    autoRodar.forEach((fn) => fn());
  } catch (e) {
    console.error("[trilha-pg] falha ao subir o Postgres:", e);
    mostrarAvisoServidor(e);
  }
}

function mostrarAvisoServidor(e) {
  setStatus("Postgres não carregou", "var(--erro)");
  const div = document.createElement("div");
  div.className = "aviso-servidor";
  div.innerHTML =
    "<strong>O Postgres não carregou.</strong> Confira:<br>" +
    "1) você está com internet? O motor do Postgres (PGlite) é baixado de um CDN na " +
    "primeira vez que a página abre — depois fica em cache.<br>" +
    "2) a página foi aberta por um servidor (o link publicado, ou " +
    "<code>python site/servir.py</code>) e não com duplo clique?<br>" +
    "3) tente recarregar com <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>, ou uma " +
    "janela anônima / outro navegador (Chrome/Edge) sem extensões.<br><br>" +
    "<small>Detalhe técnico (veja também o Console do navegador): " +
    (e && e.message ? e.message : e) + "</small>";
  const alvo = document.querySelector(".container");
  alvo.insertBefore(div, alvo.firstChild.nextSibling);
}

async function resetarBanco() {
  if (!db || !seedSQL) return;
  try {
    await db.exec(seedSQL); // o seed começa com DROP TABLE IF EXISTS, então recria do zero
    setStatus("banco resetado ✓ (dados originais de volta)", "var(--ok)");
  } catch (e) {
    setStatus("falha ao resetar: " + (e.message || e), "var(--erro)");
  }
}

/* roda uma ou mais instruções separadas por ';'. Mostra a última que
   devolver colunas; para INSERT/UPDATE/DELETE mostra quantas linhas mudaram. */
async function rodar(sql, destino) {
  destino.innerHTML = "";
  if (!db) {
    destino.innerHTML = '<p class="msg-erro">Banco ainda não carregou.</p>';
    return false;
  }
  const texto = sql.trim();
  if (!texto) return false;

  try {
    const resultados = await db.exec(texto); // array de {rows, fields, affectedRows}
    const ultimo = resultados[resultados.length - 1];

    if (ultimo && ultimo.fields && ultimo.fields.length > 0) {
      if (ultimo.rows.length > 0) {
        renderTabela(ultimo, destino);
      } else {
        destino.innerHTML =
          '<p class="msg-vazio">A query rodou sem erro, mas <strong>nenhuma linha</strong> ' +
          "atende às condições. Não é erro de sintaxe — é o filtro do <code>WHERE</code> " +
          "que não bateu com nada. Revise a condição.</p>";
      }
    } else {
      const n = ultimo && typeof ultimo.affectedRows === "number" ? ultimo.affectedRows : 0;
      destino.innerHTML =
        '<p class="msg-ok">OK — comando executado. ' + n + " linha(s) afetada(s).</p>";
    }
    return true;
  } catch (e) {
    destino.innerHTML =
      '<p class="msg-erro">ERRO SQL: ' + escapar(String(e.message || e)) + "</p>";
    return false;
  }
}

/* roda uma query só pra pegar os dados (sem desenhar) — a conferência
   automática precisa do resultado do gabarito pra comparar com o do aluno. */
async function execLinhas(sql) {
  const res = await db.exec(sql);
  const u = res[res.length - 1];
  if (!u || !u.fields || u.fields.length === 0) return { colunas: [], linhas: [] };
  const colunas = u.fields.map((f) => f.name);
  return { colunas, linhas: u.rows.map((r) => colunas.map((c) => r[c])) };
}

/* compara o que o aluno escreveu com o gabarito e pinta o veredito */
async function conferirExercicio(ex, sqlAluno, rodouOk, vd) {
  if (!window.Conferir || !vd) return;
  if (!ex.gabarito || !rodouOk || !sqlAluno.trim()) { Conferir.limpar(vd); return; }

  if (!Conferir.somenteLeitura(sqlAluno) || !Conferir.somenteLeitura(ex.gabarito)) {
    Conferir.pintar(vd, Conferir.NEUTRO_ESCRITA);
    return;
  }
  try {
    const got = await execLinhas(sqlAluno);
    const esp = await execLinhas(ex.gabarito);
    const v = Conferir.julgar(esp, got, ex.gabarito);
    Conferir.pintar(vd, v);
    if (v.estado === "ok" && window.Progresso) Progresso.marcarExercicio(ex.id);
  } catch (e) {
    Conferir.limpar(vd);
  }
}

/* formata um valor vindo do Postgres pra mostrar na tabela */
function formatarValor(v) {
  if (v === null || v === undefined) {
    return "<i style='color:var(--suave)'>NULL</i>";
  }
  if (v instanceof Date) {
    const iso = v.toISOString();
    // DATE puro volta como meia-noite UTC → mostra só a data
    if (iso.endsWith("T00:00:00.000Z")) return iso.slice(0, 10);
    return escapar(iso.replace("T", " ").replace(/\.\d+Z$/, ""));
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return escapar(JSON.stringify(v));
  return escapar(String(v));
}

function renderTabela(res, destino) {
  const colunas = res.fields.map((f) => f.name);
  const linhas = res.rows.slice(0, 200);

  let html = '<table class="dados"><thead><tr>';
  html += colunas.map((c) => "<th>" + escapar(c) + "</th>").join("");
  html += "</tr></thead><tbody>";
  for (const linha of linhas) {
    html += "<tr>";
    html += colunas.map((c) => "<td>" + formatarValor(linha[c]) + "</td>").join("");
    html += "</tr>";
  }
  html += "</tbody></table>";

  const extra = res.rows.length - linhas.length;
  html +=
    '<p class="contagem">' +
    res.rows.length +
    " linha(s)" +
    (extra > 0 ? " (mostrando as primeiras 200)" : "") +
    "</p>";
  destino.innerHTML = html;
}

function escapar(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---- realce de sintaxe nos editores (igual ao da Trilha 1) ------------ */
const SQL_KW = new Set(
  ("SELECT FROM WHERE AND OR NOT NULL IS IN LIKE ILIKE SIMILAR GLOB BETWEEN ORDER BY GROUP HAVING " +
   "LIMIT OFFSET FETCH FIRST ONLY DISTINCT AS JOIN LEFT RIGHT INNER OUTER FULL CROSS NATURAL LATERAL ON USING " +
   "UNION ALL EXCEPT INTERSECT INSERT INTO VALUES UPDATE SET DELETE RETURNING CREATE TEMP TEMPORARY " +
   "TABLE VIEW MATERIALIZED TRIGGER INDEX DROP ALTER RENAME ADD COLUMN PRIMARY KEY FOREIGN REFERENCES " +
   "DEFAULT UNIQUE CHECK CONSTRAINT GENERATED IDENTITY CASE WHEN THEN ELSE END ASC DESC NULLS COLLATE " +
   "CAST WITH RECURSIVE EXISTS ANY SOME ARRAY BEGIN COMMIT ROLLBACK TRANSACTION SAVEPOINT RELEASE " +
   "OVER PARTITION FILTER WINDOW RANGE ROWS GROUPING ROLLUP CUBE SETS TRUE FALSE UNKNOWN").split(/\s+/)
);
const SQL_FN = new Set(
  ("COUNT SUM AVG MIN MAX GREATEST LEAST STRING_AGG ARRAY_AGG JSON_AGG BOOL_AND BOOL_OR " +
   "COALESCE NULLIF ROUND ABS CEIL FLOOR TRUNC MOD POWER LENGTH CHAR_LENGTH LOWER UPPER INITCAP " +
   "TRIM LTRIM RTRIM BTRIM LPAD RPAD SUBSTRING SUBSTR LEFT RIGHT POSITION STRPOS SPLIT_PART REPLACE " +
   "REGEXP_REPLACE REGEXP_MATCHES CONCAT CONCAT_WS TO_CHAR TO_DATE TO_NUMBER TO_TIMESTAMP " +
   "NOW CURRENT_DATE CURRENT_TIMESTAMP AGE EXTRACT DATE_PART DATE_TRUNC MAKE_DATE " +
   "ROW_NUMBER RANK DENSE_RANK PERCENT_RANK NTILE LAG LEAD FIRST_VALUE LAST_VALUE NTH_VALUE " +
   "GENERATE_SERIES").split(/\s+/)
);
const SQL_TY = new Set(
  ("INTEGER INT INT2 INT4 INT8 SMALLINT BIGINT SERIAL BIGSERIAL TEXT VARCHAR CHAR BPCHAR " +
   "REAL FLOAT4 FLOAT8 DOUBLE PRECISION NUMERIC DECIMAL MONEY BOOLEAN BOOL " +
   "DATE TIME TIMESTAMP TIMESTAMPTZ INTERVAL BYTEA UUID JSON JSONB").split(/\s+/)
);

function realce(sql) {
  const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(::|[<>=!]+|\|\||[-+*/%,;().])/g;
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

const SALVA_BASE = "trilha-pg:" + location.pathname + ":";
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
  // em vez de mostrar scroll, o campo cresce conforme o texto passa das linhas visíveis
  const crescer = () => {
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + 2 + "px";
  };
  const pintar = () => {
    code.innerHTML = realce(ta.value + "\n");
    crescer();
    sync();
  };
  const salvar = () => { if (chave) gravarSalvo(chave, ta.value); };
  ta.addEventListener("input", () => { pintar(); salvar(); });
  ta.addEventListener("scroll", sync);

  const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  Object.defineProperty(ta, "value", {
    get() { return desc.get.call(this); },
    set(v) { desc.set.call(this, v); pintar(); salvar(); },
  });

  pintar();
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

    let bDica = null;
    if (dicaBox) {
      bDica = document.createElement("button");
      bDica.textContent = "Ver dica";
    }

    const bResp = document.createElement("button");
    bResp.textContent = "Ver resposta";

    // "Ver tabela": o conteúdo das tabelas que o exercício usa (../assets/ver-tabela.js)
    const verTab = window.VerTabela && VerTabela.criar({
      sql: ex.gabarito,
      executar: async (sql) => {
        if (!db) throw new Error("o banco ainda não carregou");
        return execLinhas(sql);
      },
      esquema: ESQUEMA,
    });

    acoes.appendChild(bRodar);
    if (bDica) acoes.appendChild(bDica);
    acoes.appendChild(bResp);
    if (verTab) acoes.appendChild(verTab.botao);
    card.appendChild(acoes);
    if (dicaBox) card.appendChild(dicaBox);
    if (verTab) card.appendChild(verTab.painel);

    // banner de veredito da conferência automática (fica acima da tabela)
    const vd = document.createElement("div");
    vd.className = "veredito";
    card.appendChild(vd);

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

    const rodarEConferir = async () => {
      const ok = await rodar(ta.value, resultado);
      await conferirExercicio(ex, ta.value, ok, vd);
    };
    bRodar.addEventListener("click", rodarEConferir);
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        rodarEConferir();
      }
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
    gab.querySelector("[data-usar-gab]").addEventListener("click", () => {
      ta.value = ex.gabarito;
      ta.focus();
    });

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
    "<summary>Estrutura do banco &mdash; as 6 tabelas e suas colunas (tipos do Postgres)</summary>" +
    '<div class="schema-corpo">' +
    '<p class="schema-intro">Mesmo cenário da Trilha 1, mas os <b>tipos</b> agora são os ' +
    "de verdade do PostgreSQL: <code>ativo</code> é <code>boolean</code> " +
    "(<code>TRUE</code>/<code>FALSE</code>, não 0/1), preços são <code>numeric</code> e as " +
    "datas são <code>date</code>. Uma coluna <code>x → outra.id</code> guarda o id de uma " +
    "linha de outra tabela (é o que os <code>JOIN</code> usam pra reconectar tudo).</p>";

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

function boot() {
  montarEsquema();
  montarExemplos();
  montarExercicios();
  montarQueryLivre();
  montarReset();
  iniciar();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
