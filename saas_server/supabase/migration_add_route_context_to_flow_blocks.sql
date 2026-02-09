-- ============================================================================
-- Migration: add route_context to flow_blocks (vinculação explícita rotas ↔ blocos)
-- Aplicar no SQL Editor do Supabase.
-- ============================================================================
-- route_context: JSONB nullable
-- Formato: { "parent_router_block_key": "CAM001", "route_key": "CAM001_route_1", "route_position": "first"|"middle"|"last" }
-- ============================================================================

ALTER TABLE flow_blocks
  ADD COLUMN IF NOT EXISTS route_context JSONB DEFAULT NULL;

COMMENT ON COLUMN flow_blocks.route_context IS 'Contexto de rota: parent_router_block_key, route_key, route_position (first|middle|last) para blocos dentro de multi-caminhos';
