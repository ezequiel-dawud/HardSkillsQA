// Page Object de /cadastro.html -- ver Modulo 2.
class CadastroPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByTestId("signup-name-input");
    this.emailInput = page.getByTestId("signup-email-input");
    this.passwordInput = page.getByTestId("signup-password-input");
    this.submitButton = page.getByTestId("signup-submit-button");
    this.successMessage = page.getByTestId("signup-success-message");
    this.nameError = page.getByTestId("signup-field-error-name");
    this.emailError = page.getByTestId("signup-field-error-email");
    this.passwordError = page.getByTestId("signup-field-error-password");
  }

  async goto() {
    await this.page.goto("/cadastro.html");
  }

  async preencher({ nome = "", email = "", senha = "" }) {
    await this.nameInput.fill(nome);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(senha);
  }

  async submeter() {
    await this.submitButton.click();
  }
}

module.exports = { CadastroPage };
