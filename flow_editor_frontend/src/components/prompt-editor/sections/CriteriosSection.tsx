import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, Plus, Trash2, Flame, Thermometer, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptCriterioLead } from '@/types/prompt';

interface CriteriosSectionProps {
  data: PromptCriterioLead[];
  onSave: (data: Omit<PromptCriterioLead, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

type TipoLead = 'quente' | 'morno' | 'frio';

interface CriterioConfig {
  tipo: TipoLead;
  titulo: string;
  subtitulo: string;
  icon: React.ReactNode;
  color: string;
  defaults: string[];
}

const CRITERIO_CONFIGS: CriterioConfig[] = [
  {
    tipo: 'quente',
    titulo: 'Lead Quente 🔥',
    subtitulo: 'Direcionar para time humano',
    icon: <Flame className="w-5 h-5" />,
    color: 'text-orange-500',
    defaults: [
      'Projeto definido (montagem, renovação ou ampliação)',
      'Decisor identificado e disponível',
      'Demonstra interesse genuíno e urgência',
      'Disponível para conversa com time técnico',
      'Entende que há investimento envolvido',
    ],
  },
  {
    tipo: 'morno',
    titulo: 'Lead Morno 🌡️',
    subtitulo: 'Educar e nutrir',
    icon: <Thermometer className="w-5 h-5" />,
    color: 'text-amber-500',
    defaults: [
      'Projeto em fase inicial de planejamento',
      'Influenciador mas não decisor único',
      'Interesse mas sem urgência clara',
      'Comparando opções no mercado',
      'Precisa de mais informações',
    ],
  },
  {
    tipo: 'frio',
    titulo: 'Lead Frio ❄️',
    subtitulo: 'Agradecer e liberar',
    icon: <Snowflake className="w-5 h-5" />,
    color: 'text-blue-500',
    defaults: [
      'Apenas curiosidade sem projeto concreto',
      'Sem poder de decisão nenhum',
      'Resistência clara em avançar',
      'Apenas comparando preços sem contexto',
      'Perfil incompatível (ex: uso residencial)',
    ],
  },
];

export function CriteriosSection({ data, onSave, isSaving }: CriteriosSectionProps) {
  const [criterios, setCriterios] = useState<Map<TipoLead, Omit<PromptCriterioLead, 'id' | 'prompt_id'>[]>>(new Map());
  const [newCriterio, setNewCriterio] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const map = new Map<TipoLead, Omit<PromptCriterioLead, 'id' | 'prompt_id'>[]>();
    
    if (data.length > 0) {
      data.forEach(c => {
        const tipo = c.tipo_lead as TipoLead;
        const current = map.get(tipo) || [];
        map.set(tipo, [...current, {
          tipo_lead: c.tipo_lead,
          criterio: c.criterio,
          acao_recomendada: c.acao_recomendada,
          is_active: c.is_active,
          ordem: c.ordem,
        }]);
      });
    }
    
    // Preencher com defaults para tipos faltantes
    CRITERIO_CONFIGS.forEach(config => {
      if (!map.has(config.tipo)) {
        map.set(config.tipo, config.defaults.map((criterio, i) => ({
          tipo_lead: config.tipo,
          criterio,
          is_active: true,
          ordem: i,
        })));
      }
    });
    
    setCriterios(map);
  }, [data]);

  const handleToggle = (tipo: TipoLead, index: number) => {
    setCriterios(prev => {
      const updated = new Map(prev);
      const current = updated.get(tipo) || [];
      updated.set(tipo, current.map((c, i) => 
        i === index ? { ...c, is_active: !c.is_active } : c
      ));
      return updated;
    });
  };

  const handleAdd = (tipo: TipoLead) => {
    const criterio = newCriterio[tipo]?.trim();
    if (!criterio) return;
    
    setCriterios(prev => {
      const updated = new Map(prev);
      const current = updated.get(tipo) || [];
      updated.set(tipo, [...current, {
        tipo_lead: tipo,
        criterio,
        is_active: true,
        ordem: current.length,
      }]);
      return updated;
    });
    setNewCriterio(prev => ({ ...prev, [tipo]: '' }));
  };

  const handleRemove = (tipo: TipoLead, index: number) => {
    setCriterios(prev => {
      const updated = new Map(prev);
      const current = updated.get(tipo) || [];
      updated.set(tipo, current.filter((_, i) => i !== index));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result: Omit<PromptCriterioLead, 'id' | 'prompt_id'>[] = [];
    criterios.forEach((items) => {
      items.forEach(item => {
        if (item.criterio) {
          result.push(item);
        }
      });
    });
    
    await onSave(result);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Critérios de Lead</h2>
        <p className="text-sm text-muted-foreground">
          Como classificar os leads para direcionar corretamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CRITERIO_CONFIGS.map((config) => {
          const items = criterios.get(config.tipo) || [];
          
          return (
            <div key={config.tipo} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.color)}>
                  {config.icon}
                </div>
                <div>
                  <h4 className="font-medium">{config.titulo}</h4>
                  <p className="text-xs text-muted-foreground">{config.subtitulo}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <Checkbox
                      checked={item.is_active}
                      onCheckedChange={() => handleToggle(config.tipo, index)}
                      className="mt-0.5"
                    />
                    <span className={cn(
                      "text-sm flex-1",
                      !item.is_active && "line-through text-muted-foreground"
                    )}>
                      {item.criterio}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(config.tipo, index)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newCriterio[config.tipo] || ''}
                  onChange={(e) => setNewCriterio(prev => ({ ...prev, [config.tipo]: e.target.value }))}
                  placeholder="Novo critério..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd(config.tipo))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAdd(config.tipo)}
                  disabled={!newCriterio[config.tipo]?.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar e Continuar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
