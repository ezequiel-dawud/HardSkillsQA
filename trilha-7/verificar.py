#!/usr/bin/env python3
"""
Corretor da Trilha 7 (automacao web com Playwright).

Uso, de dentro de trilha-7/:

    npx playwright test tests/0<modulo>_*.spec.js
    python verificar.py <modulo 1-5 ou "final"> [resultado.json]

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


def modulo_5(relatorio, specs):
    stats = relatorio.get("stats", {})
    get_sem_token = achar(specs, "nao exige token")
    post_sem_token = achar(specs, "post sem token")
    cria = achar(specs, "post com token cria produto")
    le = achar(specs, "retorna o produto criado")
    atualiza = achar(specs, "atualiza o preco")
    remove = achar(specs, "delete remove o produto")
    confirma_remocao = achar(specs, "depois do delete")
    put_sem_token = achar(specs, "put sem token")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/05_api.spec.js  e leia o erro"),
        linha("GET sem token passou", bool(get_sem_token and get_sem_token["ok"])),
        linha("POST sem token retorna 401", bool(post_sem_token and post_sem_token["ok"])),
        linha("POST com token cria produto", bool(cria and cria["ok"])),
        linha("GET confirma o produto criado", bool(le and le["ok"])),
        linha("PUT atualiza o preco", bool(atualiza and atualiza["ok"])),
        linha("DELETE remove o produto", bool(remove and remove["ok"])),
        linha("GET depois do DELETE confirma a remocao", bool(confirma_remocao and confirma_remocao["ok"])),
        linha("exercicio: existe um teste de PUT sem token e ele passou",
              bool(put_sem_token and put_sem_token["ok"]),
              "escreva um teste cujo titulo contenha 'PUT sem token', chamando a API sem o header Authorization"),
    ]


def modulo_final(relatorio, specs):
    stats = relatorio.get("stats", {})
    criar = achar(specs, "criar produto via api e ver ele na loja")
    mudar_preco = achar(specs, "mudar o preco via api")
    excluir = achar(specs, "excluir produto via api")
    return [
        linha("nenhum teste falhou de forma inesperada", stats.get("unexpected", 1) == 0,
              "rode  npx playwright test tests/06_desafio_final.spec.js  e leia o erro"),
        linha("criar produto via API e ver na tela do produto", bool(criar and criar["ok"])),
        linha("mudar o preco via API e ver refletido na tela", bool(mudar_preco and mudar_preco["ok"])),
        linha("excluir via API e confirmar 'Produto nao encontrado' na tela", bool(excluir and excluir["ok"])),
    ]


VERIFICADORES = {
    "1": ("tests/01_primeiro_teste.spec.js", modulo_1),
    "2": ("tests/02_selecionadores.spec.js", modulo_2),
    "3": ("tests/03_cenarios.spec.js", modulo_3),
    "4": ("tests/04_rede_ci.spec.js", modulo_4),
    "5": ("tests/05_api.spec.js", modulo_5),
    "final": ("tests/06_desafio_final.spec.js", modulo_final),
}


def main(argv):
    if len(argv) < 2 or argv[1] not in VERIFICADORES:
        print(__doc__)
        return 2

    modulo = argv[1]
    arquivo_testes, verificador = VERIFICADORES[modulo]
    rotulo = "desafio final" if modulo == "final" else f"modulo {modulo}"

    caminho_resultado = argv[2] if len(argv) > 2 else "resultado.json"
    relatorio = carregar(caminho_resultado)
    if relatorio is None:
        print(f"  nao achei {caminho_resultado}. Rode o Playwright primeiro:")
        print(f"      npx playwright test {arquivo_testes}")
        return 1

    specs = specs_planas(relatorio)

    print(f"\n  {rotulo.capitalize()} -- conferindo {caminho_resultado}\n")
    resultados = verificador(relatorio, specs)
    faltou = resultados.count(False)
    print()
    if faltou == 0:
        print(f"  tudo certo no {rotulo}. Pode seguir.\n")
        return 0
    print(f"  faltou {faltou} criterio(s) no {rotulo}. Ajuste o teste e rode de novo.\n")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
