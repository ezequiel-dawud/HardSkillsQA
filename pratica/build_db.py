"""
Gera o banco de pratica 'pratica.db' (SQLite).

Cenario: um e-commerce ficticio que esta sendo testado pelo time de QA.
Tabelas de negocio (clientes, produtos, pedidos, itens_pedido) + tabelas
de QA (defeitos, execucoes_teste).

Rode:  python pratica/build_db.py
Isso apaga e recria o banco do zero, sempre com os mesmos dados (seed fixa).
"""

import os
import random
import sqlite3
from datetime import date, timedelta

random.seed(42)  # dados deterministicos: todo mundo ve o mesmo resultado

DB_PATH = os.path.join(os.path.dirname(__file__), "pratica.db")

SCHEMA = """
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS execucoes_teste;
DROP TABLE IF EXISTS defeitos;

CREATE TABLE clientes (
    id            INTEGER PRIMARY KEY,
    nome          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    cidade        TEXT    NOT NULL,
    estado        TEXT    NOT NULL,
    data_cadastro TEXT    NOT NULL,   -- 'YYYY-MM-DD'
    ativo         INTEGER NOT NULL    -- 0 ou 1
);

CREATE TABLE produtos (
    id        INTEGER PRIMARY KEY,
    nome      TEXT    NOT NULL,
    categoria TEXT    NOT NULL,
    preco     REAL    NOT NULL,
    estoque   INTEGER NOT NULL,
    ativo     INTEGER NOT NULL
);

CREATE TABLE pedidos (
    id          INTEGER PRIMARY KEY,
    cliente_id  INTEGER NOT NULL REFERENCES clientes(id),
    data_pedido TEXT    NOT NULL,
    status      TEXT    NOT NULL,   -- novo, pago, enviado, entregue, cancelado
    valor_total REAL    NOT NULL
);

CREATE TABLE itens_pedido (
    id             INTEGER PRIMARY KEY,
    pedido_id      INTEGER NOT NULL REFERENCES pedidos(id),
    produto_id     INTEGER NOT NULL REFERENCES produtos(id),
    quantidade     INTEGER NOT NULL,
    preco_unitario REAL    NOT NULL
);

CREATE TABLE defeitos (
    id             INTEGER PRIMARY KEY,
    titulo         TEXT    NOT NULL,
    modulo         TEXT    NOT NULL,   -- login, carrinho, checkout, busca, pagamento, perfil
    severidade     TEXT    NOT NULL,   -- baixa, media, alta, critica
    prioridade     TEXT    NOT NULL,   -- P1, P2, P3, P4
    status         TEXT    NOT NULL,   -- aberto, em_analise, resolvido, fechado, reaberto
    reportado_por  TEXT    NOT NULL,
    ambiente       TEXT    NOT NULL,   -- dev, homolog, producao
    data_abertura  TEXT    NOT NULL,
    data_fechamento TEXT             -- NULL quando ainda nao fechado
);

CREATE TABLE execucoes_teste (
    id            INTEGER PRIMARY KEY,
    caso_teste    TEXT    NOT NULL,
    suite         TEXT    NOT NULL,   -- regressao, smoke, e2e, api
    resultado     TEXT    NOT NULL,   -- passou, falhou, bloqueado, pulado
    data_execucao TEXT    NOT NULL,
    duracao_seg   INTEGER NOT NULL,
    defeito_id    INTEGER REFERENCES defeitos(id)  -- preenchido quando resultado = 'falhou'
);
"""

NOMES = ["Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique",
         "Isabela", "Joao", "Karina", "Lucas", "Marina", "Nicolas", "Olivia", "Pedro",
         "Renata", "Sergio", "Tatiane", "Vitor"]
SOBRENOMES = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Lima", "Costa", "Rocha",
              "Almeida", "Nunes", "Carvalho", "Gomes"]
CIDADES = [("Sao Paulo", "SP"), ("Campinas", "SP"), ("Rio de Janeiro", "RJ"),
           ("Belo Horizonte", "MG"), ("Curitiba", "PR"), ("Porto Alegre", "RS"),
           ("Salvador", "BA"), ("Recife", "PE"), ("Fortaleza", "CE"), ("Manaus", "AM")]

PRODUTOS = [
    ("Teclado Mecanico", "Perifericos", 320.0), ("Mouse Gamer", "Perifericos", 180.0),
    ("Headset USB", "Perifericos", 250.0), ("Monitor 24pol", "Monitores", 900.0),
    ("Monitor 27pol", "Monitores", 1450.0), ("Webcam HD", "Perifericos", 210.0),
    ("SSD 1TB", "Armazenamento", 480.0), ("HD Externo 2TB", "Armazenamento", 390.0),
    ("Cadeira de Escritorio", "Moveis", 780.0), ("Suporte para Notebook", "Acessorios", 95.0),
    ("Hub USB-C", "Acessorios", 130.0), ("Cabo HDMI 2m", "Acessorios", 35.0),
    ("Notebook 14pol", "Computadores", 3800.0), ("Notebook 16pol", "Computadores", 5200.0),
    ("Mousepad Grande", "Acessorios", 60.0),
]

MODULOS = ["login", "carrinho", "checkout", "busca", "pagamento", "perfil"]
SEVERIDADES = ["baixa", "media", "alta", "critica"]
PRIORIDADES = ["P1", "P2", "P3", "P4"]
STATUS_DEF = ["aberto", "em_analise", "resolvido", "fechado", "reaberto"]
AMBIENTES = ["dev", "homolog", "producao"]
QAS = ["ezequiel", "amanda", "rodrigo", "juliana"]
STATUS_PEDIDO = ["novo", "pago", "enviado", "entregue", "cancelado"]

BASE = date(2025, 1, 1)


def d(offset_dias):
    return (BASE + timedelta(days=offset_dias)).isoformat()


def build():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    # --- clientes ---
    clientes = []
    for i in range(1, 61):
        nome = f"{random.choice(NOMES)} {random.choice(SOBRENOMES)}"
        email = f"cliente{i}@exemplo.com"
        cidade, estado = random.choice(CIDADES)
        cadastro = d(random.randint(0, 200))
        ativo = 1 if random.random() > 0.15 else 0
        clientes.append((i, nome, email, cidade, estado, cadastro, ativo))
    cur.executemany("INSERT INTO clientes VALUES (?,?,?,?,?,?,?)", clientes)

    # --- produtos ---
    produtos = []
    for i, (nome, cat, preco) in enumerate(PRODUTOS, start=1):
        estoque = random.randint(0, 120)
        ativo = 1 if random.random() > 0.1 else 0
        produtos.append((i, nome, cat, preco, estoque, ativo))
    cur.executemany("INSERT INTO produtos VALUES (?,?,?,?,?,?)", produtos)

    # --- pedidos + itens ---
    pedidos, itens = [], []
    item_id = 1
    for pid in range(1, 201):
        cliente_id = random.randint(1, 60)
        data_pedido = d(random.randint(30, 240))
        status = random.choices(STATUS_PEDIDO, weights=[10, 25, 20, 35, 10])[0]
        n_itens = random.randint(1, 4)
        total = 0.0
        escolhidos = random.sample(range(1, len(PRODUTOS) + 1), n_itens)
        for prod_id in escolhidos:
            qtd = random.randint(1, 3)
            preco_unit = PRODUTOS[prod_id - 1][2]
            total += qtd * preco_unit
            itens.append((item_id, pid, prod_id, qtd, preco_unit))
            item_id += 1
        pedidos.append((pid, cliente_id, data_pedido, status, round(total, 2)))

    # --- BUGS PLANTADOS (pra caçar no modulo 6) ---
    # A) 3 pedidos NAO cancelados com valor_total = 0 (nao deveria existir)
    for pid in (17, 88, 143):
        c_id, dt, _stt, _tot = pedidos[pid - 1][1:]
        pedidos[pid - 1] = (pid, c_id, dt, "pago", 0.0)
    # B) 2 pedidos com valor_total diferente da soma dos itens
    for pid in (25, 110):
        c_id, dt, stt, tot = pedidos[pid - 1][1:]
        pedidos[pid - 1] = (pid, c_id, dt, stt, round(tot + 99.99, 2))
    # C) 2 itens com quantidade invalida (0)
    itens[5] = (itens[5][0], itens[5][1], itens[5][2], 0, itens[5][4])
    itens[200] = (itens[200][0], itens[200][1], itens[200][2], 0, itens[200][4])

    cur.executemany("INSERT INTO pedidos VALUES (?,?,?,?,?)", pedidos)
    cur.executemany("INSERT INTO itens_pedido VALUES (?,?,?,?,?)", itens)

    # --- defeitos ---
    defeitos = []
    for i in range(1, 81):
        modulo = random.choice(MODULOS)
        sev = random.choices(SEVERIDADES, weights=[30, 35, 25, 10])[0]
        prio = random.choice(PRIORIDADES)
        status = random.choices(STATUS_DEF, weights=[25, 20, 20, 30, 5])[0]
        abertura_off = random.randint(0, 220)
        if status in ("fechado", "resolvido"):
            fechamento = d(abertura_off + random.randint(1, 40))
        else:
            fechamento = None
        titulo = f"[{modulo}] erro ao {random.choice(['salvar', 'carregar', 'validar', 'exibir', 'calcular'])} {random.choice(['campo', 'lista', 'total', 'sessao', 'filtro'])}"
        defeitos.append((i, titulo, modulo, sev, prio, status,
                         random.choice(QAS), random.choice(AMBIENTES),
                         d(abertura_off), fechamento))
    cur.executemany("INSERT INTO defeitos VALUES (?,?,?,?,?,?,?,?,?,?)", defeitos)

    # --- execucoes de teste ---
    execucoes = []
    ex_id = 1
    for _ in range(600):
        suite = random.choice(["regressao", "smoke", "e2e", "api"])
        resultado = random.choices(["passou", "falhou", "bloqueado", "pulado"],
                                   weights=[70, 15, 8, 7])[0]
        caso = f"CT-{random.randint(1, 250):03d}"
        dur = random.randint(2, 240)
        defeito_id = (random.randint(1, 80) if random.random() < 0.8 else None) if resultado == "falhou" else None
        execucoes.append((ex_id, caso, suite, resultado,
                          d(random.randint(0, 240)), dur, defeito_id))
        ex_id += 1
    cur.executemany("INSERT INTO execucoes_teste VALUES (?,?,?,?,?,?,?)", execucoes)

    con.commit()
    con.close()
    print(f"OK -> banco criado em {DB_PATH}")
    print("Tabelas: clientes(60), produtos(15), pedidos(200), itens_pedido, defeitos(80), execucoes_teste(600)")


if __name__ == "__main__":
    build()
