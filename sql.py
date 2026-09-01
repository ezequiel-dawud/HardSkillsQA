"""
Roda consultas SQL no banco de pratica.

Uso:
  python sql.py "SELECT * FROM clientes LIMIT 5"      # roda uma query direto
  python sql.py exercicios/01_basico.sql               # roda um arquivo .sql
  python sql.py                                        # modo interativo (digite queries)

No modo interativo: termine a query com ';' e Enter. Digite  .tabelas  para listar
as tabelas,  .schema NOME  para ver as colunas, e  sair  para encerrar.
"""

import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "pratica", "pratica.db")


def tabela(colunas, linhas, limite=100):
    if not linhas:
        print("(0 linhas)")
        return
    larg = [len(str(c)) for c in colunas]
    for ln in linhas[:limite]:
        for i, v in enumerate(ln):
            larg[i] = max(larg[i], len(str(v)))
    sep = "-+-".join("-" * w for w in larg)
    print(" | ".join(str(c).ljust(larg[i]) for i, c in enumerate(colunas)))
    print(sep)
    for ln in linhas[:limite]:
        print(" | ".join(str(v).ljust(larg[i]) for i, v in enumerate(ln)))
    extra = len(linhas) - limite
    print(f"\n{len(linhas)} linha(s)" + (f" (mostrando {limite})" if extra > 0 else ""))


def roda(con, sql):
    sql = sql.strip().rstrip(";")
    if not sql:
        return
    if sql == ".tabelas":
        cur = con.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        print("\n".join(r[0] for r in cur.fetchall()))
        return
    if sql.startswith(".schema"):
        nome = sql.split(maxsplit=1)[1] if " " in sql else ""
        cur = con.execute(f"PRAGMA table_info({nome})")
        rows = cur.fetchall()
        if not rows:
            print(f"tabela '{nome}' nao encontrada")
        for r in rows:
            print(f"  {r[1]:20} {r[2]:10} {'NOT NULL' if r[3] else ''}")
        return
    try:
        cur = con.execute(sql)
        if cur.description:
            cols = [c[0] for c in cur.description]
            tabela(cols, cur.fetchall())
        else:
            con.commit()
            print(f"OK ({cur.rowcount} linha(s) afetada(s))")
    except sqlite3.Error as e:
        print(f"ERRO SQL: {e}")


def main():
    if not os.path.exists(DB_PATH):
        print("Banco nao encontrado. Rode primeiro:  python pratica/build_db.py")
        sys.exit(1)
    con = sqlite3.connect(DB_PATH)

    if len(sys.argv) >= 2:
        arg = " ".join(sys.argv[1:])
        if arg.endswith(".sql") and os.path.exists(arg):
            conteudo = open(arg, encoding="utf-8").read()
            for stmt in conteudo.split(";"):
                if stmt.strip() and not stmt.strip().startswith("--"):
                    print(f"\n>>> {stmt.strip()[:80]}...")
                    roda(con, stmt)
        else:
            roda(con, arg)
        con.close()
        return

    print("Modo interativo. Termine com ';'. Comandos: .tabelas | .schema NOME | sair")
    buf = ""
    while True:
        try:
            linha = input("sql> " if not buf else "...> ")
        except (EOFError, KeyboardInterrupt):
            break
        if linha.strip().lower() in ("sair", "exit", "quit"):
            break
        buf += " " + linha
        if ";" in linha or linha.strip().startswith("."):
            roda(con, buf)
            buf = ""
    con.close()


if __name__ == "__main__":
    main()
