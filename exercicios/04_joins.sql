-- ============================================================
-- MODULO 4 - INNER JOIN, LEFT JOIN, juntando 3+ tabelas
-- ============================================================
--   python sql.py exercicios/04_joins.sql

-- 4.1) Pedidos com o nome do cliente: pedido.id, cliente.nome,
--      pedido.data_pedido, pedido.valor_total. (INNER JOIN)


-- 4.2) Itens do pedido de id = 10, mostrando nome do produto,
--      quantidade e preco_unitario.


-- 4.3) Para cada pedido, some quantidade de itens (SUM(quantidade))
--      juntando pedidos + itens_pedido, GROUP BY pedido.


-- 4.4) Clientes que NUNCA fizeram pedido
--      (LEFT JOIN pedidos ... WHERE pedidos.id IS NULL).


-- 4.5) Produtos que nunca foram vendidos (nao aparecem em itens_pedido).


-- 4.6) Faturamento por categoria de produto: junte itens_pedido + produtos,
--      some quantidade * preco_unitario, agrupe por categoria, ordene desc.


-- 4.7) Execucoes de teste que falharam, com o titulo e o modulo do defeito
--      linkado (JOIN execucoes_teste + defeitos).


-- 4.8) Nome do cliente + faturamento total dele (soma dos valor_total dos
--      pedidos que NAO estao cancelados). Top 10 clientes.


-- 4.9) Por estado do cliente: numero de pedidos e valor total.
--      (JOIN clientes + pedidos, GROUP BY estado)
