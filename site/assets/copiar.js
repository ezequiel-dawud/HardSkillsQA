(function () {
  function textoDoBloco(pre) {
    var clone = pre.cloneNode(true);
    var botao = clone.querySelector(".btn-copiar");
    if (botao) botao.remove();
    return clone.textContent.replace(/\n$/, "");
  }

  document.querySelectorAll(".teoria pre, pre.bloco").forEach(function (pre) {
    if (pre.querySelector(".btn-copiar")) return;

    // rotulo-bloco marca "não cole no terminal" — não faz sentido oferecer copiar ali
    var anterior = pre.previousElementSibling;
    if (anterior && anterior.classList.contains("rotulo-bloco")) return;

    pre.classList.add("tem-copiar");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-copiar";
    btn.textContent = "Copiar";
    btn.setAttribute("aria-label", "Copiar código");

    btn.addEventListener("click", function () {
      var texto = textoDoBloco(pre);
      navigator.clipboard.writeText(texto).then(
        function () {
          btn.textContent = "Copiado!";
          btn.classList.add("copiado");
          setTimeout(function () {
            btn.textContent = "Copiar";
            btn.classList.remove("copiado");
          }, 1500);
        },
        function () {
          btn.textContent = "Erro";
          setTimeout(function () { btn.textContent = "Copiar"; }, 1500);
        }
      );
    });

    pre.appendChild(btn);
  });
})();
