import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { FlowBlock } from "@/types/flow";
import { splitAssistantMessage } from "@/lib/chatSplit";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  modo?: string;
  fluxo_visual?: any[];
}

interface Conversation {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  messages: Message[];
}

const STORAGE_KEY = "flow-chat-conversations";

interface UseFlowChatOptions {
  assistenteId: string;
  tenantId?: string;
  flowId: string | null;
  /** Chamado quando a Grazi aplica mudanças nos blocos (canvas deve recarregar) */
  onBlocksUpdated?: () => void;
  /** Lista atual de blocos (para modo local) */
  blocks?: FlowBlock[];
  /** Atualiza bloco localmente (modo local) */
  onUpdateBlock?: (blockId: string, updates: Partial<FlowBlock>) => void;
  /** Adiciona bloco localmente (modo local) */
  onAddBlock?: (block: FlowBlock) => void;
  /** Insere bloco em posição específica (modo local) */
  onInsertBlock?: (block: FlowBlock, afterIndex: number) => void;
  /** Salva o fluxo atual (manual) */
  onSaveFlow?: () => Promise<void> | void;
  /** Transcreve o prompt para WhatsApp */
  onTranscribePrompt?: () => Promise<void> | void;
}

export function useFlowChat({
  assistenteId,
  tenantId,
  flowId,
  onBlocksUpdated,
  blocks,
  onUpdateBlock,
  onAddBlock,
  onInsertBlock,
  onSaveFlow,
  onTranscribePrompt,
}: UseFlowChatOptions) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [executingActions, setExecutingActions] = useState(false);
  const [actionResults, setActionResults] = useState<Array<{ block_key: string; success: boolean; error?: string }>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // =====================================================
  // PENDING CHANGES: Guarda sugestões do preview para
  // enviar como pending_changes quando usuário confirmar
  // =====================================================
  const [pendingSugestoes, setPendingSugestoes] = useState<any[]>([]);

  // Sempre iniciar com conversa vazia - não carregar do localStorage
  useEffect(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setConversations([]);
    setPendingSugestoes([]);
  }, [assistenteId]); // Reset quando mudar o assistente

  // Removido saveConversations - não salvar mais conversas

  const generateTitle = (content: string) => {
    const maxLen = 40;
    const clean = content.replace(/\n/g, " ").trim();
    return clean.length > maxLen ? clean.slice(0, maxLen) + "..." : clean;
  };

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setActionResults([]);
    setPendingSugestoes([]);
  }, []);

  const selectConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
      setActionResults([]);
      setPendingSugestoes([]);
    }
  }, [conversations]);

  const deleteConversation = useCallback((id: string) => {
    // Não fazer nada - conversas não são mais salvas
    toast({
      title: "Conversa excluída",
      description: "A conversa foi removida com sucesso.",
    });
  }, [toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!assistenteId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Assistente não carregado. Verifique os parâmetros.",
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setActionResults([]);

    let convId = currentConversationId;
    if (!convId) {
      convId = crypto.randomUUID();
      setCurrentConversationId(convId);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const pushAssistantMessage = (text: string) => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    };
    const pushAssistantMessageWithDelay = async (text: string, delayMs = 3000) => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      pushAssistantMessage(text);
      setIsLoading(false);
    };


    try {
      // Preparar histórico de conversa (últimas 10 mensagens para não sobrecarregar)
      const conversationHistory = newMessages
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Validar assistenteId antes de enviar
      if (!assistenteId || !assistenteId.trim()) {
        throw new Error("assistente_id é obrigatório para conversar com a Grazi");
      }

      // Log para debug
      console.log('💬 [useFlowChat] Enviando mensagem para Grazi:', {
        assistente_id: assistenteId,
        message_length: content.length,
        history_length: conversationHistory.length,
        pending_changes_count: pendingSugestoes.length,
      });

      // Chamar novo endpoint da Grazi
      const response = await fetch(`/api/grazi/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistente_id: assistenteId.trim(),
          tenant_id: tenantId || null,
          message: content,
          history: conversationHistory,
          pending_changes: pendingSugestoes,  // ← ENVIA SUGESTÕES GUARDADAS DO PREVIEW
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Erro desconhecido" }));
        throw new Error(error.detail || "Erro ao processar mensagem");
      }

      const data = await response.json();
      
      // Validar resposta da Grazi
      if (!data.success) {
        throw new Error(data.mensagem || "Erro ao processar mensagem");
      }

      const assistantText = data.mensagem || "Resposta da Grazi";
      const chunks = splitAssistantMessage(assistantText);
      const baseMeta = {
        modo: data.modo,
        fluxo_visual: Array.isArray(data.fluxo_visual) ? data.fluxo_visual : undefined,
      };
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: chunk,
          ...(i === 0 ? baseMeta : {}),
        };
        setMessages((prev) => [...prev, chunkMessage]);
        if (i < chunks.length - 1) {
          const delay = Math.min(2200, Math.max(700, Math.floor(chunk.length * 12)));
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // =====================================================
      // GERENCIAR PENDING CHANGES BASEADO NO MODO DA RESPOSTA
      // =====================================================

      if (data.modo === "preview" && data.sugestoes?.length > 0) {
        // Preview: guardar sugestões para enviar na confirmação
        setPendingSugestoes(data.sugestoes);
      } else if (data.modo === "analise" && data.sugestoes?.length > 0) {
        // Análise com sugestões: guardar caso o usuário queira aplicar
        setPendingSugestoes(data.sugestoes);
      } else if (data.modo === "executar") {
        // Executou: limpar pendentes
        setPendingSugestoes([]);
      } else if (data.modo === "conversa" && !data.aguardando_confirmacao) {
        // Conversa normal sem aguardar: limpar pendentes
        setPendingSugestoes([]);
      }
      // Se modo === "conversa" e aguardando_confirmacao === true, MANTER pendentes

      // Processar sugestões (preview de mudanças)
      if (data.sugestoes && data.sugestoes.length > 0) {
        // Converter sugestões em actionResults para exibição
        const results = data.sugestoes.map((sugestao: any) => ({
          block_key: sugestao.block_key || "unknown",
          success: true,
          preview: true,
          titulo: sugestao.titulo,
          motivo: sugestao.motivo,
          antes: sugestao.antes,
          depois: sugestao.depois,
        }));
        setActionResults(results);
      }

      // Processar ações executadas (quando usuário confirma) → atualizar canvas de blocos
      if (data.acoes_executadas && data.acoes_executadas.length > 0) {
        const results = data.acoes_executadas.map((acao: any) => ({
          block_key: acao.block_key || "unknown",
          success: acao.success !== false,
          error: acao.error,
        }));
        setActionResults(results);
        onBlocksUpdated?.();
        toast({
          title: "✅ Mudanças aplicadas",
          description: `${results.length} mudança(s) aplicada(s). O flow em blocos foi atualizado.`,
        });
      } else if (data.aguardando_confirmacao) {
        toast({
          title: "⏳ Aguardando confirmação",
          description: "A Grazi está esperando sua confirmação para aplicar as mudanças.",
        });
      }

      // Não salvar conversas - sempre iniciar nova conversa ao fechar/abrir
    } catch (error) {
      if ((error as Error).name === "AbortError") return;

      console.error("Chat error:", error);
      await pushAssistantMessageWithDelay(
        "Não consegui falar com a Grazi no Supabase agora. Verifique a Edge Function e tente novamente."
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: (error as Error).message || "Erro ao enviar mensagem",
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  }, [
    messages,
    currentConversationId,
    assistenteId,
    tenantId,
    pendingSugestoes,
    toast,
    blocks,
    onUpdateBlock,
    onAddBlock,
    onInsertBlock,
    onSaveFlow,
    onBlocksUpdated,
  ]);

  return {
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
    pendingSugestoes,
  };
}
