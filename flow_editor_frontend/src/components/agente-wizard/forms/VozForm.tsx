import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X, Volume2 } from 'lucide-react';
import { AgenteVozConfig } from '@/types/agente';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VozFormProps {
  data: Partial<AgenteVozConfig>;
  onChange: (data: Partial<AgenteVozConfig>) => void;
}

export function VozForm({ data, onChange }: VozFormProps) {
  const [novaConfirmacao, setNovaConfirmacao] = useState('');
  const [novaTransicao, setNovaTransicao] = useState('');

  const update = (field: keyof AgenteVozConfig, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addToArray = (field: 'confirmacoes' | 'transicoes' | 'empatia' | 'concordancia', value: string) => {
    if (!value.trim()) return;
    const current = (data[field] as string[]) || [];
    update(field, [...current, value.trim()]);
  };

  const removeFromArray = (field: 'confirmacoes' | 'transicoes' | 'empatia' | 'concordancia', index: number) => {
    const current = (data[field] as string[]) || [];
    update(field, current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
        <Volume2 className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium text-sm">Configurações de Voz</p>
          <p className="text-xs text-muted-foreground">
            Ajuste o comportamento específico para agentes de voz
          </p>
        </div>
      </div>

      {/* Formalidade e Velocidade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nível de Formalidade</Label>
          <Select
            value={data.nivel_formalidade || 'informal'}
            onValueChange={(v) => update('nivel_formalidade', v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="semi-formal">Semi-formal</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Velocidade da Fala</Label>
          <Select
            value={data.velocidade_fala || 'normal'}
            onValueChange={(v) => update('velocidade_fala', v)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lento">Lento</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="rapido">Rápido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Posicionamento */}
      <div>
        <Label>Posicionamento do Agente</Label>
        <Select
          value={data.posicionamento || 'consultivo'}
          onValueChange={(v) => update('posicionamento', v)}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consultivo">Consultivo (perguntas abertas)</SelectItem>
            <SelectItem value="vendedor">Vendedor (mais direto)</SelectItem>
            <SelectItem value="suporte">Suporte (resolver problemas)</SelectItem>
            <SelectItem value="receptivo">Receptivo (escuta ativa)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Pausas Naturais</Label>
            <p className="text-xs text-muted-foreground">Adiciona pausas entre frases</p>
          </div>
          <Switch
            checked={data.pausas_naturais ?? true}
            onCheckedChange={(v) => update('pausas_naturais', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Detectar Interrupção</Label>
            <p className="text-xs text-muted-foreground">Para de falar quando lead interrompe</p>
          </div>
          <Switch
            checked={data.detectar_interrupcao ?? true}
            onCheckedChange={(v) => update('detectar_interrupcao', v)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <Label>Usar Gírias</Label>
            <p className="text-xs text-muted-foreground">Linguagem mais coloquial</p>
          </div>
          <Switch
            checked={data.usa_girias ?? true}
            onCheckedChange={(v) => update('usa_girias', v)}
          />
        </div>
      </div>

      {/* Tempo de espera */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Tempo de Espera por Resposta</Label>
          <span className="text-sm font-medium">{data.tempo_espera_resposta || 30}s</span>
        </div>
        <Slider
          value={[data.tempo_espera_resposta || 30]}
          onValueChange={([v]) => update('tempo_espera_resposta', v)}
          min={10}
          max={60}
          step={5}
        />
      </div>

      {/* Max perguntas seguidas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Máximo de Perguntas Seguidas</Label>
          <span className="text-sm font-medium">{data.max_perguntas_seguidas || 1}</span>
        </div>
        <Slider
          value={[data.max_perguntas_seguidas || 1]}
          onValueChange={([v]) => update('max_perguntas_seguidas', v)}
          min={1}
          max={3}
          step={1}
        />
      </div>

      {/* Confirmações */}
      <div>
        <Label>Expressões de Confirmação</Label>
        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px]">
          {(data.confirmacoes || ['Entendi', 'Perfeito', 'Show']).map((c, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {c}
              <button onClick={() => removeFromArray('confirmacoes', i)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={novaConfirmacao}
            onChange={(e) => setNovaConfirmacao(e.target.value)}
            placeholder="Adicionar expressão..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('confirmacoes', novaConfirmacao);
                setNovaConfirmacao('');
              }
            }}
          />
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => { addToArray('confirmacoes', novaConfirmacao); setNovaConfirmacao(''); }}
            disabled={!novaConfirmacao.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Transições */}
      <div>
        <Label>Expressões de Transição</Label>
        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[32px]">
          {(data.transicoes || ['E me conta...', 'Me diz...']).map((t, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {t}
              <button onClick={() => removeFromArray('transicoes', i)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={novaTransicao}
            onChange={(e) => setNovaTransicao(e.target.value)}
            placeholder="Adicionar expressão..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addToArray('transicoes', novaTransicao);
                setNovaTransicao('');
              }
            }}
          />
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => { addToArray('transicoes', novaTransicao); setNovaTransicao(''); }}
            disabled={!novaTransicao.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Instruções adicionais */}
      <div>
        <Label>Instruções Adicionais</Label>
        <Textarea
          value={data.instrucoes_adicionais || ''}
          onChange={(e) => update('instrucoes_adicionais', e.target.value)}
          placeholder="Outras instruções específicas para comportamento de voz..."
          className="mt-1.5 min-h-[80px]"
        />
      </div>
    </div>
  );
}