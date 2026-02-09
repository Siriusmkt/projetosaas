import { TransferenciaConfig } from '@/types/tools';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ToolFormTransferenciaProps {
  config: TransferenciaConfig;
  onChange: (config: TransferenciaConfig) => void;
}

export function ToolFormTransferencia({ config, onChange }: ToolFormTransferenciaProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="department">Departamento</Label>
        <Input
          id="department"
          value={config.department || ''}
          onChange={(e) => onChange({ ...config, department: e.target.value })}
          placeholder="Ex: Vendas, Suporte, Financeiro"
          className="bg-secondary border-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="notify-number">WhatsApp para notificar</Label>
          <Input
            id="notify-number"
            value={config.notify_number || ''}
            onChange={(e) => onChange({ ...config, notify_number: e.target.value })}
            placeholder="Ex: 5511999999999"
            className="bg-secondary border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notify-email">Email para notificar</Label>
          <Input
            id="notify-email"
            type="email"
            value={config.notify_email || ''}
            onChange={(e) => onChange({ ...config, notify_email: e.target.value })}
            placeholder="Ex: atendimento@empresa.com"
            className="bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-lead">Mensagem para o lead</Label>
        <Textarea
          id="message-lead"
          value={config.message_to_lead || ''}
          onChange={(e) => onChange({ ...config, message_to_lead: e.target.value })}
          placeholder="Ex: Vou te transferir para um de nossos especialistas que poderá te ajudar melhor. Um momento!"
          className="bg-secondary border-border resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message-agent">Mensagem para o atendente</Label>
        <Textarea
          id="message-agent"
          value={config.message_to_agent || ''}
          onChange={(e) => onChange({ ...config, message_to_agent: e.target.value })}
          placeholder="Ex: Novo lead transferido: {nome} ({telefone}). Motivo: {motivo}. Resumo: {resumo}"
          className="bg-secondary border-border resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Variáveis disponíveis: {'{nome}'}, {'{telefone}'}, {'{motivo}'}, {'{resumo}'}
        </p>
      </div>
    </div>
  );
}
