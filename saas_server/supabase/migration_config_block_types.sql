-- Migration: Permitir block_type de configuração em flow_blocks
-- Execute no SQL Editor do Supabase.
-- Necessário para salvar blocos de config global (identidade, personalidade, regras, etc.)
-- A aplicação usa flow_blocks como fonte de verdade; o trigger reconstrói prompt_voz.

-- Remover CHECK restritivo (se existir)
ALTER TABLE flow_blocks DROP CONSTRAINT IF EXISTS flow_blocks_block_type_check;

-- Adicionar CHECK estendido com tipos de config
-- Fluxo: primeira_mensagem, mensagem, aguardar, caminhos, ferramenta, encerrar
-- Config: identidade, personalidade, regras, expressoes, contexto_negocio, missao,
--         objecoes, diretrizes_criticas, info_tecnicas, qualificacao, pronuncia, agendamento
ALTER TABLE flow_blocks ADD CONSTRAINT flow_blocks_block_type_check CHECK (
  block_type IN (
    'primeira_mensagem', 'mensagem', 'aguardar', 'caminhos', 'ferramenta', 'encerrar',
    'identidade', 'personalidade', 'regras', 'expressoes', 'contexto_negocio', 'missao',
    'objecoes', 'diretrizes_criticas', 'info_tecnicas', 'qualificacao', 'pronuncia', 'agendamento'
  )
);
