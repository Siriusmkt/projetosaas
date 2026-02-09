import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, AlertTriangle, Info } from 'lucide-react';
import type { PromptObjecao } from '@/types/prompt';

interface ObjecoesSectionProps {
  data: PromptObjecao[];
  onSave: (data: Omit<PromptObjecao, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_OBJECOES: Omit<PromptObjecao, 'id' | 'prompt_id'>[] = [
  {
    objecao_gatilho: 'Está caro / Achei caro',
    resposta: 'Entendo sua preocupação, [Nome]. Nossos equipamentos são fabricados para uso intenso profissional. O investimento inicial pode parecer maior, mas o custo a longo prazo com manutenção e troca é bem menor. Nosso time mostra essa conta na prática.',
    estrategia: 'Empatia → Argumento de valor → Prova social',
    ordem: 0,
  },
  {
    objecao_gatilho: 'Vou ver com outro fornecedor',
    resposta: 'Super tranquilo, faz parte avaliar opções! Se você me disser quais marcas está comparando, posso orientar o que observar - tipo espessura, ajustes, garantia real. Assim você decide mais informado.',
    estrategia: 'Validação → Oferta de ajuda → Diferenciação',
    ordem: 1,
  },
  {
    objecao_gatilho: 'Não conheço a marca',
    resposta: 'Entendo que precisa de segurança! Somos fabricante focado em robustez para uso comercial. Não somos tão expostos quanto marcas importadas, mas temos cases sólidos de academias grandes. O time mostra referências concretas.',
    estrategia: 'Validação → Credenciais → Prova social',
    ordem: 2,
  },
  {
    objecao_gatilho: 'Agora não é o momento',
    resposta: 'Sem problema, [Nome]! Cada negócio tem seu timing. Quando fizer sentido retomar, é só entrar em contato. Agradeço pela conversa e boa sorte com o planejamento! Até breve!',
    estrategia: 'Validação → Sem pressão → Porta aberta',
    ordem: 3,
  },
  {
    objecao_gatilho: 'Preciso pensar / Vou conversar com sócio',
    resposta: 'Claro, decisão importante precisa ser bem avaliada! O time pode passar material por escrito pra você analisar com calma. Faz sentido marcar a conversa mesmo assim pra ter todas as informações?',
    estrategia: 'Validação → Facilitar decisão → Manter engajamento',
    ordem: 4,
  },
  {
    objecao_gatilho: 'Só quero um orçamento rápido',
    resposta: 'Tranquilo! Pra passar um orçamento que faça sentido, o time precisa entender uns detalhes básicos. É rápido, uns quinze a vinte minutos. Assim você recebe proposta certinha, não genérica. Posso direcionar?',
    estrategia: 'Validação → Educar sobre processo → Oferecer alternativa',
    ordem: 5,
  },
];

export function ObjecoesSection({ data, onSave, isSaving }: ObjecoesSectionProps) {
  const [objecoes, setObjecoes] = useState<Omit<PromptObjecao, 'id' | 'prompt_id'>[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      setObjecoes(data.map(o => ({
        objecao_gatilho: o.objecao_gatilho,
        resposta: o.resposta,
        estrategia: o.estrategia,
        ordem: o.ordem,
      })));
    } else {
      setObjecoes(DEFAULT_OBJECOES);
    }
  }, [data]);

  const handleUpdate = (index: number, field: keyof Omit<PromptObjecao, 'id' | 'prompt_id'>, value: string | number) => {
    setObjecoes(prev => prev.map((o, i) => 
      i === index ? { ...o, [field]: value } : o
    ));
  };

  const handleAdd = () => {
    setObjecoes(prev => [...prev, {
      objecao_gatilho: '',
      resposta: '',
      estrategia: '',
      ordem: prev.length,
    }]);
  };

  const handleRemove = (index: number) => {
    setObjecoes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(objecoes.filter(o => o.objecao_gatilho && o.resposta));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Tratamento de Objeções</h2>
        <p className="text-sm text-muted-foreground">
          Como a IA responde quando o cliente resiste
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Objeções são resistências naturais do processo de venda. 
          A IA deve responder com <strong>empatia, argumento e redirecionamento</strong>.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {objecoes.map((objecao, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-2" />
              <div className="flex-1 space-y-3">
                <Input
                  value={objecao.objecao_gatilho}
                  onChange={(e) => handleUpdate(index, 'objecao_gatilho', e.target.value)}
                  placeholder="O que o cliente diz (ex: Está caro)"
                  className="font-medium"
                />
                
                <Textarea
                  value={objecao.resposta}
                  onChange={(e) => handleUpdate(index, 'resposta', e.target.value)}
                  placeholder="Resposta da IA..."
                  rows={3}
                />

                <Input
                  value={objecao.estrategia || ''}
                  onChange={(e) => handleUpdate(index, 'estrategia', e.target.value)}
                  placeholder="Estratégia (ex: Empatia → Argumento → Redirecionamento)"
                  className="text-sm text-muted-foreground"
                />
              </div>
              
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
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Objeção
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
