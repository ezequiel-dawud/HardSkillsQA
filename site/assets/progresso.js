/* Progresso do aluno — mora só no navegador dele (localStorage).

   Guarda três coisas, todas com o prefixo "qal:":
     ex:<pagina>:<id>  -> "1"        exercício conferido e certo
     extot:<pagina>    -> "10"       quantos exercícios a página tem
     mod:<pagina>      -> "1"        módulo dado como concluído
     prova:<pagina>    -> "8/9"      melhor nota naquela prova

   Um módulo conta como concluído quando o aluno acerta 70% ou mais dos
   exercícios, OU passa na prova dele (prova-N.html ao lado do modulo-N.html,
   com o mesmo corte de 70%), OU marca na mão — o jeito dos módulos de leitura
   (pytest, k6, CI/CD), que não têm exercício na página.

   A barra de cada trilha no hub enche com o andamento de cada módulo: um
   concluído vale inteiro; um começado vale a fração que já foi feita (a maior
   entre exercícios acertados e nota da prova).

   Se o aluno entrar numa conta (assets/conta.js), cada escrita também vai pro
   servidor — por isso toda gravação passa por gravar()/apagar().

   Expõe window.Progresso. */

(function () {
  "use strict";

  const B = "qal:";
  const CORTE = 0.7;
  const PREFIXOS = ["ex:", "extot:", "mod:", "prova:"];

  // quem precisa saber de cada escrita (a conta, pra mandar pro servidor) se inscreve aqui
  const escritas = [];
  const aoGravar = (fn) => escritas.push(fn);
  const anotar = (k, v) => escritas.forEach((fn) => { try { fn(k, v); } catch (e) {} });

  function ler(k) { try { return localStorage.getItem(B + k); } catch (e) { return null; } }
  function gravar(k, v) {
    if (ler(k) === v) return;
    try { localStorage.setItem(B + k, v); } catch (e) {}
    anotar(k, v);
  }
  function apagar(k) {
    if (ler(k) === null) return;
    try { localStorage.removeItem(B + k); } catch (e) {}
    anotar(k, null);
  }
  // devolve as chaves JÁ sem o prefixo "qal:"
  function chaves(pref) {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.indexOf(B + pref) === 0)
        .map((k) => k.slice(B.length));
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
    const marcado = ler("mod:" + p) === "1";
    // a prova do módulo mora ao lado dele: /sql/modulo-3.html -> /sql/prova-3.html
    const prova = /modulo-\d+\.html$/.test(p)
      ? situacaoProva(p.replace(/modulo-(\d+)\.html$/, "prova-$1.html"))
      : null;
    const pelaProva = !!(prova && prova.passou);
    return { total, feitos, marcado, prova, pelaProva, concluido: marcado || pelaProva };
  }

  // quanto do módulo já andou, de 0 a 1 — é o que enche a barra da trilha
  function andamentoModulo(pagina) {
    const s = situacaoModulo(pagina);
    if (s.concluido) return 1;
    const ex = s.total ? Math.min(s.feitos / s.total, 1) : 0;
    const pr = s.prova && s.prova.total ? s.prova.acertos / s.prova.total : 0;
    return Math.max(ex, pr);
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
    s.setAttribute("data-prog", "");
    s.textContent = texto;
    return s;
  }

  /* índice de trilha: marca cada link de módulo e de prova */
  function decorarIndiceTrilha() {
    document.querySelectorAll(".selo[data-prog]").forEach((s) => s.remove());
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
    document.querySelectorAll(".trilha-progresso").forEach((b) => b.remove());
    document.querySelectorAll("[data-trilha][data-modulos]").forEach((card) => {
      const pasta = card.getAttribute("data-trilha");
      const n = Number(card.getAttribute("data-modulos"));
      const base = caminhoDe(pasta + "/");
      let feitos = 0, andando = 0, soma = 0;
      for (let i = 1; i <= n; i++) {
        const a = andamentoModulo(base + "modulo-" + i + ".html");
        soma += a;
        if (a === 1) feitos++;
        else if (a > 0) andando++;
      }
      const barra = document.createElement("div");
      barra.className = "trilha-progresso" + (feitos === n ? " completa" : "");
      barra.innerHTML =
        '<div class="tp-trilho"><div class="tp-cheio" style="width:' +
        Math.round((100 * soma) / n) + '%"></div></div>' +
        '<span class="tp-txt">' + (feitos === n
          ? "trilha completa ✓"
          : feitos + " de " + n + " módulos" + (andando ? " · " + andando + " em andamento" : "")) +
        "</span>";
      card.appendChild(barra);
    });
  }

  /* botão "marcar como concluído" no fim de um módulo */
  function botaoConcluir(seletorAlvo) {
    const alvo = document.querySelector(seletorAlvo || "#marcar-concluido");
    if (!alvo) return;
    const contador = document.createElement("span");
    contador.className = "prog-contador";

    // passou na prova: o módulo já conta, não tem o que marcar nem desmarcar
    const pelaProva = selo("", "selo-ok");

    const b = document.createElement("button");
    const pinta = () => {
      const s = situacaoModulo();
      const soPelaProva = s.pelaProva && !s.marcado;
      pelaProva.hidden = !soPelaProva;
      b.hidden = soPelaProva;
      if (s.prova) pelaProva.textContent = "✓ Concluído pela prova (" + s.prova.acertos + "/" + s.prova.total + ")";
      b.className = s.concluido ? "primario" : "";
      b.textContent = s.concluido ? "✓ Módulo concluído (desmarcar)" : "Marcar módulo como concluído";
      contador.textContent = s.total
        ? s.feitos + " de " + s.total + " exercícios conferidos"
        : "";
    };
    b.addEventListener("click", () => marcarModulo(!situacaoModulo().marcado));
    aoMudar(pinta);
    pinta();
    alvo.appendChild(contador);
    alvo.appendChild(pelaProva);
    alvo.appendChild(b);
  }

  function zerarTudo() {
    PREFIXOS.forEach((p) => chaves(p).forEach(apagar));
  }

  /* ---- pra conta (assets/conta.js) ------------------------------------- */

  // todo o progresso deste navegador, como { "ex:/sql/modulo-1.html:1.1": "1", ... }
  function exportar() {
    const m = {};
    PREFIXOS.forEach((p) => chaves(p).forEach((k) => { m[k] = ler(k); }));
    return m;
  }

  // troca o progresso deste navegador pelo que veio da conta. Escreve direto,
  // sem passar por gravar(): o que veio do servidor não volta pra fila de envio.
  function importar(mapa) {
    PREFIXOS.forEach((p) => chaves(p).forEach((k) => {
      if (!Object.prototype.hasOwnProperty.call(mapa, k)) {
        try { localStorage.removeItem(B + k); } catch (e) {}
      }
    }));
    Object.keys(mapa).forEach((k) => {
      if (PREFIXOS.some((p) => k.indexOf(p) === 0)) {
        try { localStorage.setItem(B + k, String(mapa[k])); } catch (e) {}
      }
    });
    avisar();
  }

  window.Progresso = {
    registrarTotal, marcarExercicio, registrarProva, marcarModulo,
    situacaoModulo, situacaoProva, estaFeito, aoMudar,
    decorarIndiceTrilha, decorarHub, botaoConcluir, zerarTudo,
    aoGravar, exportar, importar,
  };

  // selos e barras se redesenham quando o progresso muda (ex.: chegou da conta)
  function decorar() {
    if (document.body.classList.contains("pagina-inicial")) decorarHub();
    else if (/index\.html?$|\/$/.test(location.pathname)) decorarIndiceTrilha();
  }

  document.addEventListener("DOMContentLoaded", () => {
    decorar();
    aoMudar(decorar);
    botaoConcluir();
  });
})();
