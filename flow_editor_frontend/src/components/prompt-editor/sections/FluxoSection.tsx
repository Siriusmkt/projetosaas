import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, GripVertical, Info } from 'lucide-react';
import type { PromptFluxoQualificacao } from '@/types/prompt';

interface FluxoSectionProps {
  data: PromptFluxoQualificacao[];
  onSave: (data: Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_FLUXO: Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>[] = [
  {
    etapa_numero: 1,
    etapa_nome: 'Validação do Interesse',
    pergunta: 'O que te despertou o interesse em conhecer os equipamentos da [Empresa]?',
    instrucoes_adicionais: 'Variações: montar academia → perguntar sobre espaço; renovar → perguntar sobre equipamentos atuais',
    ordem: 0,
  },
  {
    etapa_numero: 2,
    etapa_nome: 'Perfil e Público',
    pergunta: 'Que tipo de público você atende ou pretende atender na academia?',
    ordem: 1,
  },
  {
    etapa_numero: 3,
    etapa_nome: 'Espaço Físico',
    pergunta: 'Sobre o espaço físico, você já tem um local definido para esses equipamentos?',
    ordem: 2,
  },
  {
    etapa_numero: 4,
    etapa_nome: 'Dores e Preocupações',
    pergunta: 'Existe algo que você quer evitar na escolha? Tipo problemas com durabilidade, manutenção, falta de suporte... Qual sua maior preocupação?',
    ordem: 3,
  },
  {
    etapa_numero: 5,
    etapa_nome: 'Poder de Decisão',
    pergunta: 'Você é a pessoa que toma a decisão sobre essa compra ou tem mais alguém que decide junto?',
    instrucoes_adicionais: 'Se decisor único: "Perfeito! Facilita bastante!" | Se compartilhado: perguntar se outro acompanha',
    ordem: 4,
  },
  {
    etapa_numero: 6,
    etapa_nome: 'Urgência e Prazo',
    pergunta: 'Você tem algum prazo ou data prevista para essa aquisição? Inauguração marcada, necessidade urgente?',
    ordem: 5,
  },
  {
    etapa_numero: 7,
    etapa_nome: 'Proposta de Reunião',
    pergunta: 'Faz sentido marcar uma conversa com nosso time técnico? É uma conversa de uns trinta minutos, bem tranquilo.',
    ordem: 6,
  },
];

export function FluxoSection({ data, onSave, isSaving }: FluxoSectionProps) {
  const [etapas, setEtapas] = useState<Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      setEtapas(data.map(e => ({
        etapa_numero: e.etapa_numero,
        etapa_nome: e.etapa_nome,
        contexto_gatilho: e.contexto_gatilho,
        pergunta: e.pergunta,
        instrucoes_adicionais: e.instrucoes_adicionais,
        ordem: e.ordem,
      })));
    } else {
      setEtapas(DEFAULT_FLUXO);
    }
  }, [data]);

  const handleUpdate = (index: number, field: keyof Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>, value: string | number) => {
    setEtapas(prev => prev.map((e, i) => 
      i === index ? { ...e, [field]: value } : e
    ));
  };

  const handleAdd = () => {
    setEtapas(prev => [...prev, {
      etapa_numero: prev.length + 1,
      etapa_nome: '',
      pergunta: '',
      ordem: prev.length,
    }]);
  };

  const handleRemove = (index: number) => {
    setEtapas(prev => {
      const newEtapas = prev.filter((_, i) => i !== index);
      // Reordenar etapas
      return newEtapas.map((e, i) => ({
        ...e,
        etapa_numero: i + 1,
        ordem: i,
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(etapas.filter(e => e.etapa_nome && e.pergunta));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Fluxo de Qualificação</h2>
        <p className="text-sm text-muted-foreground">
          Perguntas que a IA faz para qualificar o lead
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ordene as etapas na sequência que a IA deve seguir. 
          Cada etapa representa uma pergunta do fluxo consultivo.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {etapas.map((etapa, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {etapa.etapa_numero}
              </div>
              <Input
                value={etapa.etapa_nome}
                onChange={(e) => handleUpdate(index, 'etapa_nome', e.target.value)}
                placeholder="Nome da etapa (ex: Validação do Interesse)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Textarea
              value={etapa.pergunta}
              onChange={(e) => handleUpdate(index, 'pergunta', e.target.value)}
              placeholder="Pergunta principal da etapa..."
              rows={2}
            />

            <Input
              value={etapa.instrucoes_adicionais || ''}
              onChange={(e) => handleUpdate(index, 'instrucoes_adicionais', e.target.value)}
              placeholder="Instruções adicionais / variações (opcional)"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Etapa
      </Button>

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
