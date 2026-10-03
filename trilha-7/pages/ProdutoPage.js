// Page Object de /produto.html -- ver Modulo 3.
class ProdutoPage {
  constructor(page) {
    this.page = page;
    this.title = page.getByTestId("product-detail-title");
    this.addToCartButton = page.getByTestId("product-detail-add-to-cart");
    this.modalMessage = page.getByTestId("modal-message");
    this.fileInput = page.getByTestId("file-upload-input");
    this.filePreview = page.getByTestId("file-upload-preview");
    this.gallery = page.getByTestId("product-gallery");
  }

  async goto(id) {
    await this.page.goto(`/produto.html?id=${id}`);
    // o detalhe do produto vem de um fetch com atraso proposital -- esperar o
    // titulo preencher evita agir numa pagina que ainda nao carregou o produto.
    await this.page.waitForSelector('[data-testid="product-detail-title"]:not(:empty)');
  }

  galleryItem(n) {
    return this.page.getByTestId(`gallery-drag-item-${n}`);
  }

  async ordemDaGaleria() {
    return this.gallery.locator(".galeria-item").evaluateAll(
      (els) => els.map((e) => e.getAttribute("data-testid"))
    );
  }
}

module.exports = { ProdutoPage };
