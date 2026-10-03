// Modulo 4: interceptar rede com page.route, e pular o login pela UI
// injetando a sessao direto no localStorage -- mais rapido e mais estavel
// pra testes que nao estao testando o login em si (bom pra CI).
const { test, expect } = require("@playwright/test");
const { LoginPage } = require("../pages/LoginPage");
const { RedePage } = require("../pages/RedePage");

test("erro real do servidor aparece na tela", async ({ page }) => {
  const rede = new RedePage(page);
  await rede.goto();
  await rede.forceErrorButton.click();
  await expect(rede.errorMessage).toContainText("500");
});

test("mock: forcar uma resposta diferente sem mudar o servidor", async ({ page }) => {
  await page.route("**/api/erro", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ erro: "Fora do ar pra manutencao (mock)." }),
    })
  );

  const rede = new RedePage(page);
  await rede.goto();
  await rede.forceErrorButton.click();

  await expect(rede.errorMessage).toContainText("503");
  await expect(rede.errorMessage).toContainText("manutencao");
});

test("pular o login escrevendo a sessao direto no localStorage", async ({ page }) => {
  // o login de verdade ja foi testado no Modulo 1 -- aqui so queremos estar
  // logados pra testar outra coisa, sem pagar o custo (e o risco de flake)
  // de passar pela tela toda vez.
  await LoginPage.pularLogin(page, "Maria");
  await page.goto("/index.html");

  await expect(page.getByTestId("nav-account-name")).toHaveText("Maria");
});

// Exercicio: escreva um teste chamado
// "produto mockado aparece na lista" que:
//   1. usa LoginPage.pularLogin(page, "Maria") (como no teste acima) pra ja entrar logado;
//   2. usa page.route("**/api/produtos*", ...) pra responder, via route.fulfill,
//      { itens: [{ id: 999, nome: "Produto Mockado", preco: 9.9, emoji: "🧪" }], totalPaginas: 1 }
//      (lembre do contentType: "application/json" e do JSON.stringify no body);
//   3. da page.goto("/index.html");
//   4. confere que page.getByTestId("product-card-999") fica visivel e contem o texto "Produto Mockado".
// Veja o modulo-4.html e o GABARITO.md se travar.
