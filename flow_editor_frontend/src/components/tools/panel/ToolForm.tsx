import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolIcon } from '../ToolIcon';
import { FileUpload } from '../modal/FileUpload';
import { 
  Tool, 
  ToolType, 
  ToolConfig,
  getToolTypeInfo, 
  TOOL_TYPES_INFO,
} from '@/types/tools';
import { Loader2, Trash2 } from 'lucide-react';

interface ToolFormProps {
  type: ToolType;
  tool?: Tool | null;
  onSave: (data: { display_name: string; ai_description: string; config: ToolConfig }) => void;
  onDelete?: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function ToolForm({ type, tool, onSave, onDelete, onBack, isLoading }: ToolFormProps) {
  const typeInfo = getToolTypeInfo(type);
  const fullTypeInfo = TOOL_TYPES_INFO.find(t => t.type === type);
  const isEditing = !!tool;
  
  const [displayName, setDisplayName] = useState(tool?.display_name || '');
  const [aiDescription, setAiDescription] = useState(tool?.ai_description || '');
  const [config, setConfig] = useState<Record<string, any>>(tool?.config || {});

  useEffect(() => {
    if (tool) {
      setDisplayName(tool.display_name);
      setAiDescription(tool.ai_description);
      setConfig(tool.config || {});
    }
  }, [tool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      display_name: displayName,
      ai_description: aiDescription,
      config: config as ToolConfig,
    });
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getFileUploadConfig = () => {
    switch (type) {
      case 'video':
        return { 
          accept: 'video/mp4', 
          maxSize: 16, 
          previewType: 'video' as const,
          label: 'Vídeo'
        };
      case 'imagem':
        return { 
          accept: 'image/jpeg,image/png,image/webp', 
          maxSize: 5, 
          previewType: 'image' as const,
          label: 'Imagem'
        };
      case 'audio':
        return { 
          accept: 'audio/mpeg,audio/ogg,audio/wav', 
          maxSize: 16, 
          previewType: 'audio' as const,
          label: 'Áudio'
        };
      case 'arquivo':
        return { 
          accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
          maxSize: 20, 
          previewType: 'file' as const,
          label: 'Arquivo'
        };
      default:
        return null;
    }
  };

  const renderConfigFields = () => {
    const fileConfig = getFileUploadConfig();
    
    // Tools que precisam de upload de arquivo
    if (fileConfig) {
      return (
        <div className="space-y-4">
          <FileUpload
            label={fileConfig.label}
            accept={fileConfig.accept}
            maxSizeMB={fileConfig.maxSize}
            currentUrl={config.file_url}
            previewType={fileConfig.previewType}
            onUpload={(url, fileName) => {
              updateConfig('file_url', url);
              if (fileName) updateConfig('file_name', fileName);
            }}
            onRemove={() => {
              updateConfig('file_url', '');
              updateConfig('file_name', '');
            }}
          />
          
          {(type === 'video' || type === 'imagem' || type === 'arquivo') && (
            <div>
              <Label className="text-xs">Legenda (opcional)</Label>
              <Textarea
                value={config.caption || ''}
                onChange={(e) => updateConfig('caption', e.target.value)}
                placeholder="Legenda que acompanha o arquivo..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}
        </div>
      );
    }

    // Outras tools sem upload
    switch (type) {
      case 'agendamento':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tipo de Calendário</Label>
              <select
                value={config.calendar_type || 'cal_com'}
                onChange={(e) => updateConfig('calendar_type', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="cal_com">Cal.com</option>
                <option value="google">Google Calendar</option>
                <option value="calendly">Calendly</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">URL do Calendário</Label>
              <Input
                value={config.calendar_url || ''}
                onChange={(e) => updateConfig('calendar_url', e.target.value)}
                placeholder="https://cal.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Duração (minutos)</Label>
              <Input
                type="number"
                value={config.duration_minutes || 30}
                onChange={(e) => updateConfig('duration_minutes', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem Antes</Label>
              <Textarea
                value={config.message_before || ''}
                onChange={(e) => updateConfig('message_before', e.target.value)}
                placeholder="Mensagem enviada antes do agendamento..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem Depois</Label>
              <Textarea
                value={config.message_after || ''}
                onChange={(e) => updateConfig('message_after', e.target.value)}
                placeholder="Mensagem enviada após confirmação..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case 'transferencia':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Departamento</Label>
              <Input
                value={config.department || ''}
                onChange={(e) => updateConfig('department', e.target.value)}
                placeholder="Vendas, Suporte, etc."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">WhatsApp para Notificar</Label>
              <Input
                value={config.notify_number || ''}
                onChange={(e) => updateConfig('notify_number', e.target.value)}
                placeholder="+55 11 99999-9999"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem para o Lead</Label>
              <Textarea
                value={config.message_to_lead || ''}
                onChange={(e) => updateConfig('message_to_lead', e.target.value)}
                placeholder="Um atendente entrará em contato..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem para o Atendente</Label>
              <Textarea
                value={config.message_to_agent || ''}
                onChange={(e) => updateConfig('message_to_agent', e.target.value)}
                placeholder="Novo lead aguardando atendimento..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">URL</Label>
              <Input
                value={config.url || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo de Link</Label>
              <select
                value={config.link_type || 'website'}
                onChange={(e) => updateConfig('link_type', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="website">Site</option>
                <option value="location">Localização</option>
                <option value="document">Documento</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea
                value={config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                placeholder="Acesse nosso site..."
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      case 'ler_documentos':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Fonte dos Documentos</Label>
              <select
                value={config.document_source || 'knowledge_base'}
                onChange={(e) => updateConfig('document_source', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="knowledge_base">Knowledge Base</option>
                <option value="google_drive">Google Drive</option>
                <option value="url">URL específica</option>
              </select>
            </div>
            {config.document_source === 'url' && (
              <div>
                <Label className="text-xs">URL do Documento</Label>
                <Input
                  value={config.source_url || ''}
                  onChange={(e) => updateConfig('source_url', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Instruções para IA</Label>
              <Textarea
                value={config.instructions || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                placeholder="O que a IA deve buscar nos documentos..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem Antes</Label>
              <Textarea
                value={config.message_before || ''}
                onChange={(e) => updateConfig('message_before', e.target.value)}
                placeholder="Vou verificar isso para você..."
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <Label className="text-xs">Mensagem Depois</Label>
              <Textarea
                value={config.message_after || ''}
                onChange={(e) => updateConfig('message_after', e.target.value)}
                placeholder="Encontrei as informações!"
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const needsFile = fullTypeInfo?.needsFile;
  const hasFile = !!config.file_url;
  const canSubmit = displayName && aiDescription && (!needsFile || hasFile);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="p-4 border-b">
        <button 
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar
        </button>
        
        <div className="flex items-center gap-3 mt-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${typeInfo.color}20` }}
          >
            <ToolIcon 
              type={type} 
              className="w-5 h-5" 
              style={{ color: typeInfo.color }} 
            />
          </div>
          <div>
            <h3 className="font-medium text-foreground">
              {isEditing ? 'Editar' : 'Nova'} {typeInfo.label}
            </h3>
            <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-xs">Nome da Tool</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Enviar Catálogo"
              className="mt-1"
              required
            />
          </div>

          {/* Descrição para IA */}
          <div>
            <Label className="text-xs">Descrição para IA</Label>
            <Textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="Descreva quando a IA deve usar esta tool..."
              className="mt-1 min-h-[80px]"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              A IA usará esta descrição para decidir quando usar a tool
            </p>
          </div>

          {/* Campos específicos do tipo */}
          <div className="pt-2 border-t">
            <Label className="text-xs text-muted-foreground mb-3 block">
              Configurações de {typeInfo.label}
            </Label>
            {renderConfigFields()}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Button type="submit" className="w-full" disabled={isLoading || !canSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            isEditing ? 'Salvar Alterações' : 'Criar Tool'
          )}
        </Button>
        
        {isEditing && onDelete && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Tool
          </Button>
        )}
      </div>
    </form>
  );
}
