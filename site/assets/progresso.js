/* Progresso do aluno — mora só no navegador dele (localStorage).

   Guarda três coisas, todas com o prefixo "qal:":
     ex:<pagina>:<id>  -> "1"        exercício conferido e certo
     extot:<pagina>    -> "10"       quantos exercícios a página tem
     mod:<pagina>      -> "1"        módulo dado como concluído
     prova:<pagina>    -> "8/9"      melhor nota naquela prova

   Um módulo se marca sozinho como concluído quando o aluno acerta 70% ou mais
   dos exercícios — o mesmo corte das provas. Também dá pra marcar na mão, pros
   módulos de leitura (pytest, k6, CI/CD), que não têm exercício na página.

   Expõe window.Progresso. */

(function () {
  "use strict";

  const B = "qal:";
  const CORTE = 0.7;

  function ler(k) { try { return localStorage.getItem(B + k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(B + k, v); } catch (e) {} }
  function apagar(k) { try { localStorage.removeItem(B + k); } catch (e) {} }
  function chaves(pref) {
    try {
      return Object.keys(localStorage).filter((k) => k.indexOf(B + pref) === 0);
    } catch (e) { return []; }
  }

  const aqui = () => location.pathname;
  const caminhoDe = (href) => new URL(href, location.href).pathname;

  // quem quiser se repintar quando o progresso mudar se inscreve aqui
  const ouvintes = [];
  const aoMudar = (fn) => ouvintes.push(fn);
  const avisar = () => ouvintes.forEach((fn) => { try { fn(); } catch (e) {} });

  /* ---- escrita (chamada pelas páginas de módulo e de prova) ------------- */

  function registrarTotal(n, pagina) {
    gravar("extot:" + (pagina || aqui()), String(n));
  }

  function marcarExercicio(id, pagina) {
    const p = pagina || aqui();
    const novo = !estaFeito(id, p);
    gravar("ex:" + p + ":" + id, "1");
    reavaliarModulo(p);
    if (novo) avisar();
  }

  function estaFeito(id, pagina) {
    return ler("ex:" + (pagina || aqui()) + ":" + id) === "1";
  }

  function registrarProva(acertos, total, pagina) {
    const p = pagina || aqui();
    const ant = ler("prova:" + p);
    const antAcertos = ant ? Number(String(ant).split("/")[0]) : -1;
    if (acertos > antAcertos) gravar("prova:" + p, acertos + "/" + total);
  }

  function marcarModulo(v, pagina) {
    const p = pagina || aqui();
    if (v) gravar("mod:" + p, "1"); else apagar("mod:" + p);
    avisar();
  }

  function reavaliarModulo(pagina) {
    const s = situacaoModulo(pagina);
    if (s.total > 0 && s.feitos / s.total >= CORTE) marcarModulo(true, pagina);
  }

  /* ---- leitura ---------------------------------------------------------- */

  function situacaoModulo(pagina) {
    const p = pagina || aqui();
    const total = Number(ler("extot:" + p) || 0);
    const feitos = chaves("ex:" + p + ":").length;
    return { total, feitos, concluido: ler("mod:" + p) === "1" };
  }

  function situacaoProva(pagina) {
    const v = ler("prova:" + (pagina || aqui()));
    if (!v) return null;
    const [a, t] = String(v).split("/").map(Number);
    return { acertos: a, total: t, passou: t > 0 && a / t >= CORTE };
  }

  /* ---- enfeites na tela -------------------------------------------------- */

  function selo(texto, classe) {
    const s = document.createElement("span");
    s.className = "selo " + classe;
    s.textContent = texto;
    return s;
  }

  /* índice de trilha: marca cada link de módulo e de prova */
  function decorarIndiceTrilha() {
    document.querySelectorAll('a[href*="modulo-"]').forEach((a) => {
      if (!a.classList.contains("modulo-link")) return;
      const s = situacaoModulo(caminhoDe(a.getAttribute("href")));
      if (s.concluido) a.appendChild(selo("concluído ✓", "selo-ok"));
      else if (s.feitos > 0) a.appendChild(selo(s.feitos + "/" + s.total, "selo-meio"));
    });

    document.querySelectorAll('a[href*="prova-"]').forEach((a) => {
      const s = situacaoProva(caminhoDe(a.getAttribute("href")));
      if (!s) return;
      const alvo = a.querySelector("button") || a;
      alvo.appendChild(selo(s.acertos + "/" + s.total, s.passou ? "selo-ok" : "selo-meio"));
    });
  }

  /* hub: cada card de trilha declara data-trilha e data-modulos */
  function decorarHub() {
    document.querySelectorAll("[data-trilha][data-modulos]").forEach((card) => {
      const pasta = card.getAttribute("data-trilha");
      const n = Number(card.getAttribute("data-modulos"));
      const base = caminhoDe(pasta + "/");
      let feitos = 0;
      for (let i = 1; i <= n; i++) {
        if (situacaoModulo(base + "modulo-" + i + ".html").concluido) feitos++;
      }
      const barra = document.createElement("div");
      barra.className = "trilha-progresso" + (feitos === n ? " completa" : "");
      barra.innerHTML =
        '<div class="tp-trilho"><div class="tp-cheio" style="width:' +
        Math.round((100 * feitos) / n) + '%"></div></div>' +
        '<span class="tp-txt">' + (feitos === n ? "trilha completa ✓" : feitos + " de " + n + " módulos") + "</span>";
      card.appendChild(barra);
    });
  }

  /* botão "marcar como concluído" no fim de um módulo */
  function botaoConcluir(seletorAlvo) {
    const alvo = document.querySelector(seletorAlvo || "#marcar-concluido");
    if (!alvo) return;
    const contador = document.createElement("span");
    contador.className = "prog-contador";

    const b = document.createElement("button");
    const pinta = () => {
      const s = situacaoModulo();
      b.className = s.concluido ? "primario" : "";
      b.textContent = s.concluido ? "✓ Módulo concluído (desmarcar)" : "Marcar módulo como concluído";
      contador.textContent = s.total
        ? s.feitos + " de " + s.total + " exercícios conferidos"
        : "";
    };
    b.addEventListener("click", () => marcarModulo(!situacaoModulo().concluido));
    aoMudar(pinta);
    pinta();
    alvo.appendChild(contador);
    alvo.appendChild(b);
  }

  function zerarTudo() {
    ["ex:", "extot:", "mod:", "prova:"].forEach((p) =>
      chaves(p).forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} })
    );
  }

  window.Progresso = {
    registrarTotal, marcarExercicio, registrarProva, marcarModulo,
    situacaoModulo, situacaoProva, estaFeito, aoMudar,
    decorarIndiceTrilha, decorarHub, botaoConcluir, zerarTudo,
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.classList.contains("pagina-inicial")) decorarHub();
    else if (/index\.html?$|\/$/.test(location.pathname)) decorarIndiceTrilha();
    botaoConcluir();
  });
})();
