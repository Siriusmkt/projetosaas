import { AgendamentoConfig } from '@/types/tools';
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

interface ToolFormAgendamentoProps {
  config: AgendamentoConfig;
  onChange: (config: AgendamentoConfig) => void;
}

export function ToolFormAgendamento({ config, onChange }: ToolFormAgendamentoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo de calendário</Label>
          <Select
            value={config.calendar_type || 'cal_com'}
            onValueChange={(v) => onChange({ ...config, calendar_type: v as any })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="cal_com">Cal.com</SelectItem>
              <SelectItem value="google">Google Calendar</SelectItem>
              <SelectItem value="calendly">Calendly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duração (minutos)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            step={15}
            value={config.duration_minutes || 30}
            onChange={(e) => onChange({ ...config, duration_minutes: parseInt(e.target.value) || 30 })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calendar-url">URL do calendário</Label>
        <Input
          id="calendar-url"
          type="url"
          value={config.calendar_url || ''}
          onChange={(e) => onChange({ ...config, calendar_url: e.target.value })}
          placeholder="Ex: https://cal.com/sua-empresa/consulta"
          className="bg-secondary border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-before">Mensagem antes do link</Label>
        <Textarea
          id="message-before"
          value={config.message_before || ''}
          onChange={(e) => onChange({ ...config, message_before: e.target.value })}
          placeholder="Ex: Ótimo! Vou te enviar o link para você escolher o melhor horário."
          className="bg-secondary border-border resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-after">Mensagem após confirmação</Label>
        <Textarea
          id="message-after"
          value={config.message_after || ''}
          onChange={(e) => onChange({ ...config, message_after: e.target.value })}
          placeholder="Ex: Perfeito! Sua consulta está marcada para {data} às {horario}. Te esperamos!"
          className="bg-secondary border-border resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Variáveis disponíveis: {'{data}'}, {'{horario}'}
        </p>
      </div>
    </div>
  );
}
