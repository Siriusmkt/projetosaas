import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  onClose?: () => void;
}

const ChatHeader = ({ onNewChat, onToggleHistory, showHistory, onClose }: ChatHeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)] sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A594FF] to-[#667eea] flex items-center justify-center shadow-[0_4px_12px_rgba(165,148,255,0.4)] overflow-hidden">
            <img 
              src="https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png" 
              alt="Grazi" 
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128"; }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Grazi</h1>
            <p className="text-sm text-muted-foreground">
              Chat para editar o fluxo
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-[rgba(165,148,255,0.1)] dark:bg-[rgba(165,148,255,0.15)]",
                "hover:bg-[rgba(165,148,255,0.2)] dark:hover:bg-[rgba(165,148,255,0.25)]",
                "text-[#A594FF] dark:text-[#A594FF]",
                "transition-colors duration-300"
              )}
              aria-label="Fechar"
            >
              <span className="text-xl">×</span>
            </button>
          )}
          <button
            onClick={onNewChat}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-[rgba(165,148,255,0.1)] dark:bg-[rgba(165,148,255,0.15)]",
              "hover:bg-[rgba(165,148,255,0.2)] dark:hover:bg-[rgba(165,148,255,0.25)]",
              "text-[#A594FF] dark:text-[#A594FF]",
              "transition-colors duration-300"
            )}
            aria-label="Nova conversa"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
