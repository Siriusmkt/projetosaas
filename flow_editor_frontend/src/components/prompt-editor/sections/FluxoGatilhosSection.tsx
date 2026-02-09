import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, Save, Plus, Trash2, ChevronDown, Info, 
  Zap, ArrowRight, CornerDownRight, Globe, Layers,
  PhoneOff, MessageSquare, X, Route, GitBranch, Shuffle,
  Edit2, Check, GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptGatilho, PromptFluxoQualificacao } from '@/types/prompt';

interface FluxoGatilhosSectionProps {
  gatilhos: PromptGatilho[];
  fluxo: PromptFluxoQualificacao[];
  onSaveGatilhos: (data: Omit<PromptGatilho, 'id' | 'prompt_id'>[]) => Promise<void>;
  onSaveFluxo: (data: Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

// Cores para os caminhos - usando variações de cores semânticas
const PATH_COLORS = [
  { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30', dot: 'bg-primary' },
  { bg: 'bg-secondary/40', text: 'text-secondary-foreground', border: 'border-secondary/50', dot: 'bg-secondary-foreground' },
  { bg: 'bg-accent/30', text: 'text-accent-foreground', border: 'border-accent/40', dot: 'bg-accent-foreground' },
  { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/30', dot: 'bg-muted-foreground' },
  { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30', dot: 'bg-destructive' },
  { bg: 'bg-primary/10', text: 'text-primary/80', border: 'border-primary/20', dot: 'bg-primary/80' },
  { bg: 'bg-secondary/20', text: 'text-secondary-foreground/80', border: 'border-secondary/30', dot: 'bg-secondary-foreground/80' },
  { bg: 'bg-accent/20', text: 'text-accent-foreground/80', border: 'border-accent/30', dot: 'bg-accent-foreground/80' },
];

// Tipos
interface Caminho {
  id: string;
  nome: string;
  descricao: string;
  cor: number; // índice de PATH_COLORS
  acaoFinal: 'transferir' | 'encerrar' | 'continuar' | 'loop';
}

interface Gatilho {
  id: string;
  frase: string;
  escopo: 'global' | string; // 'global' ou id da etapa
  destino: {
    tipo: 'caminho' | 'etapa' | 'encerrar';
    id?: string; // id do caminho ou etapa
  };
}

interface Etapa {
  id: string;
  numero: number;
  nome: string;
  pergunta: string;
  instrucoes?: string;
  caminhoId: string; // qual caminho essa etapa pertence
}

export function FluxoGatilhosSection({ 
  gatilhos: gatilhosData, 
  fluxo: fluxoData, 
  onSaveGatilhos, 
  onSaveFluxo, 
  isSaving 
}: FluxoGatilhosSectionProps) {
  // Estados principais
  const [caminhos, setCaminhos] = useState<Caminho[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [gatilhos, setGatilhos] = useState<Gatilho[]>([]);
  
  // UI states
  const [expandedCaminhos, setExpandedCaminhos] = useState<string[]>([]);
  const [expandedGatilhos, setExpandedGatilhos] = useState(true);
  const [editingCaminho, setEditingCaminho] = useState<string | null>(null);
  const [newGatilhoFrase, setNewGatilhoFrase] = useState('');
  const [newCaminhoNome, setNewCaminhoNome] = useState('');

  // Inicializar com dados padrão
  useEffect(() => {
    if (caminhos.length === 0) {
      const defaultCaminhos: Caminho[] = [
        { id: 'consultivo', nome: 'Consultivo', descricao: 'Fluxo completo de qualificação', cor: 0, acaoFinal: 'transferir' },
        { id: 'saida-rapida', nome: 'Saída Rápida', descricao: 'Cliente quer comprar direto', cor: 4, acaoFinal: 'transferir' },
      ];
      setCaminhos(defaultCaminhos);
      setExpandedCaminhos(['consultivo']);
      
      // Etapas padrão no caminho consultivo
      const defaultEtapas: Etapa[] = [
        { id: 'e1', numero: 1, nome: 'Abertura', pergunta: 'O que te despertou o interesse?', caminhoId: 'consultivo' },
        { id: 'e2', numero: 2, nome: 'Perfil', pergunta: 'Que tipo de público você atende?', caminhoId: 'consultivo' },
        { id: 'e3', numero: 3, nome: 'Dores', pergunta: 'Qual sua maior preocupação?', caminhoId: 'consultivo' },
        { id: 'e4', numero: 4, nome: 'Decisão', pergunta: 'Você é quem toma a decisão?', caminhoId: 'consultivo' },
        { id: 'e5', numero: 5, nome: 'Reunião', pergunta: 'Faz sentido marcar uma conversa?', caminhoId: 'consultivo' },
      ];
      setEtapas(defaultEtapas);
      
      // Gatilhos padrão
      const defaultGatilhos: Gatilho[] = [
        { id: 'g1', frase: 'quero comprar agora', escopo: 'global', destino: { tipo: 'caminho', id: 'saida-rapida' } },
        { id: 'g2', frase: 'quanto custa', escopo: 'global', destino: { tipo: 'caminho', id: 'saida-rapida' } },
        { id: 'g3', frase: 'não tenho interesse', escopo: 'global', destino: { tipo: 'encerrar' } },
      ];
      setGatilhos(defaultGatilhos);
    }
  }, []);

  // Carregar dados do banco
  useEffect(() => {
    if (fluxoData.length > 0 || gatilhosData.length > 0) {
      // Reconstruir estrutura a partir dos dados salvos
      const caminhosSet = new Map<string, Caminho>();
      const etapasLocal: Etapa[] = [];
      
      fluxoData.forEach((f, i) => {
        const caminhoId = f.contexto_gatilho || 'consultivo';
        
        if (!caminhosSet.has(caminhoId)) {
          caminhosSet.set(caminhoId, {
            id: caminhoId,
            nome: caminhoId === 'consultivo' ? 'Consultivo' : caminhoId,
            descricao: '',
            cor: caminhosSet.size % PATH_COLORS.length,
            acaoFinal: 'transferir',
          });
        }
        
        etapasLocal.push({
          id: f.id || `e${i}`,
          numero: f.etapa_numero,
          nome: f.etapa_nome,
          pergunta: f.pergunta,
          instrucoes: f.instrucoes_adicionais || undefined,
          caminhoId,
        });
      });
      
      if (caminhosSet.size > 0) {
        setCaminhos(Array.from(caminhosSet.values()));
        setEtapas(etapasLocal);
        setExpandedCaminhos([Array.from(caminhosSet.keys())[0]]);
      }
      
      // Gatilhos
      const gatilhosLocal: Gatilho[] = gatilhosData.map((g, i) => ({
        id: g.id || `g${i}`,
        frase: g.frase_gatilho.replace(/^\[ETAPA \d+\] /, ''),
        escopo: g.tipo === 'global' ? 'global' : 'global',
        destino: g.acao === 'encerrar_transferir' 
          ? { tipo: 'encerrar' as const }
          : { tipo: 'caminho' as const, id: 'consultivo' },
      }));
      
      if (gatilhosLocal.length > 0) {
        setGatilhos(gatilhosLocal);
      }
    }
  }, [gatilhosData, fluxoData]);

  // Handlers de Caminhos
  const handleAddCaminho = () => {
    if (!newCaminhoNome.trim()) return;
    
    const newCaminho: Caminho = {
      id: `caminho-${Date.now()}`,
      nome: newCaminhoNome.trim(),
      descricao: '',
      cor: caminhos.length % PATH_COLORS.length,
      acaoFinal: 'transferir',
    };
    
    setCaminhos(prev => [...prev, newCaminho]);
    setExpandedCaminhos(prev => [...prev, newCaminho.id]);
    setNewCaminhoNome('');
  };

  const handleUpdateCaminho = (id: string, updates: Partial<Caminho>) => {
    setCaminhos(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleRemoveCaminho = (id: string) => {
    setCaminhos(prev => prev.filter(c => c.id !== id));
    setEtapas(prev => prev.filter(e => e.caminhoId !== id));
    setGatilhos(prev => prev.filter(g => !(g.destino.tipo === 'caminho' && g.destino.id === id)));
  };

  // Handlers de Etapas
  const handleAddEtapa = (caminhoId: string) => {
    const etapasDoCaminho = etapas.filter(e => e.caminhoId === caminhoId);
    const novoNumero = etapasDoCaminho.length > 0 
      ? Math.max(...etapasDoCaminho.map(e => e.numero)) + 1 
      : 1;
    
    const newEtapa: Etapa = {
      id: `e-${Date.now()}`,
      numero: novoNumero,
      nome: '',
      pergunta: '',
      caminhoId,
    };
    
    setEtapas(prev => [...prev, newEtapa]);
  };

  const handleUpdateEtapa = (id: string, updates: Partial<Etapa>) => {
    setEtapas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleRemoveEtapa = (id: string) => {
    setEtapas(prev => {
      const etapa = prev.find(e => e.id === id);
      if (!etapa) return prev;
      
      const filtered = prev.filter(e => e.id !== id);
      // Renumerar etapas do mesmo caminho
      return filtered.map(e => {
        if (e.caminhoId === etapa.caminhoId && e.numero > etapa.numero) {
          return { ...e, numero: e.numero - 1 };
        }
        return e;
      });
    });
    
    // Remover gatilhos que apontam para essa etapa
    setGatilhos(prev => prev.filter(g => !(g.destino.tipo === 'etapa' && g.destino.id === id)));
  };

  // Handlers de Gatilhos
  const handleAddGatilho = () => {
    if (!newGatilhoFrase.trim()) return;
    
    const newGatilho: Gatilho = {
      id: `g-${Date.now()}`,
      frase: newGatilhoFrase.trim(),
      escopo: 'global',
      destino: { tipo: 'caminho', id: caminhos[0]?.id || 'consultivo' },
    };
    
    setGatilhos(prev => [...prev, newGatilho]);
    setNewGatilhoFrase('');
  };

  const handleUpdateGatilho = (id: string, updates: Partial<Gatilho>) => {
    setGatilhos(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const handleRemoveGatilho = (id: string) => {
    setGatilhos(prev => prev.filter(g => g.id !== id));
  };

  const toggleCaminho = (id: string) => {
    setExpandedCaminhos(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Salvar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter para formato do banco
    const fluxoToSave: Omit<PromptFluxoQualificacao, 'id' | 'prompt_id'>[] = etapas
      .filter(e => e.nome && e.pergunta)
      .map((e, i) => ({
        etapa_numero: e.numero,
        etapa_nome: e.nome,
        pergunta: e.pergunta,
        instrucoes_adicionais: e.instrucoes || null,
        contexto_gatilho: e.caminhoId,
        ordem: i,
      }));

    const gatilhosToSave: Omit<PromptGatilho, 'id' | 'prompt_id'>[] = gatilhos.map((g, i) => {
      let acao = 'seguir_fluxo';
      if (g.destino.tipo === 'encerrar') acao = 'encerrar_transferir';
      else if (g.destino.tipo === 'caminho') acao = `ir_para:${g.destino.id}`;
      else if (g.destino.tipo === 'etapa') acao = `ir_para_etapa:${g.destino.id}`;
      
      return {
        tipo: g.escopo === 'global' ? 'global' : 'etapa',
        frase_gatilho: g.frase,
        acao,
        ordem: i,
      };
    });

    await Promise.all([
      onSaveFluxo(fluxoToSave),
      onSaveGatilhos(gatilhosToSave),
    ]);
  };

  // Render destino selector
  const renderDestinoSelector = (gatilho: Gatilho) => {
    const buildValue = () => {
      if (gatilho.destino.tipo === 'encerrar') return 'encerrar';
      return `${gatilho.destino.tipo}:${gatilho.destino.id}`;
    };
    
    return (
      <Select
        value={buildValue()}
        onValueChange={(value) => {
          if (value === 'encerrar') {
            handleUpdateGatilho(gatilho.id, { destino: { tipo: 'encerrar' } });
          } else {
            const [tipo, id] = value.split(':');
            handleUpdateGatilho(gatilho.id, { 
              destino: { tipo: tipo as 'caminho' | 'etapa', id } 
            });
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Escolha destino..." />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Caminhos</div>
          {caminhos.map(c => {
            const cor = PATH_COLORS[c.cor];
            return (
              <SelectItem key={c.id} value={`caminho:${c.id}`}>
                <span className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", cor.dot)} />
                  <Route className="w-3 h-3" />
                  {c.nome}
                </span>
              </SelectItem>
            );
          })}
          
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Etapas específicas</div>
          {etapas.map(e => {
            const caminho = caminhos.find(c => c.id === e.caminhoId);
            const cor = caminho ? PATH_COLORS[caminho.cor] : PATH_COLORS[0];
            return (
              <SelectItem key={e.id} value={`etapa:${e.id}`}>
                <span className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", cor.dot)} />
                  <span className="text-muted-foreground">#{e.numero}</span>
                  {e.nome || 'Sem nome'}
                </span>
              </SelectItem>
            );
          })}
          
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Ações</div>
          <SelectItem value="encerrar">
            <span className="flex items-center gap-2 text-destructive">
              <PhoneOff className="w-3 h-3" />
              Encerrar conversa
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  };

  // Render cor selecionável
  const renderCorSelector = (caminho: Caminho) => (
    <div className="flex gap-1.5 flex-wrap">
      {PATH_COLORS.map((cor, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleUpdateCaminho(caminho.id, { cor: i })}
          className={cn(
            "w-5 h-5 rounded-full transition-all",
            cor.dot,
            caminho.cor === i && "ring-2 ring-offset-2 ring-primary"
          )}
        />
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          Fluxo e Gatilhos
        </h2>
        <p className="text-sm text-muted-foreground">
          Crie caminhos de conversa e defina gatilhos para redirecionar entre eles
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Sistema de caminhos:</strong> Cada caminho representa uma rota de conversa diferente. 
          Gatilhos redirecionam o cliente entre caminhos ou para etapas específicas. 
          Você pode criar quantos caminhos precisar!
        </AlertDescription>
      </Alert>

      {/* Seção de Gatilhos */}
      <Collapsible open={expandedGatilhos} onOpenChange={setExpandedGatilhos}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg hover:bg-accent/70 transition-colors border border-border">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold">Gatilhos de Redirecionamento</h3>
              <p className="text-xs text-muted-foreground">
                Frases que mudam o rumo da conversa
              </p>
            </div>
            <Badge variant="secondary">
              {gatilhos.length}
            </Badge>
            <ChevronDown className={cn(
              "w-5 h-5 transition-transform text-muted-foreground",
              expandedGatilhos && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-3 p-4 border rounded-lg space-y-3">
            {gatilhos.map((gatilho) => (
              <div 
                key={gatilho.id}
                className="flex items-center gap-2 p-3 bg-background rounded-lg border group hover:border-primary/30 transition-colors"
              >
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm flex-1 font-medium">"{gatilho.frase}"</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                {renderDestinoSelector(gatilho)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleRemoveGatilho(gatilho.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            
            <div className="flex gap-2 pt-2">
              <Input
                placeholder='Se o cliente disser... (ex: "quero comprar agora")'
                value={newGatilhoFrase}
                onChange={(e) => setNewGatilhoFrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGatilho())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddGatilho}
                disabled={!newGatilhoFrase.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Seção de Caminhos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Caminhos de Conversa</h3>
          </div>
        </div>

        <div className="space-y-3">
          {caminhos.map((caminho) => {
            const cor = PATH_COLORS[caminho.cor];
            const etapasDoCaminho = etapas.filter(e => e.caminhoId === caminho.id);
            const isExpanded = expandedCaminhos.includes(caminho.id);
            const isEditing = editingCaminho === caminho.id;
            
            return (
              <Collapsible
                key={caminho.id}
                open={isExpanded}
                onOpenChange={() => toggleCaminho(caminho.id)}
              >
                <div className={cn("border rounded-xl overflow-hidden transition-colors", cor.border)}>
                  <CollapsibleTrigger className="w-full">
                    <div className={cn("flex items-center gap-3 p-4 transition-colors", cor.bg, "hover:opacity-90")}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cor.bg)}>
                        <Route className={cn("w-5 h-5", cor.text)} />
                      </div>
                      <div className="flex-1 text-left">
                        {isEditing ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Input
                              value={caminho.nome}
                              onChange={(e) => handleUpdateCaminho(caminho.id, { nome: e.target.value })}
                              className="h-7 text-sm font-semibold"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingCaminho(null)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className={cn("font-semibold", cor.text)}>{caminho.nome}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); setEditingCaminho(caminho.id); }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {etapasDoCaminho.length} etapas
                        </p>
                      </div>
                      <Badge variant="outline" className={cn(cor.border, cor.text)}>
                        {caminho.acaoFinal === 'transferir' ? 'Transferir' : 
                         caminho.acaoFinal === 'encerrar' ? 'Encerrar' : 
                         caminho.acaoFinal === 'loop' ? 'Loop' : 'Continuar'}
                      </Badge>
                      <ChevronDown className={cn(
                        "w-5 h-5 transition-transform",
                        cor.text,
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="p-4 pt-0 space-y-4 border-t">
                      {/* Configurações do caminho */}
                      <div className="flex items-center gap-4 py-3">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Cor do caminho</label>
                          {renderCorSelector(caminho)}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Ao final deste caminho</label>
                          <Select
                            value={caminho.acaoFinal}
                            onValueChange={(v) => handleUpdateCaminho(caminho.id, { acaoFinal: v as Caminho['acaoFinal'] })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transferir">Transferir para vendedor</SelectItem>
                              <SelectItem value="encerrar">Encerrar conversa</SelectItem>
                              <SelectItem value="continuar">Continuar outro caminho</SelectItem>
                              <SelectItem value="loop">Voltar ao início</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {caminhos.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveCaminho(caminho.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Excluir
                          </Button>
                        )}
                      </div>
                      
                      {/* Etapas do caminho */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Etapas deste caminho
                          </h5>
                        </div>
                        
                        {etapasDoCaminho.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p className="text-sm">Nenhuma etapa ainda</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => handleAddEtapa(caminho.id)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Criar primeira etapa
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {etapasDoCaminho
                              .sort((a, b) => a.numero - b.numero)
                              .map((etapa, index) => (
                              <div 
                                key={etapa.id}
                                className="flex gap-3 p-3 bg-muted/30 rounded-lg border group"
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                  cor.bg, cor.text
                                )}>
                                  {etapa.numero}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={etapa.nome}
                                    onChange={(e) => handleUpdateEtapa(etapa.id, { nome: e.target.value })}
                                    placeholder="Nome da etapa (ex: Qualificação)"
                                    className="h-8 font-medium"
                                  />
                                  <Textarea
                                    value={etapa.pergunta}
                                    onChange={(e) => handleUpdateEtapa(etapa.id, { pergunta: e.target.value })}
                                    placeholder="O que a IA deve perguntar nesta etapa?"
                                    className="min-h-[60px] resize-none text-sm"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  onClick={() => handleRemoveEtapa(etapa.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddEtapa(caminho.id)}
                          className="w-full mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar etapa
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {/* Adicionar novo caminho */}
        <div className="flex gap-2 p-3 border-2 border-dashed rounded-xl bg-muted/20">
          <Input
            placeholder="Nome do novo caminho (ex: Reativação, Follow-up...)"
            value={newCaminhoNome}
            onChange={(e) => setNewCaminhoNome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCaminho())}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCaminho}
            disabled={!newCaminhoNome.trim()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Criar caminho
          </Button>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Fluxo
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
