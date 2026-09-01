-- ============================================================
-- MODULO 6 - SQL no dia a dia de QA (validacao + metricas)
-- ============================================================
--   python sql.py exercicios/06_qa_na_pratica.sql

-- ---------- VALIDACAO DE DADOS (cacar inconsistencia) ----------

-- 6.1) BUG PLANTADO: pedidos que NAO estao 'cancelado' mas tem
--      valor_total = 0. Isso nao deveria existir. Liste-os.


-- 6.2) Pedidos cujo valor_total NAO bate com a soma dos itens
--      (SUM(quantidade * preco_unitario)). Mostre pedido.id,
--      valor_total, total_itens e a diferenca.
--      (dica: JOIN + GROUP BY + HAVING com a comparacao)


-- 6.3) Itens de pedido com quantidade <= 0 ou preco_unitario <= 0.


-- 6.4) Pedidos apontando pra cliente_id que nao existe em clientes
--      (integridade referencial quebrada). Deve dar 0 - confirme.


-- 6.5) Emails duplicados em clientes (GROUP BY email HAVING COUNT(*) > 1).
--      Deve dar 0 - a coluna e UNIQUE. Escreva a query que provaria isso.


-- 6.6) Produtos com estoque negativo (nao deveria acontecer).


-- ---------- METRICAS DE QA ----------

-- 6.7) Tempo medio de correcao de defeito, em dias:
--      AVG(julianday(data_fechamento) - julianday(data_abertura))
--      considerando so os defeitos com data_fechamento preenchida.
--      Quebre por severidade.


-- 6.8) Defeitos criticos ou altos que estao 'aberto'/'reaberto',
--      por modulo - o "backlog quente" pra priorizar.


-- 6.9) Taxa de falha (falhou / total) por suite e por semana.
--      (dica: strftime('%Y-%W', data_execucao) pra agrupar por semana)


-- 6.10) "Flaky suspects": casos_teste que aparecem com resultado
--       'passou' E 'falhou' no historico (GROUP BY caso_teste HAVING
--       COUNT(DISTINCT resultado) ... ou dois SUM(CASE...)).


-- 6.11) Defeitos reportados em 'producao' com severidade 'critica' -
--       os que "escaparam" pra prod. Conte por modulo.
