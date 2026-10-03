// Page Object de /login.html -- ver Modulo 2 (o que e um Page Object e por que usar um).
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error-message");
    this.form = page.getByTestId("login-form");
  }

  async goto() {
    await this.page.goto("/login.html");
  }

  async login(email, senha) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(senha);
    await this.submitButton.click();
  }

  /** Atalho pra CI (Modulo 4): entra sem passar pela tela, escrevendo a sessao
   *  direto no localStorage antes da primeira navegacao. */
  static async pularLogin(page, nome = "Maria") {
    await page.addInitScript((nomeInjetado) => {
      localStorage.setItem("qa-treino-sessao", JSON.stringify({ nome: nomeInjetado }));
    }, nome);
  }
}

module.exports = { LoginPage };
