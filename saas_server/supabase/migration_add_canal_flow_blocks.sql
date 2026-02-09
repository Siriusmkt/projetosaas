-- Adiciona coluna canal em flow_blocks para distinguir fluxo de voz vs WhatsApp.
-- NULL ou 'voz' = fluxo de voz; 'whatsapp' = fluxo WhatsApp.
-- Blocos de config (order_index < 0) têm canal NULL e são compartilhados.
ALTER TABLE flow_blocks
ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT NULL
CHECK (canal IS NULL OR canal IN ('voz', 'whatsapp'));

COMMENT ON COLUMN flow_blocks.canal IS 'voz | whatsapp | null (config blocks shared)';
