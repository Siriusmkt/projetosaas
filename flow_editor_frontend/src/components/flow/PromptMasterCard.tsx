import { MessageSquare, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface PromptMasterCardProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export function PromptMasterCard({ value, onChange, onGenerate, isGenerating }: PromptMasterCardProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-purple-600 rounded-2xl p-6 text-primary-foreground mb-8 shadow-xl shadow-primary/20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Prompt Master</h3>
              <p className="text-sm opacity-80">Defina a personalidade e comportamento do assistente</p>
            </div>
          </div>
          
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating || !value.trim()}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 backdrop-blur-sm shadow-lg gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Gerar Blocos com IA
                </>
              )}
            </Button>
          )}
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ex: Você é a Isabela, assistente virtual da Pró Odonto. Seja simpática, profissional..."
          className="min-h-[120px] bg-white/15 backdrop-blur-sm border-white/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-white/40 focus:bg-white/20 resize-y rounded-xl"
        />

        {/* Quick tips */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[11px] uppercase tracking-wider opacity-60">Dicas:</span>
          <span className="px-2 py-0.5 text-[11px] bg-white/10 rounded-full">Nome do assistente</span>
          <span className="px-2 py-0.5 text-[11px] bg-white/10 rounded-full">Tom de voz</span>
          <span className="px-2 py-0.5 text-[11px] bg-white/10 rounded-full">Regras de comportamento</span>
          <span className="px-2 py-0.5 text-[11px] bg-white/10 rounded-full">Objetivo da conversa</span>
        </div>
      </div>
    </div>
  );
}
