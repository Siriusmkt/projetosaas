import { memo } from 'react';
import { Bot, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentesHeaderProps {
  totalAgentes: number;
  onCriar: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  isCreating?: boolean;
}

export const AgentesHeader = memo(function AgentesHeader({
  totalAgentes,
  onCriar,
  onRefresh,
  isLoading,
  isCreating,
}: AgentesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Meus Agentes</h1>
          <p className="text-sm text-muted-foreground">
            {totalAgentes} {totalAgentes === 1 ? 'agente' : 'agentes'} configurados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button onClick={onCriar} disabled={isCreating} className="gap-2">
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Novo Agente
        </Button>
      </div>
    </div>
  );
});
