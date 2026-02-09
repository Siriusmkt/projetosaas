// Types for the Flow Editor
// Tipos de blocos do fluxo - 'ramificacoes' para lógica de múltiplos caminhos
export type FlowBlockType = 'primeira_mensagem' | 'texto' | 'ramificacoes' | 'aguardar' | 'encerrar' | 'tool';
export type ToolBlockType = string;

// ============================================================================
// RAMIFICAÇÕES - Múltiplos caminhos dinâmicos para definir o fluxo
// ============================================================================
export const ROUTER_COLORS = [
  { id: 'green', hex: '#22c55e', name: 'Verde' },
  { id: 'red', hex: '#ef4444', name: 'Vermelho' },
  { id: 'blue', hex: '#3b82f6', name: 'Azul' },
  { id: 'yellow', hex: '#eab308', name: 'Amarelo' },
  { id: 'purple', hex: '#a855f7', name: 'Roxo' },
] as const;

export const FALLBACK_COLOR = '#6b7280'; // Cinza

// Tipos de destino após uma rota
export type RouteDestinationType = 'continue' | 'end' | 'loop' | 'goto';

export interface RouterRoute {
  id: string;
  label: string;           // Nome do caminho (ex: "Pode falar")
  color: string;           // Cor hex
  keywords: string[];      // Palavras-chave que ativam este caminho
  response?: string;       // Resposta automática quando ativa esta rota
  destinationType: RouteDestinationType; // Tipo de destino
  gotoBlockId?: string | null;    // ID do bloco destino (se destinationType === 'goto')
}

export interface RouterFallback {
  label: string;
  response?: string;       // Resposta quando fallback
  destinationType: RouteDestinationType;
  gotoBlockId?: string | null;
}

export interface FlowBlock {
  id: string;
  type: FlowBlockType;
  toolType?: ToolBlockType;
  content: string;
  yesLabel?: string;
  noLabel?: string;
  timeout?: number;
  nextBlock?: string | null;
  
  // CONECTIVOS: Múltiplos caminhos dinâmicos
  analyzeVariable?: string;  // Variável que o conectivo analisa (ex: {{ultima_resposta}})
  routes?: RouterRoute[];
  fallback?: RouterFallback;
  
  // Branch support - qual condição/conectivo este bloco pertence
  parentConditionId?: string | null;
  branchType?: 'yes' | 'no' | null;
  parentRouterId?: string | null;
  routeId?: string | null; // ID da rota no conectivo pai
  routePosition?: 'first' | 'middle' | 'last'; // posição na rota (para persistência route_context)
  
  // Jump/Goto - allows jumping to any block in the flow (overrides normal flow)
  gotoBlockId?: string | null;
  
  // Tool configuration
  toolConfig?: {
    source?: string;
    action?: string;
    instructions?: string;
    fields?: string[];
    toolId?: string;
    toolName?: string;
    toolType?: string;
    fileType?: string;
    promptInstructions?: string;
    instancia?: string;
    fileUrl?: string;
    mensagem?: string;
  };
  /** Canal do bloco: voz (ou null) | whatsapp. Config blocks são compartilhados (null). */
  canal?: 'voz' | 'whatsapp' | null;
  /** order_index do banco (para persistência ao salvar por canal). */
  order_index?: number;
}

export interface FlowData {
  promptMaster: string;
  blocks: FlowBlock[];
}

// ============================================================================
// EXPORT JSON - Estrutura completa para exportação
// ============================================================================
export interface FlowExportJson {
  version: string;
  exportedAt: string;
  metadata: {
    totalBlocks: number;
    totalRamificacoes: number;
    totalRoutes: number;
  };
  promptMaster: string;
  flow: FlowExportBlock[];
}

export interface FlowExportBlock {
  id: string;
  index: number;
  type: FlowBlockType;
  toolType?: ToolBlockType;
  content: string;
  
  // Para Conectivos
  conectivos?: {
    analyzeVariable: string;
    routes: {
      label: string;
      keywords: string[];
      response?: string;
      destination: {
        type: RouteDestinationType;
        targetBlockId?: string;
        targetBlockIndex?: number;
      };
    }[];
    fallback: {
      label: string;
      response?: string;
      destination: {
        type: RouteDestinationType;
        targetBlockId?: string;
        targetBlockIndex?: number;
      };
    };
  };
  
  // Para outros tipos
  timeout?: number;
  toolConfig?: FlowBlock['toolConfig'];
}

export interface BlockTypeInfo {
  type: FlowBlockType;
  toolType?: ToolBlockType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description?: string;
}

export const STRUCTURE_BLOCKS: BlockTypeInfo[] = [
  { type: 'primeira_mensagem', label: 'Primeira Mensagem', icon: 'MessageCircle', color: 'hsl(280 80% 60%)', bgColor: 'hsl(280 80% 60% / 0.1)', description: 'Saudação inicial do agente' },
  { type: 'texto', label: 'Mensagem', icon: 'MessageSquare', color: 'hsl(160 84% 39%)', bgColor: 'hsl(160 84% 39% / 0.1)' },
  { type: 'ramificacoes', label: 'Multi caminhos', icon: 'GitBranch', color: 'hsl(262 83% 58%)', bgColor: 'hsl(262 83% 58% / 0.1)', description: 'Define múltiplos caminhos no fluxo' },
  { type: 'aguardar', label: 'Aguardar', icon: 'Clock', color: 'hsl(38 92% 50%)', bgColor: 'hsl(38 92% 50% / 0.1)' },
  { type: 'encerrar', label: 'Encerrar', icon: 'XCircle', color: 'hsl(0 84% 60%)', bgColor: 'hsl(0 84% 60% / 0.1)' },
];

export const TOOL_BLOCKS: BlockTypeInfo[] = [
  { type: 'tool', label: 'Ferramenta', icon: 'Wrench', color: 'hsl(38 92% 50%)', bgColor: 'hsl(38 92% 50% / 0.1)', description: 'Executar uma ferramenta' },
];

export function getBlockTypeInfo(block: FlowBlock): BlockTypeInfo {
  if (block.type === 'tool') {
    return TOOL_BLOCKS[0];
  }
  return STRUCTURE_BLOCKS.find(b => b.type === block.type) || STRUCTURE_BLOCKS[0];
}

export function getBlockLabel(block: FlowBlock): string {
  if (block.type === 'tool') {
    return block.toolConfig?.toolName || 'Ferramenta';
  }
  const info = getBlockTypeInfo(block);
  return info.label;
}

export function createRouterRoute(index: number): RouterRoute {
  const colorInfo = ROUTER_COLORS[index % ROUTER_COLORS.length];
  return {
    id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    label: `Caminho ${index + 1}`,
    color: colorInfo.hex,
    keywords: [],
    response: '',
    destinationType: 'continue',
    gotoBlockId: null,
  };
}

export function createBlock(
  type: FlowBlockType, 
  toolType?: ToolBlockType,
  parentConditionId?: string,
  branchType?: 'yes' | 'no'
): FlowBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const defaultContent = toolType 
    ? getToolDefaultContent(toolType)
    : getStructureDefaultContent(type);

  const baseBlock: FlowBlock = {
    id,
    type,
    toolType,
    content: defaultContent,
    timeout: type === 'aguardar' ? 30 : undefined,
    nextBlock: null,
    parentConditionId: parentConditionId || null,
    branchType: branchType || null,
  };

  // Inicializar Ramificações com 2 caminhos padrão
  if (type === 'ramificacoes') {
    baseBlock.analyzeVariable = '{{ultima_resposta}}';
    baseBlock.routes = [
      {
        id: `route_${Date.now()}_1`,
        label: 'Sim',
        color: ROUTER_COLORS[0].hex,
        keywords: ['sim', 'pode', 'claro', 'quero'],
        response: 'Ótimo! Vamos continuar...',
        destinationType: 'continue',
        gotoBlockId: null,
      },
      {
        id: `route_${Date.now()}_2`,
        label: 'Não',
        color: ROUTER_COLORS[1].hex,
        keywords: ['não', 'agora não', 'depois'],
        response: 'Entendi! Sem problemas.',
        destinationType: 'continue',
        gotoBlockId: null,
      },
    ];
    baseBlock.fallback = {
      label: 'Outros',
      response: 'Pode repetir? Não entendi.',
      destinationType: 'loop',
      gotoBlockId: null,
    };
  }

  return baseBlock;
}

function getStructureDefaultContent(type: FlowBlockType): string {
  switch (type) {
    case 'primeira_mensagem': return 'Olá! Sou a assistente virtual. Como posso ajudar?';
    case 'texto': return 'Digite sua mensagem aqui...';
    case 'ramificacoes': return 'Como o lead respondeu?';
    case 'aguardar': return 'Aguardar resposta';
    case 'encerrar': return 'Encerrar conversa';
    default: return '';
  }
}

function getToolDefaultContent(_: ToolBlockType | undefined): string {
  return 'Selecionar tool';
}

// ============================================================================
// HELPER: Gerar JSON completo do fluxo (inclui ramificações)
// ============================================================================
export function generateFlowExportJson(promptMaster: string, blocks: FlowBlock[]): FlowExportJson {
  const ramificacoesBlocks = blocks.filter(b => b.type === 'ramificacoes');
  const totalRoutes = ramificacoesBlocks.reduce((acc, b) => acc + (b.routes?.length || 0), 0);
  
  const getBlockIndex = (blockId: string) => blocks.findIndex(b => b.id === blockId);
  
  const flowExport: FlowExportBlock[] = blocks.map((block, index) => {
    const exportBlock: FlowExportBlock = {
      id: block.id,
      index,
      type: block.type,
      content: block.content,
    };
    
    if (block.toolType) {
      exportBlock.toolType = block.toolType;
    }
    
    if (block.timeout) {
      exportBlock.timeout = block.timeout;
    }
    
    if (block.toolConfig) {
      exportBlock.toolConfig = block.toolConfig;
    }
    
    // Ramificações - exportar toda a configuração
    if (block.type === 'ramificacoes' && block.routes) {
      exportBlock.conectivos = {
        analyzeVariable: block.analyzeVariable || '{{ultima_resposta}}',
        routes: block.routes.map(route => ({
          label: route.label,
          keywords: route.keywords,
          response: route.response,
          destination: {
            type: route.destinationType,
            targetBlockId: route.gotoBlockId || undefined,
            targetBlockIndex: route.gotoBlockId ? getBlockIndex(route.gotoBlockId) : undefined,
          },
        })),
        fallback: {
          label: block.fallback?.label || 'Fallback',
          response: block.fallback?.response,
          destination: {
            type: block.fallback?.destinationType || 'continue',
            targetBlockId: block.fallback?.gotoBlockId || undefined,
            targetBlockIndex: block.fallback?.gotoBlockId ? getBlockIndex(block.fallback.gotoBlockId) : undefined,
          },
        },
      };
    }
    
    return exportBlock;
  });
  
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      totalBlocks: blocks.length,
      totalRamificacoes: ramificacoesBlocks.length,
      totalRoutes,
    },
    promptMaster,
    flow: flowExport,
  };
}
