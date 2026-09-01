"""
Gera 'site/pg/seed.sql' — o mesmo cenário do pratica.db, porém em SQL
compatível com PostgreSQL (para a Trilha 2, que roda um Postgres real no
navegador via PGlite).

A diferença que interessa pro aprendizado está nos TIPOS:
  - ativo            -> BOOLEAN  (TRUE/FALSE, não 0/1)
  - preco / valores  -> NUMERIC(10,2)
  - datas            -> DATE  (data_fechamento pode ser NULL)

Os DADOS são exatamente os mesmos do pratica.db (lidos de lá), então os
números batem com a Trilha 1.

Rode:  python pratica/build_seed_pg.py
"""

import os
import sqlite3

AQUI = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(AQUI, "pratica.db")
OUT = os.path.join(AQUI, "..", "site", "pg", "seed.sql")

DDL = """-- Gerado por pratica/build_seed_pg.py — não edite à mão.
-- Cenário: e-commerce fictício sob teste de QA. Mesmos dados da Trilha 1,
-- agora com tipos de verdade do PostgreSQL.

DROP TABLE IF EXISTS itens_pedido, pedidos, produtos, clientes, execucoes_teste, defeitos;

CREATE TABLE clientes (
    id            INTEGER PRIMARY KEY,
    nome          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    cidade        TEXT    NOT NULL,
    estado        TEXT    NOT NULL,
    data_cadastro DATE    NOT NULL,
    ativo         BOOLEAN NOT NULL
);

CREATE TABLE produtos (
    id        INTEGER PRIMARY KEY,
    nome      TEXT          NOT NULL,
    categoria TEXT          NOT NULL,
    preco     NUMERIC(10,2) NOT NULL,
    estoque   INTEGER       NOT NULL,
    ativo     BOOLEAN       NOT NULL
);

CREATE TABLE pedidos (
    id          INTEGER PRIMARY KEY,
    cliente_id  INTEGER       NOT NULL REFERENCES clientes(id),
    data_pedido DATE          NOT NULL,
    status      TEXT          NOT NULL,
    valor_total NUMERIC(10,2) NOT NULL
);

CREATE TABLE itens_pedido (
    id             INTEGER PRIMARY KEY,
    pedido_id      INTEGER       NOT NULL REFERENCES pedidos(id),
    produto_id     INTEGER       NOT NULL REFERENCES produtos(id),
    quantidade     INTEGER       NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL
);

CREATE TABLE defeitos (
    id              INTEGER PRIMARY KEY,
    titulo          TEXT NOT NULL,
    modulo          TEXT NOT NULL,
    severidade      TEXT NOT NULL,
    prioridade      TEXT NOT NULL,
    status          TEXT NOT NULL,
    reportado_por   TEXT NOT NULL,
    ambiente        TEXT NOT NULL,
    data_abertura   DATE NOT NULL,
    data_fechamento DATE
);

CREATE TABLE execucoes_teste (
    id            INTEGER PRIMARY KEY,
    caso_teste    TEXT    NOT NULL,
    suite         TEXT    NOT NULL,
    resultado     TEXT    NOT NULL,
    data_execucao DATE    NOT NULL,
    duracao_seg   INTEGER NOT NULL,
    defeito_id    INTEGER REFERENCES defeitos(id)
);
"""

BOOL_COLS = {"ativo"}
DATE_COLS = {"data_cadastro", "data_pedido", "data_abertura", "data_fechamento", "data_execucao"}


def lit(col, val):
    if val is None:
        return "NULL"
    if col in BOOL_COLS:
        return "TRUE" if val else "FALSE"
    if col in DATE_COLS:
        return "DATE '%s'" % val
    if isinstance(val, str):
        return "'" + val.replace("'", "''") + "'"
    return str(val)


def dump(con, tabela, f):
    cur = con.execute("SELECT * FROM %s" % tabela)
    cols = [d[0] for d in cur.description]
    f.write("\n-- %s\n" % tabela)
    for row in cur.fetchall():
        vals = ", ".join(lit(c, v) for c, v in zip(cols, row))
        f.write("INSERT INTO %s (%s) VALUES (%s);\n" % (tabela, ", ".join(cols), vals))


def main():
    con = sqlite3.connect(DB)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(DDL)
        for t in ("clientes", "produtos", "pedidos", "itens_pedido", "defeitos", "execucoes_teste"):
            dump(con, t, f)
        f.write("\n-- corrige a sequência dos ids (inserimos ids explícitos)\n")
    con.close()
    print("OK ->", os.path.normpath(OUT))


if __name__ == "__main__":
    main()
