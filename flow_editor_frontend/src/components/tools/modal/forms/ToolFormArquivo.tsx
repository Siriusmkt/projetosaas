import { ArquivoConfig } from '@/types/tools';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '../FileUpload';

interface ToolFormArquivoProps {
  config: ArquivoConfig;
  onChange: (config: ArquivoConfig) => void;
}

export function ToolFormArquivo({ config, onChange }: ToolFormArquivoProps) {
  return (
    <div className="space-y-4">
      <FileUpload
        label="Arquivo (PDF, DOC, DOCX, XLS, XLSX, máx 20MB)"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        maxSizeMB={20}
        currentUrl={config.file_url}
        onUpload={(url, fileName) => onChange({ ...config, file_url: url, file_name: fileName || config.file_name })}
        onRemove={() => onChange({ ...config, file_url: '', file_name: '' })}
        previewType="file"
      />

      <div className="space-y-2">
        <Label htmlFor="file-name">Nome de exibição do arquivo</Label>
        <Input
          id="file-name"
          value={config.file_name || ''}
          onChange={(e) => onChange({ ...config, file_name: e.target.value })}
          placeholder="Ex: Tabela de Preços 2024.pdf"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          Nome que aparecerá para o lead ao receber o arquivo
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Mensagem de envio</Label>
        <Textarea
          id="caption"
          value={config.caption || ''}
          onChange={(e) => onChange({ ...config, caption: e.target.value })}
          placeholder="Ex: Segue nossa tabela de preços atualizada!"
          className="bg-secondary border-border resize-none"
        />
      </div>
    </div>
  );
}
