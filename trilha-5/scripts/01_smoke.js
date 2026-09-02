// Trilha 5 - Modulo 1 - SMOKE TEST
// -----------------------------------------------------------------------------
// O teste mais simples que existe: 1 usuario virtual, poucas repeticoes, so
// pra confirmar que o alvo esta de pe e que o script funciona. Ninguem roda
// carga de verdade sem passar por aqui antes.
//
// Rodar (de dentro de trilha-5/, com o mock ligado noutro terminal):
//     k6 run scripts/01_smoke.js
//
// Depois:
//     python verificar.py 1

import http from "k6/http";
import { check, sleep } from "k6";
import { resumo } from "../lib/resumo.js";

// __ENV.BASE_URL deixa trocar o alvo sem editar o script:
//     k6 run -e BASE_URL=https://quickpizza.grafana.com scripts/01_smoke.js
const BASE = __ENV.BASE_URL || "http://127.0.0.1:8787";

export const options = {
  vus: 1, // 1 usuario virtual
  iterations: 10, // roda a funcao abaixo 10 vezes, no total
  thresholds: {
    // o smoke tem que passar limpo; se nao passar, o alvo ja esta ruim
    http_req_failed: ["rate<0.01"], // menos de 1% de erro
    http_req_duration: ["p(95)<800"], // 95% das respostas abaixo de 800ms
  },
};

// `default` = o roteiro de UM usuario virtual numa iteracao. O k6 repete isto.
export default function () {
  const r = http.get(`${BASE}/produtos`);

  // check() NAO derruba o teste quando falha (diferente de um assert). Ele
  // alimenta a metrica `checks`, que voce ve no resumo como % de acerto.
  check(r, {
    "status e 200": (res) => res.status === 200,
    "veio a lista de produtos": (res) => Array.isArray(res.json("produtos")),
  });

  sleep(1); // uma pausa curta entre as iteracoes
}

export const handleSummary = resumo;
