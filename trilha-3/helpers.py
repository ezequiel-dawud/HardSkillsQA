"""Atalhos pra deixar os testes curtos e legíveis."""


def scalar(con, sql, *params):
    """Roda a query e devolve UM valor (primeira coluna da primeira linha).

    Útil pra COUNT(*): `assert scalar(con, "SELECT COUNT(*) FROM x") == 0`.
    """
    linha = con.execute(sql, params).fetchone()
    return linha[0] if linha is not None else None


def linhas(con, sql, *params):
    """Roda a query e devolve a lista de linhas (cada uma acessível por nome)."""
    return con.execute(sql, params).fetchall()
