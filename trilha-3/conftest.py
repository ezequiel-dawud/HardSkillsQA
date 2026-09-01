"""
Configuração compartilhada dos testes (o pytest carrega este arquivo sozinho).

A fixture `db` entrega, pra cada teste, uma conexão SQLite aberta numa CÓPIA
do banco de prática. Cópia porque:
  - um teste que rode INSERT/UPDATE não suja o banco pro teste seguinte;
  - você pode rodar os testes sem medo de estragar `pratica/pratica.db`.
"""

import pathlib
import shutil
import sqlite3

import pytest

# raiz do repositório = pasta acima de trilha-3/
RAIZ = pathlib.Path(__file__).resolve().parents[1]
BANCO = RAIZ / "pratica" / "pratica.db"


@pytest.fixture
def db(tmp_path):
    if not BANCO.exists():
        pytest.fail(
            f"não achei o banco em {BANCO}. Rode os testes de dentro de trilha-3/, "
            f"com o repositório completo (o banco vive em pratica/pratica.db)."
        )
    copia = tmp_path / "pratica.db"
    shutil.copy(BANCO, copia)
    con = sqlite3.connect(copia)
    con.row_factory = sqlite3.Row  # linhas viram dict-like: row["nome"]
    try:
        yield con
    finally:
        con.close()
