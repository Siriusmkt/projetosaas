import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Plus, Trash2, Zap, GitBranch, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptGatilho } from '@/types/prompt';

interface GatilhosSectionProps {
  data: PromptGatilho[];
  onSave: (data: Omit<PromptGatilho, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_GATILHOS_CONSULTIVO = [
  'quero montar academia',
  'quero renovar equipamentos',
  'preciso entender opções',
  'estou planejando um projeto',
  'quero conhecer melhor',
];

const DEFAULT_GATILHOS_SAIDA = [
  'quero comprar um aparelho',
  'vi no Instagram um equipamento',
  'quanto custa o',
  'qual o preço',
  'pode me passar orçamento',
];

export function GatilhosSection({ data, onSave, isSaving }: GatilhosSectionProps) {
  const [gatilhos, setGatilhos] = useState<Omit<PromptGatilho, 'id' | 'prompt_id'>[]>([]);
  const [newConsultivo, setNewConsultivo] = useState('');
  const [newSaida, setNewSaida] = useState('');

  useEffect(() => {
    if (data.length > 0) {
      setGatilhos(data.map(g => ({
        tipo: g.tipo,
        frase_gatilho: g.frase_gatilho,
        acao: g.acao,
        ordem: g.ordem,
      })));
    } else {
      // Inicializar com padrões
      const defaults: Omit<PromptGatilho, 'id' | 'prompt_id'>[] = [
        ...DEFAULT_GATILHOS_CONSULTIVO.map((frase, i) => ({
          tipo: 'consultivo' as const,
          frase_gatilho: frase,
          acao: 'seguir_fluxo' as const,
          ordem: i,
        })),
        ...DEFAULT_GATILHOS_SAIDA.map((frase, i) => ({
          tipo: 'saida_rapida' as const,
          frase_gatilho: frase,
          acao: 'encerrar_transferir' as const,
          ordem: i + DEFAULT_GATILHOS_CONSULTIVO.length,
        })),
      ];
      setGatilhos(defaults);
    }
  }, [data]);

  const consultivos = gatilhos.filter(g => g.tipo === 'consultivo');
  const saidas = gatilhos.filter(g => g.tipo === 'saida_rapida');

  const handleAdd = (tipo: 'consultivo' | 'saida_rapida') => {
    const frase = tipo === 'consultivo' ? newConsultivo : newSaida;
    if (!frase.trim()) return;

    setGatilhos(prev => [...prev, {
      tipo,
      frase_gatilho: frase.trim(),
      acao: tipo === 'consultivo' ? 'seguir_fluxo' : 'encerrar_transferir',
      ordem: prev.length,
    }]);

    if (tipo === 'consultivo') {
      setNewConsultivo('');
    } else {
      setNewSaida('');
    }
  };

  const handleRemove = (frase: string) => {
    setGatilhos(prev => prev.filter(g => g.frase_gatilho !== frase));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(gatilhos);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Gatilhos de Contexto</h2>
        <p className="text-sm text-muted-foreground">
          Frases que determinam qual fluxo a IA deve seguir
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Estes gatilhos são <strong>CRÍTICOS</strong>. Eles determinam se a IA vai qualificar o lead 
          ou encerrar e transferir rapidamente.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-8">
        {/* Coluna Consultivo */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <GitBranch className="w-5 h-5" />
            <h3 className="font-semibold">Fluxo Consultivo</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Quando o cliente diz algo assim, a IA segue o fluxo completo de qualificação
          </p>
          
          <div className="space-y-2">
            {consultivos.map((g) => (
              <div
                key={g.frase_gatilho}
                className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg group"
              >
                <span className="flex-1 text-sm">"{g.frase_gatilho}"</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(g.frase_gatilho)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar frase gatilho..."
              value={newConsultivo}
              onChange={(e) => setNewConsultivo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd('consultivo'))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAdd('consultivo')}
              disabled={!newConsultivo.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Coluna Saída Rápida */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <Zap className="w-5 h-5" />
            <h3 className="font-semibold">Saída Rápida</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Quando o cliente diz algo assim, a IA encerra e transfere IMEDIATAMENTE
          </p>
          
          <div className="space-y-2">
            {saidas.map((g) => (
              <div
                key={g.frase_gatilho}
                className="flex items-center gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded-lg group"
              >
                <span className="flex-1 text-sm">"{g.frase_gatilho}"</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(g.frase_gatilho)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Adicionar frase gatilho..."
              value={newSaida}
              onChange={(e) => setNewSaida(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd('saida_rapida'))}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAdd('saida_rapida')}
              disabled={!newSaida.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
