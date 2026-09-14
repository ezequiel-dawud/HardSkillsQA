/* POST /api/conta/entrar   { nome }  ->  200 { nome }
                                      ->  404 se ninguém criou esse nome */

const c = require("../_lib/comum");

module.exports = c.rota(async (req, res, corpo) => {
  const n = c.validarNome(corpo.nome);
  if (n.erro) return c.responder(res, 400, { erro: n.erro });

  const usuario = await c.buscarUsuario(n.chave);
  if (!usuario) {
    return c.responder(res, 404, { erro: "Não existe conta com esse nome. Confira a digitação — ou clique em Criar conta." });
  }

  c.responder(res, 200, { nome: usuario.nome });
});
