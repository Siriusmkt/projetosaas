-- ===============================================
-- FLOW EDITOR - TABELAS COMPLETAS
-- ===============================================

-- Tabela principal de flows
CREATE TABLE public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  assistente_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de blocos do flow com routes em JSONB
CREATE TABLE public.flow_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  block_key VARCHAR(50) NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  content TEXT DEFAULT '',
  next_block_key VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  timeout_seconds INTEGER,
  analyze_variable VARCHAR(255),
  tool_type VARCHAR(100),
  routes_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(flow_id, block_key)
);

-- Índices para performance
CREATE INDEX idx_flows_assistente_id ON public.flows(assistente_id);
CREATE INDEX idx_flows_tenant_id ON public.flows(tenant_id);
CREATE INDEX idx_flow_blocks_flow_id ON public.flow_blocks(flow_id);
CREATE INDEX idx_flow_blocks_block_key ON public.flow_blocks(block_key);

-- Trigger para updated_at em flows
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON public.flows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para updated_at em flow_blocks
CREATE TRIGGER update_flow_blocks_updated_at
  BEFORE UPDATE ON public.flow_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ===============================================
-- RLS POLICIES
-- ===============================================

-- Habilitar RLS
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas para flows (baseado em tenant_id)
CREATE POLICY "Users can view their own flows"
  ON public.flows
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own flows"
  ON public.flows
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own flows"
  ON public.flows
  FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own flows"
  ON public.flows
  FOR DELETE
  USING (tenant_id = auth.uid());

-- Função security definer para verificar ownership de flow
CREATE OR REPLACE FUNCTION public.is_flow_owner(_flow_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flows
    WHERE id = _flow_id
      AND tenant_id = auth.uid()
  )
$$;

-- Políticas para flow_blocks (baseado em ownership do flow)
CREATE POLICY "Users can view blocks of their flows"
  ON public.flow_blocks
  FOR SELECT
  USING (public.is_flow_owner(flow_id));

CREATE POLICY "Users can create blocks in their flows"
  ON public.flow_blocks
  FOR INSERT
  WITH CHECK (public.is_flow_owner(flow_id));

CREATE POLICY "Users can update blocks in their flows"
  ON public.flow_blocks
  FOR UPDATE
  USING (public.is_flow_owner(flow_id))
  WITH CHECK (public.is_flow_owner(flow_id));

CREATE POLICY "Users can delete blocks from their flows"
  ON public.flow_blocks
  FOR DELETE
  USING (public.is_flow_owner(flow_id));