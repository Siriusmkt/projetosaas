import { memo } from 'react';
import { Users, CheckCircle2, Phone, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentesStatsCard } from './AgentesStatsCard';

interface AgentesPageHeaderProps {
  totalAgentes: number;
  ativos: number;
  totalCalls?: number;
  onCriar: () => void;
  isCreating?: boolean;
}

export const AgentesPageHeader = memo(function AgentesPageHeader({
  totalAgentes,
  ativos,
  totalCalls = 0,
  onCriar,
  isCreating,
}: AgentesPageHeaderProps) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-[2.2rem] font-extrabold mb-2 bg-gradient-to-br from-white to-[#A594FF] bg-clip-text text-transparent">
          Meus Assistentes
        </h1>
        <p className="text-base text-[rgba(255,255,255,0.6)] font-normal">
          Gerencie seus assistentes de IA para campanhas de prospecção
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AgentesStatsCard
          icon={<Users className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />}
          iconVariant="primary"
          label="Total de Assistentes"
          value={totalAgentes}
        />
        
        <AgentesStatsCard
          icon={<CheckCircle2 className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />}
          iconVariant="success"
          label="Assistentes Ativos"
          value={ativos}
          badge="Ativos"
        />
        
        <AgentesStatsCard
          icon={<Phone className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />}
          iconVariant="info"
          label="Total de Calls"
          value={totalCalls}
        />
      </div>

      {/* Action Bar */}
      <div 
        className="bg-gradient-to-br from-[rgba(165,148,255,0.12)] to-[rgba(102,126,234,0.08)] 
                   backdrop-blur-[20px] border border-[rgba(165,148,255,0.3)] rounded-[1.5rem] 
                   p-8 shadow-[0_8px_32px_rgba(165,148,255,0.15)]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h2 className="text-[1.75rem] font-semibold text-white mb-1">
              Assistentes Ativos
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-base">
              Configure e monitore seus assistentes de conversação
            </p>
          </div>

          <Button
            onClick={onCriar}
            disabled={isCreating}
            className="flex items-center gap-2.5 px-10 py-6 text-base font-bold rounded-2xl
                       bg-gradient-to-br from-[#A594FF] to-[#667eea] 
                       shadow-[0_4px_20px_rgba(165,148,255,0.4)] 
                       hover:translate-y-[-3px] hover:shadow-[0_8px_35px_rgba(165,148,255,0.6)]
                       transition-all duration-300 relative overflow-hidden border-0"
          >
            {isCreating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Criar Assistente
          </Button>
        </div>
      </div>
    </div>
  );
});
