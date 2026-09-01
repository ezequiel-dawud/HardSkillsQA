-- ============================================================
-- MODULO 5 - Subconsultas, CTE (WITH), EXISTS
-- ============================================================
--   python sql.py exercicios/05_subconsultas.sql

-- 5.1) Pedidos com valor_total acima da media geral de valor_total
--      (subconsulta escalar no WHERE).


-- 5.2) Clientes que fizeram pelo menos um pedido cancelado
--      (WHERE id IN (SELECT cliente_id FROM pedidos WHERE status='cancelado')).


-- 5.3) Mesma coisa da 5.2, mas usando EXISTS.


-- 5.4) Produto(s) mais caro(s): preco igual ao MAX(preco).


-- 5.5) Usando CTE: monte 'gastos' (cliente_id, total_gasto) somando valor_total
--      por cliente; depois selecione os clientes com total_gasto > 20000,
--      trazendo o nome (JOIN com clientes).


-- 5.6) Usando CTE: taxa de aprovacao por suite (do modulo 3), e depois
--      filtre so as suites com taxa < 80.


-- 5.7) Top 3 modulos com mais defeitos criticos - use uma subconsulta no FROM
--      (SELECT modulo, COUNT(*) ... WHERE severidade='critica' GROUP BY modulo)
--      e ordene/limite por fora.


-- 5.8) Clientes ativos que nao fizeram nenhum pedido nos ultimos dados
--      (NOT EXISTS um pedido pra aquele cliente).
