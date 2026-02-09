-- Migration opcional: permitir tool_type da vapi_tools no flow_blocks
-- O backend já mapeia agendamento→agendar, mensagem→enviar_whatsapp, etc.;
-- esta migration só é necessária se quiser aceitar os tipos originais no CHECK.
-- Execute no SQL Editor do Supabase.

ALTER TABLE flow_blocks DROP CONSTRAINT IF EXISTS flow_blocks_tool_type_check;

ALTER TABLE flow_blocks ADD CONSTRAINT flow_blocks_tool_type_check
  CHECK (tool_type IS NULL OR tool_type IN (
    'buscar_dados', 'verificar_agenda', 'agendar', 'enviar_whatsapp',
    'consultar_documento', 'webhook',
    'agendamento', 'mensagem', 'encerramento', 'documento'
  ));

COMMENT ON COLUMN flow_blocks.tool_type IS 'Tipo da ferramenta: valores do CHECK (DB) ou vapi_tools (agendamento, mensagem, encerramento, documento). Backend mapeia para valores legados quando necessário.';
