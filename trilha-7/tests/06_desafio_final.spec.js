// Desafio final: nao tem teste pronto neste arquivo. Os tres testes abaixo
// sao pra voce escrever, combinando tudo que a trilha ensinou -- UI
// (Modulos 1-4) e API (Modulo 5) no MESMO teste. Enunciado completo em
// site/playwright/desafio-final.html. Gabarito em trilha-7/GABARITO.md,
// so olhe depois de tentar.
const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/LoginPage");

const TOKEN = "token-treino-123";
const AUTORIZADO = { Authorization: `Bearer ${TOKEN}` };

// test.describe.serial porque os tres testes trabalham no MESMO produto,
// criado no primeiro e usado (e depois apagado) nos dois seguintes -- igual
// ao padrao do ciclo de vida no Modulo 5.
test.describe.serial("desafio final", () => {
  let produtoId;

  // 1) Via API (request.post, com o header Authorization), crie um produto
  //    com nome "Produto do desafio", preco 42 e o emoji que quiser.
  //    Guarde o id da resposta em `produtoId`.
  //    Depois, pelo NAVEGADOR (LoginPage.pularLogin + page.goto), abra
  //    /produto.html?id=<produtoId> e confira que o titulo mostrado
  //    (product-detail-title) e exatamente "Produto do desafio".
  test.skip("criar produto via API e ver ele na loja", async ({ page, request }) => {
  });

  // 2) Via API (request.put), mude o preco do produto criado pra 123.45.
  //    Depois, pelo navegador, abra a mesma pagina de novo e confira que
  //    product-detail-price contem "123.45" (o site formata como "R$ 123.45",
  //    com ponto, nao virgula -- confira no proprio produto.html se tiver duvida).
  test.skip("mudar o preco via API e ver refletido na tela do produto", async ({ page, request }) => {
  });

  // 3) Via API (request.delete), apague o produto. Depois, pelo navegador,
  //    abra a mesma pagina de novo e confira que o titulo mostrado agora e
  //    "Produto não encontrado" (é assim que produto.html reage quando o
  //    GET volta com item: null).
  test.skip("excluir produto via API e confirmar que some da loja", async ({ page, request }) => {
  });
});
