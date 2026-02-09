import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Target, Flame, ThermometerSun, Snowflake } from 'lucide-react';
import { AgenteCriterioLead, DEFAULT_CRITERIOS_QUENTE, DEFAULT_CRITERIOS_MORNO, DEFAULT_CRITERIOS_FRIO } from '@/types/agente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QualificacaoFormProps {
  data: AgenteCriterioLead[];
  onChange: (data: AgenteCriterioLead[]) => void;
}

export function QualificacaoForm({ data, onChange }: QualificacaoFormProps) {
  const [novoCriterio, setNovoCriterio] = useState('');
  const [tipoAtivo, setTipoAtivo] = useState<'quente' | 'morno' | 'frio'>('quente');

  const quentes = data.filter(c => c.tipo_lead === 'quente');
  const mornos = data.filter(c => c.tipo_lead === 'morno');
  const frios = data.filter(c => c.tipo_lead === 'frio');

  const addCriterio = () => {
    if (!novoCriterio.trim()) return;
    const novo: AgenteCriterioLead = {
      id: `temp_${Date.now()}`,
      agente_id: '',
      tipo_lead: tipoAtivo,
      criterio: novoCriterio.trim(),
      is_active: true,
      ordem: data.filter(c => c.tipo_lead === tipoAtivo).length,
    };
    onChange([...data, novo]);
    setNovoCriterio('');
  };

  const removeCriterio = (id: string) => {
    onChange(data.filter(c => c.id !== id));
  };

  const toggleCriterio = (id: string) => {
    onChange(data.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const getSugestoes = () => {
    const existentes = data.filter(c => c.tipo_lead === tipoAtivo).map(c => c.criterio);
    const defaults = tipoAtivo === 'quente' ? DEFAULT_CRITERIOS_QUENTE :
                     tipoAtivo === 'morno' ? DEFAULT_CRITERIOS_MORNO : DEFAULT_CRITERIOS_FRIO;
    return defaults.filter(d => !existentes.includes(d)).slice(0, 3);
  };

  const renderLista = (criterios: AgenteCriterioLead[]) => (
    <div className="space-y-2">
      {criterios.map((c) => (
        <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Switch
            checked={c.is_active}
            onCheckedChange={() => toggleCriterio(c.id)}
          />
          <span className={`flex-1 text-sm ${!c.is_active ? 'text-muted-foreground line-through' : ''}`}>
            {c.criterio}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => removeCriterio(c.id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* Sugestões */}
      <div className="flex flex-wrap gap-1.5 py-2">
        {getSugestoes().map((s) => (
          <Badge 
            key={s}
            variant="outline" 
            className="cursor-pointer hover:bg-primary/10 text-xs"
            onClick={() => setNovoCriterio(s)}
          >
            + {s}
          </Badge>
        ))}
      </div>

      {/* Input para adicionar */}
      <div className="flex gap-2">
        <Input
          value={novoCriterio}
          onChange={(e) => setNovoCriterio(e.target.value)}
          placeholder="Adicionar critério..."
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCriterio())}
        />
        <Button onClick={addCriterio} disabled={!novoCriterio.trim()} variant="secondary">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
        <p className="text-xs text-muted-foreground">
          <strong>Critérios de Qualificação:</strong> Defina como classificar os leads em 
          Quente (prioridade), Morno (nutrir) ou Frio (descarte).
        </p>
      </div>

      <Tabs value={tipoAtivo} onValueChange={(v) => setTipoAtivo(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quente" className="gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Quente ({quentes.length})
          </TabsTrigger>
          <TabsTrigger value="morno" className="gap-2">
            <ThermometerSun className="w-4 h-4 text-amber-500" />
            Morno ({mornos.length})
          </TabsTrigger>
          <TabsTrigger value="frio" className="gap-2">
            <Snowflake className="w-4 h-4 text-blue-500" />
            Frio ({frios.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quente" className="mt-4">
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 mb-4">
            <p className="text-xs">
              🔥 <strong>Lead Quente:</strong> Alta probabilidade de conversão. Priorizar atendimento imediato.
            </p>
          </div>
          {renderLista(quentes)}
        </TabsContent>

        <TabsContent value="morno" className="mt-4">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-4">
            <p className="text-xs">
              🌡️ <strong>Lead Morno:</strong> Interessado mas precisa de nutrição. Seguir fluxo consultivo.
            </p>
          </div>
          {renderLista(mornos)}
        </TabsContent>

        <TabsContent value="frio" className="mt-4">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
            <p className="text-xs">
              ❄️ <strong>Lead Frio:</strong> Baixa probabilidade. Encerrar de forma educada.
            </p>
          </div>
          {renderLista(frios)}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Defina pelo menos 1 critério para leads quentes
      </p>
    </div>
  );
}