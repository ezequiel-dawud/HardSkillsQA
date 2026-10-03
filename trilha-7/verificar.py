#!/usr/bin/env python3
"""
Corretor da Trilha 7 (automacao web com Playwright).

Uso, de dentro de trilha-7/:

    npx playwright test tests/0<modulo>_*.spec.js
    python verificar.py <modulo 1-4> [resultado.json]

`resultado.json` e o relatorio que o Playwright grava no fim (reporter json
configurado em playwright.config.js). Se voce nao passar o caminho, procura
./resultado.json.

Confere so os criterios OBJETIVOS de cada modulo (o teste existe? passou?).
Julgamento ("esse seletor e o melhor?") nao entra aqui -- isso a teoria discute.
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


def specs_planas(relatorio):
    """Achata as suites aninhadas numa lista de {titulo, ok}."""
    out = []

    def visitar(suites):
        for s in suites:
            for spec in s.get("specs", []):
                out.append({"titulo": spec.get("title", ""), "ok": bool(spec.get("ok"))})
            visitar(s.get("suites", []))

    visitar(relatorio.get("suites", []))
    return out


def achar(specs, pedaco):
    """Primeiro spec cujo titulo (minusculo) contem `pedaco`."""
    pedaco = pedaco.lower()
    for s in specs:
        if pedaco in s["titulo"].lower():
            return s
    return None


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
def modulo_1(relatorio, specs):
    stats = relatorio.get("stats", {})
    carrega = achar(specs, "pagina de login carrega")
    login_ok = achar(specs, "credenciais validas")
    senha_errada = achar(specs, "senha errada")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/01_primeiro_teste.spec.js  e leia o erro"),
        linha("o teste 'a pagina de login carrega' passou", bool(carrega and carrega["ok"])),
        linha("o teste de login com credenciais validas passou", bool(login_ok and login_ok["ok"])),
        linha("exercicio: existe um teste de senha errada e ele passou",
              bool(senha_errada and senha_errada["ok"]),
              "escreva um teste cujo titulo contenha 'senha errada', usando login-error-message"),
    ]


def modulo_2(relatorio, specs):
    stats = relatorio.get("stats", {})
    obrigatorios = achar(specs, "campos obrigatorios")
    sucesso = achar(specs, "cadastro valido")
    senha_curta = achar(specs, "senha curta")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/02_selecionadores.spec.js  e leia o erro"),
        linha("o teste de campos obrigatorios passou", bool(obrigatorios and obrigatorios["ok"])),
        linha("o teste de cadastro valido passou", bool(sucesso and sucesso["ok"])),
        linha("exercicio: existe um teste de senha curta e ele passou",
              bool(senha_curta and senha_curta["ok"]),
              "escreva um teste cujo titulo contenha 'senha curta'"),
    ]


def modulo_3(relatorio, specs):
    stats = relatorio.get("stats", {})
    carregou = achar(specs, "aparecem depois do carregamento")
    vazio = achar(specs, "estado vazio")
    paginacao = achar(specs, "paginacao avanca")
    modal = achar(specs, "modal de confirmacao")
    upload = achar(specs, "upload de arquivo")
    arrastar = achar(specs, "arrastar")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/03_cenarios.spec.js  e leia o erro"),
        linha("o teste de carregamento da lista passou", bool(carregou and carregou["ok"])),
        linha("o teste de estado vazio passou", bool(vazio and vazio["ok"])),
        linha("o teste de paginacao passou", bool(paginacao and paginacao["ok"])),
        linha("o teste do modal de confirmacao passou", bool(modal and modal["ok"])),
        linha("o teste de upload passou", bool(upload and upload["ok"])),
        linha("exercicio: existe um teste de arrastar (drag and drop) e ele passou",
              bool(arrastar and arrastar["ok"]),
              "escreva um teste cujo titulo contenha 'arrastar', usando .dragTo()"),
    ]


def modulo_4(relatorio, specs):
    stats = relatorio.get("stats", {})
    erro_real = achar(specs, "erro real do servidor")
    mock_erro = achar(specs, "forcar uma resposta diferente")
    pular_login = achar(specs, "pular o login")
    produto_mockado = achar(specs, "produto mockado")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/04_rede_ci.spec.js  e leia o erro"),
        linha("o teste de erro real do servidor passou", bool(erro_real and erro_real["ok"])),
        linha("o teste de mock de erro (page.route) passou", bool(mock_erro and mock_erro["ok"])),
        linha("o teste de pular login via localStorage passou", bool(pular_login and pular_login["ok"])),
        linha("exercicio: existe um teste de produto mockado e ele passou",
              bool(produto_mockado and produto_mockado["ok"]),
              "escreva um teste cujo titulo contenha 'produto mockado', usando page.route em /api/produtos*"),
    ]


VERIFICADORES = {1: modulo_1, 2: modulo_2, 3: modulo_3, 4: modulo_4}


def main(argv):
    if len(argv) < 2 or argv[1] not in {"1", "2", "3", "4"}:
        print(__doc__)
        return 2

    modulo = int(argv[1])
    if modulo not in VERIFICADORES:
        print(f"  modulo {modulo} ainda nao tem corretor.")
        return 2

    caminho_resultado = argv[2] if len(argv) > 2 else "resultado.json"
    relatorio = carregar(caminho_resultado)
    if relatorio is None:
        print(f"  nao achei {caminho_resultado}. Rode o Playwright primeiro:")
        print(f"      npx playwright test tests/0{modulo}_*.spec.js")
        return 1

    specs = specs_planas(relatorio)

    print(f"\n  Modulo {modulo} -- conferindo {caminho_resultado}\n")
    resultados = VERIFICADORES[modulo](relatorio, specs)
    faltou = resultados.count(False)
    print()
    if faltou == 0:
        print(f"  tudo certo no modulo {modulo}. Pode seguir.\n")
        return 0
    print(f"  faltou {faltou} criterio(s) no modulo {modulo}. Ajuste o teste e rode de novo.\n")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
