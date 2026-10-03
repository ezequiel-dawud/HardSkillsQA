// Page Object de /rede.html -- ver Modulo 4.
class RedePage {
  constructor(page) {
    this.page = page;
    this.forceErrorButton = page.getByTestId("force-error-button");
    this.errorMessage = page.getByTestId("server-error-message");
  }

  async goto() {
    await this.page.goto("/rede.html");
  }
}

module.exports = { RedePage };
