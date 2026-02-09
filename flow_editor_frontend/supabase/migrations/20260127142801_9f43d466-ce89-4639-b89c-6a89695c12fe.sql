-- =====================================================
-- MIGRAÇÃO: Renomear tabelas prompt_* para agente_*
-- =====================================================

-- 1. Criar tabela principal de agentes (substituindo prompts)
ALTER TABLE public.prompts RENAME TO agentes;
ALTER TABLE public.agentes RENAME COLUMN nome_prompt TO nome;

-- 2. Renomear tabelas relacionadas
ALTER TABLE public.prompt_identidade RENAME TO agente_identidade;
ALTER TABLE public.prompt_institucional RENAME TO agente_empresa;
ALTER TABLE public.prompt_regras RENAME TO agente_regras;
ALTER TABLE public.prompt_gatilhos RENAME TO agente_gatilhos;
ALTER TABLE public.prompt_fluxo_qualificacao RENAME TO agente_fluxo_etapas;
ALTER TABLE public.prompt_faq RENAME TO agente_faq;
ALTER TABLE public.prompt_objecoes RENAME TO agente_objecoes;
ALTER TABLE public.prompt_criterios_lead RENAME TO agente_criterios_lead;
ALTER TABLE public.prompt_campos_coleta RENAME TO agente_campos_coleta;
ALTER TABLE public.prompt_pronuncia RENAME TO agente_pronuncia;
ALTER TABLE public.prompt_tom RENAME TO agente_voz_config;
ALTER TABLE public.prompt_scripts RENAME TO agente_scripts;
ALTER TABLE public.prompt_conectivos RENAME TO agente_conectivos;
ALTER TABLE public.prompt_diferenciais_por_dor RENAME TO agente_argumentos_dor;

-- 3. Renomear colunas prompt_id para agente_id em todas as tabelas
ALTER TABLE public.agente_identidade RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_empresa RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_regras RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_gatilhos RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_fluxo_etapas RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_faq RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_objecoes RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_criterios_lead RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_campos_coleta RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_pronuncia RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_voz_config RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_scripts RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_conectivos RENAME COLUMN prompt_id TO agente_id;
ALTER TABLE public.agente_argumentos_dor RENAME COLUMN prompt_id TO agente_id;

-- 4. Adicionar colunas que faltam na agente_empresa (ex-prompt_institucional)
ALTER TABLE public.agente_empresa 
  ADD COLUMN IF NOT EXISTS setor VARCHAR(200);

-- 5. Adicionar colunas que faltam na agente_voz_config (ex-prompt_tom)
ALTER TABLE public.agente_voz_config 
  ADD COLUMN IF NOT EXISTS velocidade_fala VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS pausas_naturais BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmacoes JSONB DEFAULT '["Entendi", "Perfeito", "Show"]'::jsonb,
  ADD COLUMN IF NOT EXISTS transicoes JSONB DEFAULT '["E me conta...", "Me diz..."]'::jsonb,
  ADD COLUMN IF NOT EXISTS empatia JSONB DEFAULT '["Entendo perfeitamente...", "Nossa!"]'::jsonb,
  ADD COLUMN IF NOT EXISTS concordancia JSONB DEFAULT '["Pois é...", "Com certeza"]'::jsonb,
  ADD COLUMN IF NOT EXISTS max_perguntas_seguidas INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS tempo_espera_resposta INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS detectar_interrupcao BOOLEAN DEFAULT true;

-- 6. Adicionar colunas que faltam na agente_fluxo_etapas
ALTER TABLE public.agente_fluxo_etapas 
  ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS respostas_condicionais JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS campo_coleta VARCHAR(100);

-- 7. Adicionar coluna exemplo na agente_pronuncia
ALTER TABLE public.agente_pronuncia 
  ADD COLUMN IF NOT EXISTS exemplo TEXT;

-- 8. Adicionar colunas na agente_argumentos_dor
ALTER TABLE public.agente_argumentos_dor 
  ADD COLUMN IF NOT EXISTS palavras_chave JSONB DEFAULT '[]'::jsonb;

-- 9. Renomear coluna para padrão mais claro
ALTER TABLE public.agente_argumentos_dor RENAME COLUMN dor_mencionada TO dor;
ALTER TABLE public.agente_fluxo_etapas RENAME COLUMN etapa_numero TO numero;
ALTER TABLE public.agente_fluxo_etapas RENAME COLUMN etapa_nome TO nome;
ALTER TABLE public.agente_fluxo_etapas RENAME COLUMN pergunta TO pergunta_principal;