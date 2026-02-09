import { useRef, useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import ChatMessage from "@/components/flow-chat/ChatMessage";
import ChatInput from "@/components/flow-chat/ChatInput";
import TypingIndicator from "@/components/flow-chat/TypingIndicator";
import ActionResults from "@/components/flow-chat/ActionResults";
import { useFlowChat } from "@/hooks/useFlowChat";
import { Button } from "@/components/ui/button";
import { FlowBlock } from "@/types/flow";

/** 'overlay' = full-screen overlay (default). 'panel' = encaixa à esquerda do canvas (sem fixed). */
export type FlowChatPanelVariant = 'overlay' | 'panel';

interface FlowChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistenteId: string;
  /** Nome do assistente para exibir na barra (editando qual assistente) */
  assistantName?: string | null;
  /** URL da foto de perfil do assistente */
  assistantPhotoUrl?: string | null;
  tenantId?: string;
  flowId: string | null;
  onFlowUpdate?: () => void;
  /** Chamado quando a Grazi aplica ações (blocos criados/editados). Deve recarregar o fluxo com canvas atualizado. */
  onBlocksUpdated?: () => void;
  blocks?: FlowBlock[];
  onUpdateBlock?: (blockId: string, updates: Partial<FlowBlock>) => void;
  onAddBlock?: (block: FlowBlock) => void;
  onInsertBlock?: (block: FlowBlock, afterIndex: number) => void;
  onSaveFlow?: () => Promise<void> | void;
  onTranscribePrompt?: () => Promise<void> | void;
  /** Quando 'panel', o chat é exibido como coluna à esquerda; quando 'overlay', overlay full-screen */
  variant?: FlowChatPanelVariant;
}

const FLOW_CHAT_AVATAR_FALLBACK = 'https://ui-avatars.com/api/?name=AI&background=A594FF&color=fff&size=64';

const FlowChatPanel = ({
  open,
  onOpenChange,
  assistenteId,
  assistantName,
  assistantPhotoUrl,
  tenantId,
  flowId,
  onFlowUpdate,
  onBlocksUpdated,
  blocks,
  onUpdateBlock,
  onAddBlock,
  onInsertBlock,
  onSaveFlow,
  onTranscribePrompt,
  variant = 'overlay',
}: FlowChatPanelProps) => {
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(flowId);
  const [hasLoaded, setHasLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    startNewConversation,
    executingActions,
    actionResults,
  } = useFlowChat({
    assistenteId,
    tenantId: tenantId || '',
    flowId: currentFlowId,
    onBlocksUpdated: onBlocksUpdated ?? onFlowUpdate,
    blocks,
    onUpdateBlock,
    onAddBlock,
    onInsertBlock,
    onSaveFlow,
    onTranscribePrompt,
  });

  // Atualizar flowId quando prop mudar
  useEffect(() => {
    setCurrentFlowId(flowId);
  }, [flowId]);

  // Carregar flow quando abrir e sempre iniciar nova conversa
  useEffect(() => {
    if (open) {
      // Sempre iniciar nova conversa ao abrir
      startNewConversation();
      
      if (!hasLoaded) {
        if (currentFlowId) {
          setHasLoaded(true);
          if (onFlowUpdate) {
            onFlowUpdate();
          }
        } else if (assistenteId && tenantId) {
          loadFlow();
        }
      }
    } else {
      // Reset quando fechar
      setHasLoaded(false);
      startNewConversation();
    }
  }, [open, currentFlowId, assistenteId, tenantId, hasLoaded, startNewConversation, onFlowUpdate]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // Rolar apenas o chat, sem afetar o canvas/página
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messages, isLoading]);

  const loadFlow = async () => {
    if (!assistenteId || !tenantId) return;
    
    try {
      const response = await fetch(
        `/api/flows/by-assistant/${assistenteId}?tenant_id=${encodeURIComponent(tenantId)}&create_if_missing=true`
      );
      
      if (!response.ok) {
        throw new Error('Erro ao carregar flow');
      }
      
      const data = await response.json();
      const newFlowId = data.flow?.id || null;
      setCurrentFlowId(newFlowId);
      
      if (newFlowId && onFlowUpdate) {
        onFlowUpdate();
      }
      
      setHasLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar flow:', error);
    }
  };

  // Perguntas rápidas removidas

  if (!open) return null;

  const isPanel = variant === 'panel';
  const wrapperClass = isPanel
    ? 'h-full min-h-0 flex flex-col bg-background/95 border-l border-border'
    : 'fixed inset-0 min-h-screen flex flex-col bg-background/98 z-[9999] animate-fade-in';
  const wrapperStyle = isPanel ? undefined : { left: '280px', right: 0, width: 'calc(100% - 280px)' };

  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {/* Barra única compacta: fechar, avatar + nome, nova conversa */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2.5 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
            <img
              src={assistantPhotoUrl || FLOW_CHAT_AVATAR_FALLBACK}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FLOW_CHAT_AVATAR_FALLBACK;
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate leading-tight">
              {assistantName || assistenteId || "Assistente"}
            </p>
            <p className="text-[10px] text-muted-foreground">Editando fluxo</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={startNewConversation}
          aria-label="Nova conversa"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Área do chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 flex flex-col min-h-0 w-full">
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 min-h-0 overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2 py-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 overflow-hidden">
                  <img
                    src="https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png"
                    alt="Grazi"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128"; }}
                  />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Grazi</h2>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  Diga o que quer modificar no fluxo. Eu aplico nos blocos.
                </p>
                {/* Perguntas rápidas removidas */}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    modo={(message as any).modo}
                    fluxo_visual={(message as any).fluxo_visual}
                    onFlowBlockClick={(b) => {
                      // Ajuda o usuário a pedir edição pelo chat
                      const key = (b?.block_key || b?.blockKey || "").toString();
                      if (key) {
                        sendMessage(`Quero editar o bloco ${key}. Mostre o conteúdo completo e me diga como alterar.`);
                      }
                    }}
                    isStreaming={
                      isLoading &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <ActionResults results={actionResults} isExecuting={executingActions} />

          {/* Perguntas rápidas removidas */}

          <div className="flex-shrink-0 p-4 border-t border-border bg-card/80">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading || executingActions || !currentFlowId}
              placeholder="Ex: Mude o nome da IA para Sofia, adicione uma regra..."
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default FlowChatPanel;
