/* Filtro por área na grade de trilhas da home (site/index.html).
   Os cards já vêm prontos no HTML (SEO, funciona sem JS); aqui só mostra/esconde
   por data-categoria e mantém o contador de cada botão. */
(function () {
  "use strict";
  const grade = document.getElementById("trilhas-grade");
  const filtros = document.getElementById("trilhas-filtros");
  if (!grade || !filtros) return;

  const cards = Array.from(grade.querySelectorAll("[data-categoria]"));
  const botoes = Array.from(filtros.querySelectorAll(".h-filtro"));

  botoes.forEach((b) => {
    const cat = b.getAttribute("data-cat");
    const n = cat === "Todas" ? cards.length : cards.filter((c) => c.getAttribute("data-categoria") === cat).length;
    const contador = b.querySelector("span");
    if (contador) contador.textContent = n;
    b.addEventListener("click", () => {
      botoes.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      cards.forEach((c) => {
        c.hidden = !(cat === "Todas" || c.getAttribute("data-categoria") === cat);
      });
    });
  });

  /* carrossel do "Caminho recomendado": setas rolam um card por clique e
     desabilitam sozinhas no início/fim */
  const trilho = document.getElementById("caminho-trilhos");
  const prev = document.querySelector(".h-carrossel-prev");
  const next = document.querySelector(".h-carrossel-next");
  if (trilho && prev && next) {
    const passo = () => (trilho.querySelector(".h-passo") || {}).offsetWidth + 12 || 200;
    prev.addEventListener("click", () => trilho.scrollBy({ left: -passo(), behavior: "smooth" }));
    next.addEventListener("click", () => trilho.scrollBy({ left: passo(), behavior: "smooth" }));
    const atualizarSetas = () => {
      const fim = trilho.scrollWidth - trilho.clientWidth - 2;
      prev.disabled = trilho.scrollLeft <= 2;
      next.disabled = trilho.scrollLeft >= fim;
    };
    trilho.addEventListener("scroll", atualizarSetas);
    window.addEventListener("resize", atualizarSetas);
    atualizarSetas();
  }
})();
