// Page Object de /index.html (a lista de produtos) -- ver Modulo 3.
class ProdutosPage {
  constructor(page) {
    this.page = page;
    this.loadingSpinner = page.getByTestId("loading-spinner");
    this.emptyState = page.getByTestId("empty-state-message");
    this.paginationNext = page.getByTestId("pagination-next");
    this.paginationPrev = page.getByTestId("pagination-prev");
    this.paginationCurrent = page.getByTestId("pagination-current");
  }

  async goto({ vazio = false } = {}) {
    await this.page.goto(vazio ? "/index.html?vazio=1" : "/index.html");
  }

  produto(id) {
    return this.page.getByTestId(`product-card-${id}`);
  }
}

module.exports = { ProdutosPage };
