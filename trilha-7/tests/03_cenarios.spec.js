// Modulo 3: cenarios reais do site de treino -- loading assincrono, paginacao,
// estado vazio, modal e upload de arquivo. index.html, produto.html e
// carrinho.html exigem login, entao logamos pela UI uma vez por teste --
// reaproveitando a LoginPage em vez de reescrever o fluxo de login de novo
// (o mesmo fluxo que o Modulo 1 ja testou).
const path = require("node:path");
const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/LoginPage");
const { ProdutosPage } = require("../pages/ProdutosPage");
const { ProdutoPage } = require("../pages/ProdutoPage");

async function login(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("maria@exemplo.com", "SenhaForte123");
  await expect(page).toHaveURL(/index\.html/);
}

test.describe("lista de produtos", () => {
  let produtos;

  test.beforeEach(async ({ page }) => {
    await login(page);
    produtos = new ProdutosPage(page);
  });

  test("os produtos aparecem depois do carregamento", async () => {
    await expect(produtos.produto(1)).toBeVisible();
    await expect(produtos.loadingSpinner).toBeHidden();
  });

  test("estado vazio aparece com ?vazio=1", async () => {
    await produtos.goto({ vazio: true });
    await expect(produtos.emptyState).toBeVisible();
  });

  test("paginacao avanca pra pagina 2", async () => {
    await produtos.paginationNext.click();
    await expect(produtos.paginationCurrent).toHaveText("2");
  });
});

test.describe("pagina de produto", () => {
  let produto;

  test.beforeEach(async ({ page }) => {
    await login(page);
    produto = new ProdutoPage(page);
    await produto.goto(1);
  });

  test("adicionar ao carrinho abre o modal de confirmacao", async () => {
    await produto.addToCartButton.click();
    await expect(produto.modalMessage).toContainText("foi adicionado");
  });

  test("upload de arquivo mostra o nome selecionado", async () => {
    await produto.fileInput.setInputFiles(path.join(__dirname, "..", "fixtures", "exemplo.png"));
    await expect(produto.filePreview).toContainText("exemplo.png");
  });
});

// Exercicio: em "pagina de produto", escreva um teste chamado
// "arrastar o primeiro item da galeria pro final reordena a lista" que usa
// produto.galleryItem(1).dragTo(produto.galleryItem(3)) e depois confere,
// com produto.ordemDaGaleria(), que o item 1 nao e mais o primeiro da lista.
// Veja o modulo-3.html e o GABARITO.md se travar.
