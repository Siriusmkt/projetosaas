-- =============================================
-- DROP TABELAS ANTIGAS E RECRIAR COM ESTRUTURA DE PRODUÇÃO
-- =============================================

-- Dropar tabelas existentes (criadas anteriormente)
DROP TABLE IF EXISTS public.flow_blocks CASCADE;
DROP TABLE IF EXISTS public.flows CASCADE;

-- =============================================
-- TABELA: flows
-- =============================================
CREATE TABLE public.flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  assistente_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  prompt_base TEXT,
  status TEXT DEFAULT 'draft'::text,
  is_active BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABELA: flow_blocks
-- =============================================
CREATE TABLE public.flow_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  block_key TEXT NOT NULL,
  block_type TEXT NOT NULL,
  content TEXT NOT NULL,
  variable_name TEXT,
  timeout_seconds INTEGER,
  analyze_variable TEXT,
  tool_type TEXT,
  tool_config JSONB DEFAULT '{}'::jsonb,
  end_type TEXT,
  end_metadata JSONB DEFAULT '{}'::jsonb,
  next_block_key TEXT,
  order_index INTEGER DEFAULT 0,
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assistente_id TEXT,
  tenant_id TEXT,
  routes_data JSONB DEFAULT '[]'::jsonb,
  UNIQUE(flow_id, block_key)
);

-- =============================================
-- TABELA: flow_routes (separada)
-- =============================================
CREATE TABLE public.flow_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES public.flow_blocks(id) ON DELETE CASCADE,
  route_key TEXT NOT NULL,
  label TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  cor TEXT DEFAULT '#6b7280'::text,
  keywords TEXT[] DEFAULT '{}'::text[],
  response TEXT,
  destination_type TEXT DEFAULT 'continuar'::text,
  destination_block_key TEXT,
  max_loop_attempts INTEGER DEFAULT 2,
  is_fallback BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assistente_id TEXT,
  tenant_id TEXT
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_routes ENABLE ROW LEVEL SECURITY;

-- Dropar função antiga se existir
DROP FUNCTION IF EXISTS public.is_flow_owner(uuid);

-- Policies para flows (usando tenant_id como TEXT)
CREATE POLICY "Users can view their own flows" 
ON public.flows FOR SELECT 
USING (tenant_id = auth.uid()::text);

CREATE POLICY "Users can create their own flows" 
ON public.flows FOR INSERT 
WITH CHECK (tenant_id = auth.uid()::text);

CREATE POLICY "Users can update their own flows" 
ON public.flows FOR UPDATE 
USING (tenant_id = auth.uid()::text);

CREATE POLICY "Users can delete their own flows" 
ON public.flows FOR DELETE 
USING (tenant_id = auth.uid()::text);

-- Função helper para verificar ownership de flow
CREATE OR REPLACE FUNCTION public.is_flow_owner_v2(_flow_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flows
    WHERE id = _flow_id
      AND tenant_id = auth.uid()::text
  )
$$;

-- Policies para flow_blocks
CREATE POLICY "Users can view blocks of their flows" 
ON public.flow_blocks FOR SELECT 
USING (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can create blocks in their flows" 
ON public.flow_blocks FOR INSERT 
WITH CHECK (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can update blocks in their flows" 
ON public.flow_blocks FOR UPDATE 
USING (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can delete blocks from their flows" 
ON public.flow_blocks FOR DELETE 
USING (is_flow_owner_v2(flow_id));

-- Policies para flow_routes
CREATE POLICY "Users can view routes of their flows" 
ON public.flow_routes FOR SELECT 
USING (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can create routes in their flows" 
ON public.flow_routes FOR INSERT 
WITH CHECK (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can update routes in their flows" 
ON public.flow_routes FOR UPDATE 
USING (is_flow_owner_v2(flow_id));

CREATE POLICY "Users can delete routes from their flows" 
ON public.flow_routes FOR DELETE 
USING (is_flow_owner_v2(flow_id));

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE TRIGGER update_flows_updated_at
BEFORE UPDATE ON public.flows
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_flow_blocks_updated_at
BEFORE UPDATE ON public.flow_blocks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_flow_routes_updated_at
BEFORE UPDATE ON public.flow_routes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_flows_tenant_id ON public.flows(tenant_id);
CREATE INDEX idx_flows_assistente_id ON public.flows(assistente_id);
CREATE INDEX idx_flow_blocks_flow_id ON public.flow_blocks(flow_id);
CREATE INDEX idx_flow_blocks_block_key ON public.flow_blocks(block_key);
CREATE INDEX idx_flow_routes_flow_id ON public.flow_routes(flow_id);
CREATE INDEX idx_flow_routes_block_id ON public.flow_routes(block_id);