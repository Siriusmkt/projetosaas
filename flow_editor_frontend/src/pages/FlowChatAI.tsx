import { useRef, useEffect, useState } from "react";
import { Sparkles, Database } from "lucide-react";
import ChatHeader from "@/components/flow-chat/ChatHeader";
import ChatMessage from "@/components/flow-chat/ChatMessage";
import ChatInput from "@/components/flow-chat/ChatInput";
import ChatHistory from "@/components/flow-chat/ChatHistory";
import TypingIndicator from "@/components/flow-chat/TypingIndicator";
import PromptSuggestions from "@/components/flow-chat/PromptSuggestions";
import ActionResults from "@/components/flow-chat/ActionResults";
import { useFlowChat } from "@/hooks/useFlowChat";
import { useSearchParams } from "react-router-dom";

const FlowChatAI = () => {
  const [searchParams] = useSearchParams();
  const assistenteId = searchParams.get('assistente_id') || searchParams.get('assistant_id') || '';
  const tenantId = searchParams.get('tenant_id') || localStorage.getItem('tenant_id') || '';
  const flowId = searchParams.get('flow_id') || null;

  const {
    messages,
    isLoading,
    sendMessage,
    conversations,
    currentConversationId,
    startNewConversation,
    selectConversation,
    deleteConversation,
    executingActions,
    actionResults,
  } = useFlowChat({ assistenteId, tenantId, flowId });

  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      {/* Header */}
      <ChatHeader
        onNewChat={startNewConversation}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
      />

      {/* Assistente Config Bar */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Database className="w-4 h-4" />
            <span className="text-sm">Assistente:</span>
          </div>
          <code className="text-xs bg-[rgba(165,148,255,0.15)] dark:bg-[rgba(165,148,255,0.2)] text-[#A594FF] dark:text-[#A594FF] px-3 py-1.5 rounded-lg font-mono">
            {assistenteId || 'N/A'}
          </code>
          {flowId && (
            <code className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg font-mono">
              Flow: {flowId.slice(0, 8)}...
            </code>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scroll-area">
            {messages.length === 0 ? (
              /* Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A594FF] to-[#667eea] flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(165,148,255,0.4)] overflow-hidden">
                  <img 
                    src="https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png" 
                    alt="Grazi" 
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128'; }}
                  />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Grazi
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
                  Diga o que quer modificar no fluxo. Eu aplico as mudanças nos blocos.
                </p>
                <PromptSuggestions
                  onSelect={handleSuggestionSelect}
                  disabled={isLoading}
                />
              </div>
            ) : (
              /* Messages List */
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isStreaming={
                      isLoading &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <TypingIndicator />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Action Results */}
          <ActionResults results={actionResults} isExecuting={executingActions} />

          {/* Quick Suggestions */}
          {messages.length > 0 && !isLoading && (
            <div className="px-6 pb-4">
              <PromptSuggestions
                onSelect={handleSuggestionSelect}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-t-2xl border-t border-slate-200 dark:border-slate-700 shadow-lg">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading || executingActions || !assistenteId}
              placeholder="Ex: Mude o nome da IA para Sofia, adicione uma regra..."
            />
          </div>
        </main>

        {/* History Sidebar */}
        {showHistory && (
          <ChatHistory
            conversations={conversations}
            currentId={currentConversationId}
            onSelect={(id) => {
              selectConversation(id);
              setShowHistory(false);
            }}
            onDelete={deleteConversation}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FlowChatAI;
