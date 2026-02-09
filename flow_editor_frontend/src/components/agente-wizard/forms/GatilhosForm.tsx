import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Zap, ArrowRightLeft } from 'lucide-react';
import { AgenteGatilho } from '@/types/agente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GatilhosFormProps {
  data: AgenteGatilho[];
  onChange: (data: AgenteGatilho[]) => void;
}

export function GatilhosForm({ data, onChange }: GatilhosFormProps) {
  const [novaFrase, setNovaFrase] = useState('');
  const [novaAcao, setNovaAcao] = useState('');
  const [tipoAtivo, setTipoAtivo] = useState<'consultivo' | 'saida_rapida'>('consultivo');

  const consultivos = data.filter(g => g.tipo === 'consultivo');
  const saidaRapida = data.filter(g => g.tipo === 'saida_rapida');

  const addGatilho = () => {
    if (!novaFrase.trim() || !novaAcao.trim()) return;
    const novoGatilho: AgenteGatilho = {
      id: `temp_${Date.now()}`,
      agente_id: '',
      tipo: tipoAtivo,
      frase_gatilho: novaFrase.trim(),
      acao: novaAcao.trim(),
      ordem: data.filter(g => g.tipo === tipoAtivo).length,
    };
    onChange([...data, novoGatilho]);
    setNovaFrase('');
    setNovaAcao('');
  };

  const removeGatilho = (id: string) => {
    onChange(data.filter(g => g.id !== id));
  };

  const renderLista = (gatilhos: AgenteGatilho[], tipo: 'consultivo' | 'saida_rapida') => (
    <div className="space-y-3">
      {gatilhos.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4 text-center">
          Nenhum gatilho cadastrado
        </p>
      ) : (
        gatilhos.map((g) => (
          <div key={g.id} className="p-3 rounded-lg border bg-card">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">"{g.frase_gatilho}"</p>
                <p className="text-xs text-muted-foreground mt-1">→ {g.acao}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeGatilho(g.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))
      )}

      {/* Form para adicionar */}
      <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-3">
        <div>
          <Label className="text-xs">Quando o lead disser:</Label>
          <Input
            value={novaFrase}
            onChange={(e) => setNovaFrase(e.target.value)}
            placeholder="Ex: quero comprar agora, já sei o que quero..."
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Ação do agente:</Label>
          <Textarea
            value={novaAcao}
            onChange={(e) => setNovaAcao(e.target.value)}
            placeholder={tipo === 'consultivo' 
              ? "Ex: Continuar com qualificação consultiva" 
              : "Ex: Transferir imediatamente para atendente"
            }
            className="mt-1 min-h-[60px]"
          />
        </div>
        <Button 
          onClick={addGatilho} 
          disabled={!novaFrase.trim() || !novaAcao.trim()}
          className="w-full"
          variant="secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Gatilho
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={tipoAtivo} onValueChange={(v) => setTipoAtivo(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultivo" className="gap-2">
            <Zap className="w-4 h-4" />
            Consultivo ({consultivos.length})
          </TabsTrigger>
          <TabsTrigger value="saida_rapida" className="gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Saída Rápida ({saidaRapida.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consultivo" className="mt-4">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
            <p className="text-xs text-muted-foreground">
              <strong>Gatilhos Consultivos:</strong> Frases que indicam que o lead quer 
              seguir o fluxo de qualificação completo (orçamento de projeto, consultoria, etc.)
            </p>
          </div>
          {renderLista(consultivos, 'consultivo')}
        </TabsContent>

        <TabsContent value="saida_rapida" className="mt-4">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-4">
            <p className="text-xs text-muted-foreground">
              <strong>Gatilhos de Saída Rápida:</strong> Frases que indicam que o lead 
              quer comprar rapidamente e deve ser transferido para humano imediatamente.
            </p>
          </div>
          {renderLista(saidaRapida, 'saida_rapida')}
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Mínimo necessário:</span>
        <Badge variant={consultivos.length >= 3 ? 'default' : 'secondary'}>
          {consultivos.length}/3 consultivos
        </Badge>
        <Badge variant={saidaRapida.length >= 3 ? 'default' : 'secondary'}>
          {saidaRapida.length}/3 saída rápida
        </Badge>
      </div>
    </div>
  );
}