-- ===========================================
-- FASE 1: INFRAESTRUTURA DO SISTEMA DE TOOLS
-- ===========================================

-- Enum para tipos de tool
CREATE TYPE public.tool_type AS ENUM (
    'video',
    'imagem',
    'audio',
    'arquivo',
    'agendamento',
    'transferencia',
    'link',
    'webhook'
);

-- ===========================================
-- TABELA: assistant_tools
-- ===========================================
CREATE TABLE public.assistant_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    tool_type public.tool_type NOT NULL,
    ai_description TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    parameters JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tools_tenant ON public.assistant_tools(tenant_id);
CREATE INDEX idx_tools_type ON public.assistant_tools(tool_type);
CREATE INDEX idx_tools_active ON public.assistant_tools(is_active);

-- Comentários
COMMENT ON TABLE public.assistant_tools IS 'Armazena todas as tools que os assistentes podem usar';
COMMENT ON COLUMN public.assistant_tools.tool_name IS 'Nome interno sem espacos, usado pela IA';
COMMENT ON COLUMN public.assistant_tools.display_name IS 'Nome amigavel mostrado na interface';
COMMENT ON COLUMN public.assistant_tools.tool_type IS 'Tipo: video, imagem, audio, arquivo, agendamento, transferencia, link, webhook';
COMMENT ON COLUMN public.assistant_tools.ai_description IS 'Descricao que a IA le para saber QUANDO usar esta tool';
COMMENT ON COLUMN public.assistant_tools.config IS 'Configuracoes especificas do tipo (url do arquivo, calendario, etc)';
COMMENT ON COLUMN public.assistant_tools.parameters IS 'Parametros que a IA precisa extrair da conversa';

-- ===========================================
-- TABELA: tool_assets
-- ===========================================
CREATE TABLE public.tool_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id UUID NOT NULL REFERENCES public.assistant_tools(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_assets_tool ON public.tool_assets(tool_id);

-- Comentários
COMMENT ON TABLE public.tool_assets IS 'Arquivos associados às tools (videos, imagens, audios, etc)';
COMMENT ON COLUMN public.tool_assets.duration_seconds IS 'Duracao em segundos para videos e audios';
COMMENT ON COLUMN public.tool_assets.thumbnail_url IS 'URL da thumbnail para videos';

-- ===========================================
-- TABELA: tool_assignments
-- ===========================================
CREATE TABLE public.tool_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_id UUID NOT NULL,
    tool_id UUID NOT NULL REFERENCES public.assistant_tools(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    custom_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assistant_id, tool_id)
);

-- Índices
CREATE INDEX idx_assignments_assistant ON public.tool_assignments(assistant_id);
CREATE INDEX idx_assignments_tool ON public.tool_assignments(tool_id);

-- Comentários
COMMENT ON TABLE public.tool_assignments IS 'Relaciona tools com assistentes. Uma tool pode estar ativa em varios assistentes.';

-- ===========================================
-- FUNÇÃO: updated_at trigger
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.assistant_tools
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- FUNÇÃO SECURITY DEFINER: verificar tenant
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_tool_owner(_tool_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.assistant_tools
        WHERE id = _tool_id
          AND tenant_id = auth.uid()
    )
$$;

-- ===========================================
-- RLS: assistant_tools
-- ===========================================
ALTER TABLE public.assistant_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tools"
ON public.assistant_tools
FOR SELECT
TO authenticated
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own tools"
ON public.assistant_tools
FOR INSERT
TO authenticated
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own tools"
ON public.assistant_tools
FOR UPDATE
TO authenticated
USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own tools"
ON public.assistant_tools
FOR DELETE
TO authenticated
USING (tenant_id = auth.uid());

-- ===========================================
-- RLS: tool_assets
-- ===========================================
ALTER TABLE public.tool_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets of their tools"
ON public.tool_assets
FOR SELECT
TO authenticated
USING (public.is_tool_owner(tool_id));

CREATE POLICY "Users can create assets for their tools"
ON public.tool_assets
FOR INSERT
TO authenticated
WITH CHECK (public.is_tool_owner(tool_id));

CREATE POLICY "Users can update assets of their tools"
ON public.tool_assets
FOR UPDATE
TO authenticated
USING (public.is_tool_owner(tool_id))
WITH CHECK (public.is_tool_owner(tool_id));

CREATE POLICY "Users can delete assets of their tools"
ON public.tool_assets
FOR DELETE
TO authenticated
USING (public.is_tool_owner(tool_id));

-- ===========================================
-- RLS: tool_assignments
-- ===========================================
ALTER TABLE public.tool_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments of their tools"
ON public.tool_assignments
FOR SELECT
TO authenticated
USING (public.is_tool_owner(tool_id));

CREATE POLICY "Users can create assignments for their tools"
ON public.tool_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.is_tool_owner(tool_id));

CREATE POLICY "Users can update assignments of their tools"
ON public.tool_assignments
FOR UPDATE
TO authenticated
USING (public.is_tool_owner(tool_id))
WITH CHECK (public.is_tool_owner(tool_id));

CREATE POLICY "Users can delete assignments of their tools"
ON public.tool_assignments
FOR DELETE
TO authenticated
USING (public.is_tool_owner(tool_id));

-- ===========================================
-- STORAGE: bucket tool-assets
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('tool-assets', 'tool-assets', true, 20971520);

-- Storage policies
CREATE POLICY "Authenticated users can upload tool assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tool-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view tool assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tool-assets');

CREATE POLICY "Users can update their own tool assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tool-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own tool assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tool-assets' AND auth.uid()::text = (storage.foldername(name))[1]);