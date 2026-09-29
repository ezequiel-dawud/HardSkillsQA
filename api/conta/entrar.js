/* POST /api/conta/entrar   { nome }  ->  200 { nome }
                                      ->  404 se ninguém criou esse nome
                                      ->  429 se vier tentativa demais do mesmo IP

   Como a resposta diz se o nome existe ou não, sem limite esta rota vira uma
   forma de varrer nomes e descobrir quem tem conta aqui. O limite não torna
   isso impossível (quem tiver muitos IPs continua conseguindo), mas encarece
   o bastante pra não valer a pena por progresso de estudo. */

const c = require("../_lib/comum");

const TENTATIVAS_POR_IP = 20;
const JANELA_SEG = 10 * 60;

module.exports = c.rota(async (req, res, corpo) => {
  const n = c.validarNome(corpo.nome);
  if (n.erro) return c.responder(res, 400, { erro: n.erro });

  // antes de ir buscar o usuário: assim a tentativa barrada custa uma ida ao
  // banco em vez de duas
  if ((await c.contar("entradas:ip:" + c.ipDe(req), JANELA_SEG)) > TENTATIVAS_POR_IP) {
    return c.responder(res, 429, { erro: "Muitas tentativas de entrar daqui. Espere alguns minutos e tente de novo." });
  }

  const usuario = await c.buscarUsuario(n.chave);
  if (!usuario) {
    return c.responder(res, 404, { erro: "Não existe conta com esse nome. Confira a digitação — ou clique em Criar conta." });
  }

  c.responder(res, 200, { nome: usuario.nome });
});
