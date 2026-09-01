"""
Módulo 2 da trilha: as validações de dados da Trilha 1 (SQL), módulo 6,
viram testes.

Padrão de todo teste aqui:
  1. uma query traz as linhas ERRADAS (as que violam a regra);
  2. `assert` que a lista veio vazia;
  3. a mensagem do assert mostra QUAIS linhas quebraram, pra facilitar a caça.

Três testes estão marcados com @pytest.mark.xfail: são testes CORRETOS que
encontram bugs plantados de propósito no banco de prática. `xfail` = "eu já
sei que isto falha". Tire o marcador (módulo 3) e veja ficar vermelho — é você
pegando o bug.
"""

import pytest

from helpers import linhas

# ----- validações que o banco passa (dados limpos) --------------------------


def test_nenhum_pedido_orfao(db):
    ruins = linhas(
        db,
        """
        SELECT p.id
        FROM pedidos p
        LEFT JOIN clientes c ON c.id = p.cliente_id
        WHERE c.id IS NULL
        """,
    )
    assert ruins == [], f"pedidos sem cliente: {[r['id'] for r in ruins]}"


def test_emails_sem_duplicata(db):
    ruins = linhas(
        db,
        """
        SELECT email, COUNT(*) AS n
        FROM clientes
        GROUP BY email
        HAVING COUNT(*) > 1
        """,
    )
    assert ruins == [], f"emails repetidos: {[r['email'] for r in ruins]}"


def test_sem_estoque_negativo(db):
    ruins = linhas(db, "SELECT id, nome, estoque FROM produtos WHERE estoque < 0")
    assert ruins == [], f"produtos com estoque negativo: {[r['id'] for r in ruins]}"


# ----- validações que ENCONTRAM os bugs plantados --------------------------


@pytest.mark.xfail(reason="bug plantado: 3 pedidos 'pago' com valor_total = 0", strict=True)
def test_pedido_nao_cancelado_nao_tem_valor_zero(db):
    ruins = linhas(
        db,
        """
        SELECT id, status, valor_total
        FROM pedidos
        WHERE status <> 'cancelado' AND valor_total = 0
        """,
    )
    assert ruins == [], f"pedidos não-cancelados com valor 0: {[r['id'] for r in ruins]}"


@pytest.mark.xfail(reason="bug plantado: 2 pedidos com valor_total != soma dos itens", strict=True)
def test_valor_total_bate_com_itens(db):
    ruins = linhas(
        db,
        """
        SELECT p.id,
               p.valor_total,
               ROUND(SUM(i.quantidade * i.preco_unitario), 2) AS soma_itens
        FROM pedidos p
        JOIN itens_pedido i ON i.pedido_id = p.id
        GROUP BY p.id, p.valor_total
        HAVING ROUND(p.valor_total, 2) <> ROUND(SUM(i.quantidade * i.preco_unitario), 2)
        """,
    )
    assert ruins == [], f"pedidos com valor divergente: {[r['id'] for r in ruins]}"


@pytest.mark.xfail(reason="bug plantado: 2 itens de pedido com quantidade 0", strict=True)
def test_item_tem_quantidade_positiva(db):
    ruins = linhas(
        db,
        "SELECT id, pedido_id, quantidade FROM itens_pedido WHERE quantidade <= 0",
    )
    assert ruins == [], f"itens com quantidade <= 0: {[r['id'] for r in ruins]}"
