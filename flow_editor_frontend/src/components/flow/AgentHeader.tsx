import { memo } from 'react';
import { Bot, Settings } from 'lucide-react';

interface AgentHeaderProps {
  agentName: string;
  agentPhotoUrl?: string;
  onOpenConfig: () => void;
}

const FALLBACK_AVATAR = 'https://ui-avatars.com/api/?name=AI&background=A594FF&color=fff&size=80';

export const AgentHeader = memo(function AgentHeader({
  agentName,
  agentPhotoUrl,
  onOpenConfig,
}: AgentHeaderProps) {
  const avatarSrc = agentPhotoUrl || FALLBACK_AVATAR;
  return (
    <div className="flex items-center justify-center mb-4">
      <button
        onClick={onOpenConfig}
        className="flex items-center gap-3 px-5 py-3 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all group cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {agentPhotoUrl ? (
            <img
              src={avatarSrc}
              alt={agentName || 'Assistente'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
              }}
            />
          ) : (
            <Bot className="w-5 h-5 text-primary" />
          )}
        </div>

        <div className="text-left">
          <span className="font-semibold text-sm block">{agentName || 'Meu Agente'}</span>
          <span className="text-[10px] text-muted-foreground">Clique para configurar</span>
        </div>

        <Settings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
      </button>
    </div>
  );
});
