import { MessageSquare, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
}

interface ChatHistoryProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ChatHistory = ({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onClose,
}: ChatHistoryProps) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-xl slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Histórico</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* List */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-70px)] scroll-area">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhuma conversa ainda
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-start gap-3 p-3 rounded-xl cursor-pointer",
                  "transition-all duration-200",
                  currentId === conv.id
                    ? "bg-[rgba(165,148,255,0.15)] dark:bg-[rgba(165,148,255,0.2)] border border-[rgba(165,148,255,0.3)] dark:border-[rgba(165,148,255,0.4)]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
                onClick={() => onSelect(conv.id)}
              >
                <div className="w-9 h-9 rounded-lg bg-[rgba(165,148,255,0.15)] dark:bg-[rgba(165,148,255,0.2)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#A594FF] dark:text-[#A594FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {conv.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatDate(conv.timestamp)} • {conv.messageCount} msgs
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
