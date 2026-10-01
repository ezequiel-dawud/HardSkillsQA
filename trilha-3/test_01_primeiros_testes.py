"""
Módulo 1 da trilha: a forma de um teste.

Um teste com pytest é só uma função `def test_algo():` com um `assert` dentro.
Se o assert é verdadeiro, PASSED. Se é falso (ou a função explode), FAILED,
e o pytest mostra os dois lados da comparação.

Rode só este arquivo com:  pytest -v test_01_primeiros_testes.py
"""

from helpers import scalar


def test_o_banco_abre(db):
    # `db` é a fixture do conftest.py — o pytest injeta pelo nome do parâmetro.
    total = scalar(db, "SELECT COUNT(*) FROM clientes")
    assert total == 61


def test_contagem_das_tabelas(db):
    esperado = {
        "clientes": 60,
        "produtos": 15,
        "pedidos": 200,
        "defeitos": 80,
        "execucoes_teste": 600,
    }
    real = {t: scalar(db, f"SELECT COUNT(*) FROM {t}") for t in esperado}
    assert real == esperado


def test_todo_pedido_aponta_para_um_cliente_que_existe(db):
    # Primeiro contato com "query de validação vira teste":
    # a query traz as linhas problemáticas; o teste passa quando NÃO há nenhuma.
    orfaos = db.execute(
        """
        SELECT p.id
        FROM pedidos p
        LEFT JOIN clientes c ON c.id = p.cliente_id
        WHERE c.id IS NULL
        """
    ).fetchall()
    assert orfaos == [], f"pedidos sem cliente válido: {[r['id'] for r in orfaos]}"
