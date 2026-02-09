import { LinkConfig } from '@/types/tools';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolFormLinkProps {
  config: LinkConfig;
  onChange: (config: LinkConfig) => void;
}

export function ToolFormLink({ config, onChange }: ToolFormLinkProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de link</Label>
        <Select
          value={config.link_type || 'website'}
          onValueChange={(v) => onChange({ ...config, link_type: v as any })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="location">Localização (Maps)</SelectItem>
            <SelectItem value="document">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          value={config.url || ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder={
            config.link_type === 'location' 
              ? 'Ex: https://maps.google.com/...' 
              : 'Ex: https://seusite.com/pagina'
          }
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem de envio</Label>
        <Textarea
          id="message"
          value={config.message || ''}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder={
            config.link_type === 'location'
              ? 'Ex: Segue nossa localização! Te esperamos lá.'
              : 'Ex: Dá uma olhada no link que te mandei!'
          }
          className="bg-secondary border-border resize-none"
        />
      </div>
    </div>
  );
}
