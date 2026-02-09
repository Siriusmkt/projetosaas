import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, CheckCircle, ThumbsUp, MessageCircle, ArrowRight, Heart } from 'lucide-react';
import type { PromptConectivo } from '@/types/prompt';

interface ConectivosSectionProps {
  data: PromptConectivo[];
  onSave: (data: Omit<PromptConectivo, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

type TipoConectivo = 'validacao' | 'concordancia' | 'transicao' | 'empatia' | 'explicacao';

interface ConectivoConfig {
  tipo: TipoConectivo;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  defaults: string[];
}

const CONECTIVO_CONFIGS: ConectivoConfig[] = [
  {
    tipo: 'validacao',
    titulo: 'Validação Positiva',
    descricao: 'Expressões para confirmar que entendeu',
    icon: <CheckCircle className="w-4 h-4" />,
    defaults: ['Entendi', 'Faz sentido', 'Perfeito', 'Show', 'Bacana'],
  },
  {
    tipo: 'concordancia',
    titulo: 'Concordância',
    descricao: 'Expressões para concordar com o cliente',
    icon: <ThumbsUp className="w-4 h-4" />,
    defaults: ['Pois é...', 'Com certeza', 'Exatamente', 'Isso mesmo', 'Verdade'],
  },
  {
    tipo: 'explicacao',
    titulo: 'Início de Explicação',
    descricao: 'Para começar a explicar algo',
    icon: <MessageCircle className="w-4 h-4" />,
    defaults: ['Olha...', 'Veja bem...', 'Então...', 'A questão é...', 'O ponto é...'],
  },
  {
    tipo: 'transicao',
    titulo: 'Transição',
    descricao: 'Para mudar de assunto ou fazer nova pergunta',
    icon: <ArrowRight className="w-4 h-4" />,
    defaults: ['E me conta...', 'Me diz...', 'E sobre...', 'Falando nisso...', 'Aproveitando...'],
  },
  {
    tipo: 'empatia',
    titulo: 'Empatia',
    descricao: 'Para demonstrar que entende o cliente',
    icon: <Heart className="w-4 h-4" />,
    defaults: ['Entendo perfeitamente...', 'Nossa, entendo!', 'Faz total sentido...', 'Imagino...', 'Sei como é...'],
  },
];

export function ConectivosSection({ data, onSave, isSaving }: ConectivosSectionProps) {
  const [conectivos, setConectivos] = useState<Map<TipoConectivo, string[]>>(new Map());
  const [newExpression, setNewExpression] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const map = new Map<TipoConectivo, string[]>();
    
    if (data.length > 0) {
      data.forEach(c => {
        map.set(c.tipo as TipoConectivo, c.expressoes);
      });
    }
    
    // Preencher com defaults para tipos faltantes
    CONECTIVO_CONFIGS.forEach(config => {
      if (!map.has(config.tipo)) {
        map.set(config.tipo, [...config.defaults]);
      }
    });
    
    setConectivos(map);
  }, [data]);

  const handleAddExpression = (tipo: TipoConectivo) => {
    const expression = newExpression[tipo]?.trim();
    if (!expression) return;
    
    setConectivos(prev => {
      const updated = new Map(prev);
      const current = updated.get(tipo) || [];
      updated.set(tipo, [...current, expression]);
      return updated;
    });
    setNewExpression(prev => ({ ...prev, [tipo]: '' }));
  };

  const handleRemoveExpression = (tipo: TipoConectivo, index: number) => {
    setConectivos(prev => {
      const updated = new Map(prev);
      const current = updated.get(tipo) || [];
      updated.set(tipo, current.filter((_, i) => i !== index));
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result: Omit<PromptConectivo, 'id' | 'prompt_id'>[] = [];
    conectivos.forEach((expressoes, tipo) => {
      if (expressoes.length > 0) {
        result.push({ tipo, expressoes });
      }
    });
    
    await onSave(result);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Expressões e Conectivos</h2>
        <p className="text-sm text-muted-foreground">
          Palavras e frases que dão naturalidade à conversa
        </p>
      </div>

      <div className="space-y-6">
        {CONECTIVO_CONFIGS.map((config) => {
          const expressions = conectivos.get(config.tipo) || [];
          
          return (
            <div key={config.tipo} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {config.icon}
                </div>
                <div>
                  <h4 className="font-medium">{config.titulo}</h4>
                  <p className="text-xs text-muted-foreground">{config.descricao}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {expressions.map((exp, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 py-1">
                    {exp}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpression(config.tipo, index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newExpression[config.tipo] || ''}
                  onChange={(e) => setNewExpression(prev => ({ ...prev, [config.tipo]: e.target.value }))}
                  placeholder="Adicionar expressão..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpression(config.tipo))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddExpression(config.tipo)}
                  disabled={!newExpression[config.tipo]?.trim()}
                >
                  Adicionar
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
