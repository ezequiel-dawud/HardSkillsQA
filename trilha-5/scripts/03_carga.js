// Trilha 5 - Modulo 3 - CARGA DE VERDADE: STAGES E THRESHOLDS
// -----------------------------------------------------------------------------
// `stages` desenha a curva de carga no tempo: sobe, segura, desce (rampa).
// `thresholds` sao o PORTAO: se a regra nao for cumprida, o k6 sai com codigo
// de erro (99) -- e assim o CI reprova o build.
//
// De proposito, o threshold de p95 aqui e apertado. O servidor mock fica mais
// lento quanto mais gente chega junto, entao sob 20 VUs o p95 passa de 300ms e
// o portao REPROVA. Isso NAO e um bug do seu script: e o teste de carga
// fazendo o trabalho dele -- mostrar que o sistema nao aguenta a meta.
//
// Rodar:  k6 run scripts/03_carga.js          (mock ligado noutro terminal)
// Depois: python verificar.py 3
//
// Experimente: afrouxe pra p(95)<1500 e rode de novo -- o portao passa.
// Ou suba o mock com  MOCK_LATENCIA_POR_CARGA_MS=0  e veja o p95 nem subir.

import http from "k6/http";
import { check, sleep } from "k6";
import { resumo } from "../lib/resumo.js";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:8787";

export const options = {
  stages: [
    { duration: "20s", target: 20 }, // rampa de subida: 0 -> 20 VUs
    { duration: "40s", target: 20 }, // patamar: segura 20 VUs
    { duration: "10s", target: 0 }, // rampa de descida: 20 -> 0
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // erro tem que ficar abaixo de 1%
    http_req_duration: ["p(95)<300"], // META de performance (vai reprovar sob carga)
  },
};

export default function () {
  const r = http.get(`${BASE}/produtos`);
  check(r, { "status 200": (res) => res.status === 200 });
  // think time curto: com 20 VUs mal descansando, o alvo sente a carga simultanea
  sleep(0.1);
}

export const handleSummary = resumo;
