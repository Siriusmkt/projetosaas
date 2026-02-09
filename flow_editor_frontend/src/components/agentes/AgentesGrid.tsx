import { memo } from 'react';
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgenteCard } from './AgenteCard';
import { cn } from '@/lib/utils';
import type { Agente } from '@/types/agente';

interface AgentesGridProps {
  agentes: Agente[];
  isLoading: boolean;
  onEdit: (agente: Agente) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFlow: (id: string) => void;
  onCriar: () => void;
}

// Loading skeleton matching original style
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 p-2">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className={cn(
          "bg-gradient-to-br from-[rgba(15,5,30,0.98)] to-[rgba(20,8,40,0.98)]",
          "border-[1.5px] border-[rgba(165,148,255,0.2)] rounded-[18px]",
          "overflow-hidden animate-pulse"
        )}
      >
        <div className="px-7 py-6 bg-gradient-to-br from-[rgba(10,3,20,0.8)] to-[rgba(15,5,30,0.7)] border-b-[1.5px] border-[rgba(165,148,255,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(165,148,255,0.2)]" />
            <div className="h-6 w-32 rounded bg-[rgba(165,148,255,0.2)]" />
          </div>
        </div>
        <div className="p-7 space-y-5">
          <div className="h-4 w-24 rounded bg-[rgba(165,148,255,0.1)]" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 rounded-xl bg-[rgba(165,148,255,0.1)]" />
            <div className="flex-1 h-12 rounded-xl bg-[rgba(165,148,255,0.1)]" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty state matching original style
const EmptyState = ({ onCriar }: { onCriar: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
    <svg 
      width="80" 
      height="80" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-[rgba(255,255,255,0.5)] mb-6"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <h3 className="text-2xl font-semibold text-white mb-3">
      Você não tem assistentes
    </h3>
    <p className="text-[rgba(255,255,255,0.6)] text-base max-w-sm mb-8">
      Crie seu primeiro assistente de IA clicando no botão acima.
    </p>
    <Button 
      onClick={onCriar}
      className={cn(
        "flex items-center gap-2.5 px-8 py-5 text-base font-bold rounded-xl",
        "bg-gradient-to-br from-[#A594FF] to-[#667eea]",
        "shadow-[0_4px_20px_rgba(165,148,255,0.4)]",
        "hover:translate-y-[-3px] hover:shadow-[0_8px_35px_rgba(165,148,255,0.6)]",
        "transition-all duration-300 border-0"
      )}
    >
      <Plus className="w-5 h-5" />
      Criar Primeiro Assistente
    </Button>
  </div>
);

export const AgentesGrid = memo(function AgentesGrid({
  agentes,
  isLoading,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenFlow,
  onCriar,
}: AgentesGridProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (agentes.length === 0) {
    return <EmptyState onCriar={onCriar} />;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-7 p-2">
      {agentes.map((agente, index) => (
        <div 
          key={agente.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
        >
          <AgenteCard
            agente={agente}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onOpenFlow={onOpenFlow}
          />
        </div>
      ))}
    </div>
  );
});
