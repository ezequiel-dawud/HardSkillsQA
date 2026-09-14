/* Conta opcional: só um nome de usuário, pra não perder o progresso.

   Sem conta nada muda: o progresso fica só neste navegador (assets/progresso.js).
   Com conta, toda mudança no progresso entra numa fila, e a fila vai pro
   servidor (api/conta/progresso.js), que junta com o que já estava guardado e
   devolve o progresso inteiro. É assim que o que você fez em outro computador
   aparece aqui.

   Não tem senha, de propósito: quem digitar o nome de usuário abre a conta.

   No localStorage, fora das chaves do progresso:
     qalconta:sessao -> {"nome":"ezequiel.qa"}
     qalconta:fila   -> [{"k":"ex:/sql/modulo-1.html:1.1","v":"1"}, ...]   (v null = apagou)

   Ao entrar, o progresso que já está no navegador sobe pra conta (soma, não
   substitui). Ao sair, ele sai deste navegador — continua guardado na conta.

   O servidor só existe no site publicado na Vercel (ou com `vercel dev`); com o
   servir.py o botão aparece, mas entrar avisa que não está disponível.

   Carregar DEPOIS de progresso.js. Expõe window.Conta. */

(function () {
  "use strict";
  if (!window.Progresso) return;

  const K_SESSAO = "qalconta:sessao";
  const K_FILA = "qalconta:fila";
  const ESPERA_MS = 800;       // junta mudanças seguidas num envio só
  const RETENTAR_MS = 20000;   // sem conexão: tenta de novo depois disso

  function lerJSON(k, padrao) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : padrao;
    } catch (e) { return padrao; }
  }
  function gravarJSON(k, v) {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  }

  const sessao = () => lerJSON(K_SESSAO, null);
  const fila = () => lerJSON(K_FILA, []);
  const salvarFila = (f) => gravarJSON(K_FILA, f.length ? f : null);

  // várias mudanças na mesma chave: vale a última
  function compactar(f) {
    const ultima = new Map();
    f.forEach((m) => { ultima.delete(m.k); ultima.set(m.k, m.v); });
    return Array.from(ultima, ([k, v]) => ({ k, v }));
  }

  /* ---- conversa com o servidor ------------------------------------------ */

  async function chamar(rota, corpo) {
    let r;
    try {
      r = await fetch("/api/conta/" + rota, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
    } catch (e) {
      return { status: 0, erro: "Sem conexão com o servidor." };
    }
    let dados = null;
    try { dados = await r.json(); } catch (e) {}
    if (!dados || typeof dados !== "object") {
      return { status: r.status, erro: "A conta não está disponível aqui — ela só funciona no site publicado." };
    }
    dados.status = r.status;
    return dados;
  }

  /* ---- sincronização ----------------------------------------------------- */

  let estado = "ok";   // "ok" | "salvando" | "offline"
  let aviso = "";      // recado pra próxima vez que a janela de entrar abrir
  let timer = null;
  let emCurso = null;

  function mudarEstado(e) { estado = e; pintar(); }

  function agendar(ms) {
    clearTimeout(timer);
    timer = setTimeout(sincronizar, ms == null ? ESPERA_MS : ms);
  }

  // progresso.js chama isto a cada escrita
  function anotar(k, v) {
    if (!sessao()) return;
    let f = fila();
    f.push({ k, v });
    if (f.length > 1000 && !emCurso) f = compactar(f);
    salvarFila(f);
    mudarEstado("salvando");
    agendar();
  }
  Progresso.aoGravar(anotar);

  // se já tem um envio andando, espera ele (que repete enquanto chegar mudança nova)
  function sincronizar() {
    if (!emCurso) emCurso = rodada().finally(() => { emCurso = null; });
    return emCurso;
  }

  async function rodada() {
    for (let volta = 0; volta < 5; volta++) {
      clearTimeout(timer);   // este envio já leva a fila inteira
      const s = sessao();
      if (!s) return;
      const enviando = fila();
      mudarEstado("salvando");
      const r = await chamar("progresso", { nome: s.nome, mudancas: compactar(enviando) });

      const agora = sessao();
      if (!agora || agora.nome !== s.nome) return;   // saiu (ou trocou de conta) no meio do caminho
      if (r.status === 404) return contaSumiu();
      if (r.status !== 200 || !r.dados) {
        mudarEstado("offline");
        agendar(RETENTAR_MS);
        return;
      }

      // o servidor é a verdade; o que entrou na fila durante o envio vai por cima
      const resto = fila().slice(enviando.length);
      salvarFila(resto);
      const final = Object.assign({}, r.dados);
      resto.forEach((m) => { if (m.v === null) delete final[m.k]; else final[m.k] = m.v; });
      Progresso.importar(final);

      if (!resto.length) { mudarEstado("ok"); return; }
    }
    agendar();
  }

  // a conta não existe mais no servidor: sai, mas mantém o progresso aqui
  function contaSumiu() {
    gravarJSON(K_SESSAO, null);
    salvarFila([]);
    aviso = "Essa conta não existe mais no servidor. O progresso continua neste navegador; crie uma conta nova pra guardá-lo.";
    mudarEstado("ok");
  }

  // devolve null se deu certo, ou a mensagem de erro
  async function entrar(nome, criar) {
    const r = await chamar(criar ? "criar" : "entrar", { nome });
    if (!r.nome) return r.erro || "Não deu certo. Tente de novo.";
    gravarJSON(K_SESSAO, { nome: r.nome });
    aviso = "";
    // o que já está neste navegador sobe pra conta (soma, não substitui)
    const local = Progresso.exportar();
    salvarFila(Object.keys(local).map((k) => ({ k, v: local[k] })));
    await sincronizar();
    return null;
  }

  // devolve true se saiu
  async function sair() {
    if (!sessao()) return true;
    if (fila().length) await sincronizar();
    if (fila().length && !confirm(
      "Parte do seu progresso ainda não chegou na conta (sem conexão com o servidor). " +
      "Se sair agora, essa parte se perde. Sair mesmo assim?"
    )) return false;
    clearTimeout(timer);
    gravarJSON(K_SESSAO, null);
    salvarFila([]);
    Progresso.importar({});   // sai deste navegador; continua guardado na conta
    mudarEstado("ok");
    return true;
  }

  // fechou a aba com mudança na fila: tenta mandar mesmo assim
  // (a fila fica, e vai de novo na próxima visita — o servidor aceita repetido)
  window.addEventListener("pagehide", () => {
    const s = sessao();
    const f = fila();
    if (!s || !f.length) return;
    const corpo = JSON.stringify({ nome: s.nome, mudancas: compactar(f) });
    if (corpo.length > 60000) return;
    fetch("/api/conta/progresso", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json" }, body: corpo,
    }).catch(() => {});
  });

  window.addEventListener("online", () => { if (sessao() && fila().length) sincronizar(); });

  /* ---- tela: botão no topo + janela -------------------------------------- */

  let botao = null;
  let dlg = null;

  const TEXTO_ESTADO = {
    ok: "✓ Progresso salvo na conta.",
    salvando: "Salvando o progresso na conta…",
    offline: "Sem conexão com o servidor. O progresso fica guardado aqui e sobe sozinho quando a conexão voltar.",
  };

  function pintar() {
    if (botao) {
      const s = sessao();
      botao.className = "conta-botao" + (s ? " logado estado-" + estado : "");
      botao.textContent = s ? s.nome : "Entrar";
      botao.title = s ? TEXTO_ESTADO[estado] : "Entrar com um nome de usuário pra não perder o progresso";
    }
    const st = dlg && dlg.querySelector("[data-status]");
    if (st) {
      st.className = "conta-status estado-" + estado;
      st.textContent = TEXTO_ESTADO[estado];
    }
  }

  function abrir() {
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.className = "conta-dialogo";
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // clicou fora
      document.body.appendChild(dlg);
    }
    if (sessao()) telaConta(); else telaEntrar();
    if (!dlg.open) dlg.showModal();
    const campo = dlg.querySelector("input");
    if (campo) campo.focus();
  }

  function telaEntrar() {
    dlg.innerHTML =
      '<form class="conta-caixa">' +
      "<h3>Não perder meu progresso</h3>" +
      '<p class="conta-texto">Opcional. Com uma conta, o seu progresso fica guardado e aparece em ' +
      "qualquer navegador em que você entrar com o mesmo nome. Sem conta, ele fica só neste navegador.</p>" +
      '<label class="conta-campo">Nome de usuário' +
      '<input name="nome" autocomplete="username" autocapitalize="none" spellcheck="false" ' +
      'minlength="3" maxlength="30" pattern="[\\p{L}\\p{N}._\\-]+" required ' +
      'title="3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado, sem espaço">' +
      "</label>" +
      '<p class="conta-aviso">Não tem senha: quem digitar o seu nome de usuário abre o seu progresso. ' +
      "Escolha um nome que só você usaria.</p>" +
      '<p class="conta-msg" role="status"></p>' +
      '<div class="acoes">' +
      '<button type="submit" class="primario">Entrar</button>' +
      '<button type="button" data-acao="criar">Criar conta</button>' +
      '<button type="button" data-acao="fechar">Cancelar</button>' +
      "</div></form>";

    const form = dlg.querySelector("form");
    const campo = form.elements.nome;
    const msg = dlg.querySelector(".conta-msg");
    const botoes = dlg.querySelectorAll("button");
    const mostrar = (texto, tipo) => { msg.textContent = texto; msg.className = "conta-msg " + (tipo || ""); };
    mostrar(aviso, "erro");

    async function enviar(criar) {
      if (!form.reportValidity()) return;
      botoes.forEach((b) => { b.disabled = true; });
      mostrar(criar ? "Criando a conta…" : "Entrando…", "info");
      const falha = await entrar(campo.value, criar);
      botoes.forEach((b) => { b.disabled = false; });
      if (falha) return mostrar(falha, "erro");
      dlg.close();
    }
    form.addEventListener("submit", (e) => { e.preventDefault(); enviar(false); });
    dlg.querySelector('[data-acao="criar"]').addEventListener("click", () => enviar(true));
    dlg.querySelector('[data-acao="fechar"]').addEventListener("click", () => dlg.close());
  }

  function telaConta() {
    dlg.innerHTML =
      '<div class="conta-caixa">' +
      "<h3>Sua conta</h3>" +
      '<p class="conta-texto">Você entrou como <b data-nome></b>.</p>' +
      "<p data-status></p>" +
      '<p class="conta-texto">Ao sair, o progresso desta conta sai deste navegador — ele continua ' +
      "guardado e volta quando você entrar de novo com o mesmo nome.</p>" +
      '<div class="acoes">' +
      '<button type="button" class="primario" data-acao="fechar">Fechar</button>' +
      '<button type="button" data-acao="sair">Sair da conta</button>' +
      "</div></div>";
    dlg.querySelector("[data-nome]").textContent = sessao().nome;
    pintar();
    dlg.querySelector('[data-acao="fechar"]').addEventListener("click", () => dlg.close());
    const bSair = dlg.querySelector('[data-acao="sair"]');
    bSair.addEventListener("click", async () => {
      bSair.disabled = true;
      if (await sair()) dlg.close();
      else bSair.disabled = false;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const lugar = document.querySelector(".topo nav") || document.querySelector(".topo");
    if (lugar) {
      botao = document.createElement("button");
      botao.type = "button";
      botao.addEventListener("click", abrir);
      lugar.appendChild(botao);
      pintar();
    }
    if (sessao()) sincronizar();   // traz o que foi feito em outros navegadores
  });

  window.Conta = { entrar, sair, sincronizar, sessao };
})();
