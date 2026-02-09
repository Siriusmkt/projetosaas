-- ============================================================================
-- Opcional: Um flow por assistente – diagnóstico e limpeza de duplicados
-- Execute no SQL Editor do Supabase. Ajuste conforme sua necessidade.
-- ============================================================================

-- 1) DIAGNÓSTICO: Assistentes que têm mais de um flow
SELECT
  assistente_id,
  COUNT(*) AS total_flows,
  array_agg(id::text ORDER BY updated_at DESC) AS flow_ids,
  array_agg(name ORDER BY updated_at DESC) AS flow_names
FROM flows
WHERE assistente_id IS NOT NULL AND assistente_id != ''
GROUP BY assistente_id
HAVING COUNT(*) > 1
ORDER BY total_flows DESC;

-- 2) Por flow: quantidade de blocos (fluxo de conversa: order_index >= -5 ou null)
SELECT
  f.id AS flow_id,
  f.assistente_id,
  f.name,
  f.updated_at,
  (SELECT COUNT(*) FROM flow_blocks fb
   WHERE fb.flow_id = f.id
     AND (fb.order_index IS NULL OR fb.order_index >= -5)) AS blocos_fluxo
FROM flows f
WHERE f.assistente_id IS NOT NULL AND f.assistente_id != ''
ORDER BY f.assistente_id, blocos_fluxo DESC;

-- 3) OPCIONAL: Arquivar flows “duplicados” mantendo um por assistente
--    (descomente e substitua SEU_ASSISTENTE_ID pelo assistente que quer corrigir)
/*
-- Exemplo genérico: manter o flow com mais blocos e arquivar os outros
WITH ranked AS (
  SELECT id, assistente_id,
         ROW_NUMBER() OVER (
           PARTITION BY assistente_id
           ORDER BY (SELECT COUNT(*) FROM flow_blocks fb WHERE fb.flow_id = flows.id) DESC
         ) AS rn
  FROM flows
  WHERE assistente_id = 'SEU_ASSISTENTE_ID'
)
UPDATE flows
SET status = 'archived', is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
*/

-- 3b) Exemplo para o assistente com 25 flows (d40f638f-eda0-4682-932b-4fe237e5c46e)
--     Opção A: manter o flow que tem MAIS blocos de fluxo; arquivar os outros 24
/*
WITH blocos_por_flow AS (
  SELECT f.id,
         (SELECT COUNT(*) FROM flow_blocks fb
          WHERE fb.flow_id = f.id AND (fb.order_index IS NULL OR fb.order_index >= -5)) AS n
  FROM flows f
  WHERE f.assistente_id = 'd40f638f-eda0-4682-932b-4fe237e5c46e'
),
ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY n DESC) AS rn
  FROM blocos_por_flow
)
UPDATE flows
SET status = 'archived', is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
*/

-- 3c) Opção B: manter só o flow com nome "Fluxo Markapp Promotores - Maria"; arquivar os outros
/*
UPDATE flows
SET status = 'archived', is_active = false
WHERE assistente_id = 'd40f638f-eda0-4682-932b-4fe237e5c46e'
  AND (name IS NULL OR name != 'Fluxo Markapp Promotores - Maria');
*/

-- 4) OPCIONAL: Constraint única “um flow por assistente”
--    Só aplique depois de consolidar (cada assistente com um único flow ativo).
--    Permite NULL em assistente_id (flows sem assistente vinculado).
/*
-- PostgreSQL: unique partial index (só um flow não nulo por assistente_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_flows_one_per_assistant
ON flows (assistente_id)
WHERE assistente_id IS NOT NULL AND assistente_id != '';
*/
