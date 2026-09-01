-- ============================================================
-- MODULO 2 - NULL, COALESCE, CASE, filtros finos
-- ============================================================
--   python sql.py exercicios/02_filtros_e_nulos.sql

-- 2.1) Defeitos ainda nao fechados (data_fechamento IS NULL).
--      Mostre id, titulo, status, data_abertura.


-- 2.2) Defeitos JA fechados (data_fechamento IS NOT NULL), do mais
--      antigo pro mais recente por data_fechamento.


-- 2.3) Para cada defeito, mostre id, titulo e uma coluna 'fechamento'
--      que traga a data_fechamento ou o texto 'em aberto' quando for NULL
--      (use COALESCE).


-- 2.4) Classifique os defeitos por severidade numa coluna 'faixa':
--      'critica'/'alta' -> 'urgente', 'media' -> 'normal', resto -> 'baixa'
--      (use CASE). Mostre id, severidade, faixa.


-- 2.5) Execucoes de teste cujo resultado NAO foi 'passou'
--      (falhou, bloqueado ou pulado). Mostre caso_teste, suite, resultado.


-- 2.6) Execucoes com resultado 'falhou' mas SEM defeito_id preenchido
--      (isso e um problema de processo - falha sem bug linkado).


-- 2.7) Defeitos de severidade 'critica' que estao 'aberto' ou 'reaberto'.


-- 2.8) Conte quantos defeitos tem data_fechamento NULL e quantos nao tem.
--      (dica: SELECT COUNT(*) ... duas queries, ou um CASE dentro de SUM)
