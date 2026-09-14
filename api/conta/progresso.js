/* POST /api/conta/progresso   { nome, mudancas: [{ k, v }] }  ->  200 { dados: { k: v, ... } }

   Aplica as mudanças que o navegador acumulou em cima do que já está guardado
   e devolve o progresso inteiro, já juntado. Mandar mudancas: [] só busca.

   As chaves são as mesmas do site/assets/progresso.js:
     ex:<pagina>:<id>  "1"      exercício feito      (v: null desfaz)
     extot:<pagina>    "10"     total de exercícios
     mod:<pagina>      "1"      módulo concluído     (v: null desmarca)
     prova:<pagina>    "8/9"    melhor nota — só troca se a nova acertou mais */

const { redis, lote } = require("../_lib/banco");
const c = require("../_lib/comum");

const MAX_MUDANCAS = 5000;
const MAX_CHAVES = 5000;

const FORMATO = {
  ex: /^1$/,
  extot: /^\d{1,4}$/,
  mod: /^1$/,
  prova: /^\d{1,4}\/\d{1,4}$/,
};

function mudancaValida(m) {
  if (!m || typeof m.k !== "string") return false;
  const tipo = /^(ex|extot|mod|prova):[\x21-\x7e]{1,250}$/.exec(m.k);
  if (!tipo) return false;
  return m.v === null || (typeof m.v === "string" && FORMATO[tipo[1]].test(m.v));
}

const acertos = (nota) => Number(String(nota).split("/")[0]);

module.exports = c.rota(async (req, res, corpo) => {
  const n = c.validarNome(corpo.nome);
  if (n.erro) return c.responder(res, 400, { erro: n.erro });
  if (!(await c.buscarUsuario(n.chave))) {
    return c.responder(res, 404, { erro: "Essa conta não existe mais." });
  }

  const mudancas = Array.isArray(corpo.mudancas) ? corpo.mudancas : [];
  if (mudancas.length > MAX_MUDANCAS) {
    return c.responder(res, 413, { erro: "Mudanças demais de uma vez." });
  }

  const kProg = "progresso:" + n.chave;
  const lista = (await redis(["HGETALL", kProg])) || [];
  const antes = {};
  for (let i = 0; i < lista.length; i += 2) antes[lista[i]] = lista[i + 1];

  const depois = Object.assign({}, antes);
  for (const m of mudancas) {
    if (!mudancaValida(m)) continue;
    if (m.v === null) {
      delete depois[m.k];
    } else if (m.k.startsWith("prova:") && depois[m.k] && acertos(depois[m.k]) > acertos(m.v)) {
      // nota pior que a guardada (ex.: navegador desatualizado): fica a melhor
    } else {
      depois[m.k] = m.v;
    }
  }
  if (Object.keys(depois).length > MAX_CHAVES) {
    return c.responder(res, 413, { erro: "Progresso grande demais." });
  }

  // grava só o que mudou
  const gravar = [];
  const apagar = [];
  Object.keys(depois).forEach((k) => { if (antes[k] !== depois[k]) gravar.push(k, depois[k]); });
  Object.keys(antes).forEach((k) => { if (!(k in depois)) apagar.push(k); });
  const cmds = [];
  if (gravar.length) cmds.push(["HSET", kProg, ...gravar]);
  if (apagar.length) cmds.push(["HDEL", kProg, ...apagar]);
  if (cmds.length) await lote(cmds);

  c.responder(res, 200, { dados: depois });
});
