import ReactMarkdown from "react-markdown";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlowPreviewInChat } from "@/components/flow-chat/FlowPreviewInChat";

const GRAZI_AVATAR_URL = "https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png";
const GRAZI_AVATAR_FALLBACK = "https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128";

/** Normaliza ** texto ** para **texto** para o markdown interpretar como negrito mesmo com espaços. */
function normalizeBoldMarkdown(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\*\*\s*([^*]+?)\s*\*\*/g, (_, inner) => `**${inner.trim()}**`);
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp?: string;
  modo?: string;
  fluxo_visual?: any[];
  onFlowBlockClick?: (block: any) => void;
}

const ChatMessage = ({ role, content, isStreaming, timestamp, modo, fluxo_visual, onFlowBlockClick }: ChatMessageProps) => {
  const isUser = role === "user";
  const normalizedContent = !isUser ? normalizeBoldMarkdown(content) : content;

  return (
    <div
      className={cn(
        "flex gap-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-purple-sm ring-purple flex-shrink-0 overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)',
            backgroundImage: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)'
          }}
        >
          <img 
            src={GRAZI_AVATAR_URL} 
            alt="Grazi" 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = GRAZI_AVATAR_FALLBACK; }}
          />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-5 py-4 shadow-sm chat-bubble",
          isUser
            ? "text-white rounded-tr-sm chat-bubble-user"
            : "bg-slate-50 dark:bg-slate-700 border border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)] rounded-tl-sm chat-bubble-ai"
        )}
        style={isUser ? { 
          background: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)',
          backgroundImage: 'linear-gradient(135deg, #A594FF 0%, #667eea 100%)'
        } : undefined}
      >
        {isUser ? (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            {timestamp && (
              <span className="text-xs mt-2 block text-white/70">{timestamp}</span>
            )}
          </>
        ) : (
          <>
            <div
              className={cn(
                "prose prose-sm dark:prose-invert max-w-none chat-message-grazi",
                "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                "[&_code]:bg-slate-200 [&_code]:dark:bg-slate-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs",
                "[&_pre]:bg-slate-200 [&_pre]:dark:bg-slate-600 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto",
                "[&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5",
                "[&_p]:my-1.5 [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:dark:text-slate-200",
                "[&_strong]:font-semibold",
                "[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-slate-100",
                "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-800 [&_h2]:dark:text-slate-200",
                "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:dark:text-slate-300",
                "[&_table]:w-full [&_table]:text-sm",
                "[&_th]:bg-slate-100 [&_th]:dark:bg-slate-600 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left",
                "[&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-slate-200 [&_td]:dark:border-slate-600",
                isStreaming && "after:content-['▊'] after:animate-pulse after:ml-0.5 after:text-[#A594FF]"
              )}
            >
              <ReactMarkdown
                components={{
                  strong: ({ children }) => (
                    <strong className="font-semibold text-[#A594FF] dark:text-[#A594FF]">{children}</strong>
                  ),
                }}
              >
                {normalizedContent || " "}
              </ReactMarkdown>
            </div>
            {modo === "mostrar_fluxo" && Array.isArray(fluxo_visual) && fluxo_visual.length > 0 && (
              <FlowPreviewInChat blocos={fluxo_visual as any[]} onBlocoClick={onFlowBlockClick} />
            )}
            {timestamp && (
              <span className="text-xs mt-2 block text-slate-400 dark:text-slate-500">{timestamp}</span>
            )}
          </>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-10 h-10 rounded-xl gradient-user flex items-center justify-center shadow-md flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
