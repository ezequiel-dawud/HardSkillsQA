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
})();
