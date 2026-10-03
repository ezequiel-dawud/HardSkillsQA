// Modulo 1 da trilha: primeiro contato com o Playwright.
// Rode so este arquivo com:  npx playwright test tests/01_primeiro_teste.spec.js
const { test, expect } = require("@playwright/test");

test("a pagina de login carrega", async ({ page }) => {
  await page.goto("/login.html");
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("login com credenciais validas entra na loja", async ({ page }) => {
  await page.goto("/login.html");
  await page.getByTestId("login-email-input").fill("maria@exemplo.com");
  await page.getByTestId("login-password-input").fill("SenhaForte123");
  await page.getByTestId("login-submit-button").click();

  await expect(page).toHaveURL(/index\.html/);
  await expect(page.getByTestId("nav-account-name")).toHaveText("Maria");
});

// Exercicio: escreva aqui embaixo um terceiro teste chamado
// "login com senha errada mostra mensagem de erro" que preenche
// login-email-input e login-password-input com uma senha incorreta, clica em
// login-submit-button e confere que login-error-message fica visivel.
// Veja o modulo-1.html e o GABARITO.md se travar.
