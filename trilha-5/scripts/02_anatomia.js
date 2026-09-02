// Trilha 5 - Modulo 2 - ANATOMIA DE UM SCRIPT
// -----------------------------------------------------------------------------
// Um roteiro de usuario mais realista: faz login, navega, compra. Mostra as
// 4 pecas que todo script de carga tem:
//   - options .... quanta carga e por quanto tempo
//   - http.* ..... as requisicoes
//   - check() .... o que conta como "resposta certa"
//   - sleep() .... o tempo que um humano leva entre um clique e outro
//
// group() so organiza o relatorio (agrupa metricas por trecho do fluxo).
// A tag { tipo: "leitura" } cria uma sub-metrica, usada no threshold abaixo.
//
// Rodar:  k6 run scripts/02_anatomia.js       (mock ligado noutro terminal)
// Depois: python verificar.py 2

import http from "k6/http";
import { check, sleep, group } from "k6";
import { resumo } from "../lib/resumo.js";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:8787";

export const options = {
  vus: 5, // 5 usuarios virtuais ao mesmo tempo
  duration: "20s", // durante 20 segundos (cada VU repete o fluxo em loop)
  thresholds: {
    http_req_failed: ["rate<0.05"],
    // threshold so nas requisicoes marcadas com a tag tipo=leitura:
    "http_req_duration{tipo:leitura}": ["p(95)<600"],
  },
};

export default function () {
  let token;

  group("login", function () {
    const r = http.post(
      `${BASE}/login`,
      JSON.stringify({ usuario: `qa_${__VU}` }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(r, {
      "login 200": (res) => res.status === 200,
      "veio token": (res) => typeof res.json("token") === "string",
    });
    token = r.json("token"); // guarda pra usar no passo de comprar
  });

  group("navegar", function () {
    const r = http.get(`${BASE}/produtos`, { tags: { tipo: "leitura" } });
    check(r, { "produtos 200": (res) => res.status === 200 });
    sleep(1); // "tempo de leitura" da vitrine
  });

  group("comprar", function () {
    const corpo = JSON.stringify({
      itens: [{ produto_id: 3, quantidade: 2 }],
      email: `qa_${__VU}@teste.com`,
    });
    const r = http.post(`${BASE}/pedidos`, corpo, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    check(r, {
      "pedido criado (201)": (res) => res.status === 201,
      "resposta traz id": (res) => res.json("id") !== undefined,
    });
  });

  sleep(1);
}

export const handleSummary = resumo;
