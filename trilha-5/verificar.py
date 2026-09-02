#!/usr/bin/env python3
"""
Corretor da Trilha 5 (teste de carga com k6).

Uso, de dentro de trilha-5/:

    python verificar.py <modulo 1-4> [resumo.json] [mock/ultimo_relatorio.json]

- `resumo.json` e o arquivo que o k6 grava no fim (via handleSummary de
  lib/resumo.js). Se voce nao passar o caminho, ele procura ./resumo.json.
- `mock/ultimo_relatorio.json` e o resumo do servidor mock, gravado quando
  voce encerra ele com Ctrl+C. Usado nos modulos 3 e 4.

Confere so os criterios OBJETIVOS de cada modulo (configurou VUs? definiu
threshold? o dado variou?) e imprime  [ok] / [--]  em cada um. Sai 0 se todos
passaram, 1 se faltou algo. Julgamento ("esse p95 e aceitavel?") nao entra
aqui -- isso a teoria discute.
"""

import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent


def carregar(caminho):
    p = Path(caminho)
    if not p.is_absolute():
        p = AQUI / p
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"  !! {p} nao e um JSON valido: {e}")
        return None


def val(resumo, metrica, chave, padrao=None):
    try:
        return resumo["metrics"][metrica]["values"][chave]
    except (KeyError, TypeError):
        return padrao


def vus_pico(resumo):
    """VUs no pico. k6 grava vus_max como gauge: values tem 'max' (as vezes so 'value')."""
    return val(resumo, "vus_max", "max") or val(resumo, "vus_max", "value") \
        or val(resumo, "vus", "max") or val(resumo, "vus", "value") or 0


def tem_threshold(resumo, metrica, contendo=None):
    """True se a metrica tem bloco de thresholds (opcionalmente com um texto na regra)."""
    try:
        regras = resumo["metrics"][metrica]["thresholds"]
    except (KeyError, TypeError):
        return False
    if not regras:
        return False
    if contendo is None:
        return True
    return any(contendo in regra for regra in regras)


def thresholds_reprovados(resumo):
    fora = []
    for nome, m in (resumo.get("metrics") or {}).items():
        for regra, res in (m.get("thresholds") or {}).items():
            if isinstance(res, dict) and res.get("ok") is False:
                fora.append(f"{nome}: {regra}")
    return fora


def linha(desc, ok, dica=""):
    marca = "[ok]" if ok else "[--]"
    txt = f"  {marca} {desc}"
    if not ok and dica:
        txt += f"\n         -> {dica}"
    print(txt)
    return ok


# --------------------------------------------------------------------------- #
#  um verificador por modulo. Cada um retorna lista de bool.
# --------------------------------------------------------------------------- #
def modulo_1(resumo, mock):
    reqs = val(resumo, "http_reqs", "count", 0) or 0
    checks_tot = (val(resumo, "checks", "passes", 0) or 0) + (val(resumo, "checks", "fails", 0) or 0)
    return [
        linha("o k6 executou requisicoes HTTP", reqs > 0,
              "rode  k6 run scripts/01_smoke.js  com o mock ligado"),
        linha("a duracao das respostas foi medida", val(resumo, "http_req_duration", "avg") is not None),
        linha("o script tem pelo menos um check()", checks_tot > 0,
              "cada check() vira a metrica `checks` no resumo"),
        linha("todos os thresholds passaram (smoke limpo)", not thresholds_reprovados(resumo),
              "; ".join(thresholds_reprovados(resumo))),
    ]


def modulo_2(resumo, mock):
    reqs = val(resumo, "http_reqs", "count", 0) or 0
    checks_ok = val(resumo, "checks", "passes", 0) or 0
    tem_sub = tem_threshold(resumo, "http_req_duration", contendo="tipo:leitura") or \
        any("tipo:leitura" in k for k in (resumo.get("metrics") or {}))
    vus = vus_pico(resumo)
    iters = val(resumo, "iterations", "count", 0) or 0
    return [
        linha("rodou com mais de 1 VU", vus >= 2, f"vus_max={vus}"),
        linha("fez varias iteracoes ao longo do tempo (duration)", iters >= 10, f"iterations={iters}"),
        linha("tem checks passando (login/produtos/pedido)", checks_ok >= 3, f"checks ok={checks_ok}"),
        linha("usou tag pra criar sub-metrica (tipo:leitura)", tem_sub,
              "marque a requisicao de leitura com { tags: { tipo: 'leitura' } }"),
        linha("gerou trafego GET e POST", reqs >= 10, f"http_reqs={reqs}"),
    ]


def modulo_3(resumo, mock):
    vus = vus_pico(resumo)
    tem_p95 = tem_threshold(resumo, "http_req_duration", contendo="p(95)")
    tem_erro = tem_threshold(resumo, "http_req_failed")
    reprovados = thresholds_reprovados(resumo)
    checks = []
    checks.append(linha("a rampa (stages) chegou a ~20 VUs", vus >= 18, f"vus_max={vus}"))
    checks.append(linha("existe threshold de p95 em http_req_duration", tem_p95))
    checks.append(linha("existe threshold de erro (http_req_failed)", tem_erro))
    checks.append(linha("o portao processou as regras (passando ou reprovando)",
                        tem_p95 and tem_erro))
    if mock:
        pico = mock.get("pico_simultaneo", 0)
        checks.append(linha("o servidor viu a carga simultanea subir", pico >= 10,
                            f"pico_simultaneo={pico} (encerrou o mock com Ctrl+C antes de checar?)"))
    else:
        print("  (sem mock/ultimo_relatorio.json -- encerre o mock com Ctrl+C pra checar o lado do servidor)")
    # nota, nao criterio:
    if reprovados:
        print("  nota: o portao REPROVOU em " + "; ".join(reprovados) +
              " -- esperado neste modulo. O teste de carga achou o limite do sistema.")
    else:
        print("  nota: o portao passou. Se quer ver ele reprovar, aperte o p95 ou suba a latencia do mock.")
    return checks


def modulo_4(resumo, mock):
    checks_rate = val(resumo, "checks", "rate", 0) or 0
    iters = val(resumo, "iterations", "count", 0) or 0
    out = [
        linha("rodou as 100 iteracoes", iters >= 100, f"iterations={iters}"),
        linha("taxa de checks acima de 95%", checks_rate >= 0.95, f"checks rate={checks_rate:.3f}"),
    ]
    if mock:
        emails = mock.get("emails_distintos", 0)
        reaproveitados = mock.get("tokens_reaproveitados", 0)
        distintos = mock.get("tokens_distintos", 0)
        out.append(linha("os dados variaram (muitos emails distintos)", emails >= 20,
                          f"emails_distintos={emails}"))
        out.append(linha("correlacao: o mesmo token foi reaproveitado", reaproveitados > 0,
                          f"tokens_reaproveitados={reaproveitados}"))
        out.append(linha("mais de um usuario da lista foi usado", distintos >= 5,
                          f"tokens_distintos={distintos}"))
    else:
        print("  (sem mock/ultimo_relatorio.json -- encerre o mock com Ctrl+C pra checar variacao de dados e correlacao)")
    return out


VERIFICADORES = {1: modulo_1, 2: modulo_2, 3: modulo_3, 4: modulo_4}


def main(argv):
    if len(argv) < 2 or argv[1] not in {"1", "2", "3", "4"}:
        print(__doc__)
        return 2

    modulo = int(argv[1])
    caminho_resumo = argv[2] if len(argv) > 2 else "resumo.json"
    caminho_mock = argv[3] if len(argv) > 3 else "mock/ultimo_relatorio.json"

    resumo = carregar(caminho_resumo)
    if resumo is None:
        print(f"  nao achei {caminho_resumo}. Rode o k6 primeiro:")
        print(f"      k6 run scripts/0{modulo}_*.js")
        print("  (o handleSummary de lib/resumo.js grava o resumo.json na pasta onde voce chamou o k6)")
        return 1

    mock = carregar(caminho_mock)

    print(f"\n  Modulo {modulo} -- conferindo {caminho_resumo}\n")
    resultados = VERIFICADORES[modulo](resumo, mock)
    faltou = resultados.count(False)
    print()
    if faltou == 0:
        print(f"  tudo certo no modulo {modulo}. Pode seguir.\n")
        return 0
    print(f"  faltou {faltou} criterio(s) no modulo {modulo}. Ajuste o script e rode de novo.\n")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
