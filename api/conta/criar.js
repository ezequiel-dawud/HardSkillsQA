/* POST /api/conta/criar   { nome }  ->  201 { nome }
                                     ->  409 se alguém já usa esse nome */

const { redis } = require("../_lib/banco");
const c = require("../_lib/comum");

const CRIACOES_POR_IP_HORA = 10;

module.exports = c.rota(async (req, res, corpo) => {
  const n = c.validarNome(corpo.nome);
  if (n.erro) return c.responder(res, 400, { erro: n.erro });

  if ((await c.contar("criacoes:ip:" + c.ipDe(req), 60 * 60)) > CRIACOES_POR_IP_HORA) {
    return c.responder(res, 429, { erro: "Muitas contas criadas daqui. Tente de novo mais tarde." });
  }

  // NX: só grava se o nome ainda não existe — duas pessoas pegando o mesmo nome
  // ao mesmo tempo não se atropelam
  const usuario = { nome: n.nome, criadoEm: new Date().toISOString() };
  const gravou = await redis(["SET", "usuario:" + n.chave, JSON.stringify(usuario), "NX"]);
  if (gravou !== "OK") {
    return c.responder(res, 409, { erro: "Esse nome de usuário já está em uso. Escolha outro — ou clique em Entrar, se ele é seu." });
  }

  c.responder(res, 201, { nome: n.nome });
});
