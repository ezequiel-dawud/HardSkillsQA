# Gabarito

Tenta resolver antes de abrir. Muitas vezes há mais de um jeito certo — se o seu
resultado bate, está válido. Rode cada uma com `python sql.py "..."`.

---

## Módulo 1 — básico

```sql
-- 1.1
SELECT nome, categoria, preco FROM produtos;

-- 1.2
SELECT nome, email FROM clientes WHERE estado = 'SP';

-- 1.3
SELECT nome, preco FROM produtos WHERE preco > 500 ORDER BY preco DESC;

-- 1.4
SELECT id, valor_total FROM pedidos ORDER BY valor_total DESC LIMIT 5;

-- 1.5
SELECT nome, data_cadastro FROM clientes
WHERE data_cadastro BETWEEN '2025-03-01' AND '2025-05-31'
ORDER BY data_cadastro;

-- 1.6
SELECT nome, categoria FROM produtos
WHERE categoria IN ('Perifericos', 'Acessorios');

-- 1.7
SELECT nome FROM clientes WHERE nome LIKE '%Silva%';

-- 1.8
SELECT DISTINCT categoria FROM produtos;

-- 1.9
SELECT id, status, valor_total FROM pedidos
WHERE status <> 'entregue' AND valor_total >= 3000;

-- 1.10
SELECT nome, ativo, estoque FROM produtos WHERE ativo = 0 OR estoque = 0;
```

---

## Módulo 2 — NULL / CASE

```sql
-- 2.1
SELECT id, titulo, status, data_abertura FROM defeitos
WHERE data_fechamento IS NULL;

-- 2.2
SELECT id, titulo, data_fechamento FROM defeitos
WHERE data_fechamento IS NOT NULL
ORDER BY data_fechamento;

-- 2.3
SELECT id, titulo, COALESCE(data_fechamento, 'em aberto') AS fechamento
FROM defeitos;

-- 2.4
SELECT id, severidade,
       CASE
         WHEN severidade IN ('critica', 'alta') THEN 'urgente'
         WHEN severidade = 'media' THEN 'normal'
         ELSE 'baixa'
       END AS faixa
FROM defeitos;

-- 2.5
SELECT caso_teste, suite, resultado FROM execucoes_teste
WHERE resultado <> 'passou';

-- 2.6
SELECT caso_teste, suite, resultado FROM execucoes_teste
WHERE resultado = 'falhou' AND defeito_id IS NULL;

-- 2.7
SELECT id, titulo, status FROM defeitos
WHERE severidade = 'critica' AND status IN ('aberto', 'reaberto');

-- 2.8
SELECT
  SUM(CASE WHEN data_fechamento IS NULL THEN 1 ELSE 0 END) AS abertos,
  SUM(CASE WHEN data_fechamento IS NOT NULL THEN 1 ELSE 0 END) AS fechados
FROM defeitos;
```

---

## Módulo 3 — agregação

```sql
-- 3.1
SELECT COUNT(*) AS total, SUM(ativo) AS ativos FROM clientes;

-- 3.2
SELECT status, COUNT(*) AS qtd FROM pedidos GROUP BY status;

-- 3.3
SELECT status,
       ROUND(SUM(valor_total), 2) AS total,
       ROUND(AVG(valor_total), 2) AS ticket_medio
FROM pedidos
GROUP BY status
ORDER BY total DESC;

-- 3.4
SELECT estado, COUNT(*) AS qtd FROM clientes
GROUP BY estado ORDER BY qtd DESC;

-- 3.5
SELECT modulo, severidade, COUNT(*) AS qtd FROM defeitos
GROUP BY modulo, severidade
ORDER BY modulo, severidade;

-- 3.6
SELECT modulo, COUNT(*) AS qtd FROM defeitos
GROUP BY modulo HAVING COUNT(*) > 12;

-- 3.7
SELECT suite,
       COUNT(*) AS total,
       SUM(CASE WHEN resultado = 'passou' THEN 1 ELSE 0 END) AS passaram,
       ROUND(SUM(CASE WHEN resultado = 'passou' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS taxa_aprovacao
FROM execucoes_teste
GROUP BY suite;

-- 3.8
SELECT suite, ROUND(AVG(duracao_seg), 1) AS dur_media, MAX(duracao_seg) AS dur_max
FROM execucoes_teste GROUP BY suite;

-- 3.9
SELECT reportado_por, COUNT(*) AS qtd FROM defeitos
GROUP BY reportado_por ORDER BY qtd DESC;

-- 3.10
SELECT data_pedido, COUNT(*) AS qtd FROM pedidos
GROUP BY data_pedido HAVING COUNT(*) > 5 ORDER BY qtd DESC;
```

---

## Módulo 4 — JOIN

```sql
-- 4.1
SELECT p.id, c.nome, p.data_pedido, p.valor_total
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id;

-- 4.2
SELECT pr.nome, i.quantidade, i.preco_unitario
FROM itens_pedido i
JOIN produtos pr ON pr.id = i.produto_id
WHERE i.pedido_id = 10;

-- 4.3
SELECT p.id, SUM(i.quantidade) AS qtd_itens
FROM pedidos p
JOIN itens_pedido i ON i.pedido_id = p.id
GROUP BY p.id;

-- 4.4
SELECT c.id, c.nome
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE p.id IS NULL;

-- 4.5
SELECT pr.id, pr.nome
FROM produtos pr
LEFT JOIN itens_pedido i ON i.produto_id = pr.id
WHERE i.id IS NULL;

-- 4.6
SELECT pr.categoria, ROUND(SUM(i.quantidade * i.preco_unitario), 2) AS faturamento
FROM itens_pedido i
JOIN produtos pr ON pr.id = i.produto_id
GROUP BY pr.categoria
ORDER BY faturamento DESC;

-- 4.7
SELECT e.caso_teste, d.titulo, d.modulo
FROM execucoes_teste e
JOIN defeitos d ON d.id = e.defeito_id
WHERE e.resultado = 'falhou';

-- 4.8
SELECT c.nome, ROUND(SUM(p.valor_total), 2) AS faturamento
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE p.status <> 'cancelado'
GROUP BY c.id, c.nome
ORDER BY faturamento DESC
LIMIT 10;

-- 4.9
SELECT c.estado, COUNT(p.id) AS qtd_pedidos, ROUND(SUM(p.valor_total), 2) AS total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
GROUP BY c.estado
ORDER BY total DESC;
```

---

## Módulo 5 — subconsultas / CTE

```sql
-- 5.1
SELECT id, valor_total FROM pedidos
WHERE valor_total > (SELECT AVG(valor_total) FROM pedidos);

-- 5.2
SELECT id, nome FROM clientes
WHERE id IN (SELECT cliente_id FROM pedidos WHERE status = 'cancelado');

-- 5.3
SELECT c.id, c.nome FROM clientes c
WHERE EXISTS (
  SELECT 1 FROM pedidos p
  WHERE p.cliente_id = c.id AND p.status = 'cancelado'
);

-- 5.4
SELECT nome, preco FROM produtos
WHERE preco = (SELECT MAX(preco) FROM produtos);

-- 5.5
WITH gastos AS (
  SELECT cliente_id, SUM(valor_total) AS total_gasto
  FROM pedidos GROUP BY cliente_id
)
SELECT c.nome, g.total_gasto
FROM gastos g
JOIN clientes c ON c.id = g.cliente_id
WHERE g.total_gasto > 20000
ORDER BY g.total_gasto DESC;

-- 5.6
WITH taxa AS (
  SELECT suite,
         ROUND(SUM(CASE WHEN resultado = 'passou' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS aprov
  FROM execucoes_teste GROUP BY suite
)
SELECT * FROM taxa WHERE aprov < 80;

-- 5.7
SELECT modulo, qtd FROM (
  SELECT modulo, COUNT(*) AS qtd
  FROM defeitos WHERE severidade = 'critica'
  GROUP BY modulo
) ORDER BY qtd DESC LIMIT 3;

-- 5.8
SELECT c.id, c.nome FROM clientes c
WHERE c.ativo = 1
  AND NOT EXISTS (SELECT 1 FROM pedidos p WHERE p.cliente_id = c.id);
```

---

## Módulo 6 — QA na prática

```sql
-- 6.1  (o bug plantado)
SELECT id, status, valor_total FROM pedidos
WHERE status <> 'cancelado' AND valor_total = 0;

-- 6.2
SELECT p.id, p.valor_total,
       ROUND(SUM(i.quantidade * i.preco_unitario), 2) AS total_itens,
       ROUND(p.valor_total - SUM(i.quantidade * i.preco_unitario), 2) AS diferenca
FROM pedidos p
JOIN itens_pedido i ON i.pedido_id = p.id
GROUP BY p.id, p.valor_total
HAVING ROUND(p.valor_total, 2) <> ROUND(SUM(i.quantidade * i.preco_unitario), 2);
-- Pega os bugs A (valor_total 0) e B (valor_total deslocado em 99.99).
-- Tambem aparecem 2 pedidos por tabela (ex.: 4 e 80): sao efeito do bug C -
-- um item deles teve quantidade zerada, entao a soma dos itens caiu. Rastrear
-- isso ate a causa raiz e exatamente o trabalho de investigacao de QA.

-- 6.3
SELECT * FROM itens_pedido WHERE quantidade <= 0 OR preco_unitario <= 0;

-- 6.4
SELECT p.id FROM pedidos p
LEFT JOIN clientes c ON c.id = p.cliente_id
WHERE c.id IS NULL;

-- 6.5
SELECT email, COUNT(*) AS qtd FROM clientes
GROUP BY email HAVING COUNT(*) > 1;

-- 6.6
SELECT id, nome, estoque FROM produtos WHERE estoque < 0;

-- 6.7
SELECT severidade,
       ROUND(AVG(julianday(data_fechamento) - julianday(data_abertura)), 1) AS dias_medios
FROM defeitos
WHERE data_fechamento IS NOT NULL
GROUP BY severidade;

-- 6.8
SELECT modulo, COUNT(*) AS qtd
FROM defeitos
WHERE severidade IN ('critica', 'alta')
  AND status IN ('aberto', 'reaberto')
GROUP BY modulo
ORDER BY qtd DESC;

-- 6.9
SELECT suite,
       strftime('%Y-%W', data_execucao) AS semana,
       COUNT(*) AS total,
       SUM(CASE WHEN resultado = 'falhou' THEN 1 ELSE 0 END) AS falhas,
       ROUND(SUM(CASE WHEN resultado = 'falhou' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS taxa_falha
FROM execucoes_teste
GROUP BY suite, semana
ORDER BY suite, semana;

-- 6.10
SELECT caso_teste,
       SUM(CASE WHEN resultado = 'passou' THEN 1 ELSE 0 END) AS passou,
       SUM(CASE WHEN resultado = 'falhou' THEN 1 ELSE 0 END) AS falhou
FROM execucoes_teste
GROUP BY caso_teste
HAVING passou > 0 AND falhou > 0;

-- 6.11
SELECT modulo, COUNT(*) AS qtd
FROM defeitos
WHERE ambiente = 'producao' AND severidade = 'critica'
GROUP BY modulo
ORDER BY qtd DESC;
```

---

## Módulo 7 — escrita

```sql
-- 7.1
INSERT INTO produtos (id, nome, categoria, preco, estoque, ativo)
VALUES (16, 'Micro SD 128GB', 'Armazenamento', 89.90, 50, 1);
SELECT * FROM produtos WHERE nome = 'Micro SD 128GB';

-- 7.2
INSERT INTO clientes (id, nome, email, cidade, estado, data_cadastro, ativo)
VALUES (999, 'QA Teste', 'qa.teste@exemplo.com', 'Curitiba', 'PR', '2025-08-01', 1);

-- 7.3
INSERT INTO pedidos (id, cliente_id, data_pedido, status, valor_total)
VALUES (999, 999, '2025-08-02', 'novo', 0);
INSERT INTO itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario)
VALUES (9001, 999, 1, 2, 320.0);
INSERT INTO itens_pedido (id, pedido_id, produto_id, quantidade, preco_unitario)
VALUES (9002, 999, 3, 1, 250.0);

-- 7.4
SELECT SUM(quantidade * preco_unitario) FROM itens_pedido WHERE pedido_id = 999;  -- 890
UPDATE pedidos SET valor_total = 890.0 WHERE id = 999;

-- 7.5
SELECT nome, preco FROM produtos WHERE categoria = 'Perifericos';
UPDATE produtos SET preco = ROUND(preco * 1.10, 2) WHERE categoria = 'Perifericos';

-- 7.6
UPDATE defeitos
SET status = 'fechado', data_fechamento = '2025-08-31'
WHERE status = 'resolvido';

-- 7.7
BEGIN;
DELETE FROM itens_pedido WHERE pedido_id = 999;
DELETE FROM pedidos WHERE id = 999;
SELECT * FROM pedidos WHERE id = 999;   -- deve vir vazio
COMMIT;   -- ou ROLLBACK; pra desfazer

-- 7.8
DELETE FROM clientes WHERE id = 999;
DELETE FROM produtos WHERE nome = 'Micro SD 128GB';
-- reset geral:  python pratica/build_db.py
```
