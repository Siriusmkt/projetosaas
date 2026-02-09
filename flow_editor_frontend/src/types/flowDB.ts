// ============================================================================
// FLOW EDITOR - DATABASE TYPES (Produção)
// Tipos para persistência no banco de dados
// ============================================================================

import { FlowBlock, FlowBlockType, RouterRoute, RouterFallback, RouteDestinationType, ToolBlockType, ROUTER_COLORS } from './flow';

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

export interface FlowDB {
  id: string;
  tenant_id: string;            // TEXT (não UUID)
  assistente_id: string | null; // TEXT
  name: string;
  description: string | null;
  prompt_base: string | null;
  status: 'draft' | 'published' | 'active';
  is_active: boolean;
  version: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FlowBlockDB {
  id: string;
  flow_id: string;
  block_key: string;           // Ex: "PM001", "CAM001", "AG002"
  block_type: string;          // primeira_mensagem, mensagem, caminhos, aguardar, encerrar, ferramenta
  content: string;
  variable_name: string | null;  // Nome da variável para salvar resposta
  timeout_seconds: number | null;
  analyze_variable: string | null;
  tool_type: string | null;
  tool_config: Record<string, any>;
  end_type: string | null;      // Tipo de encerramento
  end_metadata: Record<string, any>;
  next_block_key: string | null;
  order_index: number;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
  assistente_id: string | null;
  tenant_id: string | null;
  routes_data: RouteDB[];      // JSONB inline
  route_context?: RouteContextDB | null; // vinculação explícita à rota (first/middle/last)
  /** voz | whatsapp | null. Config blocks (order_index < 0) = null. */
  canal?: 'voz' | 'whatsapp' | null;
}

export interface RouteContextDB {
  parent_router_block_key: string;
  route_key: string;
  route_position: 'first' | 'middle' | 'last';
}

export interface FlowRouteDB {
  id: string;
  flow_id: string;
  block_id: string;
  route_key: string;
  label: string;
  ordem: number;
  cor: string;
  keywords: string[];
  response: string | null;
  destination_type: 'continuar' | 'encerrar' | 'loop';
  destination_block_key: string | null;
  max_loop_attempts: number;
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
  assistente_id: string | null;
  tenant_id: string | null;
}

// RouteDB para JSONB inline (routes_data)
export interface RouteDB {
  route_key: string;
  label: string;
  ordem: number;
  cor: string;
  keywords: string[];
  response: string | null;
  destination_type: 'continuar' | 'encerrar' | 'loop';
  destination_block_key: string | null;
  last_block_key?: string | null; // último bloco da rota (opcional)
  max_loop_attempts: number;
  is_fallback: boolean;
}

// Tipos de bloco no banco
export type FlowBlockTypeDB = 
  | 'primeira_mensagem'
  | 'mensagem'      // 'texto' no canvas
  | 'caminhos'      // 'ramificacoes' no canvas
  | 'aguardar'
  | 'encerrar'
  | 'ferramenta';   // 'tool' no canvas

// ============================================================================
// BLOCK KEY PREFIXES
// ============================================================================

export const BLOCK_KEY_PREFIXES: Record<FlowBlockTypeDB, string> = {
  'primeira_mensagem': 'PM',
  'mensagem': 'MSG',
  'caminhos': 'CAM',
  'aguardar': 'AG',
  'encerrar': 'ENC',
  'ferramenta': 'FER',
};

// ============================================================================
// MAPPING FUNCTIONS: Canvas ↔ Database
// ============================================================================

// Mapeamento de tipos Canvas → Banco
export const CANVAS_TO_DB_TYPE: Record<FlowBlockType, FlowBlockTypeDB> = {
  'primeira_mensagem': 'primeira_mensagem',
  'texto': 'mensagem',
  'ramificacoes': 'caminhos',
  'aguardar': 'aguardar',
  'encerrar': 'encerrar',
  'tool': 'ferramenta',
};

// Mapeamento de tipos Banco → Canvas
export const DB_TO_CANVAS_TYPE: Record<FlowBlockTypeDB, FlowBlockType> = {
  'primeira_mensagem': 'primeira_mensagem',
  'mensagem': 'texto',
  'caminhos': 'ramificacoes',
  'aguardar': 'aguardar',
  'encerrar': 'encerrar',
  'ferramenta': 'tool',
};

// Mapeamento de destinos Canvas → Banco
export const CANVAS_TO_DB_DESTINATION: Record<RouteDestinationType, 'continuar' | 'encerrar' | 'loop'> = {
  'continue': 'continuar',
  'end': 'encerrar',
  'loop': 'loop',
  'goto': 'continuar', // 'goto' é tratado como 'continuar' com destination_block_key preenchido
};

// Mapeamento de destinos Banco → Canvas
function dbToCanvasDestination(destType: string, hasBlockKey: boolean): RouteDestinationType {
  if (destType === 'continuar' && hasBlockKey) return 'goto';
  if (destType === 'continuar') return 'continue';
  if (destType === 'encerrar') return 'end';
  if (destType === 'loop') return 'loop';
  return 'continue';
}

// ============================================================================
// GENERATE BLOCK KEY
// ============================================================================

export function generateBlockKey(
  blockType: FlowBlockTypeDB,
  existingBlocks: FlowBlockDB[]
): string {
  const prefix = BLOCK_KEY_PREFIXES[blockType] || 'BLK';
  
  const existingNumbers = existingBlocks
    .filter(b => b.block_key?.startsWith(prefix))
    .map(b => {
      const match = b.block_key.match(/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
  
  const nextNumber = existingNumbers.length > 0 
    ? Math.max(...existingNumbers) + 1 
    : 1;
  
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// ============================================================================
// GENERATE ROUTE KEY
// ============================================================================

export function generateRouteKey(
  blockKey: string,
  existingRoutes: RouteDB[],
  isFallback = false
): string {
  if (isFallback) {
    return `${blockKey}_fallback`;
  }
  
  const existingNumbers = existingRoutes
    .filter(r => r.route_key?.startsWith(`${blockKey}_route_`))
    .map(r => {
      const match = r.route_key.match(/_route_(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    });
  
  const nextNumber = existingNumbers.length > 0 
    ? Math.max(...existingNumbers) + 1 
    : 1;
  
  return `${blockKey}_route_${nextNumber}`;
}

// ============================================================================
// RESOLVE: id ou block_key → block_key (para salvar destination_block_key)
// ============================================================================

export function resolveToBlockKey(
  idOrKey: string | null | undefined,
  allCanvasBlocks: (FlowBlock & { blockKey?: string })[]
): string | null {
  if (!idOrKey) return null;
  const block = allCanvasBlocks.find(b => b.id === idOrKey || (b as any).blockKey === idOrKey);
  return block ? ((block as any).blockKey || idOrKey) : idOrKey;
}

// ============================================================================
// CONVERT: Canvas Block → Database Block
// ============================================================================

export function canvasBlockToDBBlock(
  canvasBlock: FlowBlock,
  flowId: string,
  orderIndex: number,
  tenantId: string,
  assistenteId?: string,
  existingDBBlocks: FlowBlockDB[] = [],
  allCanvasBlocks: (FlowBlock & { blockKey?: string })[] = [],
  canal?: 'voz' | 'whatsapp' | null
): Omit<FlowBlockDB, 'id' | 'created_at' | 'updated_at'> {
  const dbType = CANVAS_TO_DB_TYPE[canvasBlock.type];
  
  // Gerar block_key se não existir (usar existingDBBlocks para evitar duplicatas)
  const blockKey = (canvasBlock as any).blockKey || generateBlockKey(dbType, existingDBBlocks);
  
  // Converter routes para routes_data (destination_block_key sempre como block_key)
  const routesData: RouteDB[] = [];
  
  if (canvasBlock.type === 'ramificacoes' && canvasBlock.routes) {
    canvasBlock.routes.forEach((route, index) => {
      routesData.push({
        route_key: `${blockKey}_route_${index + 1}`,
        label: route.label,
        ordem: index + 1,
        cor: route.color,
        keywords: route.keywords || [],
        response: route.response || null,
        destination_type: CANVAS_TO_DB_DESTINATION[route.destinationType],
        destination_block_key: resolveToBlockKey(route.gotoBlockId, allCanvasBlocks),
        max_loop_attempts: 2,
        is_fallback: false,
      });
    });
    
    // Adicionar fallback
    if (canvasBlock.fallback) {
      routesData.push({
        route_key: `${blockKey}_fallback`,
        label: canvasBlock.fallback.label || 'Fallback',
        ordem: 999,
        cor: '#6b7280',
        keywords: [],
        response: canvasBlock.fallback.response || null,
        destination_type: CANVAS_TO_DB_DESTINATION[canvasBlock.fallback.destinationType],
        destination_block_key: resolveToBlockKey(canvasBlock.fallback.gotoBlockId, allCanvasBlocks),
        max_loop_attempts: 2,
        is_fallback: true,
      });
    }
  }

  let route_context: RouteContextDB | undefined;
  // Bloco multi caminho (ramificacoes) nunca é filho de rota — não persistir route_context
  if (canvasBlock.type !== 'ramificacoes' && canvasBlock.parentRouterId && canvasBlock.routeId) {
    const router = allCanvasBlocks.find(
      (b) => b.id === canvasBlock.parentRouterId || (b as any).blockKey === canvasBlock.parentRouterId
    );
    const routerBlockKey = (router as any)?.blockKey ?? canvasBlock.parentRouterId;
    const route =
      canvasBlock.routeId === 'fallback'
        ? (router as FlowBlock)?.fallback
        : (router as FlowBlock)?.routes?.find((r) => r.id === canvasBlock.routeId);
    const thisKey = blockKey;
    const isFirst =
      !!route &&
      (resolveToBlockKey((route as RouterRoute).gotoBlockId, allCanvasBlocks) === thisKey ||
        (route as RouterRoute).gotoBlockId === canvasBlock.id);
    const nextKey = resolveToBlockKey(canvasBlock.nextBlock, allCanvasBlocks) ?? canvasBlock.nextBlock;
    const nextBlock = nextKey
      ? allCanvasBlocks.find((b) => (b as any).blockKey === nextKey || b.id === nextKey)
      : null;
    const isLast =
      !nextBlock ||
      nextBlock.parentRouterId !== canvasBlock.parentRouterId ||
      nextBlock.routeId !== canvasBlock.routeId;
    const route_position: 'first' | 'middle' | 'last' = isFirst ? 'first' : isLast ? 'last' : 'middle';
    route_context = {
      parent_router_block_key: routerBlockKey,
      route_key: canvasBlock.routeId,
      route_position,
    };
  }

  const resolvedOrder = (canvasBlock as { order_index?: number }).order_index ?? orderIndex;
  // content NOT NULL no banco: para blocos tool garantir fallback (toolName, toolType ou 'Ferramenta')
  const contentValue =
    canvasBlock.type === 'tool'
      ? (canvasBlock.content || (canvasBlock as { toolConfig?: { toolName?: string; toolType?: string } }).toolConfig?.toolName || (canvasBlock as { toolConfig?: { toolType?: string } }).toolConfig?.toolType || 'Ferramenta')
      : (canvasBlock.content || '');
  const out: Omit<FlowBlockDB, 'id' | 'created_at' | 'updated_at'> = {
    flow_id: flowId,
    block_key: blockKey,
    block_type: dbType,
    content: contentValue,
    variable_name: null,
    next_block_key: resolveToBlockKey(canvasBlock.nextBlock, allCanvasBlocks) ?? canvasBlock.nextBlock ?? null,
    order_index: resolvedOrder,
    position_x: 0,
    position_y: resolvedOrder * 150,
    timeout_seconds: canvasBlock.timeout || null,
    analyze_variable: canvasBlock.analyzeVariable || null,
    tool_type: canvasBlock.toolType || null,
    tool_config: canvasBlock.toolConfig || {},
    end_type: null,
    end_metadata: {},
    routes_data: routesData,
    tenant_id: tenantId,
    assistente_id: assistenteId || null,
  };
  if (route_context) {
    out.route_context = route_context;
  }
  if (canal !== undefined) {
    out.canal = resolvedOrder < 0 ? null : (canvasBlock.canal ?? canal);
  }
  return out;
}

// ============================================================================
// CONVERT: Database Block → Canvas Block
// ============================================================================

export function dbBlockToCanvasBlock(dbBlock: FlowBlockDB): FlowBlock & { blockKey: string } {
  const canvasType = DB_TO_CANVAS_TYPE[dbBlock.block_type as FlowBlockTypeDB] || 'texto';
  
  // Converter routes_data para routes + fallback
  let routes: RouterRoute[] | undefined;
  let fallback: RouterFallback | undefined;
  
  if (dbBlock.block_type === 'caminhos') {
    if (dbBlock.routes_data && dbBlock.routes_data.length > 0) {
      const normalRoutes = [...dbBlock.routes_data.filter(r => !r.is_fallback)].sort((a, b) => {
        const aOrder = typeof a.ordem === 'number' ? a.ordem : 0;
        const bOrder = typeof b.ordem === 'number' ? b.ordem : 0;
        return aOrder - bOrder;
      });
      const fallbackRoute = dbBlock.routes_data.find(r => r.is_fallback);
      routes = normalRoutes.map((r, idx) => ({
        id: r.route_key || `${dbBlock.block_key}_route_${idx + 1}`,
        label: r.label,
        color: r.cor || ROUTER_COLORS[idx % ROUTER_COLORS.length].hex,
        keywords: r.keywords || [],
        response: r.response || '',
        destinationType: dbToCanvasDestination(r.destination_type, !!r.destination_block_key),
        gotoBlockId: r.destination_block_key,
      }));
      if (fallbackRoute) {
        fallback = {
          label: fallbackRoute.label,
          response: fallbackRoute.response || '',
          destinationType: dbToCanvasDestination(fallbackRoute.destination_type, !!fallbackRoute.destination_block_key),
          gotoBlockId: fallbackRoute.destination_block_key,
        };
      } else {
        fallback = {
          label: 'Outros',
          response: '',
          destinationType: 'loop',
          gotoBlockId: null,
        };
      }
    } else {
      // Bloco multi-caminhos sem routes_data (ex.: carregado do banco antigo): padrão 2 rotas + fallback
      const blockKey = dbBlock.block_key;
      routes = [
        { id: `${blockKey}_route_1`, label: 'Sim', color: '#22c55e', keywords: ['sim', 'pode', 'claro', 'quero'], response: 'Ótimo! Vamos continuar...', destinationType: 'continue' as const, gotoBlockId: null },
        { id: `${blockKey}_route_2`, label: 'Não', color: '#ef4444', keywords: ['não', 'agora não', 'depois'], response: 'Entendi! Sem problemas.', destinationType: 'continue' as const, gotoBlockId: null },
      ];
      fallback = { label: 'Outros', response: 'Pode repetir? Não entendi.', destinationType: 'loop' as const, gotoBlockId: null };
    }
  }
  
  const result: FlowBlock & { blockKey: string } = {
    id: dbBlock.id,
    type: canvasType,
    toolType: dbBlock.tool_type as ToolBlockType | undefined,
    content: dbBlock.content || '',
    timeout: dbBlock.timeout_seconds || undefined,
    nextBlock: dbBlock.next_block_key,
    analyzeVariable: dbBlock.analyze_variable || undefined,
    routes,
    fallback,
    toolConfig: dbBlock.tool_config || undefined,
    blockKey: dbBlock.block_key,
  };
  if (dbBlock.route_context?.parent_router_block_key && dbBlock.route_context?.route_key) {
    (result as Record<string, unknown>).route_context = dbBlock.route_context;
  }
  if (dbBlock.canal !== undefined && dbBlock.canal !== null) {
    result.canal = dbBlock.canal;
  }
  (result as Record<string, unknown>).order_index = dbBlock.order_index;
  return result;
}

// ============================================================================
// CONVERT ALL: Database Blocks → Canvas Blocks
// ============================================================================

export function dbBlocksToCanvasBlocks(dbBlocks: FlowBlockDB[]): (FlowBlock & { blockKey: string })[] {
  const sorted = [...dbBlocks].sort((a, b) => (a.order_index ?? 999999) - (b.order_index ?? 999999));
  const canvasBlocks = sorted.map(dbBlockToCanvasBlock);

  const byId = new Map<string, FlowBlock & { blockKey: string }>();
  const byKey = new Map<string, FlowBlock & { blockKey: string }>();
  canvasBlocks.forEach((block) => {
    byId.set(block.id, block);
    byKey.set((block as any).blockKey || block.id, block);
  });

  // Aplicar route_context do banco (vinculação explícita rota ↔ bloco)
  canvasBlocks.forEach((block) => {
    const ctx = (block as Record<string, unknown>).route_context as RouteContextDB | undefined;
    if (ctx?.parent_router_block_key && ctx?.route_key) {
      const router = byKey.get(ctx.parent_router_block_key);
      if (router) {
        block.parentRouterId = router.id;
        block.routeId = ctx.route_key;
        block.routePosition = ctx.route_position;
      }
      delete (block as Record<string, unknown>).route_context;
    }
  });

  // Normalizar: bloco multi caminho (ramificacoes) nunca pode estar dentro de uma rota — sempre na raiz
  canvasBlocks.forEach((block) => {
    if (block.type === 'ramificacoes' && (block.parentRouterId || block.routeId)) {
      block.parentRouterId = null;
      block.routeId = null;
      block.routePosition = undefined;
    }
  });

  // Primeiro: marcar destinos diretos das rotas
  const routeDestKeys = new Set<string>();
  canvasBlocks.forEach((block) => {
    if (block.type !== 'ramificacoes') return;
    (block.routes || []).forEach((route) => {
      if (!route.gotoBlockId) return;
      routeDestKeys.add(route.gotoBlockId);
      const target = byKey.get(route.gotoBlockId) || byId.get(route.gotoBlockId);
      if (!target || target.parentRouterId) return;
      if (target.type === 'ramificacoes') return; // multi caminho nunca é filho de rota
      if (target.id === block.id) return;
      target.parentRouterId = block.id;
      target.routeId = route.id;
    });
    if (block.fallback?.gotoBlockId) {
      routeDestKeys.add(block.fallback.gotoBlockId);
      const fallbackTarget = byKey.get(block.fallback.gotoBlockId) || byId.get(block.fallback.gotoBlockId);
      if (fallbackTarget && !fallbackTarget.parentRouterId && fallbackTarget.type !== 'ramificacoes') {
        if (fallbackTarget.id !== block.id) {
          fallbackTarget.parentRouterId = block.id;
          fallbackTarget.routeId = 'fallback';
        }
      }
    }
  });

  // Segundo: propagar parentRouterId ao longo da cadeia do caminho
  const getBlockByKey = (key?: string | null) =>
    key ? (byKey.get(key) || byId.get(key)) : undefined;
  const isRouteDest = (key?: string | null) => !!key && routeDestKeys.has(key);

  canvasBlocks.forEach((block) => {
    if (block.type !== 'ramificacoes') return;
    const routerId = block.id;
    const propagateFrom = (startKey: string | null | undefined, routeId: string) => {
      let current = getBlockByKey(startKey);
      const visited = new Set<string>();
      while (current) {
        const currentKey = (current as any).blockKey || current.id;
        if (visited.has(currentKey)) break;
        visited.add(currentKey);
        // Bloco multi caminho nunca pode ser filho de rota: não atribuir e não atravessar
        if (current.type === 'ramificacoes') break;
        if (!current.parentRouterId) {
          current.parentRouterId = routerId;
          current.routeId = routeId;
        } else if (current.parentRouterId !== routerId) {
          break;
        }
        const nextKey = current.nextBlock || null;
        if (!nextKey) break;
        if (isRouteDest(nextKey) && nextKey !== startKey) break;
        const next = getBlockByKey(nextKey);
        if (!next) break;
        // Evitar auto-referencia ao router
        if (next.id === routerId) break;
        current = next;
      }
    };

    (block.routes || []).forEach((route) => {
      if (route.gotoBlockId) propagateFrom(route.gotoBlockId, route.id);
    });
    if (block.fallback?.gotoBlockId) {
      propagateFrom(block.fallback.gotoBlockId, 'fallback');
    }
  });

  // Nova normalização após propagação: ramificacoes nunca como bloco de rota
  canvasBlocks.forEach((block) => {
    if (block.type === 'ramificacoes' && (block.parentRouterId || block.routeId)) {
      block.parentRouterId = null;
      block.routeId = null;
      block.routePosition = undefined;
    }
  });

  // Garantir nextBlock para linha principal (ordem do banco)
  const orderById = new Map<string, number>();
  sorted.forEach((dbBlock, idx) => {
    orderById.set(dbBlock.id, idx);
  });
  const rootBlocks = canvasBlocks.filter(b => !b.parentRouterId);
  rootBlocks.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
  for (let i = 0; i < rootBlocks.length - 1; i += 1) {
    const current = rootBlocks[i];
    if (!current.nextBlock) {
      const next = rootBlocks[i + 1];
      current.nextBlock = (next as any).blockKey || next.id;
    }
  }

  // Garantir nextBlock dentro de cada rota (cadeia por ordem do banco), para caminhos organizados
  canvasBlocks.forEach((block) => {
    if (block.type !== 'ramificacoes' || !block.parentRouterId) return;
    const routerId = block.id;
    const routeIds = [(block.routes || []).map(r => r.id), block.fallback ? 'fallback' : null].flat().filter(Boolean) as string[];
    routeIds.forEach((routeId) => {
      const inRoute = canvasBlocks.filter(b => b.parentRouterId === routerId && b.routeId === routeId);
      inRoute.sort((a, b) => (orderById.get(a.id) ?? 0) - (orderById.get(b.id) ?? 0));
      for (let i = 0; i < inRoute.length - 1; i += 1) {
        const cur = inRoute[i];
        if (!cur.nextBlock) {
          const next = inRoute[i + 1];
          cur.nextBlock = (next as any).blockKey || next.id;
        }
      }
    });
  });

  return canvasBlocks;
}

// ============================================================================
// CONVERT ALL: Canvas Blocks → Database Blocks
// ============================================================================

export function canvasBlocksToDBBlocks(
  canvasBlocks: FlowBlock[],
  flowId: string,
  tenantId: string,
  assistenteId?: string,
  existingDBBlocks: FlowBlockDB[] = []
): Omit<FlowBlockDB, 'id' | 'created_at' | 'updated_at'>[] {
  return canvasBlocks.map((block, index) => 
    canvasBlockToDBBlock(block, flowId, index, tenantId, assistenteId, existingDBBlocks)
  );
}
