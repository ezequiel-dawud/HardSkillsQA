// Modulo 2: locators, test.describe/beforeEach, formulario e validacao de campo.
// A partir daqui a trilha usa Page Object Model -- ver modulo-2.html pra entender
// por que (o Modulo 1 ficou com locators direto no teste de proposito).
const { test, expect } = require("@playwright/test");
const { CadastroPage } = require("../pages/CadastroPage");

test.describe("cadastro", () => {
  let cadastro;

  test.beforeEach(async ({ page }) => {
    cadastro = new CadastroPage(page);
    await cadastro.goto();
  });

  test("campos obrigatorios mostram erro ao submeter em branco", async () => {
    await cadastro.submeter();

    await expect(cadastro.nameError).toBeVisible();
    await expect(cadastro.emailError).toBeVisible();
    await expect(cadastro.passwordError).toBeVisible();
  });

  test("cadastro valido mostra mensagem de sucesso", async () => {
    await cadastro.preencher({ nome: "Joana", email: "joana@exemplo.com", senha: "SenhaForte123" });
    await cadastro.submeter();

    await expect(cadastro.successMessage).toBeVisible();
  });
});

// Exercicio: escreva aqui embaixo um teste chamado
// "senha curta mostra so o erro de senha" que usa a mesma CadastroPage
// (cadastro.preencher({ nome: "Joana", email: "joana@exemplo.com", senha: "123" })
// e cadastro.submeter()) e confere que:
//   - cadastro.passwordError fica visivel
//   - cadastro.nameError NAO fica visivel (toBeHidden)
//   - cadastro.emailError NAO fica visivel (toBeHidden)
// Veja o modulo-2.html e o GABARITO.md se travar.
