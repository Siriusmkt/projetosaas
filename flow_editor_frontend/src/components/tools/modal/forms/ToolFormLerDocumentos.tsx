import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LerDocumentosConfig } from '@/types/tools';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolFormLerDocumentosProps {
  config: LerDocumentosConfig;
  onChange: (config: LerDocumentosConfig) => void;
}

export function ToolFormLerDocumentos({ config, onChange }: ToolFormLerDocumentosProps) {
  const updateConfig = (key: keyof LerDocumentosConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm">Fonte dos Documentos</Label>
        <Select
          value={config.document_source || 'knowledge_base'}
          onValueChange={(value: 'knowledge_base' | 'google_drive' | 'url') => 
            updateConfig('document_source', value)
          }
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Selecione a fonte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="knowledge_base">
              Knowledge Base (arquivos enviados)
            </SelectItem>
            <SelectItem value="google_drive">
              Google Drive
            </SelectItem>
            <SelectItem value="url">
              URL específica
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          De onde a IA deve buscar as informações
        </p>
      </div>

      {config.document_source === 'url' && (
        <div>
          <Label className="text-sm">URL do Documento</Label>
          <Input
            value={config.source_url || ''}
            onChange={(e) => updateConfig('source_url', e.target.value)}
            placeholder="https://..."
            className="mt-1.5"
          />
        </div>
      )}

      {config.document_source === 'google_drive' && (
        <div>
          <Label className="text-sm">ID da Pasta/Arquivo</Label>
          <Input
            value={config.source_id || ''}
            onChange={(e) => updateConfig('source_id', e.target.value)}
            placeholder="ID do Google Drive"
            className="mt-1.5"
          />
        </div>
      )}

      <div>
        <Label className="text-sm">Instruções para a IA</Label>
        <Textarea
          value={config.instructions || ''}
          onChange={(e) => updateConfig('instructions', e.target.value)}
          placeholder="Ex: Busque informações sobre preços e características dos produtos..."
          className="mt-1.5 min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          O que a IA deve procurar nos documentos
        </p>
      </div>

      <div>
        <Label className="text-sm">Mensagem Antes da Busca</Label>
        <Textarea
          value={config.message_before || ''}
          onChange={(e) => updateConfig('message_before', e.target.value)}
          placeholder="Vou verificar essa informação para você..."
          className="mt-1.5"
        />
      </div>

      <div>
        <Label className="text-sm">Mensagem Após Encontrar</Label>
        <Textarea
          value={config.message_after || ''}
          onChange={(e) => updateConfig('message_after', e.target.value)}
          placeholder="Encontrei as informações que você precisa!"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}