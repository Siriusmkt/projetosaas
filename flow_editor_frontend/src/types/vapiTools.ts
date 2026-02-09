export type VapiToolType = 'agendamento' | 'mensagem' | 'encerramento' | 'documento';
export type VapiFileType = 'texto' | 'audio' | 'arquivo' | 'imagem' | 'video' | 'pdf' | 'doc' | 'docx' | 'txt';

export interface VapiTool {
  id: string;
  tenant_id: string;
  assistant_id?: string | null;
  tool_name: string;
  tool_type: VapiToolType;
  file_type?: VapiFileType | null;
  is_active: boolean;
  instancia?: string | null;
  mensagem?: string | null;
  file_url?: string | null;
  prompt_instructions?: string | null;
  created_at?: string;
  updated_at?: string;
}
