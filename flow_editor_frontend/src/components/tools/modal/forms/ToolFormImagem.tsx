import { ImagemConfig } from '@/types/tools';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '../FileUpload';

interface ToolFormImagemProps {
  config: ImagemConfig;
  onChange: (config: ImagemConfig) => void;
}

export function ToolFormImagem({ config, onChange }: ToolFormImagemProps) {
  return (
    <div className="space-y-4">
      <FileUpload
        label="Imagem (JPG, PNG, WEBP, máx 5MB)"
        accept="image/jpeg,image/png,image/webp"
        maxSizeMB={5}
        currentUrl={config.file_url}
        onUpload={(url) => onChange({ ...config, file_url: url })}
        onRemove={() => onChange({ ...config, file_url: '' })}
        previewType="image"
      />

      <div className="space-y-2">
        <Label htmlFor="caption">Legenda da imagem</Label>
        <Textarea
          id="caption"
          value={config.caption || ''}
          onChange={(e) => onChange({ ...config, caption: e.target.value })}
          placeholder="Ex: Olha só como ficou nosso espaço depois da reforma!"
          className="bg-secondary border-border resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Mensagem que acompanha a imagem quando enviada
        </p>
      </div>
    </div>
  );
}
