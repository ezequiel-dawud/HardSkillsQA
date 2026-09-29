/* POST /api/conta/progresso   { nome, mudancas: [{ k, v }] }  ->  200 { dados: { k: v, ... } }

   Aplica as mudanças que o navegador acumulou em cima do que já está guardado
   e devolve o progresso inteiro, já juntado. Mandar mudancas: [] só busca.

   As chaves são as mesmas do site/assets/progresso.js:
     ex:<pagina>:<id>  "1"      exercício feito      (v: null desfaz)
     extot:<pagina>    "10"     total de exercícios
     mod:<pagina>      "1"      módulo concluído     (v: null desmarca)
     prova:<pagina>    "8/9"    melhor nota — só troca se a nova acertou mais

   Cada chamada custa 3 idas ao banco (busca o usuário, lê o progresso, grava o
   que mudou), então esta é a rota cara: sem limite, um laço aqui queima a cota
   do Redis e derruba a conta de todo mundo. O limite é por IP — pôr por nome
   deixaria qualquer um travar a sincronização de uma pessoa específica só
   mandando o nome dela. */

const { redis, lote } = require("../_lib/banco");
const c = require("../_lib/comum");

const MAX_MUDANCAS = 5000;
const MAX_CHAVES = 5000;

// uso normal é muito menor: o navegador junta as mudanças num envio só a cada
// 800 ms (site/assets/conta.js) e só envia quando algo muda. A folga aqui é pra
// caber uma sala inteira de gente estudando atrás do mesmo IP.
const ENVIOS_POR_IP = 240;
const JANELA_SEG = 5 * 60;

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

  // antes das 3 idas ao banco: barrar cedo é o que segura a cota
  if ((await c.contar("progresso:ip:" + c.ipDe(req), JANELA_SEG)) > ENVIOS_POR_IP) {
    return c.responder(res, 429, { erro: "Progresso salvo demais de uma vez. Ele continua guardado neste navegador e sobe sozinho daqui a pouco." });
  }

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
