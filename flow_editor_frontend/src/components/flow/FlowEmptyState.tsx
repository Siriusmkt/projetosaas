import { Plus, MessageSquare, GitBranch, Wrench, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlowEmptyStateProps {
  onAddBlock: () => void;
}

export function FlowEmptyState({ onAddBlock }: FlowEmptyStateProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted border-2 border-dashed border-border rounded-2xl p-12 text-center">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Icon grid */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-warning" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-success" />
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">Comece a criar seu fluxo</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
          Adicione blocos de mensagem, condições e ações para criar uma conversa inteligente
        </p>
        
        <Button onClick={onAddBlock} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          Adicionar primeiro bloco
        </Button>

        {/* Features hint */}
        <div className="flex items-center justify-center gap-4 mt-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>IA para gerar blocos</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <span>Arrastar e soltar</span>
          <div className="w-1 h-1 rounded-full bg-border" />
          <span>Preview em tempo real</span>
        </div>
      </div>
    </div>
  );
}
