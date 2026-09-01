-- ============================================================
-- MODULO 1 - SELECT, WHERE, ORDER BY, LIMIT, DISTINCT
-- ============================================================
-- Escreva sua query embaixo de cada enunciado e rode:
--   python sql.py exercicios/01_basico.sql
-- (ele roda cada comando separado por ';')
-- Gabarito em exercicios/gabarito.md

-- 1.1) Todos os produtos, mostrando nome, categoria e preco.
SELECT nome, categoria, preco FROM produtos;

-- 1.2) Nome e email apenas dos clientes do estado 'SP'.
SELECT nome, email FROM clientes WHERE estado = 'SP';

-- 1.3) Produtos com preco acima de 500, do mais caro pro mais barato.


-- 1.4) Os 5 pedidos de maior valor_total.


-- 1.5) Clientes cadastrados entre '2025-03-01' e '2025-05-31'
--      (use BETWEEN), ordenados por data_cadastro.


-- 1.6) Produtos das categorias 'Perifericos' ou 'Acessorios' (use IN).


-- 1.7) Clientes cujo nome contem 'Silva' (use LIKE).


-- 1.8) Lista das categorias distintas que existem em produtos.


-- 1.9) Pedidos com status diferente de 'entregue' e valor_total >= 3000.


-- 1.10) Produtos inativos (ativo = 0) OU com estoque igual a 0.
