import { AudioConfig } from '@/types/tools';
import { FileUpload } from '../FileUpload';

interface ToolFormAudioProps {
  config: AudioConfig;
  onChange: (config: AudioConfig) => void;
}

export function ToolFormAudio({ config, onChange }: ToolFormAudioProps) {
  return (
    <div className="space-y-4">
      <FileUpload
        label="Áudio (MP3, OGG, WAV, máx 16MB)"
        accept="audio/mpeg,audio/ogg,audio/wav"
        maxSizeMB={16}
        currentUrl={config.file_url}
        onUpload={(url) => onChange({ ...config, file_url: url })}
        onRemove={() => onChange({ ...config, file_url: '' })}
        previewType="audio"
      />
      
      <p className="text-xs text-muted-foreground">
        O áudio será enviado como mensagem de voz para o lead
      </p>
    </div>
  );
}
