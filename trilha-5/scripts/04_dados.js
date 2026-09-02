// Trilha 5 - Modulo 4 - DADOS E CORRELACAO
// -----------------------------------------------------------------------------
// Carga com dado de mentira sempre igual nao vale muito. Aqui:
//   - SharedArray carrega uma lista de usuarios do JSON UMA vez e compartilha
//     entre todos os VUs (sem isso, cada VU carregaria o arquivo inteiro).
//   - cada VU pega um usuario diferente da lista.
//   - CORRELACAO: o token vem na resposta do /login e e reaproveitado no passo
//     seguinte -- e o padrao "extraia da resposta A pra montar a requisicao B".
//   - o email muda a cada iteracao (__ITER), pra nao mandar o mesmo dado 100x.
//
// Rodar:  k6 run scripts/04_dados.js           (mock ligado noutro terminal)
// Depois: python verificar.py 4

import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { resumo } from "../lib/resumo.js";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:8787";

// open() so funciona aqui no topo (contexto de init), nunca dentro da funcao.
const usuarios = new SharedArray("usuarios", function () {
  return JSON.parse(open("../dados/usuarios.json"));
});

export const options = {
  vus: 10,
  iterations: 100, // 100 fluxos no total, divididos entre os 10 VUs
  thresholds: {
    http_req_failed: ["rate<0.03"],
    checks: ["rate>0.95"], // 95%+ dos checks tem que passar (o mock erra ~1% dos POST)
  },
};

export default function () {
  const u = usuarios[(__VU - 1) % usuarios.length];

  // 1) login -> extrai o token da resposta
  const login = http.post(
    `${BASE}/login`,
    JSON.stringify({ usuario: u.usuario, email: u.email }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(login, { "login ok": (r) => r.status === 200 });
  const token = login.json("token");

  // 2) cria o pedido usando o token do passo 1 + um email unico por iteracao
  const email = `${u.usuario}+${__ITER}@teste.com`;
  const pedido = http.post(
    `${BASE}/pedidos`,
    JSON.stringify({ itens: [{ produto_id: 1, quantidade: 1 }], email }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  check(pedido, {
    "pedido 201": (r) => r.status === 201,
    "pedido tem id": (r) => r.json("id") !== undefined,
  });

  sleep(0.5);
}

export const handleSummary = resumo;
