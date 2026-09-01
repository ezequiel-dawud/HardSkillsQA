"""
Módulo 4 da trilha: regras de negócio e @pytest.mark.parametrize.

parametrize roda a MESMA função de teste várias vezes, com valores diferentes.
Cada valor vira um caso separado no relatório (PASSED/FAILED por linha), então
você vê exatamente qual variação quebrou — sem escrever N funções quase iguais.
"""

import pytest

from helpers import linhas, scalar

STATUS_PEDIDO_VALIDOS = {"novo", "pago", "enviado", "entregue", "cancelado"}
SEVERIDADES_VALIDAS = {"baixa", "media", "alta", "critica"}
RESULTADOS_VALIDOS = {"passou", "falhou", "bloqueado", "pulado"}


@pytest.mark.parametrize(
    "coluna, tabela, permitidos",
    [
        ("status", "pedidos", STATUS_PEDIDO_VALIDOS),
        ("severidade", "defeitos", SEVERIDADES_VALIDAS),
        ("resultado", "execucoes_teste", RESULTADOS_VALIDOS),
    ],
)
def test_coluna_so_tem_valores_do_dominio(db, coluna, tabela, permitidos):
    achados = {r[0] for r in db.execute(f"SELECT DISTINCT {coluna} FROM {tabela}")}
    fora = achados - permitidos
    assert not fora, f"{tabela}.{coluna} tem valores inesperados: {fora}"


def test_defeito_fechado_tem_data_de_fechamento(db):
    ruins = linhas(
        db,
        """
        SELECT id, status
        FROM defeitos
        WHERE status IN ('fechado', 'resolvido') AND data_fechamento IS NULL
        """,
    )
    assert ruins == [], f"defeitos fechados sem data: {[r['id'] for r in ruins]}"


def test_defeito_aberto_nao_tem_data_de_fechamento(db):
    ruins = linhas(
        db,
        """
        SELECT id, status
        FROM defeitos
        WHERE status IN ('aberto', 'em_analise', 'reaberto')
          AND data_fechamento IS NOT NULL
        """,
    )
    assert ruins == [], f"defeitos abertos com data de fechamento: {[r['id'] for r in ruins]}"


def test_execucao_que_falhou_costuma_ter_defeito_ligado(db):
    # Regra "mole": não é erro grave, mas queremos vigiar. Aqui o assert é sobre
    # uma PROPORÇÃO, não sobre zero — outro jeito comum de escrever validação.
    total_falhas = scalar(db, "SELECT COUNT(*) FROM execucoes_teste WHERE resultado = 'falhou'")
    sem_defeito = scalar(
        db,
        "SELECT COUNT(*) FROM execucoes_teste WHERE resultado = 'falhou' AND defeito_id IS NULL",
    )
    proporcao = sem_defeito / total_falhas
    assert proporcao <= 0.30, (
        f"{sem_defeito}/{total_falhas} falhas ({proporcao:.0%}) sem defeito ligado — "
        f"acima do teto de 30%"
    )
