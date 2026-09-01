# Plano de Estudos — SQL para QA

Objetivo: sair do zero e chegar em **consultar, validar e investigar dados** com
confiança — a skill de SQL que realmente move a carreira de QA (validar regra de
negócio no banco, achar dado inconsistente que a UI esconde, montar massa de teste,
conferir o que a API gravou).

Foco: **mão na massa**. Cada módulo = teoria curta + exercícios rodando de verdade
no banco `pratica/pratica.db`.

---

## Versão web (recomendada)

Tem uma versão navegável em `site/`, montada como um hub de trilhas de QA
(`site/index.html`). A trilha de SQL fica em `site/sql/`: teoria e prática juntas,
uma página por módulo, com um SQLite rodando dentro do próprio navegador (não
precisa de Python pra rodar as queries, nada sai da máquina). Outras trilhas
(PostgreSQL, pytest, teste de API) estão listadas como "em breve".

```bash
python site/servir.py     # abre http://localhost:8000
```

O resto abaixo (arquivos `.md` + `sql.py`) continua valendo pra quem prefere
terminal.

## Como usar

```bash
# 1. criar o banco (só uma vez, ou pra resetar)
python pratica/build_db.py

# 2. rodar uma query rápida
python sql.py "SELECT * FROM clientes LIMIT 5"

# 3. rodar um arquivo de exercício inteiro
python sql.py exercicios/01_basico.sql

# 4. modo interativo (digite queries, termine com ;)
python sql.py
```

No modo interativo: `.tabelas` lista as tabelas, `.schema pedidos` mostra as colunas.

O banco (cenário: e-commerce sendo testado pelo time de QA):

| Tabela | O que é |
|---|---|
| `clientes` | quem compra (id, nome, email, cidade, estado, data_cadastro, ativo) |
| `produtos` | catálogo (id, nome, categoria, preco, estoque, ativo) |
| `pedidos` | pedidos (id, cliente_id, data_pedido, status, valor_total) |
| `itens_pedido` | linhas de cada pedido (pedido_id, produto_id, quantidade, preco_unitario) |
| `defeitos` | bugs reportados (modulo, severidade, prioridade, status, datas...) |
| `execucoes_teste` | execuções de casos de teste (suite, resultado, duracao, defeito_id) |

---

## Módulo 1 — Ler dados: SELECT, WHERE, ORDER BY, LIMIT, DISTINCT

**Teoria (resumo):**
- `SELECT colunas FROM tabela` — escolhe o quê e de onde.
- `WHERE condição` — filtra linhas. Operadores: `= <> > < >= <=`, `AND`, `OR`, `NOT`,
  `BETWEEN a AND b`, `IN (...)`, `LIKE 'abc%'` (`%` = qualquer coisa, `_` = 1 caractere).
- `ORDER BY coluna ASC|DESC` — ordena. `LIMIT n` — corta nas n primeiras.
- `DISTINCT` — remove duplicatas do resultado.
- `AS` — dá apelido a uma coluna (`preco * 0.9 AS preco_promo`).

**Exercícios:** `exercicios/01_basico.sql`

---

## Módulo 2 — NULL e filtros mais finos

**Teoria (resumo):**
- `NULL` = "sem valor". **Não** é 0 nem "". Não dá pra comparar com `=`:
  use `IS NULL` / `IS NOT NULL`.
- Qualquer conta com `NULL` vira `NULL` (`10 + NULL` = `NULL`).
- `COALESCE(a, b, c)` — devolve o primeiro que não for `NULL`.
- `CASE WHEN ... THEN ... ELSE ... END` — "if" dentro do SELECT.
- Pega QA de olho: linha com `data_fechamento IS NULL` = defeito ainda aberto.

**Exercícios:** `exercicios/02_filtros_e_nulos.sql`

---

## Módulo 3 — Agregação: COUNT, SUM, AVG, GROUP BY, HAVING

**Teoria (resumo):**
- Funções de agregação resumem várias linhas em uma: `COUNT(*)`, `SUM(x)`,
  `AVG(x)`, `MIN(x)`, `MAX(x)`.
- `GROUP BY coluna` — calcula a agregação **por grupo** (ex.: total por status).
- `WHERE` filtra **antes** de agrupar; `HAVING` filtra **depois** (sobre o resultado
  agregado). Ex.: `HAVING COUNT(*) > 5`.
- `COUNT(*)` conta linhas; `COUNT(coluna)` ignora `NULL` naquela coluna.

**Exercícios:** `exercicios/03_agregacao.sql`

---

## Módulo 4 — Juntar tabelas: JOIN

**Teoria (resumo):**
- `INNER JOIN b ON a.x = b.y` — só linhas que casam nas duas tabelas.
- `LEFT JOIN` — todas as linhas da tabela da esquerda, mesmo sem par na direita
  (colunas da direita vêm `NULL`). Útil pra achar "quem não tem": 
  `LEFT JOIN ... WHERE b.id IS NULL`.
- Sempre qualifique colunas ambíguas: `pedidos.id`, `clientes.id`.
- Dá pra juntar 3+ tabelas encadeando `JOIN`.

**Exercícios:** `exercicios/04_joins.sql`

---

## Módulo 5 — Subconsultas e CTE

**Teoria (resumo):**
- Subconsulta = um `SELECT` dentro de outro. Em `WHERE ... IN (SELECT ...)`,
  em `FROM (SELECT ...)`, ou escalar (`SELECT ... = (SELECT MAX(...))`).
- `WITH nome AS (SELECT ...) SELECT ... FROM nome` — CTE: dá nome a uma subconsulta,
  deixa a query legível. Encadeie com vírgula.
- `EXISTS (SELECT 1 FROM ... WHERE ...)` — testa se existe pelo menos uma linha.

**Exercícios:** `exercicios/05_subconsultas.sql`

---

## Módulo 6 — SQL no dia a dia de QA

**Teoria (resumo):** aqui você usa tudo junto pra tarefas reais:
- **Validação de dados**: achar linhas que violam a regra de negócio
  (ex.: pedido não-cancelado com `valor_total = 0`; item com `quantidade <= 0`;
  `valor_total` do pedido diferente da soma dos itens).
- **Métricas de QA**: taxa de aprovação por suite, tempo médio de correção de
  defeito (`data_fechamento - data_abertura`), defeitos críticos abertos por módulo.
- **Massa de teste**: montar `INSERT` pra criar um cenário específico.
- **Conferir escrita**: depois de um teste de API que cria pedido, checar no banco
  se gravou certo.

**Exercícios:** `exercicios/06_qa_na_pratica.sql` — inclui um bug plantado nos dados
pra você caçar.

---

## Módulo 7 — Escrever dados: INSERT, UPDATE, DELETE, transações

**Teoria (resumo):**
- `INSERT INTO t (col1, col2) VALUES (v1, v2)`.
- `UPDATE t SET col = valor WHERE ...` — **sempre** com `WHERE`, senão altera tudo.
- `DELETE FROM t WHERE ...` — idem.
- `BEGIN; ... COMMIT;` (ou `ROLLBACK;`) — agrupa mudanças; testa antes de confirmar.
- Reset a qualquer momento: `python pratica/build_db.py`.

**Exercícios:** `exercicios/07_escrita.sql`

---

## Depois disso

- Refazer os exercícios sem olhar o gabarito.
- Migrar o mesmo cenário pra **PostgreSQL** (sintaxe de datas/strings muda um pouco;
  o núcleo é igual) — é o banco que você mais vai encontrar no trabalho.
- Praticar em plataformas: SQLZoo, StrataScratch, DataLemur, HackerRank (SQL).
- Ligar com automação: rodar essas queries de validação dentro de um teste
  (`pytest` + `sqlite3`/`psycopg`).

## Gabarito

`exercicios/gabarito.md` — tenta resolver antes de abrir. Errar e ajustar é o
exercício.
