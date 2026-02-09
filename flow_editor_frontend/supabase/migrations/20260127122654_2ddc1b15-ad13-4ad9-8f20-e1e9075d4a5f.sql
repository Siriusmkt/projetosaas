-- Create prompts table
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  nome_prompt VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'rascunho',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_identidade table
CREATE TABLE public.prompt_identidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  nome_ia VARCHAR(100) NOT NULL,
  genero VARCHAR(20) DEFAULT 'feminino',
  empresa_nome VARCHAR(200) NOT NULL,
  empresa_nome_curto VARCHAR(100),
  funcao VARCHAR(200) NOT NULL,
  setor VARCHAR(200) NOT NULL,
  personalidade TEXT,
  UNIQUE(prompt_id)
);

-- Create prompt_institucional table
CREATE TABLE public.prompt_institucional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  pais VARCHAR(100) DEFAULT 'Brasil',
  area_entrega TEXT,
  nome_ceo VARCHAR(200),
  tipo_produto TEXT NOT NULL,
  diferenciais JSONB DEFAULT '[]',
  sobre_empresa TEXT,
  UNIQUE(prompt_id)
);

-- Create prompt_regras table
CREATE TABLE public.prompt_regras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  regra_key VARCHAR(50) NOT NULL,
  regra_nome VARCHAR(200) NOT NULL,
  regra_descricao TEXT,
  is_active BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0,
  UNIQUE(prompt_id, regra_key)
);

-- Create prompt_gatilhos table
CREATE TABLE public.prompt_gatilhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  frase_gatilho TEXT NOT NULL,
  acao VARCHAR(100) NOT NULL,
  ordem INT DEFAULT 0
);

-- Create prompt_scripts table
CREATE TABLE public.prompt_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  script_key VARCHAR(50) NOT NULL,
  contexto VARCHAR(200) NOT NULL,
  conteudo TEXT NOT NULL,
  instrucao_uso TEXT,
  ordem INT DEFAULT 0,
  UNIQUE(prompt_id, script_key)
);

-- Create prompt_fluxo_qualificacao table
CREATE TABLE public.prompt_fluxo_qualificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  etapa_numero INT NOT NULL,
  etapa_nome VARCHAR(100) NOT NULL,
  contexto_gatilho VARCHAR(200),
  pergunta TEXT NOT NULL,
  instrucoes_adicionais TEXT,
  ordem INT DEFAULT 0
);

-- Create prompt_faq table
CREATE TABLE public.prompt_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  topico VARCHAR(200) NOT NULL,
  palavras_chave JSONB DEFAULT '[]',
  resposta TEXT NOT NULL,
  ordem INT DEFAULT 0
);

-- Create prompt_objecoes table
CREATE TABLE public.prompt_objecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  objecao_gatilho VARCHAR(300) NOT NULL,
  resposta TEXT NOT NULL,
  estrategia VARCHAR(100),
  ordem INT DEFAULT 0
);

-- Create prompt_conectivos table
CREATE TABLE public.prompt_conectivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  expressoes JSONB NOT NULL DEFAULT '[]',
  UNIQUE(prompt_id, tipo)
);

-- Create prompt_diferenciais_por_dor table
CREATE TABLE public.prompt_diferenciais_por_dor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  dor_mencionada VARCHAR(200) NOT NULL,
  argumento TEXT NOT NULL,
  ordem INT DEFAULT 0
);

-- Create prompt_criterios_lead table
CREATE TABLE public.prompt_criterios_lead (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  tipo_lead VARCHAR(20) NOT NULL,
  criterio TEXT NOT NULL,
  acao_recomendada VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  ordem INT DEFAULT 0
);

-- Create prompt_campos_coleta table
CREATE TABLE public.prompt_campos_coleta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  campo_nome VARCHAR(100) NOT NULL,
  campo_descricao TEXT,
  is_obrigatorio BOOLEAN DEFAULT false,
  ordem INT DEFAULT 0
);

-- Create prompt_tom table
CREATE TABLE public.prompt_tom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  usa_girias BOOLEAN DEFAULT true,
  usa_emojis BOOLEAN DEFAULT false,
  nivel_formalidade VARCHAR(20) DEFAULT 'informal',
  proporcao_fala_escuta VARCHAR(50) DEFAULT '20/80',
  posicionamento VARCHAR(100) DEFAULT 'consultivo',
  instrucoes_adicionais TEXT,
  UNIQUE(prompt_id)
);

-- Create prompt_pronuncia table
CREATE TABLE public.prompt_pronuncia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
  simbolo VARCHAR(20) NOT NULL,
  pronuncia VARCHAR(100) NOT NULL,
  UNIQUE(prompt_id, simbolo)
);

-- Enable RLS on all tables
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_identidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_institucional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_gatilhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_fluxo_qualificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_objecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_conectivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_diferenciais_por_dor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_criterios_lead ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_campos_coleta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_pronuncia ENABLE ROW LEVEL SECURITY;

-- Create public access policies for development (similar to existing pattern)
CREATE POLICY "Public can view prompts" ON public.prompts FOR SELECT USING (true);
CREATE POLICY "Public can create prompts" ON public.prompts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompts" ON public.prompts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompts" ON public.prompts FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_identidade" ON public.prompt_identidade FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_identidade" ON public.prompt_identidade FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_identidade" ON public.prompt_identidade FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_identidade" ON public.prompt_identidade FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_institucional" ON public.prompt_institucional FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_institucional" ON public.prompt_institucional FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_institucional" ON public.prompt_institucional FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_institucional" ON public.prompt_institucional FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_regras" ON public.prompt_regras FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_regras" ON public.prompt_regras FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_regras" ON public.prompt_regras FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_regras" ON public.prompt_regras FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_gatilhos" ON public.prompt_gatilhos FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_gatilhos" ON public.prompt_gatilhos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_gatilhos" ON public.prompt_gatilhos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_gatilhos" ON public.prompt_gatilhos FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_scripts" ON public.prompt_scripts FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_scripts" ON public.prompt_scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_scripts" ON public.prompt_scripts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_scripts" ON public.prompt_scripts FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_fluxo_qualificacao" ON public.prompt_fluxo_qualificacao FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_fluxo_qualificacao" ON public.prompt_fluxo_qualificacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_fluxo_qualificacao" ON public.prompt_fluxo_qualificacao FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_fluxo_qualificacao" ON public.prompt_fluxo_qualificacao FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_faq" ON public.prompt_faq FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_faq" ON public.prompt_faq FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_faq" ON public.prompt_faq FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_faq" ON public.prompt_faq FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_objecoes" ON public.prompt_objecoes FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_objecoes" ON public.prompt_objecoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_objecoes" ON public.prompt_objecoes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_objecoes" ON public.prompt_objecoes FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_conectivos" ON public.prompt_conectivos FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_conectivos" ON public.prompt_conectivos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_conectivos" ON public.prompt_conectivos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_conectivos" ON public.prompt_conectivos FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_diferenciais_por_dor" ON public.prompt_diferenciais_por_dor FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_diferenciais_por_dor" ON public.prompt_diferenciais_por_dor FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_diferenciais_por_dor" ON public.prompt_diferenciais_por_dor FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_diferenciais_por_dor" ON public.prompt_diferenciais_por_dor FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_criterios_lead" ON public.prompt_criterios_lead FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_criterios_lead" ON public.prompt_criterios_lead FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_criterios_lead" ON public.prompt_criterios_lead FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_criterios_lead" ON public.prompt_criterios_lead FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_campos_coleta" ON public.prompt_campos_coleta FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_campos_coleta" ON public.prompt_campos_coleta FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_campos_coleta" ON public.prompt_campos_coleta FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_campos_coleta" ON public.prompt_campos_coleta FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_tom" ON public.prompt_tom FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_tom" ON public.prompt_tom FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_tom" ON public.prompt_tom FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_tom" ON public.prompt_tom FOR DELETE USING (true);

CREATE POLICY "Public can view prompt_pronuncia" ON public.prompt_pronuncia FOR SELECT USING (true);
CREATE POLICY "Public can create prompt_pronuncia" ON public.prompt_pronuncia FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update prompt_pronuncia" ON public.prompt_pronuncia FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete prompt_pronuncia" ON public.prompt_pronuncia FOR DELETE USING (true);

-- Create trigger for updated_at on prompts
CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();