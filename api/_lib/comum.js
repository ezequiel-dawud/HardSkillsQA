/* O que todas as rotas da conta usam: validar o nome, achar o usuário,
   limitar abuso por IP e responder JSON.

   A conta é só um nome de usuário, sem senha. Isso é de propósito (o que se
   guarda é progresso de estudo): quem souber o nome consegue abrir a conta. */

const { configurado, redis, lote } = require("./banco");

// devolve { nome, chave } ou { erro }. A chave é o nome em minúsculas:
// "Ana" e "ana" são a mesma conta.
function validarNome(bruto) {
  const nome = String(bruto || "").normalize("NFC").trim();
  if (nome.length < 3 || nome.length > 30) {
    return { erro: "O nome de usuário precisa ter de 3 a 30 caracteres." };
  }
  if (!/^[\p{L}\p{N}._-]+$/u.test(nome)) {
    return { erro: "Use só letras, números, ponto, hífen e sublinhado — sem espaço." };
  }
  return { nome, chave: nome.toLowerCase() };
}

// { nome, criadoEm } ou null
async function buscarUsuario(chave) {
  const bruto = await redis(["GET", "usuario:" + chave]);
  return bruto ? JSON.parse(bruto) : null;
}

function ipDe(req) {
  const h = req.headers;
  return String(h["x-real-ip"] || h["x-forwarded-for"] || "").split(",")[0].trim() || "desconhecido";
}

// soma 1 no contador e (re)começa a janela; devolve o total
async function contar(chave, janelaSeg) {
  const [n] = await lote([["INCR", chave], ["EXPIRE", chave, janelaSeg]]);
  return n;
}

function responder(res, status, corpo) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(corpo);
}

// embrulha uma rota: só POST com JSON, banco configurado, e erro inesperado
// vira 500 com mensagem amigável (o detalhe fica no log da Vercel)
function rota(fn) {
  return async function (req, res) {
    if (req.method !== "POST") return responder(res, 405, { erro: "Use POST." });
    if (!/^application\/json/i.test(req.headers["content-type"] || "")) {
      return responder(res, 415, { erro: "Mande o corpo em JSON." });
    }
    if (!configurado()) {
      return responder(res, 503, { erro: "O banco das contas não está configurado no servidor." });
    }
    let corpo;
    try {
      corpo = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return responder(res, 400, { erro: "JSON inválido." });
    }
    try {
      await fn(req, res, corpo && typeof corpo === "object" ? corpo : {});
    } catch (e) {
      console.error(e);
      responder(res, 500, { erro: "Deu erro no servidor. Tente de novo daqui a pouco." });
    }
  };
}

module.exports = { validarNome, buscarUsuario, ipDe, contar, responder, rota };
