import { memo, useState, useEffect } from 'react';
import { X, Volume2, Sparkles, MessageCircle, Clock, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface AgentConfig {
  name: string;
  voiceTone: 'formal' | 'casual' | 'friendly' | 'professional';
  phoneticRules: string;
  greetingStyle: string;
  maxWaitTime: number;
  forbiddenWords: string;
  useEmojis: boolean;
  confirmBeforeAction: boolean;
}

interface AgentConfigPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: AgentConfig;
  onConfigChange: (config: AgentConfig) => void;
}

const VOICE_TONES = [
  { value: 'formal', label: 'Formal', desc: 'Linguagem profissional e séria' },
  { value: 'casual', label: 'Casual', desc: 'Descontraído e natural' },
  { value: 'friendly', label: 'Amigável', desc: 'Próximo e acolhedor' },
  { value: 'professional', label: 'Consultivo', desc: 'Especialista que orienta' },
];

export const AgentConfigPanel = memo(function AgentConfigPanel({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: AgentConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState<AgentConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Configurar Agente
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Nome do Agente */}
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nome do Agente</Label>
            <Input
              id="agent-name"
              value={localConfig.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Grazi, Ana, Carlos..."
            />
            <p className="text-xs text-muted-foreground">
              Como o agente se apresenta nas conversas
            </p>
          </div>

          {/* Tom de Voz */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Tom de Voz
            </Label>
            <Select
              value={localConfig.voiceTone}
              onValueChange={(value) => handleChange('voiceTone', value as AgentConfig['voiceTone'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_TONES.map((tone) => (
                  <SelectItem key={tone.value} value={tone.value}>
                    <div>
                      <span className="font-medium">{tone.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        — {tone.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Regras Fonéticas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Regras de Pronúncia
            </Label>
            <Textarea
              value={localConfig.phoneticRules}
              onChange={(e) => handleChange('phoneticRules', e.target.value)}
              placeholder="@ = arroba&#10;% = por cento&#10;CRM = sistema de gestão&#10;5 = cinco"
              className="min-h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Como pronunciar símbolos, siglas e números (um por linha)
            </p>
          </div>

          {/* Estilo de Saudação */}
          <div className="space-y-2">
            <Label>Expressões Naturais</Label>
            <Textarea
              value={localConfig.greetingStyle}
              onChange={(e) => handleChange('greetingStyle', e.target.value)}
              placeholder="Show!, Entendi!, Muito bacana!, Caraca, muito top!"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Expressões que o agente usa para parecer natural
            </p>
          </div>

          {/* Palavras Proibidas */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Palavras Proibidas
            </Label>
            <Textarea
              value={localConfig.forbiddenWords}
              onChange={(e) => handleChange('forbiddenWords', e.target.value)}
              placeholder="preço, valor, custo, desconto..."
              className="min-h-[60px]"
            />
            <p className="text-xs text-muted-foreground">
              Palavras que o agente nunca deve usar
            </p>
          </div>

          {/* Tempo Máximo de Espera */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo Máximo de Espera (segundos)
            </Label>
            <Input
              type="number"
              value={localConfig.maxWaitTime}
              onChange={(e) => handleChange('maxWaitTime', parseInt(e.target.value) || 30)}
              min={10}
              max={300}
            />
            <p className="text-xs text-muted-foreground">
              Quanto tempo esperar resposta antes de fazer follow-up
            </p>
          </div>

          {/* Switches */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usar Emojis</Label>
                <p className="text-xs text-muted-foreground">
                  Incluir emojis nas mensagens
                </p>
              </div>
              <Switch
                checked={localConfig.useEmojis}
                onCheckedChange={(checked) => handleChange('useEmojis', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmar Antes de Ações</Label>
                <p className="text-xs text-muted-foreground">
                  Pedir confirmação antes de agendar, etc.
                </p>
              </div>
              <Switch
                checked={localConfig.confirmBeforeAction}
                onCheckedChange={(checked) => handleChange('confirmBeforeAction', checked)}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
