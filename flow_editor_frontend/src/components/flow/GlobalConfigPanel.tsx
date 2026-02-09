import { useState, useEffect, useMemo } from 'react';
import { Settings2, Loader2, Save, MessageCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getPromptMaster, updatePromptMaster, getVoiceSpeed, updateVoiceSpeed, getAssistantFirstMessage, updateAssistantFirstMessage } from '@/services/flowService';
import { useToast } from '@/hooks/use-toast';
import { MARKAPP_PROMPT_MASTER } from '@/constants/promptTemplates';
import { toWhatsappPrompt } from '@/lib/whatsappPrompt';

interface GlobalConfigPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistenteId: string | null;
  tenantId?: string | null;
}

export function GlobalConfigPanel({ open, onOpenChange, assistenteId, tenantId }: GlobalConfigPanelProps) {
  const [promptVoz, setPromptVoz] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [sections, setSections] = useState<Record<string, string>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [visibleSectionOrder, setVisibleSectionOrder] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const selectedAssistant = useMemo(() => {
    try {
      const raw = localStorage.getItem('sd_selected_assistente');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }, []);

  const parsePrompt = (text: string) => {
    const lines = text.split(/\r?\n/);
    const nextSections: Record<string, string[]> = {};
    const order: string[] = [];
    let current = 'Geral';
    nextSections[current] = [];
    order.push(current);

    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        const title = line.replace(/^##\s+/, '').trim();
        current = title || 'Seção';
        if (!nextSections[current]) {
          nextSections[current] = [];
          order.push(current);
        }
        return;
      }
      nextSections[current].push(line);
    });

    const flat: Record<string, string> = {};
    Object.keys(nextSections).forEach((key) => {
      flat[key] = nextSections[key].join('\n').trim();
    });
    return { order, flat };
  };

  const buildPrompt = (order: string[], data: Record<string, string>) => {
    const parts: string[] = [];
    const intro = data['Geral'];
    if (intro) {
      parts.push(intro.trim());
    }
    order
      .filter((k) => k !== 'Geral')
      .forEach((key) => {
        const body = (data[key] || '').trim();
        parts.push(`## ${key}\n\n${body}`);
      });
    return parts.join('\n\n').trim();
  };

  useEffect(() => {
    if (open && assistenteId) {
      setIsLoading(true);
      Promise.all([
        getPromptMaster(assistenteId, tenantId || undefined),
        getAssistantFirstMessage(assistenteId),
        getVoiceSpeed(assistenteId),
      ])
        .then(([text, firstMsg, speed]) => {
          setFirstMessage(firstMsg ?? '');
          const shouldApplyTemplate =
            selectedAssistant?.name &&
            selectedAssistant.name.toLowerCase().includes('markapp promotores') &&
            (!text || !text.trim());
          const finalText = shouldApplyTemplate ? MARKAPP_PROMPT_MASTER : text;
          setPromptVoz(finalText);
          setVoiceSpeed(speed);
          const parsed = parsePrompt(finalText || '');
          setSections(parsed.flat);
          setSectionOrder(parsed.order);
          const hidden = new Set([
            'GERAL',
            'IA DE BOAS-VINDAS E CONVITE PARA LIVE',
            'FLUXO DA CONVERSA',
          ]);
          const visible = parsed.order.filter((name) => !hidden.has(name.toUpperCase()));
          setVisibleSectionOrder(visible);
          setActiveSection(visible[0] || 'Geral');
        })
        .catch((e) => {
          console.error('Erro ao carregar configuração global:', e);
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível carregar a configuração global.',
          });
          setPromptVoz('');
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, assistenteId, tenantId, toast]);

  const handleSave = async () => {
    if (!assistenteId) return;
    setIsSaving(true);
    try {
      const merged = buildPrompt(sectionOrder, sections);
      await Promise.all([
        updatePromptMaster(assistenteId, merged, tenantId || undefined),
        updateAssistantFirstMessage(assistenteId, firstMessage),
        updateVoiceSpeed(assistenteId, voiceSpeed),
      ]);
      toast({
        title: 'Salvo',
        description: 'Configuração global (Prompt Master, primeira mensagem e velocidade da fala) atualizada.',
      });
    } catch (e) {
      console.error('Erro ao salvar configuração global:', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar a configuração global.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTranscribeWhatsapp = async () => {
    if (!assistenteId) return;
    setIsTranscribing(true);
    try {
      const merged = buildPrompt(sectionOrder, sections);
      const whatsappText = toWhatsappPrompt(merged);
      if (!whatsappText) {
        toast({
          title: 'Sem conteúdo',
          description: 'Não encontrei um prompt para transcrever.',
        });
        return;
      }
      await navigator.clipboard.writeText(whatsappText);
      toast({
        title: 'Transcrito',
        description: 'Prompt para WhatsApp copiado com sucesso.',
      });
    } catch (e) {
      console.error('Erro ao transcrever prompt:', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível transcrever o prompt.',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-[rgba(165,148,255,0.2)] flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Configuração global
          </SheetTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            Prompt Master, primeira mensagem (saudação), velocidade da fala e contexto da IA. Edite e salve para aplicar.
          </p>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Carregando...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* 1. Primeira mensagem e voz — sempre no topo */}
              <div className="flex-shrink-0 space-y-4 mb-6">
                <div className="p-4 rounded-xl border-2 border-[rgba(165,148,255,0.4)] bg-[rgba(165,148,255,0.08)] shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Primeira mensagem (saudação)
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Texto que o assistente fala ao iniciar a ligação. Não faz parte do fluxo de blocos.
                  </p>
                  <Textarea
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    placeholder="Ex: Olá! Sou a assistente virtual. Como posso ajudar?"
                    className="min-h-[88px] resize-y text-sm bg-background/80 border-[rgba(165,148,255,0.2)] rounded-xl"
                  />
                </div>
                <div className="p-4 rounded-xl border border-[rgba(165,148,255,0.3)] bg-muted/40 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Velocidade da fala</h3>
                <label className="text-sm font-medium block mb-2 text-muted-foreground">Velocidade da fala</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                    className="flex-1 h-3 rounded-lg appearance-none bg-muted accent-primary cursor-pointer"
                  />
                  <span className="text-base font-mono font-semibold w-12 text-right tabular-nums">{voiceSpeed.toFixed(1)}x</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  0.5 = Lento · 1.0 = Normal · 2.0 = Rápido
                </p>
                </div>
              </div>

              {/* 2. Prompt Master */}
              <div className="flex-1 min-h-0 flex gap-4 mt-2">
                <div className="w-56 flex-shrink-0 border border-[rgba(165,148,255,0.2)] rounded-xl bg-muted/30 p-2 overflow-y-auto">
                  {visibleSectionOrder.map((section) => (
                    <button
                      key={section}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        activeSection === section
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveSection(section)}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-h-0 flex flex-col">
                  <Textarea
                    value={sections[activeSection] || ''}
                    onChange={(e) => {
                      const next = { ...sections, [activeSection]: e.target.value };
                      setSections(next);
                      setPromptVoz(buildPrompt(sectionOrder, next));
                    }}
                    placeholder="Edite o conteúdo desta seção..."
                    className="flex-1 min-h-[320px] resize-y text-sm bg-muted/30 border-[rgba(165,148,255,0.2)] rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 flex-shrink-0 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTranscribeWhatsapp}
                  disabled={isTranscribing || !assistenteId}
                  className="gap-2"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Transcrevendo...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !assistenteId}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
