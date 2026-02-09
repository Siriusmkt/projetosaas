import { memo } from 'react';
import { 
  Pencil, 
  Trash2, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agente } from '@/types/agente';

interface AgenteCardProps {
  agente: Agente;
  onEdit: (agente: Agente) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFlow: (id: string) => void;
}

const statusConfig = {
  ativo: { 
    label: 'Ativo', 
    className: 'bg-[rgba(34,197,94,0.2)] border-[rgba(34,197,94,0.5)] text-[#4ade80] shadow-[0_4px_12px_rgba(34,197,94,0.2)]' 
  },
  rascunho: { 
    label: 'Rascunho', 
    className: 'bg-[rgba(245,158,11,0.2)] border-[rgba(245,158,11,0.5)] text-[#fbbf24] shadow-[0_4px_12px_rgba(245,158,11,0.2)]' 
  },
  arquivado: { 
    label: 'Arquivado', 
    className: 'bg-[rgba(107,114,128,0.2)] border-[rgba(107,114,128,0.5)] text-[#9ca3af] shadow-[0_4px_12px_rgba(107,114,128,0.2)]' 
  },
  inativo: { 
    label: 'Inativo', 
    className: 'bg-[rgba(239,68,68,0.2)] border-[rgba(239,68,68,0.5)] text-[#f87171] shadow-[0_4px_12px_rgba(239,68,68,0.2)]' 
  },
};

export const AgenteCard = memo(function AgenteCard({
  agente,
  onEdit,
  onDelete,
}: AgenteCardProps) {
  const status = statusConfig[agente.status as keyof typeof statusConfig] || statusConfig.rascunho;

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-[18px] border-[1.5px] backdrop-blur-[12px]",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:translate-y-[-6px]",
        /* tema claro: roxo clarinho */
        "bg-gradient-to-br from-[rgba(245,243,255,0.98)] to-[rgba(237,233,254,0.98)]",
        "border-[rgba(165,148,255,0.25)] shadow-[0_8px_24px_rgba(165,148,255,0.12)]",
        "hover:border-[rgba(165,148,255,0.5)] hover:shadow-[0_16px_48px_rgba(165,148,255,0.18)]",
        /* tema escuro */
        "dark:from-[rgba(15,5,30,0.98)] dark:to-[rgba(20,8,40,0.98)]",
        "dark:border-[rgba(165,148,255,0.2)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]",
        "dark:hover:border-[rgba(165,148,255,0.5)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_40px_rgba(165,148,255,0.25)]"
      )}
    >
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(165,148,255,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none dark:from-[rgba(165,148,255,0.05)]" />

      {/* Header - assistente-header */}
      <div className={cn(
        "flex justify-between items-center px-7 py-6 border-b-[1.5px]",
        "bg-gradient-to-br from-[rgba(255,255,255,0.7)] to-[rgba(245,243,255,0.8)] border-[rgba(165,148,255,0.2)]",
        "dark:from-[rgba(10,3,20,0.8)] dark:to-[rgba(15,5,30,0.7)] dark:border-[rgba(165,148,255,0.15)]"
      )}>
        <h3 className="text-[1.3rem] font-bold flex-1 truncate text-slate-900 drop-shadow-none dark:text-white dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          {agente.nome}
        </h3>
        
        {/* assistente-status */}
        <span className={cn(
          "px-4 py-2 rounded-lg text-[0.75rem] font-bold uppercase tracking-[0.8px] whitespace-nowrap",
          "border-[1.5px]",
          status.className
        )}>
          {status.label}
        </span>
      </div>

      {/* Body - assistente-body */}
      <div className="p-7">
        {/* assistente-profile-photo */}
        <div className={cn(
          "w-full h-[240px] min-h-[240px] max-h-[240px] mb-5 rounded-xl overflow-hidden",
          "border-2 border-[rgba(165,148,255,0.25)] shadow-[0_8px_24px_rgba(165,148,255,0.15)]",
          "bg-gradient-to-br from-[rgba(165,148,255,0.12)] to-[rgba(196,181,253,0.08)]",
          "flex items-center justify-center relative transition-all duration-300",
          "group-hover:border-[rgba(165,148,255,0.45)] group-hover:shadow-[0_12px_32px_rgba(165,148,255,0.2)]",
          "dark:border-[rgba(165,148,255,0.2)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
          "dark:from-[rgba(165,148,255,0.08)] dark:to-[rgba(102,126,234,0.05)]",
          "dark:group-hover:border-[rgba(165,148,255,0.4)] dark:group-hover:shadow-[0_12px_32px_rgba(165,148,255,0.2)]"
        )}>
          {/* Placeholder SVG for profile photo */}
          <svg 
            className="w-20 h-20 text-[rgba(165,148,255,0.3)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={1}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        {/* assistente-info */}
        <div className="mb-5">
          {/* info-label */}
          <span className="block text-[0.75rem] font-semibold text-[#7c3aed] dark:text-[#A594FF] uppercase tracking-[1px] mb-2.5">
            Primeira Mensagem
          </span>
          {/* first-message-text */}
          <div className="p-3.5 bg-slate-100 dark:bg-[rgba(0,0,0,0.3)] rounded-lg border-l-[3px] border-violet-400 dark:border-[rgba(165,148,255,0.4)]">
            <p className="text-slate-700 dark:text-[rgba(255,255,255,0.85)] text-[0.95rem] leading-relaxed">
              Configure a mensagem inicial do assistente...
            </p>
          </div>
        </div>

        {/* assistente-actions */}
        <div className="flex gap-3">
          {/* btn-edit */}
          <button
            onClick={() => onEdit(agente)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5",
              "py-3.5 px-5 rounded-xl",
              "text-[0.95rem] font-bold tracking-[0.3px]",
              "border-[1.5px] relative overflow-hidden",
              "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              // btn-edit styles
              "bg-gradient-to-br from-[rgba(59,130,246,0.2)] to-[rgba(37,99,235,0.2)]",
              "border-[rgba(59,130,246,0.5)] text-[#60a5fa]",
              "hover:from-[rgba(59,130,246,0.35)] hover:to-[rgba(37,99,235,0.35)]",
              "hover:border-[#3b82f6] hover:text-[#93c5fd]",
              "hover:shadow-[0_10px_28px_rgba(59,130,246,0.4),0_0_30px_rgba(59,130,246,0.25)]",
              "hover:translate-y-[-3px]"
            )}
          >
            <Pencil className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Editar
          </button>

          {/* btn-delete */}
          <button
            onClick={() => onDelete(agente.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2.5",
              "py-3.5 px-5 rounded-xl",
              "text-[0.95rem] font-bold tracking-[0.3px]",
              "border-[1.5px] relative overflow-hidden",
              "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
              // btn-delete styles
              "bg-gradient-to-br from-[rgba(239,68,68,0.2)] to-[rgba(220,38,38,0.2)]",
              "border-[rgba(239,68,68,0.5)] text-[#f87171]",
              "hover:from-[rgba(239,68,68,0.35)] hover:to-[rgba(220,38,38,0.35)]",
              "hover:border-[#ef4444] hover:text-[#fca5a5]",
              "hover:shadow-[0_10px_28px_rgba(239,68,68,0.4),0_0_30px_rgba(239,68,68,0.25)]",
              "hover:translate-y-[-3px]"
            )}
          >
            <Trash2 className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
});
