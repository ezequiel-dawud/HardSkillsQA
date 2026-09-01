-- ============================================================
-- MODULO 3 - COUNT, SUM, AVG, GROUP BY, HAVING
-- ============================================================
--   python sql.py exercicios/03_agregacao.sql

-- 3.1) Quantos clientes existem no total? E quantos ativos?


-- 3.2) Quantidade de pedidos por status.


-- 3.3) Valor total (SUM) e ticket medio (AVG) de valor_total por status,
--      arredondados com ROUND(x, 2). Ordene pelo total desc.


-- 3.4) Numero de clientes por estado, do estado com mais clientes pro com menos.


-- 3.5) Numero de defeitos por modulo e por severidade
--      (GROUP BY modulo, severidade).


-- 3.6) Modulos que tem MAIS de 12 defeitos (GROUP BY + HAVING).


-- 3.7) Por suite de teste: total de execucoes, quantas passaram,
--      e a taxa de aprovacao em % (passaram * 100.0 / total), com ROUND.
--      (dica: SUM(CASE WHEN resultado='passou' THEN 1 ELSE 0 END))


-- 3.8) Duracao media (AVG) e maxima (MAX) das execucoes por suite.


-- 3.9) Quantos defeitos cada QA (reportado_por) abriu. Ordene por qtd desc.


-- 3.10) Dias com mais de 5 pedidos: agrupe por data_pedido e use HAVING.
