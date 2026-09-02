// Resumo enxuto pro terminal + grava resumo.json (lido pelo verificar.py).
// Sem libs externas: e so ler o objeto `data` que o k6 entrega no fim do teste.
//
// Uso, em cada script:
//     import { resumo } from "../lib/resumo.js";
//     export const handleSummary = resumo;

function ms(v) {
  return v === undefined || v === null ? "-" : v.toFixed(1) + "ms";
}
function pct(v) {
  return v === undefined || v === null ? "-" : (v * 100).toFixed(2) + "%";
}

function thresholdsFalhos(metrics) {
  const falhos = [];
  for (const [nome, m] of Object.entries(metrics || {})) {
    if (!m || !m.thresholds) continue;
    for (const [regra, res] of Object.entries(m.thresholds)) {
      // k6 marca { ok: false } quando a regra nao foi cumprida
      if (res && res.ok === false) falhos.push(`${nome}: ${regra}`);
    }
  }
  return falhos;
}

export function resumo(data) {
  const m = data.metrics || {};
  const dur = (m.http_req_duration && m.http_req_duration.values) || {};
  const reqs = (m.http_reqs && m.http_reqs.values) || {};
  const falhou = (m.http_req_failed && m.http_req_failed.values) || {};
  const checks = (m.checks && m.checks.values) || {};
  const vus = (m.vus_max && m.vus_max.values) || {};
  const iters = (m.iterations && m.iterations.values) || {};

  const falhos = thresholdsFalhos(m);

  const linhas = [
    "",
    "  -- resumo --------------------------------",
    `  requisicoes.......: ${reqs.count || 0}`,
    `  req/s.............: ${reqs.rate ? reqs.rate.toFixed(1) : 0}`,
    `  duracao media.....: ${ms(dur.avg)}`,
    `  duracao p95.......: ${ms(dur["p(95)"])}`,
    `  duracao max.......: ${ms(dur.max)}`,
    `  falhas (erro).....: ${pct(falhou.rate || 0)}`,
    `  checks ok.........: ${pct(checks.rate)}`,
    `  VUs (pico)........: ${vus.max !== undefined ? vus.max : "-"}`,
    `  iteracoes.........: ${iters.count || 0}`,
    `  portao (thresholds): ${falhos.length ? "REPROVADO -> " + falhos.join(" | ") : "ok"}`,
    "  -----------------------------------------",
    "  resumo.json gravado nesta pasta (rode o verificar.py em seguida)",
    "",
  ];

  return {
    stdout: linhas.join("\n"),
    "resumo.json": JSON.stringify(data, null, 2),
  };
}
