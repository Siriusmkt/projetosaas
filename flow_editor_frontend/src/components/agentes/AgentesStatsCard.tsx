import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AgentesStatsCardProps {
  icon: ReactNode;
  iconVariant?: 'primary' | 'success' | 'info';
  label: string;
  value: number | string;
  badge?: string;
  onClick?: () => void;
  action?: ReactNode;
}

const iconVariantClasses = {
  primary: 'bg-gradient-to-br from-[hsl(var(--primary))] to-[#667eea] shadow-[0_4px_20px_rgba(165,148,255,0.4)]',
  success: 'bg-gradient-to-br from-[#10b981] to-[#059669] shadow-[0_4px_20px_rgba(16,185,129,0.4)]',
  info: 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] shadow-[0_4px_20px_rgba(139,92,246,0.4)]',
};

export const AgentesStatsCard = memo(function AgentesStatsCard({
  icon,
  iconVariant = 'primary',
  label,
  value,
  badge,
  onClick,
  action,
}: AgentesStatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[rgba(15,6,36,0.8)] backdrop-blur-[20px]",
        "border border-[rgba(165,148,255,0.2)] rounded-[1.2rem]",
        "p-6 flex items-center gap-4",
        "transition-all duration-300 ease-out",
        "hover:translate-y-[-5px] hover:shadow-[0_8px_32px_rgba(165,148,255,0.3)]",
        "hover:border-[rgba(165,148,255,0.4)] hover:bg-[rgba(15,6,36,0.95)]",
        onClick && "cursor-pointer"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
          iconVariantClasses[iconVariant]
        )}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="text-[0.85rem] text-[rgba(255,255,255,0.5)] mb-1 font-medium uppercase tracking-wide">
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[2.2rem] font-extrabold text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            {value}
          </span>
          {badge && (
            <span className="px-2 py-1 bg-[rgba(165,148,255,0.15)] border border-[rgba(165,148,255,0.3)] rounded-md text-[0.65rem] text-[#A594FF] font-semibold">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
    </div>
  );
});
