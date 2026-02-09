import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Wrench, MessageSquare, Settings2, MessageCircle } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { FlowCanvas, DroppableData, DraggableCanvasBlockData } from '@/components/flow/FlowCanvas';
import { FlowBlockIcon } from '@/components/flow/FlowBlockIcon';
import { InsertBlockPositionDialog, type InsertPosition } from '@/components/flow/InsertBlockPositionDialog';
import { PromptBlocksPanel, PromptDraggableBlockData } from '@/components/flow/PromptBlocksPanel';
import { PropertiesPanel } from '@/components/flow/PropertiesPanel';
import { GlobalConfigPanel } from '@/components/flow/GlobalConfigPanel';
import FlowChatPanel from '@/components/flow/FlowChatPanel';
import { useFlowPersistence } from '@/hooks/useFlowPersistence';
import { useVapiTools } from '@/hooks/useVapiTools';
import { createBlock, FlowBlock, FlowBlockType, ToolBlockType, getBlockTypeInfo, getBlockLabel } from '@/types/flow';
import type { VapiTool } from '@/types/vapiTools';
import { DraggableBlockData } from '@/components/flow/BlocksPalette';
import { getAssistantInfo, getPromptMaster, createBlockBetween, FIRST_MESSAGE_BLOCK_ID, convertToWhatsApp } from '@/services/flowService';
import { useToast } from '@/hooks/use-toast';
import { toWhatsappPrompt } from '@/lib/whatsappPrompt';
import {
  computeBlockPositionInsert,
  generateBlockKeyFromCanvas,
  canvasTypeToDBType,
} from '@/lib/flowPosition';

// Largura do painel do chat Grazi à esquerda
const CHAT_PANEL_WIDTH = 380;

export default function FlowEditorPage() {
  const { agenteId } = useParams<{ agenteId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawAssistenteId = agenteId || searchParams.get('assistente_id') || '';
  const selectedAssistant = (() => {
    try {
      const raw = localStorage.getItem('sd_selected_assistente');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();
  // tenant_id: URL > localStorage > assistente selecionado (para listar tools da tabela vapi_tools)
  const tenantId =
    searchParams.get('tenant_id') ||
    localStorage.getItem('tenant_id') ||
    (selectedAssistant && (selectedAssistant.tenant_id ?? selectedAssistant.tenantId)) ||
    '';
  const forcedAssistenteId = selectedAssistant?.assistente_id || null;

  const [assistenteId, setAssistenteId] = useState<string>('');
  const [isLoadingAssistenteId, setIsLoadingAssistenteId] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<{ name: string | null; photoUrl: string | null }>({ name: null, photoUrl: null });
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [configGlobalOpen, setConfigGlobalOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [agentConfigOpen, setAgentConfigOpen] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<DraggableBlockData | DraggableCanvasBlockData | null>(null);
  const [promptPickerTarget, setPromptPickerTarget] = useState<DroppableData | null>(null);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);
  const [canalAtivo, setCanalAtivo] = useState<'voz' | 'whatsapp'>('voz');
  const [convertendo, setConvertendo] = useState(false);
  const [pendingAddBlock, setPendingAddBlock] = useState<{
    type: FlowBlockType;
    toolType?: ToolBlockType;
    blockKey?: string;
  } | null>(null);
  const { toast } = useToast();

  const persistence = useFlowPersistence({
    assistenteId: forcedAssistenteId || assistenteId || rawAssistenteId,
    tenantId: tenantId || undefined,
    autoSave: false,
    autoSaveDelay: 0,
  });

  // tenant_id para listar tools: URL/localStorage/assistente > fluxo carregado (tabela vapi_tools)
  const effectiveTenantIdForTools = tenantId || (persistence.flow?.tenant_id ?? '');
  const { data: vapiToolsData } = useVapiTools(effectiveTenantIdForTools || undefined);
  const vapiTools: VapiTool[] = Array.isArray(vapiToolsData) ? vapiToolsData : [];

  // Persistir tenant_id do fluxo quando for o que estamos usando (para tools e próximas aberturas)
  useEffect(() => {
    if (effectiveTenantIdForTools && typeof window !== 'undefined') {
      localStorage.setItem('tenant_id', effectiveTenantIdForTools);
    }
  }, [effectiveTenantIdForTools]);

  const {
    blocks,
    flow,
    isLoading,
    setBlocks,
    addBlock: persistenceAddBlock,
    updateBlock,
    removeBlock,
    loadFlow,
    saveNow,
    availableBlocks,
    manualMode: _manualModeFromPersistence,
    setAvailableBlocks,
  } = persistence;

  // Sempre renderizar blocos no canvas; nunca usar modo manual (paleta vazia, usuário arrastando).
  const manualMode = false;

  useEffect(() => {
    async function fetchAssistenteId() {
      if (!rawAssistenteId) {
        setAssistenteId('');
        return;
      }
      // Evitar acesso ao Supabase no Flow Editor: usar o id direto
      setAssistenteId(rawAssistenteId);
      setIsLoadingAssistenteId(false);
    }
    fetchAssistenteId();
  }, [rawAssistenteId]);

  useEffect(() => {
    fetch('/health').catch(() => {});
  }, []);

  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('tenant_id', tenantId);
    }
  }, [tenantId]);

  const effectiveAssistenteId = forcedAssistenteId || assistenteId || rawAssistenteId;

  const handleWhatsappTranscribe = useCallback(async () => {
    if (!effectiveAssistenteId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Assistente não carregado para transcrever.',
      });
      return;
    }
    try {
      const prompt = await getPromptMaster(effectiveAssistenteId);
      const whatsappText = toWhatsappPrompt(prompt || '');
      if (!whatsappText) {
        toast({
          title: 'Sem conteúdo',
          description: 'Não encontrei um prompt para transcrever.',
        });
        return;
      }
      await navigator.clipboard.writeText(whatsappText);
      toast({
        title: 'Transcrito',
        description: 'Prompt para WhatsApp copiado com sucesso.',
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível transcrever o prompt.',
      });
    }
  }, [effectiveAssistenteId, toast]);

  useEffect(() => {
    if (!effectiveAssistenteId) {
      setAssistantInfo({ name: null, photoUrl: null });
      return;
    }
    getAssistantInfo(effectiveAssistenteId)
      .then(setAssistantInfo)
      .catch(() => setAssistantInfo({ name: null, photoUrl: null }));
  }, [effectiveAssistenteId]);

  const addBlockForCanvas = useCallback(
    (
      type: FlowBlockType,
      toolType?: ToolBlockType,
      parentRouterId?: string,
      routeId?: string,
      content?: string,
      dropData?: DroppableData | null
    ) => {
      // Bloco de caminhos: criar router + 3 blocos de rota já conectados (mapeamento rota ↔ bloco)
      if (type === 'ramificacoes' && !parentRouterId) {
        const router = createBlock('ramificacoes');
        if (content) router.content = content;
        const msg1 = createBlock('texto');
        msg1.content = 'Ótimo! Em que mais posso ajudar?';
        const msg2 = createBlock('texto');
        msg2.content = 'Sem problemas. Posso ajudar em algo mais?';
        const msg3 = createBlock('texto');
        msg3.content = 'Não entendi. Pode repetir?';
        router.routes![0].gotoBlockId = msg1.id;
        router.routes![1].gotoBlockId = msg2.id;
        router.fallback!.gotoBlockId = msg3.id;
        msg1.parentRouterId = router.id;
        msg1.routeId = router.routes![0].id;
        msg2.parentRouterId = router.id;
        msg2.routeId = router.routes![1].id;
        msg3.parentRouterId = router.id;
        msg3.routeId = 'fallback';
        persistenceAddBlock(router).then(() => {
          persistenceAddBlock(msg1).then(() => {
            persistenceAddBlock(msg2).then(() => {
              persistenceAddBlock(msg3);
            });
          });
        });
        return;
      }
      const newBlock = createBlock(type, toolType) as FlowBlock & { blockKey?: string };
      if (content) newBlock.content = content;
      if (parentRouterId) newBlock.parentRouterId = parentRouterId;
      if (routeId) newBlock.routeId = routeId;

      if (dropData) {
        const nextBlocks = [...blocks];
        let insertAt = nextBlocks.length;
        if (dropData.parentRouterId && dropData.routeId) {
          const afterRoute = nextBlocks.findIndex(
            (b) => b.parentRouterId === dropData.parentRouterId && b.routeId === dropData.routeId
          );
          if (afterRoute >= 0) {
            let lastSame = afterRoute;
            while (
              lastSame + 1 < nextBlocks.length &&
              nextBlocks[lastSame + 1].parentRouterId === dropData.parentRouterId &&
              nextBlocks[lastSame + 1].routeId === dropData.routeId
            ) lastSame++;
            insertAt = lastSame + 1;
          } else {
            const ri = nextBlocks.findIndex((b) => b.id === dropData.parentRouterId);
            insertAt = ri >= 0 ? ri + 1 : nextBlocks.length;
          }
          newBlock.parentRouterId = dropData.parentRouterId;
          newBlock.routeId = dropData.routeId;
        } else if (dropData.afterBlockId === null) {
          insertAt = 0;
        } else if (dropData.afterBlockId) {
          const idx = nextBlocks.findIndex((b) => b.id === dropData.afterBlockId);
          insertAt = idx >= 0 ? idx + 1 : nextBlocks.length;
        }
        const pos = computeBlockPositionInsert(nextBlocks, insertAt, {
          parentRouterId: dropData.parentRouterId ?? null,
          routeId: dropData.routeId ?? null,
        });
        newBlock.blockKey = generateBlockKeyFromCanvas(
          canvasTypeToDBType(newBlock.type),
          nextBlocks
        );
        (newBlock as { order_index?: number }).order_index = pos.order_index;
        newBlock.nextBlock = pos.nextBlockId;
        nextBlocks.splice(insertAt, 0, newBlock);
        if (pos.previousBlockId) {
          const prevIdx = nextBlocks.findIndex((b) => b.id === pos.previousBlockId);
          if (prevIdx >= 0) {
            nextBlocks[prevIdx] = { ...nextBlocks[prevIdx], nextBlock: newBlock.id };
          }
        }
        setBlocks(nextBlocks);
        // Não chamar persistenceAddBlock aqui: o bloco já está em nextBlocks; addBlock faria setState(prev => [...prev, block]) e duplicaria.
        return;
      }

      if (parentRouterId && routeId) {
        const naRota = blocks.filter(
          (b) => b.parentRouterId === parentRouterId && b.routeId === routeId
        );
        const lastInRoute = naRota[naRota.length - 1];
        let insertAt = lastInRoute ? blocks.indexOf(lastInRoute) + 1 : blocks.findIndex((b) => b.id === parentRouterId) + 1;
        if (insertAt <= 0) insertAt = blocks.length;
        newBlock.blockKey = generateBlockKeyFromCanvas(
          canvasTypeToDBType(newBlock.type),
          blocks
        );
        (newBlock as { order_index?: number }).order_index = lastInRoute
          ? ((lastInRoute as { order_index?: number }).order_index ?? 0) + 10
          : 100;
        newBlock.nextBlock = null;
        const nextBlocks = [...blocks];
        nextBlocks.splice(insertAt, 0, newBlock);
        if (lastInRoute) {
          const prevIdx = nextBlocks.findIndex((b) => b.id === lastInRoute.id);
          if (prevIdx >= 0) nextBlocks[prevIdx] = { ...nextBlocks[prevIdx], nextBlock: newBlock.id };
        }
        setBlocks(nextBlocks);
        return;
      }
      const rootBlocks = blocks.filter((b) => !b.parentRouterId);
      const lastRoot = rootBlocks[rootBlocks.length - 1];
      const insertAtRoot = lastRoot ? blocks.indexOf(lastRoot) + 1 : 0;
      newBlock.blockKey = generateBlockKeyFromCanvas(
        canvasTypeToDBType(newBlock.type),
        blocks
      );
      (newBlock as { order_index?: number }).order_index = lastRoot
        ? ((lastRoot as { order_index?: number }).order_index ?? 0) + 10
        : 0;
      newBlock.nextBlock = null;
      const nextBlocksRoot = [...blocks];
      nextBlocksRoot.splice(insertAtRoot, 0, newBlock);
      if (lastRoot) {
        const prevIdx = nextBlocksRoot.findIndex((b) => b.id === lastRoot.id);
        if (prevIdx >= 0) nextBlocksRoot[prevIdx] = { ...nextBlocksRoot[prevIdx], nextBlock: newBlock.id };
      }
      setBlocks(nextBlocksRoot);
    },
    [blocks, persistenceAddBlock, updateBlock, setBlocks]
  );

  const insertBlockAfterIndex = useCallback(
    (block: FlowBlock, afterIndex: number) => {
      const nextBlocks = [...blocks];
      const insertAt = Math.min(Math.max(afterIndex + 1, 0), nextBlocks.length);
      nextBlocks.splice(insertAt, 0, block);
      setBlocks(nextBlocks);
    },
    [blocks, setBlocks]
  );

  const moveBlockToPosition = useCallback(
    (
      blockId: string,
      afterBlockId: string | null,
      parentConditionId?: string | null,
      branchType?: 'yes' | 'no' | null,
      parentRouterId?: string | null,
      routeId?: string | null
    ) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const rest = blocks.filter((b) => b.id !== blockId);
      const updated: FlowBlock = {
        ...block,
        parentConditionId: parentConditionId ?? block.parentConditionId ?? null,
        branchType: branchType ?? block.branchType ?? null,
        parentRouterId: parentRouterId ?? block.parentRouterId ?? null,
        routeId: routeId ?? block.routeId ?? null,
      };
      let insertAt: number;
      if (parentRouterId && routeId) {
        const afterRoute = rest.findIndex((b) => b.parentRouterId === parentRouterId && b.routeId === routeId);
        if (afterRoute >= 0) {
          let lastSame = afterRoute;
          while (lastSame + 1 < rest.length && rest[lastSame + 1].parentRouterId === parentRouterId && rest[lastSame + 1].routeId === routeId) {
            lastSame++;
          }
          insertAt = lastSame + 1;
        } else {
          const routerIndex = rest.findIndex((b) => b.id === parentRouterId);
          insertAt = routerIndex >= 0 ? routerIndex + 1 : rest.length;
        }
      } else if (afterBlockId !== null) {
        const idx = rest.findIndex((b) => b.id === afterBlockId);
        insertAt = idx >= 0 ? idx + 1 : rest.length;
      } else {
        insertAt = 0;
      }
      rest.splice(insertAt, 0, updated);
      setBlocks(rest);
    },
    [blocks, setBlocks]
  );

  const usedBlockKeys = useMemo(() => {
    const used = new Set<string>();
    blocks.forEach((b) => used.add((b as any).blockKey || b.id));
    return used;
  }, [blocks]);

  // Filtro por canal: config (order_index < 0) em ambas as abas; flow blocks por canal
  const blocosVisiveis = useMemo(() => {
    if (!blocks.length) return [];
    const orderIdx = (b: FlowBlock) => (b as { order_index?: number }).order_index ?? 999999;
    const config = blocks.filter((b) => orderIdx(b) < 0);
    const flow =
      canalAtivo === 'voz'
        ? blocks.filter((b) => {
            const o = orderIdx(b);
            if (o < 0) return false;
            const c = (b as { canal?: string }).canal;
            return !c || c === 'voz';
          })
        : blocks.filter((b) => {
            const o = orderIdx(b);
            if (o < 0) return false;
            return (b as { canal?: string }).canal === 'whatsapp';
          });
    return [...config, ...flow].sort((a, b) => orderIdx(a) - orderIdx(b));
  }, [blocks, canalAtivo]);

  /** Blocos WhatsApp no MESMO flow (canal='whatsapp', order_index >= 0; exclui config) */
  const temBlocosWhats = useMemo(
    () =>
      blocks.some(
        (b) =>
          (b as { canal?: string }).canal === 'whatsapp' &&
          ((b as { order_index?: number }).order_index ?? 999999) >= 0
      ),
    [blocks]
  );

  /** Blocos de fluxo de voz (order_index >= 0 e canal null ou voz) — para habilitar/desabilitar conversão */
  const temBlocosVoz = useMemo(() => {
    return blocks.some((b) => {
      const o = (b as { order_index?: number }).order_index ?? 999999;
      const c = (b as { canal?: string }).canal;
      return o >= 0 && (!c || c === 'voz');
    });
  }, [blocks]);

  // Blocos do painel "Blocos do Prompt" = blocos do fluxo + tools da vapi_tools (Supabase)
  const vapiToolsAsBlocks = useMemo((): (FlowBlock & { blockKey: string })[] => {
    return (vapiTools || [])
      .filter((t) => t.is_active)
      .map((t: VapiTool) => {
        const blockKey = `vapi_${t.id}`;
        return {
          id: blockKey,
          blockKey,
          type: 'tool' as const,
          content: t.tool_name || 'Tool',
          toolType: t.tool_type,
          toolConfig: {
            toolId: t.id,
            toolName: t.tool_name,
            toolType: t.tool_type,
            fileType: t.file_type || undefined,
            promptInstructions: t.prompt_instructions || undefined,
            instancia: t.instancia || undefined,
            fileUrl: t.file_url || undefined,
            mensagem: t.mensagem || undefined,
          },
          nextBlock: null,
          parentRouterId: null,
          routeId: null,
          parentConditionId: null,
          branchType: null,
          gotoBlockId: null,
        };
      });
  }, [vapiTools]);

  const promptBlocksList = useMemo(
    () => [...availableBlocks, ...vapiToolsAsBlocks],
    [availableBlocks, vapiToolsAsBlocks]
  );

  const promptOrderOptions = useMemo(() => {
    const map = new Map<string, string>();
    const all = [...blocks, ...availableBlocks];
    all.forEach((b) => {
      if (b.id === FIRST_MESSAGE_BLOCK_ID) return;
      const key = (b as any).blockKey || b.id;
      if (!key || map.has(key)) return;
      map.set(key, `${key} • ${getBlockLabel(b as FlowBlock)}`);
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [blocks, availableBlocks]);

  const openPromptPicker = useCallback((data?: DroppableData | null) => {
    setPromptPickerTarget(data ?? null);
    setPromptPanelOpen(true);
  }, []);

  const closePromptPicker = useCallback(() => {
    setPromptPickerTarget(null);
    setPromptPanelOpen(false);
  }, []);

  const insertPromptBlock = useCallback(
    (blockKey: string, dropData?: DroppableData, blockOverride?: FlowBlock & { blockKey?: string }) => {
      const isVapiTool = blockKey.startsWith('vapi_');
      let block: (FlowBlock & { blockKey?: string }) | undefined =
        blockOverride ||
        availableBlocks.find((b) => ((b as any).blockKey || b.id) === blockKey);

      if (!block && isVapiTool) {
        const toolId = blockKey.replace(/^vapi_/, '');
        const tool = vapiTools.find((t) => t.id === toolId);
        if (tool) {
          const base = createBlock('tool', tool.tool_type);
          block = {
            ...base,
            content: tool.tool_name || base.content,
            toolType: tool.tool_type,
            toolConfig: {
              toolId: tool.id,
              toolName: tool.tool_name,
              toolType: tool.tool_type,
              fileType: tool.file_type || undefined,
              promptInstructions: tool.prompt_instructions || undefined,
              instancia: tool.instancia || undefined,
              fileUrl: tool.file_url || undefined,
              mensagem: tool.mensagem || undefined,
            },
            blockKey: undefined,
          };
        }
      }
      if (!block) return;
      if (!isVapiTool && usedBlockKeys.has(blockKey)) return;

      const cleanBlock = {
        ...block,
        id: block.id.startsWith('vapi_') ? `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` : block.id,
        parentRouterId: null,
        routeId: null,
        parentConditionId: null,
        branchType: null,
        nextBlock: null,
        gotoBlockId: null,
        ...(block.blockKey?.startsWith('vapi_') ? {} : { blockKey: block.blockKey }),
      } as FlowBlock & { blockKey?: string };

      const nextBlocks = [...blocks];
      let insertAt = nextBlocks.length;

      if (dropData?.parentRouterId && dropData?.routeId) {
        const afterRoute = nextBlocks.findIndex(
          (b) => b.parentRouterId === dropData.parentRouterId && b.routeId === dropData.routeId
        );
        if (afterRoute >= 0) {
          let lastSame = afterRoute;
          while (
            lastSame + 1 < nextBlocks.length &&
            nextBlocks[lastSame + 1].parentRouterId === dropData.parentRouterId &&
            nextBlocks[lastSame + 1].routeId === dropData.routeId
          ) {
            lastSame++;
          }
          insertAt = lastSame + 1;
        } else {
          const routerIndex = nextBlocks.findIndex((b) => b.id === dropData.parentRouterId);
          insertAt = routerIndex >= 0 ? routerIndex + 1 : nextBlocks.length;
        }
        cleanBlock.parentRouterId = dropData.parentRouterId;
        cleanBlock.routeId = dropData.routeId;
      } else if (dropData && dropData.afterBlockId === null) {
        insertAt = 0;
      } else if (dropData?.afterBlockId) {
        const idx = nextBlocks.findIndex((b) => b.id === dropData.afterBlockId);
        insertAt = idx >= 0 ? idx + 1 : nextBlocks.length;
      }

      const pos = computeBlockPositionInsert(nextBlocks, insertAt, {
        parentRouterId: dropData?.parentRouterId ?? null,
        routeId: dropData?.routeId ?? null,
      });
      if (!cleanBlock.blockKey) {
        cleanBlock.blockKey = generateBlockKeyFromCanvas(
          canvasTypeToDBType(cleanBlock.type),
          nextBlocks
        );
      }
      (cleanBlock as { order_index?: number }).order_index = pos.order_index;
      cleanBlock.nextBlock = pos.nextBlockId;

      nextBlocks.splice(insertAt, 0, cleanBlock);
      if (pos.previousBlockId) {
        const prevIdx = nextBlocks.findIndex((b) => b.id === pos.previousBlockId);
        if (prevIdx >= 0) {
          nextBlocks[prevIdx] = { ...nextBlocks[prevIdx], nextBlock: cleanBlock.id };
        }
      }
      setBlocks(nextBlocks);
    },
    [availableBlocks, blocks, setBlocks, usedBlockKeys, vapiTools]
  );

  const handleInsertPositionConfirm = useCallback(
    (position: InsertPosition) => {
      if (!pendingAddBlock) return;
      const dropData: DroppableData | undefined =
        position === 'start'
          ? { position: 'root', afterBlockId: null }
          : position === 'end'
            ? undefined
            : { position: 'root', afterBlockId: position.afterBlockId };
      if (pendingAddBlock.blockKey) {
        insertPromptBlock(pendingAddBlock.blockKey, dropData);
      } else {
        addBlockForCanvas(
          pendingAddBlock.type,
          pendingAddBlock.toolType,
          undefined,
          undefined,
          undefined,
          dropData
        );
      }
      setPendingAddBlock(null);
    },
    [pendingAddBlock, insertPromptBlock, addBlockForCanvas]
  );

  /** Ao adicionar na raiz (paleta / DropZone): abre o diálogo para escolher onde inserir. Dentro de rota: insere direto. */
  const handleCanvasAddBlock = useCallback(
    (type: FlowBlockType, toolType?: ToolBlockType, parentRouterId?: string, routeId?: string, content?: string) => {
      if (parentRouterId !== undefined && routeId !== undefined) {
        addBlockForCanvas(type, toolType, parentRouterId, routeId, content);
        return;
      }
      setPendingAddBlock({ type, toolType });
    },
    [addBlockForCanvas]
  );

  const handleCreatePromptBlock = useCallback(
    async ({
      type,
      content,
      insertAfterKey,
      insertBeforeKey,
    }: {
      type: FlowBlockType;
      content: string;
      insertAfterKey: string;
      insertBeforeKey: string;
    }) => {
      if (!flow?.id) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Flow não carregado para criar bloco.',
        });
        return null;
      }
      const dbTypeMap: Record<FlowBlockType, string> = {
        primeira_mensagem: 'primeira_mensagem',
        texto: 'mensagem',
        ramificacoes: 'caminhos',
        aguardar: 'aguardar',
        encerrar: 'encerrar',
        tool: 'ferramenta',
      };
      const dbType = dbTypeMap[type];
      if (!dbType) return null;
      try {
        const created = await createBlockBetween(flow.id, {
          block_type: dbType,
          content,
          insert_after_key: insertAfterKey,
          insert_before_key: insertBeforeKey,
          tool_type: null,
        });
        const canvasTypeMap: Record<string, FlowBlockType> = {
          primeira_mensagem: 'primeira_mensagem',
          mensagem: 'texto',
          caminhos: 'ramificacoes',
          aguardar: 'aguardar',
          encerrar: 'encerrar',
          ferramenta: 'tool',
        };
        const canvasBlock: FlowBlock & { blockKey: string } = {
          id: created.id,
          type: canvasTypeMap[created.block_type] || 'texto',
          toolType: created.tool_type || undefined,
          content: created.content || '',
          parentRouterId: null,
          routeId: null,
          parentConditionId: null,
          branchType: null,
          nextBlock: null,
          gotoBlockId: null,
          routes: [],
          fallback: undefined,
          blockKey: created.block_key,
        };
        setAvailableBlocks((prev) => {
          const exists = prev.some((b) => (b as any).blockKey === canvasBlock.blockKey);
          return exists ? prev : [...prev, canvasBlock];
        });
        if (promptPickerTarget) {
          insertPromptBlock(canvasBlock.blockKey, promptPickerTarget, canvasBlock);
        }
        // Bloco de caminhos: backend criou router + 3 blocos de rota; recarregar para mostrar todos
        if (created.block_type === 'caminhos') {
          loadFlow({ forceRefreshCanvas: true });
        }
        return canvasBlock.blockKey;
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao criar bloco no banco.',
        });
        return null;
      }
    },
    [flow?.id, toast, setAvailableBlocks, promptPickerTarget, insertPromptBlock, loadFlow]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedBlock(null);
      const { active, over } = event;
      if (!over) return;
      const dragData = active.data.current as DraggableBlockData | DraggableCanvasBlockData | PromptDraggableBlockData;
      const dropData = over.data.current as DroppableData;
      if (!dragData || !dropData) return;

      if ('source' in dragData && dragData.source === 'canvas') {
        moveBlockToPosition(
          dragData.blockId,
          dropData.afterBlockId ?? null,
          dropData.parentConditionId ?? null,
          dropData.branchType ?? null,
          dropData.parentRouterId ?? null,
          dropData.routeId ?? null
        );
      } else if ('source' in dragData && dragData.source === 'prompt') {
        insertPromptBlock(dragData.blockKey, dropData);
      } else {
        const paletteData = dragData as DraggableBlockData;
        addBlockForCanvas(
          paletteData.type,
          paletteData.toolType,
          dropData.parentRouterId ?? undefined,
          dropData.routeId ?? undefined,
          undefined,
          dropData
        );
      }
    },
    [moveBlockToPosition, addBlockForCanvas, insertPromptBlock]
  );

  const handleDragStart = useCallback((event: { active: { data: { current: unknown } } }) => {
    const data = event.active.data.current as DraggableBlockData | DraggableCanvasBlockData | PromptDraggableBlockData;
    if (data) setDraggedBlock(data);
  }, []);

  const selectedBlock = useMemo(
    () => (selectedBlockId ? blocosVisiveis.find((b) => b.id === selectedBlockId) ?? null : null),
    [blocosVisiveis, selectedBlockId]
  );

  const handleConverterWhatsApp = useCallback(async () => {
    if (!flow?.id || convertendo) return;
    setConvertendo(true);
    try {
      const result = await convertToWhatsApp(
        flow.id,
        tenantId || '',
        effectiveAssistenteId || undefined
      );
      if (result.success) {
        await loadFlow({ forceRefreshCanvas: true });
        setCanalAtivo('whatsapp');
        const total = result.total_blocos ?? 0;
        toast({ title: 'Sucesso', description: `Fluxo WhatsApp criado com ${total} blocos!` });
      } else {
        const msg =
          result.error === 'timeout'
            ? 'A conversão pode levar até 2 minutos. Verifique em alguns instantes se o fluxo WhatsApp foi criado e recarregue a página.'
            : result.error || 'Falha na conversão. Tente novamente.';
        toast({ variant: 'destructive', title: 'Erro', description: msg });
      }
    } catch (e) {
      console.error('Erro ao converter para WhatsApp:', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao converter. Tente novamente.' });
    } finally {
      setConvertendo(false);
    }
  }, [flow?.id, tenantId, effectiveAssistenteId, convertendo, loadFlow, toast]);

  const handleDuplicateBlock = useCallback(() => {
    if (!selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    const newBlock = createBlock(block.type, block.toolType, block.parentConditionId ?? undefined, block.branchType ?? undefined);
    newBlock.content = block.content + ' (cópia)';
    if (block.parentRouterId) newBlock.parentRouterId = block.parentRouterId;
    if (block.routeId) newBlock.routeId = block.routeId;
    persistenceAddBlock(newBlock);
  }, [selectedBlockId, blocks, persistenceAddBlock]);

  const pageContent = (
    <>
      <div className="h-screen overflow-hidden flex flex-col bg-background relative">
        <header className="h-16 border-b border-[rgba(165,148,255,0.25)] bg-gradient-to-b from-background via-background/90 to-background/80 backdrop-blur-md flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Flow Editor</span>
              <span className="text-[11px] text-muted-foreground">Monte o fluxo do jeito que quiser</span>
            </div>
            <Button
              variant={promptPanelOpen ? "secondary" : "outline"}
              size="sm"
              className="h-9 gap-2 rounded-full border border-[rgba(165,148,255,0.35)]"
              onClick={() => (promptPanelOpen ? closePromptPicker() : openPromptPicker())}
              title="Abrir blocos do Prompt"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">Blocos do Prompt</span>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={configGlobalOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-8 gap-2"
              onClick={() => {
                setConfigGlobalOpen(true);
                setChatPanelOpen(false);
              }}
              title="Configuração global (Prompt Master)"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Config. global</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={handleWhatsappTranscribe}
              title="Transcrever prompt para WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => {
                const q = new URLSearchParams();
                if (effectiveTenantIdForTools) q.set('tenant_id', effectiveTenantIdForTools);
                if (effectiveAssistenteId) q.set('assistente_id', effectiveAssistenteId);
                navigate('/tools' + (q.toString() ? '?' + q.toString() : ''));
              }}
              title="Gerenciar ferramentas (página inteira)"
            >
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Gerenciar Tools</span>
            </Button>

            <Button
              variant={chatPanelOpen ? 'secondary' : 'outline'}
              size="sm"
              className="h-9 gap-2 relative"
              onClick={() => {
                setChatPanelOpen(true);
                setConfigGlobalOpen(false);
              }}
              title="Abrir chat Grazi (editar prompt por conversa)"
            >
              <span className="relative inline-flex items-center justify-center">
                <img
                  src="https://gwjcgzeybqiyqezuswpt.supabase.co/storage/v1/object/public/profile-pictures/GRAZI.png"
                  alt="Grazi"
                  className="w-6 h-6 rounded-full object-cover border border-[rgba(165,148,255,0.3)]"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Grazi&background=A594FF&color=fff&size=128'; }}
                />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              </span>
              <span className="hidden sm:inline">Grazi</span>
            </Button>

            {effectiveAssistenteId && (
              <Button size="sm" className="h-8" onClick={() => saveNow(canalAtivo)} disabled={persistence.isSaving}>
                {persistence.isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Painel Prompt (montagem manual) à esquerda */}
            {manualMode && promptPanelOpen && (
              <div
                className="flex flex-col overscroll-contain h-full"
                onWheel={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  className="px-3 py-2 border-r bg-card flex items-center justify-between w-80 flex-shrink-0"
                  onWheel={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-semibold text-muted-foreground">Blocos do Prompt</span>
                  <Button size="sm" variant="outline" onClick={closePromptPicker}>
                    Fechar
                  </Button>
                </div>
                <PromptBlocksPanel
                  blocks={promptBlocksList}
                  usedKeys={usedBlockKeys}
                  onAddBlock={(blockKey) => {
                    const dropData = promptPickerTarget ?? undefined;
                    if (!dropData) {
                      const block =
                        availableBlocks.find((b) => ((b as any).blockKey || b.id) === blockKey) ||
                        (blockKey.startsWith('vapi_') ? vapiToolsAsBlocks.find((b) => (b.blockKey || b.id) === blockKey) : undefined);
                      if (block) {
                        setPendingAddBlock({
                          type: block.type,
                          toolType: block.toolType,
                          blockKey,
                        });
                        return;
                      }
                    }
                    insertPromptBlock(blockKey, dropData);
                  }}
                  orderOptions={promptOrderOptions}
                  canalAtivo={canalAtivo}
                  onCreateBlock={handleCreatePromptBlock}
                  onSave={() => saveNow(canalAtivo)}
                  isSaving={persistence.isSaving}
                  disableSave={blocks.length === 0}
                />
              </div>
            )}

            {/* Flow canvas à direita (conteúdo principal) */}
            <main className="flex-1 flex overflow-hidden min-w-0 order-1 relative flex flex-col">
              {/* Abas Voz / WhatsApp + botão Converter para WhatsApp */}
              <div className="flex items-center gap-2 flex-shrink-0 mx-2 mt-2 flex-wrap">
                <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setCanalAtivo('voz')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      canalAtivo === 'voz'
                        ? 'bg-background shadow text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Voz
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanalAtivo('whatsapp')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      canalAtivo === 'whatsapp'
                        ? 'bg-background shadow text-green-700'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    WhatsApp
                  </button>
                </div>
                {canalAtivo === 'voz' && !temBlocosWhats && (
                  <Button
                    onClick={handleConverterWhatsApp}
                    disabled={convertendo || !flow?.id || !temBlocosVoz}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    size="sm"
                  >
                    {convertendo ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Convertendo...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        Converter para WhatsApp
                      </>
                    )}
                  </Button>
                )}
              </div>
              {canalAtivo === 'whatsapp' && !temBlocosWhats && !isLoading && (
                <div className="flex flex-1 flex-col items-center justify-center py-20 gap-4 px-4">
                  <div className="text-5xl">WhatsApp</div>
                  <h3 className="text-lg font-medium text-foreground">Nenhum fluxo de WhatsApp ainda</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Converta seu fluxo de voz para WhatsApp automaticamente. A IA vai adaptar as mensagens, remover
                    pausas e ajustar pro formato de chat.
                  </p>
                  <Button
                    onClick={handleConverterWhatsApp}
                    disabled={convertendo || !flow?.id || !temBlocosVoz}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 disabled:opacity-50"
                  >
                    {convertendo ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Convertendo...
                      </>
                    ) : (
                      <>Converter fluxo de voz para WhatsApp</>
                    )}
                  </Button>
                </div>
              )}
              {/* Área central: canvas e painel de propriedades lado a lado */}
              <div className="flex-1 flex min-w-0 overflow-hidden flex-row">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
              {!(canalAtivo === 'whatsapp' && !temBlocosWhats && !isLoading) && (
              <FlowCanvas
                blocks={blocosVisiveis}
                selectedBlockId={selectedBlockId}
                agentName={assistantInfo.name || 'Assistente'}
                agentPhotoUrl={assistantInfo.photoUrl ?? undefined}
                onOpenAgentConfig={() => setAgentConfigOpen(true)}
                onSelectBlock={setSelectedBlockId}
                onAddBlock={handleCanvasAddBlock}
                onDeleteBlock={removeBlock}
                onUpdateBlock={updateBlock}
                manualMode={manualMode}
                onRequestPromptInsert={openPromptPicker}
              />
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Carregando fluxo...</p>
                  </div>
                </div>
              )}

              {manualMode && blocosVisiveis.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-card/90 border rounded-xl px-4 py-3 text-sm text-muted-foreground shadow-sm">
                    Monte o fluxo usando os blocos do painel “Prompt”
                  </div>
                </div>
              )}
                </div>
                {selectedBlock && (
                  <PropertiesPanel
                  selectedBlock={selectedBlock}
                  allBlocks={blocosVisiveis}
                  onUpdate={(updates) => updateBlock(selectedBlockId!, updates)}
                  onDelete={() => {
                    if (selectedBlockId) removeBlock(selectedBlockId);
                    setSelectedBlockId(null);
                  }}
                  onDuplicate={handleDuplicateBlock}
                  onClose={() => setSelectedBlockId(null)}
                  vapiTools={vapiTools}
                  />
                )}
              </div>
            </main>

            {/* Chat Grazi (Prompt Manager) à direita, pode fechar */}
            {chatPanelOpen && effectiveAssistenteId && (
              <aside className="flex-shrink-0 overflow-hidden order-2 border-l border-[rgba(165,148,255,0.2)]" style={{ width: CHAT_PANEL_WIDTH }}>
                <FlowChatPanel
                  open={true}
                  onOpenChange={setChatPanelOpen}
                  assistenteId={effectiveAssistenteId}
                  assistantName={assistantInfo.name}
                  assistantPhotoUrl={assistantInfo.photoUrl}
                  tenantId={tenantId || undefined}
                  flowId={flow?.id ?? null}
                  onFlowUpdate={loadFlow}
                  onBlocksUpdated={() => loadFlow({ forceRefreshCanvas: true })}
                  blocks={blocks}
                  onUpdateBlock={updateBlock}
                  onAddBlock={persistenceAddBlock}
                  onInsertBlock={insertBlockAfterIndex}
                  onSaveFlow={() => saveNow(canalAtivo)}
                  onTranscribePrompt={handleWhatsappTranscribe}
                  variant="panel"
                />
              </aside>
            )}

            <InsertBlockPositionDialog
              open={!!pendingAddBlock}
              onOpenChange={(open) => !open && setPendingAddBlock(null)}
              blocks={blocks}
              blockType={pendingAddBlock?.type ?? 'texto'}
              toolType={pendingAddBlock?.toolType}
              onConfirm={handleInsertPositionConfirm}
            />

            <DragOverlay>
              {draggedBlock && (() => {
                const isCanvas = 'source' in draggedBlock && draggedBlock.source === 'canvas';
                const isPrompt = 'source' in draggedBlock && draggedBlock.source === 'prompt';
                const typeInfo = isCanvas ? getBlockTypeInfo(draggedBlock.block) : null;
                return (
                  <div
                    className="px-3 py-2 rounded-lg border-2 border-primary shadow-xl flex items-center gap-2 bg-card"
                    style={{
                      borderColor: isCanvas
                        ? typeInfo?.color
                        : isPrompt
                          ? (draggedBlock as PromptDraggableBlockData).color
                          : (draggedBlock as DraggableBlockData).color,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: isCanvas
                          ? typeInfo?.bgColor
                          : isPrompt
                            ? (draggedBlock as PromptDraggableBlockData).bgColor
                            : (draggedBlock as DraggableBlockData).bgColor,
                      }}
                    >
                      <FlowBlockIcon
                        type={
                          isCanvas
                            ? draggedBlock.block.type
                            : isPrompt
                              ? (draggedBlock as PromptDraggableBlockData).type
                              : (draggedBlock as DraggableBlockData).type
                        }
                        toolType={
                          isCanvas
                            ? draggedBlock.block.toolType
                            : isPrompt
                              ? (draggedBlock as PromptDraggableBlockData).toolType
                              : (draggedBlock as DraggableBlockData).toolType
                        }
                        className="w-4 h-4"
                        style={{
                          color: isCanvas
                            ? typeInfo?.color
                            : isPrompt
                              ? (draggedBlock as PromptDraggableBlockData).color
                              : (draggedBlock as DraggableBlockData).color,
                        }}
                      />
                    </div>
                    <span className="font-medium text-sm">
                      {isCanvas
                        ? getBlockLabel(draggedBlock.block)
                        : isPrompt
                          ? (draggedBlock as PromptDraggableBlockData).label
                          : (draggedBlock as DraggableBlockData).label}
                    </span>
                  </div>
                );
              })()}
            </DragOverlay>
          </DndContext>
        </div>

      </div>

      <GlobalConfigPanel
        open={configGlobalOpen}
        onOpenChange={setConfigGlobalOpen}
        assistenteId={effectiveAssistenteId || null}
        tenantId={tenantId || undefined}
      />
    </>
  );

  // Flow Editor é sempre full-screen (sem sidebar do app) para evitar menu duplicado
  if (isLoadingAssistenteId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground text-sm">Carregando assistente...</p>
      </div>
    );
  }

  return pageContent;
}
