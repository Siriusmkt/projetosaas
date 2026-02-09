import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Save, Plus, Trash2, ChevronDown, Info, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptScript } from '@/types/prompt';

interface ScriptsSectionProps {
  data: PromptScript[];
  onSave: (data: Omit<PromptScript, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_SCRIPTS: Omit<PromptScript, 'id' | 'prompt_id'>[] = [
  {
    script_key: 'saida_imediata_1',
    contexto: 'Saída Imediata - Parte 1',
    conteudo: 'Perfeito, entendi! Nesse caso, para agilizar sua compra, o melhor é seguir direto com um atendente humano que já vai passar todas as informações de preço, condições e disponibilidade. Vou encerrar por aqui e o time continua com você em seguida. Tudo bem?',
    instrucao_uso: 'Quando identificar compra direta',
    ordem: 0,
  },
  {
    script_key: 'saida_imediata_2',
    contexto: 'Saída Imediata - Parte 2',
    conteudo: 'Obrigada pelo contato! Encerrando por aqui. Até breve!',
    instrucao_uso: 'Após cliente confirmar',
    ordem: 1,
  },
  {
    script_key: 'abertura',
    contexto: 'Abertura / Apresentação',
    conteudo: 'Perfeito, [Nome]! Eu vi aqui que você demonstrou interesse em conhecer nossos equipamentos de academia, está podendo falar uns minutinhos pra eu entender melhor o seu cenário e ver como podemos te ajudar? É bem rápido mesmo!',
    instrucao_uso: 'Início da conversa após confirmar nome',
    ordem: 2,
  },
  {
    script_key: 'cliente_nao_pode',
    contexto: 'Cliente Não Pode Falar',
    conteudo: 'Tranquilo! Quando seria um momento melhor para conversarmos? Assim eu retorno em um horário que funcione melhor para você',
    instrucao_uso: 'Quando cliente diz que não pode conversar agora',
    ordem: 3,
  },
  {
    script_key: 'encerramento_padrao',
    contexto: 'Encerramento Padrão',
    conteudo: 'Agradeço pela conversa, [Nome]! Encerrando por aqui. Até breve!',
    instrucao_uso: 'Final de conversa qualificada',
    ordem: 4,
  },
];

export function ScriptsSection({ data, onSave, isSaving }: ScriptsSectionProps) {
  const [scripts, setScripts] = useState<Omit<PromptScript, 'id' | 'prompt_id'>[]>([]);
  const [openScripts, setOpenScripts] = useState<string[]>(['saida_imediata_1', 'abertura']);
  const [isAdding, setIsAdding] = useState(false);
  const [newScript, setNewScript] = useState({ contexto: '', conteudo: '', instrucao_uso: '' });

  useEffect(() => {
    if (data.length > 0) {
      setScripts(data.map(s => ({
        script_key: s.script_key,
        contexto: s.contexto,
        conteudo: s.conteudo,
        instrucao_uso: s.instrucao_uso,
        ordem: s.ordem,
      })));
    } else {
      setScripts(DEFAULT_SCRIPTS);
    }
  }, [data]);

  const toggleScript = (key: string) => {
    setOpenScripts(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleUpdateScript = (key: string, field: 'conteudo' | 'instrucao_uso', value: string) => {
    setScripts(prev => prev.map(s => 
      s.script_key === key ? { ...s, [field]: value } : s
    ));
  };

  const handleAddScript = () => {
    if (!newScript.contexto.trim() || !newScript.conteudo.trim()) return;

    const key = `custom_${Date.now()}`;
    setScripts(prev => [...prev, {
      script_key: key,
      contexto: newScript.contexto.trim(),
      conteudo: newScript.conteudo.trim(),
      instrucao_uso: newScript.instrucao_uso.trim() || undefined,
      ordem: prev.length,
    }]);
    setNewScript({ contexto: '', conteudo: '', instrucao_uso: '' });
    setIsAdding(false);
    setOpenScripts(prev => [...prev, key]);
  };

  const handleRemoveScript = (key: string) => {
    setScripts(prev => prev.filter(s => s.script_key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(scripts);
  };

  const isDefaultScript = (key: string) => DEFAULT_SCRIPTS.some(s => s.script_key === key);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Frases Obrigatórias</h2>
        <p className="text-sm text-muted-foreground">
          Scripts que a IA DEVE usar em situações específicas
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estas frases são usadas exatamente como escritas. Use <code className="bg-muted px-1 rounded">[Nome]</code> como placeholder 
          para o nome do cliente.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {scripts.map((script) => (
          <Collapsible
            key={script.script_key}
            open={openScripts.includes(script.script_key)}
            onOpenChange={() => toggleScript(script.script_key)}
          >
            <div className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                <MessageSquare className="w-4 h-4 text-primary" />
                <div className="flex-1 text-left">
                  <h4 className="font-medium">{script.contexto}</h4>
                  {script.instrucao_uso && (
                    <p className="text-xs text-muted-foreground">{script.instrucao_uso}</p>
                  )}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  openScripts.includes(script.script_key) && "rotate-180"
                )} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="p-4 pt-0 space-y-3 border-t">
                  <Textarea
                    value={script.conteudo}
                    onChange={(e) => handleUpdateScript(script.script_key, 'conteudo', e.target.value)}
                    rows={4}
                    placeholder="Conteúdo do script..."
                  />
                  <Input
                    value={script.instrucao_uso || ''}
                    onChange={(e) => handleUpdateScript(script.script_key, 'instrucao_uso', e.target.value)}
                    placeholder="Quando usar este script..."
                  />
                  {!isDefaultScript(script.script_key) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleRemoveScript(script.script_key)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover Script
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      {isAdding ? (
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium">Novo Script</h4>
          <Input
            placeholder="Nome do script (ex: Agradecimento especial)"
            value={newScript.contexto}
            onChange={(e) => setNewScript(prev => ({ ...prev, contexto: e.target.value }))}
          />
          <Textarea
            placeholder="Conteúdo do script..."
            value={newScript.conteudo}
            onChange={(e) => setNewScript(prev => ({ ...prev, conteudo: e.target.value }))}
            rows={3}
          />
          <Input
            placeholder="Quando usar (opcional)"
            value={newScript.instrucao_uso}
            onChange={(e) => setNewScript(prev => ({ ...prev, instrucao_uso: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddScript}
              disabled={!newScript.contexto.trim() || !newScript.conteudo.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAdding(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Script Personalizado
        </Button>
      )}

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
