// ============================================================================
// USE FLOW PERSISTENCE - Hook para persistência do Flow Editor (Produção)
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { FlowBlock } from '@/types/flow';
import { FlowDB, FlowBlockDB, dbBlocksToCanvasBlocks } from '@/types/flowDB';
import {
  loadFlowByAssistant,
  getOrCreateFlow,
  saveAllBlocks,
  deleteBlock,
  publishFlow,
  FlowServiceData,
} from '@/services/flowService';
import { toast } from 'sonner';

interface UseFlowPersistenceOptions {
  assistenteId: string;
  tenantId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseFlowPersistenceReturn {
  // State
  flow: FlowDB | null;
  blocks: (FlowBlock & { blockKey?: string })[];
  availableBlocks: (FlowBlock & { blockKey?: string })[];
  manualMode: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;
  tenantId: string | null;
  
  // Actions
  /** Recarrega o fluxo do servidor. forceRefreshCanvas=true: após Grazi aplicar ações, coloca todos os blocos no canvas. */
  loadFlow: (options?: { forceRefreshCanvas?: boolean }) => Promise<void>;
  saveBlocks: (blocks: FlowBlock[], canal?: 'voz' | 'whatsapp') => Promise<void>;
  addBlock: (block: FlowBlock) => Promise<FlowBlock | null>;
  updateBlock: (blockId: string, updates: Partial<FlowBlock>) => void;
  removeBlock: (blockId: string) => Promise<void>;
  setBlocks: (blocks: FlowBlock[]) => void;
  setAvailableBlocks: (blocks: (FlowBlock & { blockKey?: string })[]) => void;
  setManualMode: (value: boolean) => void;
  markDirty: () => void;
  saveNow: (canal?: 'voz' | 'whatsapp') => Promise<void>;
  publish: () => Promise<void>;
}

export function useFlowPersistence(options: UseFlowPersistenceOptions): UseFlowPersistenceReturn {
  const { assistenteId, tenantId: providedTenantId, autoSave = true, autoSaveDelay = 2000 } = options;
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isOffline = !!searchParams && searchParams.get('offline') === '1';
  const shouldClearDraft = !!searchParams && searchParams.get('clear_draft') === '1';
  const selectedAssistant = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('sd_selected_assistente');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  })();
  
  // State
  const [flow, setFlow] = useState<FlowDB | null>(null);
  const [blocks, setBlocksState] = useState<(FlowBlock & { blockKey?: string })[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<(FlowBlock & { blockKey?: string })[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blocksRef = useRef<FlowBlock[]>(blocks);
  
  // Keep blocksRef in sync
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const DRAFT_KEY = (aid: string) => `flow_draft_${aid}`;
  const MANUAL_READY_KEY = (flowId: string) => `flow_manual_ready_${flowId}`;

  // Persistir rascunho no localStorage sempre que blocos ou flow mudarem (para não perder ao adicionar bloco)
  useEffect(() => {
    if (!assistenteId || !flow?.id || blocks.length === 0) return;
    try {
      const draft = { flowId: flow.id, blocks, updatedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY(assistenteId), JSON.stringify(draft));
    } catch (e) {
      console.warn('flow draft localStorage write failed', e);
    }
  }, [assistenteId, flow?.id, blocks]);

  // Get tenant ID from URL params, localStorage, or provided prop
  useEffect(() => {
    function getTenantId() {
      // 1. Use provided tenantId
      if (providedTenantId) {
        setTenantId(providedTenantId);
        return;
      }
      
      // 2. Try URL params
      const urlParams = new URLSearchParams(window.location.search);
      const urlTenantId = urlParams.get('tenant_id');
      if (urlTenantId) {
        setTenantId(urlTenantId);
        return;
      }
      
      // 3. Try localStorage
      const storedTenantId = localStorage.getItem('tenant_id');
      if (storedTenantId) {
        setTenantId(storedTenantId);
        return;
      }
      
      // 4. Fallback: use assistente_id (não ideal, mas funciona)
      console.warn('⚠️ tenant_id não encontrado. Usando assistente_id como fallback.');
      setTenantId(assistenteId);
    }
    getTenantId();
  }, [providedTenantId, assistenteId]);
  
  // ============================================================================
  // LOAD FLOW
  // ============================================================================
  
  const loadFlow = useCallback(async (options?: { forceRefreshCanvas?: boolean }) => {
    const forceRefreshCanvas = options?.forceRefreshCanvas === true;
    if (!assistenteId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (shouldClearDraft) {
        try {
          localStorage.removeItem(DRAFT_KEY(assistenteId));
        } catch (_) {}
      }
      if (isOffline) {
        const localId = assistenteId || 'offline';
        let blocksFromSnapshot: FlowBlock[] = [];
        try {
          const res = await fetch(`/api/flow-editor/snapshot/latest?assistente_id=${encodeURIComponent(localId)}`);
          if (res.ok) {
            const payload = await res.json();
            blocksFromSnapshot = Array.isArray(payload?.snapshot?.blocks) ? payload.snapshot.blocks : [];
          }
        } catch (_) {}
        const raw = localStorage.getItem(DRAFT_KEY(localId));
        const draft = raw ? JSON.parse(raw) : null;
        const blocksOffline = blocksFromSnapshot.length > 0
          ? blocksFromSnapshot
          : Array.isArray(draft?.blocks) ? draft.blocks : [];
        setFlow({
          id: `offline_${localId}`,
          tenant_id: tenantId || localId,
          assistente_id: localId,
          name: 'Flow Offline',
          description: null,
          prompt_base: null,
          status: 'draft',
          is_active: false,
          version: 0,
          published_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setBlocksState(blocksOffline);
        setIsDirty(false);
        return;
      }
      // Produção: usuário abriu o assistente pelo SaaS → puxar fluxo desse assistente_id e montar blocos no canvas automaticamente
      const data = await getOrCreateFlow(assistenteId, 'Novo Fluxo', tenantId || undefined);
      setFlow(data.flow);
      let blocksToSet = data.blocks;
      let usedDraft = false;

      // Quando Grazi aplicou ações: forçar canvas com todos os blocos do servidor (refetch completo)
      if (forceRefreshCanvas) {
        setManualMode(false);
        setAvailableBlocks([]);
        if (blocksToSet && blocksToSet.length > 0) {
          localStorage.removeItem(DRAFT_KEY(assistenteId));
        }
        setBlocksState(blocksToSet ?? []);
        setIsDirty(false);
        return;
      }

      // Sempre exibir no canvas os blocos vindos do servidor (ordem do prompt + caminhos).
      // Não usar modo manual ao carregar: canvas deve vir preenchido e ordenado.
      setManualMode(false);
      setAvailableBlocks([]);
      try {
        // Sempre priorizar o servidor. Só usar rascunho se o servidor vier vazio.
        if (!blocksToSet || blocksToSet.length === 0) {
          const raw = localStorage.getItem(DRAFT_KEY(assistenteId));
          if (raw && data.flow?.id) {
            const draft = JSON.parse(raw);
            if (draft?.flowId === data.flow.id && Array.isArray(draft.blocks) && draft.blocks.length > 0) {
              blocksToSet = draft.blocks;
              usedDraft = true;
            }
          }
        } else {
          // Limpar rascunho para não sobrescrever o servidor
          localStorage.removeItem(DRAFT_KEY(assistenteId));
        }
      } catch (_) {}
      setBlocksState(blocksToSet ?? []);
      setIsDirty(usedDraft);
    } catch (err) {
      console.error('Error loading flow:', err);
      const message = (err as Error)?.message ?? '';
      if (message.includes('SUPABASE_KEY is required')) {
        setError('Servidor não configurado');
        toast.error('Servidor não configurado. Configure SUPABASE_URL e SUPABASE_KEY no backend (pasta saas_server).');
      } else {
        setError('Erro ao carregar fluxo');
        toast.error('Erro ao carregar fluxo');
      }
    } finally {
      setIsLoading(false);
    }
  }, [assistenteId, tenantId]);

  // Load on mount
  useEffect(() => {
    loadFlow();
  }, [loadFlow]);
  
  // ============================================================================
  // SAVE BLOCKS
  // ============================================================================
  
  const saveBlocks = useCallback(async (blocksToSave: FlowBlock[], canal?: 'voz' | 'whatsapp') => {
    if (!flow?.id || !tenantId) return;
    if (isOffline) {
      setBlocksState(blocksToSave);
      setIsDirty(false);
      toast.success('Rascunho local atualizado');
      return;
    }
    
    const toSave =
      canal === 'voz' || canal === 'whatsapp'
        ? blocksToSave.filter((b) => {
            const o = (b as { order_index?: number }).order_index;
            if (o !== undefined && o < 0) return true;
            return canal === 'voz' ? !b.canal || b.canal === 'voz' : b.canal === 'whatsapp';
          })
        : blocksToSave;

    setIsSaving(true);
    
    try {
      const savedBlocks = await saveAllBlocks(flow.id, toSave, tenantId, assistenteId, canal);
      
      // Primeira mensagem fica em Configurações globais (assistentes.first_message), não no canvas
      const canvasFromApi = dbBlocksToCanvasBlocks(savedBlocks);
      const updatedBlocks = canvasFromApi;

      setBlocksState(updatedBlocks);
      setIsDirty(false);
      if (manualMode && updatedBlocks.length > 0 && flow?.id) {
        try {
          localStorage.setItem(MANUAL_READY_KEY(flow.id), '1');
        } catch (_) {}
        setManualMode(false);
        setAvailableBlocks([]);
      }
      toast.success('Fluxo salvo!');
    } catch (err) {
      console.error('Error saving blocks:', err);
      setError('Erro ao salvar fluxo');
      toast.error('Erro ao salvar fluxo');
    } finally {
      setIsSaving(false);
    }
  }, [flow?.id, tenantId, assistenteId, isOffline, manualMode]);
  
  // ============================================================================
  // AUTO SAVE
  // ============================================================================
  
  const scheduleAutoSave = useCallback(() => {
    if (!autoSave) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Schedule new save
    saveTimeoutRef.current = setTimeout(() => {
      if (isDirty && blocksRef.current.length > 0) {
        saveBlocks(blocksRef.current);
      }
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, isDirty, saveBlocks]);
  
  useEffect(() => {
    if (isDirty) {
      scheduleAutoSave();
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, scheduleAutoSave]);
  
  // ============================================================================
  // BLOCK OPERATIONS
  // ============================================================================
  
  const addBlock = useCallback(async (block: FlowBlock): Promise<FlowBlock | null> => {
    if (!flow?.id) return null;
    
    try {
      // Para novo bloco, apenas adiciona ao estado local
      setBlocksState(prev => [...prev, block]);
      setIsDirty(true);
      
      return block;
    } catch (err) {
      console.error('Error adding block:', err);
      toast.error('Erro ao adicionar bloco');
      return null;
    }
  }, [flow?.id]);
  
  const updateBlock = useCallback((blockId: string, updates: Partial<FlowBlock>) => {
    setBlocksState(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
    setIsDirty(true);
  }, []);
  
  const removeBlock = useCallback(async (blockId: string) => {
    const block = blocksRef.current.find(b => b.id === blockId);
    
    if (block && (block as any).blockKey && flow?.id) {
      try {
        await deleteBlock(flow.id, (block as any).blockKey);
      } catch (err) {
        console.error('Error deleting block from DB:', err);
      }
    }
    
    setBlocksState(prev => prev.filter(b => b.id !== blockId));
    setIsDirty(true);
  }, [flow?.id]);
  
  const setBlocks = useCallback((newBlocks: FlowBlock[]) => {
    setBlocksState(newBlocks);
    setIsDirty(true);
  }, []);
  
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);
  
  const saveNow = useCallback(async (canal?: 'voz' | 'whatsapp') => {
    await saveBlocks(blocksRef.current, canal);
  }, [saveBlocks]);

  const publish = useCallback(async () => {
    if (!flow?.id) return;
    
    try {
      // Primeiro salva
      await saveBlocks(blocksRef.current);
      // Depois publica
      const published = await publishFlow(flow.id);
      setFlow(published);
      toast.success('Fluxo publicado!');
    } catch (err) {
      console.error('Error publishing flow:', err);
      toast.error('Erro ao publicar fluxo');
    }
  }, [flow?.id, saveBlocks]);
  
  return {
    flow,
    blocks,
    availableBlocks,
    manualMode,
    isLoading,
    isSaving,
    isDirty,
    error,
    tenantId,
    loadFlow,
    saveBlocks,
    addBlock,
    updateBlock,
    removeBlock,
    setBlocks,
    setAvailableBlocks,
    setManualMode,
    markDirty,
    saveNow,
    publish,
  };
}
