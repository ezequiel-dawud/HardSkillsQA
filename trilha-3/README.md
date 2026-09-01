# Trilha 3 — Validação com pytest

Pegar as queries de "caça-bug" que você aprendeu na Trilha 1 (SQL) e transformar
em **testes automatizados** que rodam sozinhos — no seu terminal e depois no CI.

A teoria fica no site (`site/pytest/`). Aqui está o projeto de verdade pra você
rodar na sua máquina.

## Rodar (Windows / PowerShell)

Do diretório `trilha-3/`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pytest -v
```

(No macOS/Linux o único passo diferente é ativar o venv: `source .venv/bin/activate`.)

Saída esperada na primeira vez:

```
test_01_primeiros_testes.py::test_o_banco_abre PASSED
test_01_primeiros_testes.py::test_contagem_das_tabelas PASSED
test_02_integridade.py::test_nenhum_pedido_orfao PASSED
test_02_integridade.py::test_emails_sem_duplicata PASSED
test_02_integridade.py::test_sem_estoque_negativo PASSED
test_02_integridade.py::test_pedido_nao_cancelado_nao_tem_valor_zero XFAIL
test_02_integridade.py::test_valor_total_bate_com_itens XFAIL
test_02_integridade.py::test_item_tem_quantidade_positiva XFAIL
...
======== X passed, 3 xfailed ========
```

Os 3 **XFAIL** são testes corretos que encontram os bugs plantados de propósito
no banco de prática. O módulo 3 da trilha explica como "soltar" esses testes e
ver eles ficarem vermelhos — que é você pegando o bug.

## Estrutura

| Arquivo | O que é |
|---|---|
| `conftest.py` | a fixture `db` — abre uma cópia de `../pratica/pratica.db` pra cada teste |
| `helpers.py` | atalhos: `scalar()`, `linhas()` |
| `test_01_primeiros_testes.py` | o "olá, teste": abrir o banco, contar linhas |
| `test_02_integridade.py` | as validações de dados da Trilha 1 viram `assert` |
| `test_03_regras_negocio.py` | regras de negócio + `@pytest.mark.parametrize` |
