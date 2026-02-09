// ============================================================================
// FLOW SERVICE - Operações CRUD para Flow Editor (Adaptado para API REST)
// ============================================================================

import { FlowBlock, ToolBlockType } from '@/types/flow';
import { 
  FlowDB, 
  FlowBlockDB, 
  RouteDB,
  dbBlocksToCanvasBlocks, 
  canvasBlockToDBBlock,
  generateBlockKey,
  FlowBlockTypeDB,
} from '@/types/flowDB';

// Base URL da API: proxy em dev (Vite encaminha /api para o backend) ou VITE_API_URL em produção
const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || window.location.origin;

// Helper para fazer requisições HTTP
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    // #region agent log
    const method = (options.method || 'GET').toUpperCase();
    fetch('http://127.0.0.1:7242/ingest/9b63e896-b730-44e9-bf24-e8345446e2af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flowService.ts:apiRequest',message:'HTTP error',data:{status:response.status,url:response.url,method,endpoint},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Helper para converter Json para RouteDB[]
function parseRoutesData(routesData: any, blockKey?: string): RouteDB[] {
  if (!routesData) return [];
  let raw = routesData;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (_) {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((item: any, index: number) => ({
      route_key: item.route_key || item.id || `${blockKey || 'route'}_route_${index + 1}`,
      label: item.label || item.nome || `Caminho ${index + 1}`,
      ordem: typeof item.ordem === 'number' ? item.ordem : index + 1,
      cor: item.cor || item.color || '',
      keywords: item.keywords || item.condicoes?.map((c: any) => c?.valor).filter(Boolean) || [],
      response: item.response || item.resposta || null,
      destination_type: item.destination_type || (item.entao?.acao === 'encerrar' ? 'encerrar' : item.entao?.acao === 'loop' ? 'loop' : 'continuar'),
      destination_block_key: item.destination_block_key || item.entao?.target_block_key || null,
      max_loop_attempts: item.max_loop_attempts || 2,
      is_fallback: !!item.is_fallback,
    })) as RouteDB[];
  }
  const rotas = raw.rotas || raw.routes;
  if (Array.isArray(rotas)) {
    const mapped: RouteDB[] = rotas.map((r: any, index: number) => ({
      route_key: r.route_key || r.id || `${blockKey || 'route'}_route_${index + 1}`,
      label: r.label || r.nome || `Caminho ${index + 1}`,
      ordem: typeof r.ordem === 'number' ? r.ordem : index + 1,
      cor: r.cor || r.color || '',
      keywords: r.keywords || r.condicoes?.map((c: any) => c?.valor).filter(Boolean) || [],
      response: r.response || r.resposta || null,
      destination_type: r.destination_type || (r.entao?.acao === 'encerrar' ? 'encerrar' : r.entao?.acao === 'loop' ? 'loop' : 'continuar'),
      destination_block_key: r.destination_block_key || r.entao?.target_block_key || null,
      max_loop_attempts: r.max_loop_attempts || 2,
      is_fallback: false,
    }));
    const fallback = raw.senao || raw.fallback;
    if (fallback) {
      mapped.push({
        route_key: fallback.route_key || `${blockKey || 'route'}_fallback`,
        label: fallback.label || fallback.nome || 'Outros',
        ordem: 999,
        cor: fallback.cor || '#6b7280',
        keywords: [],
        response: fallback.response || fallback.resposta || null,
        destination_type: fallback.destination_type || (fallback.acao === 'encerrar' ? 'encerrar' : fallback.acao === 'loop' ? 'loop' : 'continuar'),
        destination_block_key: fallback.destination_block_key || fallback.target_block_key || null,
        max_loop_attempts: fallback.max_loop_attempts || 2,
        is_fallback: true,
      });
    }
    return mapped;
  }
  return [];
}

// Helper para converter FlowBlockDB da API
function parseFlowBlockDB(data: any): FlowBlockDB {
  return {
    ...data,
    routes_data: parseRoutesData(data.routes_data, data.block_key),
    tool_config: data.tool_config || {},
    end_metadata: data.end_metadata || {},
  };
}

// Mapeamento de tipos Canvas → Banco
const CANVAS_TO_DB_TYPE_MAP: Record<string, FlowBlockTypeDB> = {
  'primeira_mensagem': 'primeira_mensagem',
  'texto': 'mensagem',
  'ramificacoes': 'caminhos',
  'aguardar': 'aguardar',
  'encerrar': 'encerrar',
  'tool': 'ferramenta',
};

/** block_key FER001, FER002, TOOL001 etc. = sempre ferramenta (nunca primeira mensagem). */
function blockKeyIsTool(blockKey: string | null | undefined): boolean {
  if (!blockKey || typeof blockKey !== 'string') return false;
  const upper = blockKey.trim().toUpperCase();
  return upper.startsWith('FER') || upper.startsWith('TOOL');
}

/** Detecta se o texto descreve uma ação de ferramenta (ex: enviar link WhatsApp) e não uma saudação. */
function contentLooksLikeTool(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const lower = content.toLowerCase().trim();
  const toolPatterns = [
    'enviar link',
    'whatsapp',
    'link da live',
    'confirmar participação',
    'enviar no whatsapp',
    'link no whatsapp',
    'live no whatsapp',
    'lead confirmar',
    'quando lead confirmar',
    'enviar link da live',
    'bloco de ferramenta',
    'ferramenta para ',
    'envia link',
    'enviar o link',
    'mandar link',
  ];
  return toolPatterns.some((p) => lower.includes(p));
}

/** Infere o tipo de ferramenta a partir do conteúdo (para blocos mal classificados como primeira_mensagem). */
function inferToolTypeFromContent(content: string): ToolBlockType {
  const lower = content.toLowerCase();
  if (lower.includes('whatsapp') && (lower.includes('link') || lower.includes('live') || lower.includes('confirmar') || lower.includes('enviar'))) {
    return 'enviar_link_whatsapp';
  }
  if (lower.includes('enviar') && (lower.includes('link') || lower.includes('live'))) {
    return 'enviar_link_whatsapp';
  }
  return 'enviar_link_whatsapp'; // fallback para descrições de “enviar link”
}

export interface FlowServiceData {
  flow: FlowDB | null;
  blocks: (FlowBlock & { blockKey: string })[];
  isNew: boolean;
}

// ============================================================================
// CARREGAR FLUXO POR ASSISTENTE
// ============================================================================

export async function loadFlowByAssistant(
  assistenteId: string,
  tenantId?: string
): Promise<FlowServiceData> {
  try {
    // Obter tenant_id da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const finalTenantId = tenantId || urlParams.get('tenant_id') || localStorage.getItem('tenant_id') || '';
    
    if (!finalTenantId) {
      console.warn('⚠️ tenant_id não encontrado. Usando assistente_id como fallback.');
    }

    // Buscar flow deste assistente (produção: usuário abriu pelo SaaS; blocos vêm por assistente_id e são montados no canvas automaticamente)
    const result = await apiRequest<{
      flow: FlowDB;
      blocks: FlowBlockDB[];
      routes: any[];
      first_message?: string;
    }>(`/api/flows/by-assistant/${assistenteId}?tenant_id=${encodeURIComponent(finalTenantId)}&create_if_missing=true`);

    if (!result || !result.flow) {
      return { flow: null, blocks: [], isNew: true };
    }

    // Garantir que blocks seja sempre array (algumas respostas podem vir com key diferente ou vazio)
    let rawBlocks: FlowBlockDB[] = Array.isArray(result.blocks) ? result.blocks : [];
    if (rawBlocks.length === 0 && result.flow.id) {
      try {
        const complete = await apiRequest<{ flow: FlowDB; blocks: FlowBlockDB[] }>(`/api/flows/${result.flow.id}`);
        rawBlocks = Array.isArray(complete?.blocks) ? complete.blocks : [];
      } catch (_) {
        // ignora; segue com rawBlocks vazio
      }
    }

    // Converter blocos do banco para formato do canvas
    const parsedBlocks = rawBlocks.map(parseFlowBlockDB);
    // Reclassificar: blocos que são ferramentas nunca devem aparecer como "Primeira Mensagem"
    // - block_key FER001, FER002, TOOL* = sempre ferramenta (convenção do sistema)
    // - block_type primeira_mensagem + conteúdo de ferramenta = virar ferramenta
    const normalizedDbBlocks: FlowBlockDB[] = parsedBlocks.map((b) => {
      const content = (b.content || '').trim();
      const isFirstMessageType = (b.block_type === 'primeira_mensagem' || (b.block_type as string) === 'primeira mensagem');
      const keyIsTool = blockKeyIsTool(b.block_key);

      if (keyIsTool) {
        // FER001, FER002, TOOL*: sempre ferramenta, independente do block_type no banco
        return {
          ...b,
          block_type: 'ferramenta',
          tool_type: b.tool_type || inferToolTypeFromContent(content),
        };
      }
      if (isFirstMessageType && contentLooksLikeTool(content)) {
        return {
          ...b,
          block_type: 'ferramenta',
          tool_type: inferToolTypeFromContent(content),
        };
      }
      if (b.block_type === 'ferramenta' && !b.tool_type && contentLooksLikeTool(content)) {
        return { ...b, tool_type: inferToolTypeFromContent(content) };
      }
      return b;
    });
    const canvasBlocksFromDb = dbBlocksToCanvasBlocks(normalizedDbBlocks);

    // Primeira mensagem não faz parte do fluxo: fica só em Configurações globais (assistentes.first_message). Não adicionamos nenhum bloco ao canvas a partir dela.
    const canvasBlocks = canvasBlocksFromDb;

    return {
      flow: result.flow,
      blocks: canvasBlocks,
      isNew: false,
    };
  } catch (error) {
    console.error('Error loading flow:', error);
    throw error;
  }
}

// ============================================================================
// CRIAR NOVO FLUXO
// ============================================================================

export async function createFlow(
  assistenteId: string,
  name: string,
  description?: string,
  tenantId?: string
): Promise<FlowDB> {
  const urlParams = new URLSearchParams(window.location.search);
  const finalTenantId = tenantId || urlParams.get('tenant_id') || localStorage.getItem('tenant_id') || '';
  
  if (!finalTenantId) {
    throw new Error('tenant_id é obrigatório para criar flow');
  }

  const data = await apiRequest<FlowDB>('/api/flows', {
    method: 'POST',
    body: JSON.stringify({
      tenant_id: finalTenantId,
      assistente_id: assistenteId,
      name,
      description: description || null,
    }),
  });

  return data;
}

// ============================================================================
// SALVAR BLOCO INDIVIDUAL
// ============================================================================

export async function saveBlock(
  flowId: string,
  canvasBlock: FlowBlock,
  orderIndex: number,
  tenantId: string,
  assistenteId?: string,
  existingBlocks: FlowBlockDB[] = []
): Promise<FlowBlockDB> {
  const dbType = CANVAS_TO_DB_TYPE_MAP[canvasBlock.type] || 'mensagem';
  
  // Verificar se o bloco já existe (tem blockKey)
  const existingBlockKey = (canvasBlock as any).blockKey;
  
  // Converter para formato do banco
  const dbBlock = canvasBlockToDBBlock(
    existingBlockKey ? canvasBlock : { ...canvasBlock, blockKey: generateBlockKey(dbType, existingBlocks) } as any,
    flowId,
    orderIndex,
    tenantId,
    assistenteId,
    existingBlocks
  );

  // Usar endpoint PATCH para atualizar bloco individual
  const blockKey = existingBlockKey || dbBlock.block_key;
  
  const result = await apiRequest<{
    success: boolean;
    block_key: string;
    action: string;
    data: FlowBlockDB;
    routes_saved?: number;
    routes_data_count?: number;
  }>(`/api/flows/${flowId}/blocks/${blockKey}`, {
    method: 'PATCH',
    body: JSON.stringify({
      block_type: dbBlock.block_type,
      content: dbBlock.content,
      variable_name: dbBlock.variable_name,
      next_block_key: dbBlock.next_block_key,
      order_index: dbBlock.order_index,
      position_x: dbBlock.position_x,
      position_y: dbBlock.position_y,
      timeout_seconds: dbBlock.timeout_seconds,
      analyze_variable: dbBlock.analyze_variable,
      tool_type: dbBlock.tool_type,
      tool_config: dbBlock.tool_config,
      end_type: dbBlock.end_type,
      end_metadata: dbBlock.end_metadata,
      routes_data: dbBlock.routes_data, // ⭐ Multi-paths em routes_data
    }),
  });

  return parseFlowBlockDB(result.data);
}

// ============================================================================
// CRIAR BLOCO ENTRE DOIS (PROMPT)
// ============================================================================
export async function createBlockBetween(
  flowId: string,
  payload: {
    block_type: FlowBlockTypeDB;
    content: string;
    insert_after_key: string;
    insert_before_key: string;
    tool_type?: string | null;
  }
): Promise<FlowBlockDB> {
  const result = await apiRequest<{ success: boolean; data: FlowBlockDB }>(
    `/api/flows/${flowId}/blocks/create-between`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return parseFlowBlockDB(result.data);
}

// ============================================================================
// SALVAR TODOS OS BLOCOS
// ============================================================================

/** ID do bloco sintético "Primeira Mensagem" (vem de assistentes.first_message, não de flow_blocks). */
export const FIRST_MESSAGE_BLOCK_ID = 'first_message';

export async function saveAllBlocks(
  flowId: string,
  canvasBlocks: FlowBlock[],
  tenantId: string,
  assistenteId?: string,
  canal?: 'voz' | 'whatsapp'
): Promise<FlowBlockDB[]> {
  // Primeira mensagem é salva em assistentes.first_message, não em flow_blocks
  const firstMessageBlock = canvasBlocks.find(b => b.id === FIRST_MESSAGE_BLOCK_ID);
  if (firstMessageBlock && assistenteId) {
    try {
      await updateAssistantFirstMessage(assistenteId, firstMessageBlock.content ?? '');
    } catch (e) {
      console.error('Erro ao salvar primeira mensagem:', e);
    }
  }
  const blocksToSave = canvasBlocks.filter(b => b.id !== FIRST_MESSAGE_BLOCK_ID);

  // Converter blocos para formato do banco (preservar order_index do canvas quando existir)
  const dbBlocks: Omit<FlowBlockDB, 'id' | 'created_at' | 'updated_at'>[] = [];
  for (let index = 0; index < blocksToSave.length; index++) {
    const canvasBlock = blocksToSave[index];
    const dbType = CANVAS_TO_DB_TYPE_MAP[canvasBlock.type] || 'mensagem';
    const dbBlock = canvasBlockToDBBlock(
      { ...canvasBlock } as FlowBlock & { blockKey?: string },
      flowId,
      index,
      tenantId,
      assistenteId,
      dbBlocks as FlowBlockDB[],
      blocksToSave as (FlowBlock & { blockKey?: string })[],
      canal
    );
    dbBlocks.push(dbBlock);
  }

  // Preparar payload para salvar todos os blocos
  const blocksPayload = dbBlocks.map(block => ({
    block_key: block.block_key,
    block_type: block.block_type,
    content: block.content,
    variable_name: block.variable_name,
    next_block_key: block.next_block_key,
    order_index: block.order_index,
    position_x: block.position_x,
    position_y: block.position_y,
    timeout_seconds: block.timeout_seconds,
    analyze_variable: block.analyze_variable,
    tool_type: block.tool_type,
    tool_config: block.tool_config,
    end_type: block.end_type,
    end_metadata: block.end_metadata,
    routes_data: block.routes_data, // ⭐ Multi-paths em routes_data
    route_context: (block as { route_context?: unknown }).route_context ?? undefined, // vinculação rota ↔ bloco
    ...(block.canal !== undefined ? { canal: block.canal } : {}),
  }));

  // Usar endpoint POST /api/flows/save
  const body: { flow_id: string; blocks: typeof blocksPayload; routes: never[]; canal?: string } = {
    flow_id: flowId,
    blocks: blocksPayload,
    routes: [], // ⚠️ DEPRECATED: routes agora estão em routes_data dos blocos
  };
  if (canal) body.canal = canal;

  const result = await apiRequest<{
    success: boolean;
    version: number;
    blocks_saved: number;
  }>(`/api/flows/save`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  // Buscar blocos atualizados
  const completeFlow = await apiRequest<{
    flow: FlowDB;
    blocks: FlowBlockDB[];
    routes: any[];
  }>(`/api/flows/${flowId}`);

  return (completeFlow.blocks || []).map(parseFlowBlockDB);
}

// ============================================================================
// DELETAR BLOCO
// ============================================================================

export async function deleteBlock(flowId: string, blockKey: string): Promise<void> {
  // O backend não tem endpoint específico para deletar bloco individual
  // Vamos usar o endpoint de salvar com blocos atualizados
  // Ou podemos implementar via PATCH removendo o bloco da lista
  
  // Por enquanto, vamos apenas fazer um log
  console.warn('⚠️ deleteBlock: Implementação via API REST pendente. Use saveAllBlocks após remover o bloco.');
  
  // Alternativa: buscar todos os blocos, remover o desejado e salvar novamente
  // Isso será feito pelo hook useFlowPersistence
}

// ============================================================================
// CONVERTER FLUXO VOZ → WHATSAPP
// ============================================================================

const CONVERT_WHATSAPP_TIMEOUT_MS = 120000;

export interface ConvertToWhatsAppResult {
  success: boolean;
  flow_id?: string;
  total_blocos?: number;
  canal?: string;
  error?: string;
}

export async function convertToWhatsApp(
  flowId: string,
  tenantId: string,
  assistenteId?: string
): Promise<ConvertToWhatsAppResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONVERT_WHATSAPP_TIMEOUT_MS);
  const url = `${API_BASE_URL}/api/flows/${encodeURIComponent(flowId)}/convert-to-whatsapp`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenantId,
        assistente_id: assistenteId ?? null,
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: ConvertToWhatsAppResult & { detail?: string } = {};
    try {
      data = (text ? JSON.parse(text) : {}) as ConvertToWhatsAppResult & { detail?: string };
    } catch {
      // Resposta 500 pode vir como HTML ou texto; evita "Expecting value" no parse
    }
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.error || text?.slice(0, 200) || `HTTP ${response.status}`,
      };
    }
    return {
      success: data.success,
      flow_id: data.flow_id,
      total_blocos: data.total_blocos ?? data.blocks_created,
      canal: data.canal,
      error: data.error,
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'timeout' };
      }
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Erro desconhecido' };
  }
}

// ============================================================================
// ATUALIZAR FLOW METADATA
// ============================================================================

export async function updateFlow(
  flowId: string,
  updates: Partial<Pick<FlowDB, 'name' | 'description' | 'is_active' | 'status' | 'prompt_base'>>
): Promise<FlowDB> {
  const data = await apiRequest<FlowDB>(`/api/flows/${flowId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  return data;
}

// ============================================================================
// DELETAR FLOW
// ============================================================================

export async function deleteFlow(flowId: string): Promise<void> {
  // O backend não tem endpoint para deletar flow
  // Por enquanto, apenas log
  console.warn('⚠️ deleteFlow: Endpoint não implementado no backend');
}

// ============================================================================
// CRIAR OU OBTER FLOW DO ASSISTENTE
// ============================================================================

export async function getOrCreateFlow(
  assistenteId: string,
  name = 'Novo Fluxo',
  tenantId?: string
): Promise<FlowServiceData> {
  let result = await loadFlowByAssistant(assistenteId, tenantId);
  
  if (result.isNew) {
    // Criar novo flow
    const newFlow = await createFlow(assistenteId, name, undefined, tenantId);
    result = {
      flow: newFlow,
      blocks: [],
      isNew: false,
    };
  }
  
  return result;
}

// ============================================================================
// PROMPT COMPLETO (mostrar e aplicar texto → blocos)
// ============================================================================

/** Nome e foto do assistente para exibir no flow editor */
export async function getAssistantInfo(assistenteId: string): Promise<{ name: string | null; photoUrl: string | null }> {
  const data = await apiRequest<{ success: boolean; name?: string | null; photoUrl?: string | null }>(
    `/api/assistants/${encodeURIComponent(assistenteId)}/info`
  );
  return { name: data.name ?? null, photoUrl: data.photoUrl ?? null };
}

/** Retorna a primeira mensagem do assistente (assistentes.first_message) para Configurações globais. */
export async function getAssistantFirstMessage(assistenteId: string): Promise<string> {
  // #region agent log
  const endpoint = `/api/assistants/${encodeURIComponent(assistenteId)}/first-message`;
  fetch('http://127.0.0.1:7242/ingest/9b63e896-b730-44e9-bf24-e8345446e2af',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'flowService.ts:getAssistantFirstMessage',message:'GET first-message call',data:{endpoint,method:'GET'},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  const data = await apiRequest<{ success: boolean; first_message?: string }>(endpoint);
  return data.first_message ?? '';
}

/** Atualiza a primeira mensagem do assistente (assistentes.first_message). Não é salva em flow_blocks. */
export async function updateAssistantFirstMessage(assistenteId: string, firstMessage: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/api/assistants/${encodeURIComponent(assistenteId)}/first-message`, {
    method: 'PATCH',
    body: JSON.stringify({ first_message: firstMessage ?? '' }),
  });
}

/** Retorna voice_speed do assistente (assistentes.voice_speed). Default 1.0. */
export async function getVoiceSpeed(assistenteId: string): Promise<number> {
  const data = await apiRequest<{ success: boolean; voice_speed?: number }>(
    `/api/assistants/${encodeURIComponent(assistenteId)}/voice-settings`
  );
  const raw = data.voice_speed;
  if (raw == null) return 1.0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0.5, Math.min(2, n)) : 1.0;
}

/** Atualiza voice_speed na tabela assistentes (0.5 a 2.0). */
export async function updateVoiceSpeed(assistenteId: string, voiceSpeed: number): Promise<void> {
  const value = Math.max(0.5, Math.min(2, Number(voiceSpeed) || 1));
  await apiRequest<{ success: boolean }>(`/api/assistants/${encodeURIComponent(assistenteId)}/voice-settings`, {
    method: 'PATCH',
    body: JSON.stringify({ voice_speed: value }),
  });
}

/** Busca o Prompt Master do assistente para a aba Configuração global. Fonte: flow_blocks (blocos de config). */
export async function getPromptMaster(assistenteId: string, tenantId?: string): Promise<string> {
  const params = new URLSearchParams();
  if (tenantId) params.set('tenant_id', tenantId);
  const qs = params.toString();
  const url = `/api/assistants/${encodeURIComponent(assistenteId)}/prompt-master${qs ? `?${qs}` : ''}`;
  const data = await apiRequest<{ success: boolean; prompt_voz?: string }>(url);
  return data.prompt_voz ?? '';
}

/** Atualiza o Prompt Master salvando em flow_blocks. O trigger no banco reconstrói prompt_voz. */
export async function updatePromptMaster(assistenteId: string, promptVoz: string, tenantId?: string): Promise<void> {
  const params = new URLSearchParams();
  if (tenantId) params.set('tenant_id', tenantId);
  const qs = params.toString();
  const url = `/api/assistants/${encodeURIComponent(assistenteId)}/prompt-master${qs ? `?${qs}` : ''}`;
  await apiRequest<{ success: boolean }>(url, {
    method: 'PATCH',
    body: JSON.stringify({ prompt_voz: promptVoz ?? '' }),
  });
}

export async function getPromptByAssistant(assistenteId: string): Promise<{ prompt: string; flow_id: string }> {
  const data = await apiRequest<{ prompt: string; flow_id: string }>(
    `/api/flows/by-assistant/${assistenteId}/prompt`
  );
  return data;
}

export async function applyPromptToBlocks(
  assistenteId: string,
  promptText: string,
  tenantId?: string
): Promise<{ success: boolean; blocks_count: number; flow_id: string }> {
  const data = await apiRequest<{ success: boolean; blocks_count: number; flow_id: string }>(
    `/api/flows/by-assistant/${assistenteId}/apply-prompt`,
    {
      method: 'POST',
      body: JSON.stringify({ prompt_text: promptText, tenant_id: tenantId || null }),
    }
  );
  return data;
}

// ============================================================================
// PUBLICAR FLOW
// ============================================================================

export async function publishFlow(flowId: string): Promise<FlowDB> {
  const data = await apiRequest<FlowDB>(`/api/flows/${flowId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'published',
      is_active: true,
    }),
  });

  return data;
}
