-- ============================================================
-- MODULO 7 - INSERT, UPDATE, DELETE, transacoes
-- ============================================================
--   python sql.py exercicios/07_escrita.sql
-- Estragou os dados? Reseta:  python pratica/build_db.py

-- 7.1) Insira um novo produto: 'Micro SD 128GB', categoria 'Armazenamento',
--      preco 89.90, estoque 50, ativo 1. Depois confira com um SELECT.


-- 7.2) Insira um cliente de teste (id 999, email 'qa.teste@exemplo.com',
--      cidade/estado a escolha, data_cadastro '2025-08-01', ativo 1).


-- 7.3) Crie um pedido (id 999) pra esse cliente 999, status 'novo',
--      data_pedido '2025-08-02', valor_total 0. Depois adicione 2 itens
--      em itens_pedido referenciando produtos reais.


-- 7.4) Agora ATUALIZE o valor_total do pedido 999 pra bater com a soma
--      dos itens (rode um SELECT da soma antes, depois o UPDATE).


-- 7.5) Suba o preco de todos os produtos da categoria 'Perifericos' em 10%.
--      Confira antes e depois.


-- 7.6) Marque como 'fechado' e preencha data_fechamento = '2025-08-31'
--      todos os defeitos com status 'resolvido'.


-- 7.7) Transacao: BEGIN; delete os itens do pedido 999; delete o pedido 999;
--      rode um SELECT pra conferir; se estiver ok faca COMMIT, senao ROLLBACK.
--      (no modo interativo: python sql.py  e va digitando)


-- 7.8) DELETE o cliente de teste 999 e o produto 'Micro SD 128GB'.
--      Reset geral no fim:  python pratica/build_db.py
