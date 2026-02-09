import { VideoConfig } from '@/types/tools';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '../FileUpload';

interface ToolFormVideoProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

export function ToolFormVideo({ config, onChange }: ToolFormVideoProps) {
  return (
    <div className="space-y-4">
      <FileUpload
        label="Vídeo (MP4, máx 16MB)"
        accept="video/mp4"
        maxSizeMB={16}
        currentUrl={config.file_url}
        onUpload={(url) => onChange({ ...config, file_url: url })}
        onRemove={() => onChange({ ...config, file_url: '', thumbnail_url: '' })}
        previewType="video"
      />

      <div className="space-y-2">
        <Label htmlFor="caption">Legenda do vídeo</Label>
        <Textarea
          id="caption"
          value={config.caption || ''}
          onChange={(e) => onChange({ ...config, caption: e.target.value })}
          placeholder="Ex: Dá uma olhada na nossa clínica! Temos um espaço moderno esperando por você."
          className="bg-secondary border-border resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Mensagem que acompanha o vídeo quando enviado
        </p>
      </div>
    </div>
  );
}
