-- Adiciona velocidade da voz (VAPI) na tabela assistentes.
-- Valor entre 0.5 e 2.0; 1.0 = normal. Usado ao sincronizar com VAPI (Voice > Speed).
ALTER TABLE assistentes
ADD COLUMN IF NOT EXISTS voice_speed REAL DEFAULT 1.0;

COMMENT ON COLUMN assistentes.voice_speed IS 'Velocidade da voz do assistente (VAPI): 0.5=mais lento, 1.0=normal, 2.0=mais rápido';
