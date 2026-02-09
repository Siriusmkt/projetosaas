import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MessageCircle, AlertTriangle } from 'lucide-react';
import { AgenteFAQ, AgenteObjecao, DEFAULT_FAQ_TOPICS, DEFAULT_OBJECOES } from '@/types/agente';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RespostasFormProps {
  faq: AgenteFAQ[];
  objecoes: AgenteObjecao[];
  onChangeFaq: (data: AgenteFAQ[]) => void;
  onChangeObjecoes: (data: AgenteObjecao[]) => void;
}

export function RespostasForm({ faq, objecoes, onChangeFaq, onChangeObjecoes }: RespostasFormProps) {
  const [novoTopico, setNovoTopico] = useState('');
  const [novaResposta, setNovaResposta] = useState('');
  const [novaObjecao, setNovaObjecao] = useState('');
  const [respostaObjecao, setRespostaObjecao] = useState('');
  const [activeTab, setActiveTab] = useState('faq');

  const addFaq = () => {
    if (!novoTopico.trim() || !novaResposta.trim()) return;
    const novo: AgenteFAQ = {
      id: `temp_${Date.now()}`,
      agente_id: '',
      topico: novoTopico.trim(),
      palavras_chave: [],
      resposta: novaResposta.trim(),
      ordem: faq.length,
    };
    onChangeFaq([...faq, novo]);
    setNovoTopico('');
    setNovaResposta('');
  };

  const addObjecao = () => {
    if (!novaObjecao.trim() || !respostaObjecao.trim()) return;
    const novo: AgenteObjecao = {
      id: `temp_${Date.now()}`,
      agente_id: '',
      objecao_gatilho: novaObjecao.trim(),
      resposta: respostaObjecao.trim(),
      ordem: objecoes.length,
    };
    onChangeObjecoes([...objecoes, novo]);
    setNovaObjecao('');
    setRespostaObjecao('');
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            FAQ ({faq.length})
          </TabsTrigger>
          <TabsTrigger value="objecoes" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Objeções ({objecoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-4 space-y-4">
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>FAQ:</strong> Perguntas frequentes que o agente deve saber responder.
            </p>
          </div>

          {/* Lista de FAQs */}
          <div className="space-y-2">
            {faq.map((f) => (
              <div key={f.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{f.topico}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.resposta}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onChangeFaq(faq.filter(x => x.id !== f.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Sugestões */}
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_FAQ_TOPICS.filter(t => !faq.some(f => f.topico === t.topico)).slice(0, 4).map((t) => (
              <Badge 
                key={t.topico}
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setNovoTopico(t.topico)}
              >
                + {t.topico}
              </Badge>
            ))}
          </div>

          {/* Form */}
          <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-3">
            <div>
              <Label className="text-xs">Tópico/Pergunta:</Label>
              <Input
                value={novoTopico}
                onChange={(e) => setNovoTopico(e.target.value)}
                placeholder="Ex: Preço/Valor, Frete/Entrega..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Resposta do Agente:</Label>
              <Textarea
                value={novaResposta}
                onChange={(e) => setNovaResposta(e.target.value)}
                placeholder="Como o agente deve responder..."
                className="mt-1"
              />
            </div>
            <Button onClick={addFaq} disabled={!novoTopico.trim() || !novaResposta.trim()} className="w-full" variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar FAQ
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="objecoes" className="mt-4 space-y-4">
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <p className="text-xs text-muted-foreground">
              <strong>Objeções:</strong> Como o agente deve responder quando o lead apresentar resistência.
            </p>
          </div>

          {/* Lista de objeções */}
          <div className="space-y-2">
            {objecoes.map((o) => (
              <div key={o.id} className="p-3 rounded-lg border bg-card">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">"{o.objecao_gatilho}"</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">→ {o.resposta}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onChangeObjecoes(objecoes.filter(x => x.id !== o.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Sugestões */}
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_OBJECOES.filter(o => !objecoes.some(ob => ob.objecao_gatilho === o.objecao)).slice(0, 4).map((o) => (
              <Badge 
                key={o.objecao}
                variant="outline" 
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setNovaObjecao(o.objecao)}
              >
                + {o.objecao}
              </Badge>
            ))}
          </div>

          {/* Form */}
          <div className="p-4 rounded-lg border-2 border-dashed bg-muted/30 space-y-3">
            <div>
              <Label className="text-xs">Objeção do Lead:</Label>
              <Input
                value={novaObjecao}
                onChange={(e) => setNovaObjecao(e.target.value)}
                placeholder="Ex: Está caro, Vou pensar..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Resposta do Agente:</Label>
              <Textarea
                value={respostaObjecao}
                onChange={(e) => setRespostaObjecao(e.target.value)}
                placeholder="Como contornar essa objeção..."
                className="mt-1"
              />
            </div>
            <Button onClick={addObjecao} disabled={!novaObjecao.trim() || !respostaObjecao.trim()} className="w-full" variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Objeção
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Mínimo necessário:</span>
        <Badge variant={faq.length >= 3 ? 'default' : 'secondary'}>{faq.length}/3 FAQs</Badge>
        <Badge variant={objecoes.length >= 3 ? 'default' : 'secondary'}>{objecoes.length}/3 objeções</Badge>
      </div>
    </div>
  );
}