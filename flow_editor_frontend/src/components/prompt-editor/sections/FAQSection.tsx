import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Plus, Trash2, X, Search, HelpCircle } from 'lucide-react';
import type { PromptFAQ } from '@/types/prompt';

interface FAQSectionProps {
  data: PromptFAQ[];
  onSave: (data: Omit<PromptFAQ, 'id' | 'prompt_id'>[]) => Promise<void>;
  isSaving: boolean;
}

const DEFAULT_FAQ: Omit<PromptFAQ, 'id' | 'prompt_id'>[] = [
  {
    topico: 'Preço / Valor',
    palavras_chave: ['preço', 'valor', 'quanto custa', 'orçamento'],
    resposta: 'Os valores variam conforme o projeto específico, quantidade, personalização... O time técnico consegue passar uma proposta precisa depois de entender os detalhes. Faz sentido?',
    ordem: 0,
  },
  {
    topico: 'Instagram / Catálogo',
    palavras_chave: ['instagram', 'foto', 'catálogo', 'ver'],
    resposta: 'Você pode encontrar nosso conteúdo no Instagram buscando por [Empresa]. Lá temos fotos, vídeos dos equipamentos em uso, cases de clientes...',
    ordem: 1,
  },
  {
    topico: 'Pagamento / Parcelamento',
    palavras_chave: ['parcela', 'pagamento', 'cartão', 'boleto'],
    resposta: 'Trabalhamos com diversas formas de pagamento e parcelamento. As condições específicas o time comercial passa depois de fechar a proposta completa.',
    ordem: 2,
  },
  {
    topico: 'Frete / Entrega',
    palavras_chave: ['frete', 'entrega', 'envio', 'transporte'],
    resposta: 'O frete varia conforme a região e o volume da carga. O time consegue simular certinho quando estiver fechando a proposta.',
    ordem: 3,
  },
  {
    topico: 'Suporte / Garantia',
    palavras_chave: ['garantia', 'suporte', 'assistência', 'defeito'],
    resposta: 'Somos fabricante próprio, então o suporte vem direto da gente. Temos garantia completa e canal de atendimento pós-venda.',
    ordem: 4,
  },
  {
    topico: 'Falar com Vendedor',
    palavras_chave: ['vendedor', 'humano', 'pessoa', 'atendente'],
    resposta: 'Claro! O time humano vai continuar o atendimento agora. Vou encerrar por aqui. Obrigada pelo contato! Até breve!',
    ordem: 5,
  },
];

export function FAQSection({ data, onSave, isSaving }: FAQSectionProps) {
  const [faqs, setFaqs] = useState<Omit<PromptFAQ, 'id' | 'prompt_id'>[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newKeyword, setNewKeyword] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (data.length > 0) {
      setFaqs(data.map(f => ({
        topico: f.topico,
        palavras_chave: f.palavras_chave,
        resposta: f.resposta,
        ordem: f.ordem,
      })));
    } else {
      setFaqs(DEFAULT_FAQ);
    }
  }, [data]);

  const filteredFaqs = faqs.filter(f => 
    f.topico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.palavras_chave.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUpdate = (index: number, field: 'topico' | 'resposta', value: string) => {
    setFaqs(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const handleAddKeyword = (index: number) => {
    const keyword = newKeyword[index]?.trim();
    if (!keyword) return;
    
    setFaqs(prev => prev.map((f, i) => 
      i === index ? { ...f, palavras_chave: [...f.palavras_chave, keyword] } : f
    ));
    setNewKeyword(prev => ({ ...prev, [index]: '' }));
  };

  const handleRemoveKeyword = (faqIndex: number, keywordIndex: number) => {
    setFaqs(prev => prev.map((f, i) => 
      i === faqIndex 
        ? { ...f, palavras_chave: f.palavras_chave.filter((_, ki) => ki !== keywordIndex) }
        : f
    ));
  };

  const handleAdd = () => {
    setFaqs(prev => [...prev, {
      topico: '',
      palavras_chave: [],
      resposta: '',
      ordem: prev.length,
    }]);
  };

  const handleRemove = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(faqs.filter(f => f.topico && f.resposta));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Respostas Padrão (FAQ)</h2>
        <p className="text-sm text-muted-foreground">
          Respostas para perguntas frequentes
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por tópico ou palavra-chave..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {filteredFaqs.map((faq, index) => {
          const originalIndex = faqs.indexOf(faq);
          return (
            <div
              key={originalIndex}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-primary mt-2" />
                <div className="flex-1 space-y-3">
                  <Input
                    value={faq.topico}
                    onChange={(e) => handleUpdate(originalIndex, 'topico', e.target.value)}
                    placeholder="Tópico (ex: Preço / Valor)"
                    className="font-medium"
                  />
                  
                  <Textarea
                    value={faq.resposta}
                    onChange={(e) => handleUpdate(originalIndex, 'resposta', e.target.value)}
                    placeholder="Resposta padrão..."
                    rows={3}
                  />

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Palavras-chave que ativam esta resposta:</p>
                    <div className="flex flex-wrap gap-2">
                      {faq.palavras_chave.map((keyword, ki) => (
                        <Badge key={ki} variant="secondary" className="gap-1">
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(originalIndex, ki)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <div className="flex gap-1">
                        <Input
                          value={newKeyword[originalIndex] || ''}
                          onChange={(e) => setNewKeyword(prev => ({ ...prev, [originalIndex]: e.target.value }))}
                          placeholder="+ palavra"
                          className="h-6 w-24 text-xs"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword(originalIndex))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(originalIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Pergunta Frequente
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
