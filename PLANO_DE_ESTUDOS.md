# Plano de Estudos — QA Learning

Objetivo: sair do zero e chegar em **QA que sabe o que testar e consegue provar**:
escolher casos de teste com técnica, investigar dados no banco, testar API, automatizar
a validação e fazer tudo isso rodar sozinho no pipeline.

Foco: **mão na massa**. Cada módulo = teoria curta + prática rodando de verdade,
a maioria dentro do próprio navegador.

---

## Versão web (recomendada)

Hub de trilhas em `site/` (`site/index.html`), publicado na Vercel. Oito trilhas e um
projeto final:

| Pasta | O que é | Onde roda |
|---|---|---|
| `site/fundamentos/` | **Fundamentos de Teste** — princípios, níveis e tipos, técnicas de design de caso de teste, exploratório, relatar bug. 5 módulos | leitura + provas na página |
| `site/git/` | **Git e GitHub para QA** — fork, clone, o ciclo, branch, Pull Request e os checks do CI. 3 módulos | terminal do aluno |
| `site/sql/` | **SQL para QA** — SELECT a transações, 7 módulos | SQLite (WASM) na página |
| `site/pg/` | **PostgreSQL na prática** — tipos reais, datas, texto, FILTER, window functions, 7 módulos | Postgres (PGlite/WASM) na página |
| `site/pytest/` | **Validação com pytest** — queries de validação viram testes + CI, 4 módulos | teoria na página; testes rodam local (`trilha-3/`) |
| `site/api/` | **Teste de API** — status, contrato, cruzar API × banco, 4 módulos | API falsa em JS na página |
| `site/k6/` | **Teste de carga com k6** — VU/iteração, thresholds como portão, dados e CI, 4 módulos | teoria na página; k6 roda local (`trilha-5/`) |
| `site/cicd/` | **CI/CD para QA** — pipeline, ler o GitHub Actions, fazer o build reprovar, matrix/cache/secrets/artefatos, 4 módulos | leitura; mexe nos workflows em `.github/workflows/` |
| `site/projeto/` | **Projeto final** — uma história de usuário do refinamento ao pipeline, usando todas as trilhas. Vira portfólio | repositório do aluno |

**Caminho recomendado para quem começa do zero:**
Fundamentos → Git → SQL → API → pytest → CI/CD.
PostgreSQL e k6 são aprofundamentos.

### Como o site funciona por dentro

| Arquivo | Papel |
|---|---|
| `site/assets/app.js` | motor da prática em SQLite (sql.js): monta exercícios, roda query, desenha tabela |
| `site/pg/app-pg.js` | o mesmo, em Postgres (PGlite) |
| `site/api/app-api.js` | o mesmo, para a API falsa em JS |
| `site/assets/conferir.js` | **conferência automática**: roda a resposta do aluno e o gabarito no mesmo banco e compara os resultados, em vez de comparar o texto da query |
| `site/assets/progresso.js` | progresso do aluno no `localStorage`: exercícios conferidos, módulos concluídos, melhor nota por prova; desenha os selos no índice e a barra no hub |
| `site/assets/prova-core.js` | motor das provas: questões de query, de escrita, de múltipla escolha (com alternativas embaralhadas) e abertas (não entram na nota, mostram resposta modelo) |

Provas conceituais (só múltipla escolha e abertas) não precisam de banco: o
`prova-core.js` cria um motor de mentira sozinho quando a prova não tem questão de query.

```bash
python site/servir.py     # abre http://localhost:8000 (dev local; em produção é só o link)
```

Geração de dados:
- `pratica/build_db.py` → `pratica/pratica.db` (Trilhas 1 e 3)
- `pratica/build_seed_pg.py` → `site/pg/seed.sql` (Trilha 2, tipos do Postgres, mesmos dados)
- `site/api/dados.js` é um subconjunto do banco usado pela API falsa da Trilha 4

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

- Refazer os exercícios sem olhar o gabarito (a conferência automática diz na hora se bateu).
- Fazer as provas de cada módulo — 70% pra cima significa que o módulo está firme.
- Seguir o caminho recomendado até o fim e fechar com o **Projeto final** (`site/projeto/`).
- Praticar em plataformas: SQLZoo, StrataScratch, DataLemur, HackerRank (SQL).

## Gabarito

`exercicios/gabarito.md` — tenta resolver antes de abrir. Errar e ajustar é o
exercício.
