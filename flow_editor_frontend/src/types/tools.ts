// Tipos base para o sistema de Tools
export type ToolType = 'video' | 'imagem' | 'audio' | 'arquivo' | 'agendamento' | 'transferencia' | 'link' | 'ler_documentos';

export interface Tool {
  id: string;
  tenant_id: string;
  tool_name: string;
  display_name: string;
  tool_type: ToolType;
  ai_description: string;
  config: ToolConfig;
  parameters: ToolParameter[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tool_assets?: ToolAsset[];
}

export interface ToolAsset {
  id: string;
  tool_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

// Configs específicas por tipo
export interface VideoConfig {
  file_url: string;
  thumbnail_url?: string;
  caption: string;
}

export interface ImagemConfig {
  file_url: string;
  caption: string;
}

export interface AudioConfig {
  file_url: string;
  duration_seconds?: number;
}

export interface ArquivoConfig {
  file_url: string;
  file_name: string;
  caption: string;
}

export interface AgendamentoConfig {
  calendar_type: 'cal_com' | 'google' | 'calendly';
  calendar_url: string;
  duration_minutes: number;
  message_before: string;
  message_after: string;
}

export interface TransferenciaConfig {
  department: string;
  notify_number?: string;
  notify_email?: string;
  message_to_lead: string;
  message_to_agent: string;
}

export interface LinkConfig {
  url: string;
  link_type: 'location' | 'website' | 'document';
  message: string;
}

export interface LerDocumentosConfig {
  document_source: 'knowledge_base' | 'google_drive' | 'url';
  source_id?: string;
  source_url?: string;
  instructions: string;
  message_before: string;
  message_after: string;
}

export type ToolConfig =
  | VideoConfig
  | ImagemConfig
  | AudioConfig
  | ArquivoConfig
  | AgendamentoConfig
  | TransferenciaConfig
  | LinkConfig
  | LerDocumentosConfig;

// Inputs para criar/atualizar
export interface CreateToolInput {
  tenant_id: string;
  tool_name: string;
  display_name: string;
  tool_type: ToolType;
  ai_description: string;
  config: ToolConfig;
  parameters?: ToolParameter[];
}

export interface UpdateToolInput {
  display_name?: string;
  ai_description?: string;
  config?: ToolConfig;
  parameters?: ToolParameter[];
  is_active?: boolean;
}

// Metadados dos tipos de tools para UI
export interface ToolTypeInfo {
  type: ToolType;
  label: string;
  description: string;
  icon: string;
  color: string;
  needsFile: boolean;
  maxFileSize: number; // em MB
  acceptedFormats: string[];
}

export const TOOL_TYPES_INFO: ToolTypeInfo[] = [
  {
    type: 'video',
    label: 'Vídeo',
    description: 'Envia um vídeo para o lead',
    icon: 'Video',
    color: 'hsl(250 100% 79%)',
    needsFile: true,
    maxFileSize: 16,
    acceptedFormats: ['video/mp4'],
  },
  {
    type: 'imagem',
    label: 'Imagem',
    description: 'Envia uma imagem para o lead',
    icon: 'Image',
    color: 'hsl(217 91% 60%)',
    needsFile: true,
    maxFileSize: 5,
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    type: 'audio',
    label: 'Áudio',
    description: 'Envia áudio ou mensagem de voz',
    icon: 'Mic',
    color: 'hsl(160 84% 39%)',
    needsFile: true,
    maxFileSize: 16,
    acceptedFormats: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  },
  {
    type: 'arquivo',
    label: 'Arquivo',
    description: 'Envia documento (PDF, DOC, XLS)',
    icon: 'FileText',
    color: 'hsl(38 92% 50%)',
    needsFile: true,
    maxFileSize: 20,
    acceptedFormats: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  {
    type: 'agendamento',
    label: 'Agendamento',
    description: 'Agenda consulta ou reunião',
    icon: 'Calendar',
    color: 'hsl(280 80% 60%)',
    needsFile: false,
    maxFileSize: 0,
    acceptedFormats: [],
  },
  {
    type: 'transferencia',
    label: 'Transferência',
    description: 'Transfere para um atendente humano',
    icon: 'UserCheck',
    color: 'hsl(340 80% 60%)',
    needsFile: false,
    maxFileSize: 0,
    acceptedFormats: [],
  },
  {
    type: 'link',
    label: 'Link',
    description: 'Envia uma URL para o lead',
    icon: 'Link',
    color: 'hsl(200 80% 50%)',
    needsFile: false,
    maxFileSize: 0,
    acceptedFormats: [],
  },
  {
    type: 'ler_documentos',
    label: 'Ler Documentos',
    description: 'Consulta e extrai informações de documentos',
    icon: 'FileSearch',
    color: 'hsl(220 80% 55%)',
    needsFile: false,
    maxFileSize: 0,
    acceptedFormats: [],
  },
];

export function getToolTypeInfo(type: ToolType): ToolTypeInfo {
  return TOOL_TYPES_INFO.find(t => t.type === type) || TOOL_TYPES_INFO[0];
}

export function generateToolName(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}
