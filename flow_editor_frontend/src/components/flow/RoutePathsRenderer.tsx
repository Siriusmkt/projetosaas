import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FlowBlock, FlowBlockType, ToolBlockType, getBlockTypeInfo, getBlockLabel, RouterRoute } from '@/types/flow';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { FlowBlockIcon } from './FlowBlockIcon';
import { AgentActionPicker, AgentAction, AGENT_ACTIONS } from './AgentActionPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Componente unificado: double-click = adicionar bloco, drag = conectar
interface RouteConnectionButtonProps {
  color: string;
  routeId: string;
  onAddBlock: (action: AgentAction) => void;
  onConnect: (targetBlockId: string) => void;
}

const RouteConnectionButton = ({ color, routeId, onAddBlock, onConnect }: RouteConnectionButtonProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragState.startX, 2) + 
        Math.pow(e.clientY - dragState.startY, 2)
      );
      
      // Se arrastou significativamente, tenta conectar
      if (distance > 20) {
        // Usar elementsFromPoint para encontrar todos elementos (mais robusto)
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        
        let targetBlockId: string | null = null;
        
        for (const el of elements) {
          // Primeiro verificar input handles
          const inputHandle = el.closest('[data-input-handle]');
          if (inputHandle) {
            targetBlockId = inputHandle.getAttribute('data-input-handle');
            break;
          }
          
          // Depois verificar blocos diretamente
          const blockElement = el.closest('[data-block-id]');
          if (blockElement) {
            targetBlockId = blockElement.getAttribute('data-block-id');
            break;
          }
        }
        
        if (targetBlockId) {
          console.log('Rota conectando ao bloco:', targetBlockId);
          onConnect(targetBlockId);
        }
      }
      
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onConnect, dragState.startX, dragState.startY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pegar posição real do botão para o ponto de início
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragState({
      startX: centerX,
      startY: centerY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
    setIsDragging(true);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPicker(true);
  };

  // Gerar curva SVG usando portal para garantir posição correta
  const renderDragLine = () => {
    if (!isDragging) return null;

    const { startX, startY, currentX, currentY } = dragState;
    const deltaY = currentY - startY;
    const controlOffset = Math.abs(deltaY) * 0.5 + 50;

    let path: string;
    if (deltaY >= 0) {
      path = `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${currentX} ${currentY - controlOffset}, ${currentX} ${currentY}`;
    } else {
      path = `M ${startX} ${startY} C ${startX} ${startY - controlOffset}, ${currentX} ${currentY + controlOffset}, ${currentX} ${currentY}`;
    }

    const svgElement = (
      <svg
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw', 
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <path
          d={path}
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeDasharray="6 4"
          opacity={0.8}
        />
        <circle cx={currentX} cy={currentY} r={6} fill={color} opacity={0.6} />
      </svg>
    );

    // Renderizar no layer de conexões (fallback para body)
    const connectionsLayer = document.getElementById('connections-layer') || document.body;
    
    return createPortal(svgElement, connectionsLayer);
  };

  return (
    <>
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button
            ref={buttonRef}
            data-route-button={routeId}
            className="w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center transition-all hover:scale-110 hover:border-solid text-sm font-medium cursor-grab active:cursor-grabbing"
            style={{
              borderColor: color,
              color: color,
              backgroundColor: `${color}15`,
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            title="Duplo clique: adicionar bloco | Arrastar: conectar"
          >
            +
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="center">
          <div className="flex flex-col gap-0.5">
            {AGENT_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  onAddBlock(action);
                  setShowPicker(false);
                }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left text-sm"
              >
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: action.bgColor }}
                >
                  <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                </div>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {renderDragLine()}
    </>
  );
};


interface RoutePathsRendererProps {
  parentBlock: FlowBlock;
  allBlocks: (FlowBlock & { blockKey?: string })[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType, parentRouterId?: string, routeId?: string, content?: string) => void;
  onUpdateParentBlock?: (blockId: string, updates: Partial<FlowBlock>) => void;
  onUpdateBlock?: (blockId: string, updates: Partial<FlowBlock>) => void;
}

// Componente para renderizar um bloco dentro de uma rota - COM output handle e data-block-id
const RouteBlock = memo(function RouteBlock({
  block,
  index,
  isSelected,
  onClick,
  routeColor,
  onConnect,
  onDisconnect,
}: {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  routeColor: string;
  onConnect?: (targetBlockId: string) => void;
  onDisconnect?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDraggingConnection, setIsDraggingConnection] = useState(false);
  const [dragPos, setDragPos] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const outputRef = useRef<HTMLButtonElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-block-${block.id}`,
    data: { source: 'canvas', blockId: block.id, block },
  });

  const typeInfo = getBlockTypeInfo(block);
  const label = getBlockLabel(block);
  const hasLongContent = block.content.length > 30;
  const displayContent = isExpanded ? block.content : block.content.substring(0, 30) + (hasLongContent ? '...' : '');

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  // Handler para arrastar conexão do output
  useEffect(() => {
    if (!isDraggingConnection) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDragPos(prev => ({ ...prev, currentX: e.clientX, currentY: e.clientY }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Calcular distância para verificar se foi um arraste significativo
      const distance = Math.sqrt(
        Math.pow(e.clientX - dragPos.startX, 2) + 
        Math.pow(e.clientY - dragPos.startY, 2)
      );
      
      // Se não arrastou significativamente, ignorar
      if (distance < 20) {
        setIsDraggingConnection(false);
        return;
      }
      
      // Encontrar bloco ou input handle sob o cursor
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let targetBlockId: string | null = null;
      
      for (const el of elements) {
        const inputHandle = el.closest('[data-input-handle]');
        if (inputHandle) {
          targetBlockId = inputHandle.getAttribute('data-input-handle');
          break;
        }
        const blockEl = el.closest('[data-block-id]');
        if (blockEl && blockEl.getAttribute('data-block-id') !== block.id) {
          targetBlockId = blockEl.getAttribute('data-block-id');
          break;
        }
      }
      
      if (targetBlockId && onConnect) {
        console.log('[RouteBlock] Bloco conectando:', block.id, '→', targetBlockId);
        onConnect(targetBlockId);
      }
      
      setIsDraggingConnection(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingConnection, block.id, onConnect, dragPos.startX, dragPos.startY]);

  const handleOutputMouseDown = (e: React.MouseEvent) => {
    console.log('[RouteBlock] Output handle clicado para bloco:', block.id);
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragPos({
      startX: rect.left + rect.width / 2,
      startY: rect.top + rect.height / 2,
      currentX: e.clientX,
      currentY: e.clientY,
    });
    setIsDraggingConnection(true);
  };

  // Renderizar linha de arraste
  const renderDragLine = () => {
    if (!isDraggingConnection) return null;
    const { startX, startY, currentX, currentY } = dragPos;
    const deltaY = currentY - startY;
    const controlOffset = Math.abs(deltaY) * 0.5 + 50;
    const path = deltaY >= 0
      ? `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${currentX} ${currentY - controlOffset}, ${currentX} ${currentY}`
      : `M ${startX} ${startY} C ${startX} ${startY - controlOffset}, ${currentX} ${currentY + controlOffset}, ${currentX} ${currentY}`;

    const connectionsLayer = document.getElementById('connections-layer') || document.body;
    
    return createPortal(
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1 }}>
        <path d={path} stroke={typeInfo.color} strokeWidth={2} fill="none" strokeDasharray="6 4" opacity={0.8} />
        <circle cx={currentX} cy={currentY} r={6} fill={typeInfo.color} opacity={0.6} />
      </svg>,
      connectionsLayer
    );
  };

  return (
    <>
      <div
        ref={setNodeRef}
        data-block-id={block.id}
        style={style}
        className={cn(
          "w-[260px] cursor-pointer transition-all relative z-10",
          "border-2 rounded-xl shadow-md bg-card",
          isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary",
          isDragging && "opacity-60 scale-105 z-50 shadow-2xl",
          !isSelected && "hover:shadow-lg hover:scale-[1.02]"
        )}
        onClick={onClick}
      >
        {/* Indicador de cor da rota */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: routeColor }}
        />
        
        {/* Input handles laterais */}
        <div 
          data-input-handle={block.id}
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
          style={{ left: -6, top: '50%', transform: 'translateY(-50%)', backgroundColor: typeInfo.color }}
        />
        <div 
          data-input-handle={block.id}
          className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
          style={{ right: -6, top: '50%', transform: 'translateY(-50%)', backgroundColor: typeInfo.color }}
        />
        
        {/* Header */}
        <div 
          className="flex items-center gap-2 px-2.5 py-2 rounded-t-xl"
          style={{ backgroundColor: typeInfo.bgColor }}
        >
          <div 
            {...attributes} 
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-background/50"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${typeInfo.color}20` }}
          >
            <FlowBlockIcon 
              type={block.type} 
              toolType={block.toolType} 
              className="w-4 h-4" 
              style={{ color: typeInfo.color }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground"
                style={{ backgroundColor: typeInfo.color }}
              >
                {index + 1}
              </span>
              <span className="font-medium text-xs text-foreground truncate">{label}</span>
            </div>
          </div>
          
          {hasLongContent && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center bg-background/60 hover:bg-background"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
        
        {/* Content */}
        <div 
          className="px-2.5 py-2 bg-card rounded-b-xl border-t"
          style={{ borderColor: `${typeInfo.color}30` }}
        >
          {!block.content.trim() ? (
            <span className="text-xs text-muted-foreground italic">Clique para configurar</span>
          ) : (
            <p className={cn("text-xs text-foreground leading-relaxed", isExpanded && "max-h-[150px] overflow-y-auto")}>
              {displayContent}
            </p>
          )}
        </div>
        
        {/* Output handle na base - muda baseado se tem conexão ou não */}
        {block.type !== 'encerrar' && (
          block.gotoBlockId ? (
            // Se tem conexão, mostra botão de desconectar
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDisconnect?.();
              }}
              className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform flex items-center justify-center z-50 bg-destructive"
              style={{ 
                bottom: -10, 
                left: '50%', 
                transform: 'translateX(-50%)', 
              }}
              title="Clique para desconectar"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          ) : (
            // Se não tem conexão, mostra botão para conectar
            <button
              ref={outputRef}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOutputMouseDown(e);
              }}
              className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing hover:scale-125 transition-transform flex items-center justify-center z-50"
              style={{ 
                bottom: -10, 
                left: '50%', 
                transform: 'translateX(-50%)', 
                backgroundColor: typeInfo.color 
              }}
              title="Arraste para conectar a outro bloco"
            >
              <span className="text-white text-[8px] font-bold">+</span>
            </button>
          )
        )}
      </div>
      {renderDragLine()}
    </>
  );
});

// Componente principal que renderiza os paths de cada rota
export const RoutePathsRenderer = memo(function RoutePathsRenderer({
  parentBlock,
  allBlocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateParentBlock,
  onUpdateBlock,
}: RoutePathsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const routes = parentBlock.routes || [];
  const fallback = parentBlock.fallback;

  // Descobrir linha principal (excluir destinos de rotas para não esconder colunas)
  const mainLineKeys = useMemo(() => {
    const destKeys = new Set<string>();
    allBlocks.forEach(b => {
      if (b.type !== 'ramificacoes') return;
      (b.routes || []).forEach(r => {
        if (r.gotoBlockId) destKeys.add(r.gotoBlockId);
      });
      if (b.fallback?.gotoBlockId) destKeys.add(b.fallback.gotoBlockId);
    });
    const keys = new Set<string>();
    allBlocks
      .filter(b => !b.parentRouterId)
      .forEach(b => {
        const key = (b as any).blockKey || b.id;
        if (!destKeys.has(key)) keys.add(key);
      });
    return keys;
  }, [allBlocks]);

  // Ordenar blocos de uma rota na ordem da cadeia (gotoBlockId → nextBlock → ...)
  const sortRouteBlocksByChain = useCallback((blocks: FlowBlock[], startKey: string | null | undefined): FlowBlock[] => {
    if (!startKey || blocks.length === 0) return blocks;
    const getB = (key: string | null | undefined) => allBlocks.find(b => (b as any).blockKey === key || b.id === key);
    const ordered: FlowBlock[] = [];
    const seen = new Set<string>();
    let current = getB(startKey);
    while (current && ordered.length < blocks.length) {
      const k = (current as any).blockKey || current.id;
      if (seen.has(k)) break;
      seen.add(k);
      if (blocks.some(b => (b as any).blockKey === k || b.id === k)) ordered.push(current);
      const nextKey = current.nextBlock ?? null;
      if (!nextKey) break;
      if (mainLineKeys.has(nextKey)) break;
      current = getB(nextKey);
    }
    // Incluir qualquer bloco da rota que não entrou na cadeia (ex.: sem nextBlock)
    blocks.forEach(b => {
      if (!ordered.some(o => o.id === b.id)) ordered.push(b);
    });
    return ordered;
  }, [allBlocks, mainLineKeys]);

  // Agrupar blocos por rota (manual) OU por destino (auto)
  const routesWithBlocks = useMemo(() => {
    const manualRoutes = routes.map(route => {
      const raw = allBlocks.filter(b => b.parentRouterId === parentBlock.id && b.routeId === route.id);
      const blocks = sortRouteBlocksByChain(raw, route.gotoBlockId ?? undefined);
      return {
        id: route.id,
        label: route.label,
        color: route.color,
        gotoBlockId: route.gotoBlockId,
        blocks,
        routeLabels: [{ label: route.label, color: route.color }],
      };
    });

    const fallbackRaw = allBlocks.filter(b => b.parentRouterId === parentBlock.id && b.routeId === 'fallback');
    const fallbackBlocks = sortRouteBlocksByChain(fallbackRaw, fallback?.gotoBlockId ?? undefined);
    if (fallbackBlocks.length > 0) {
      manualRoutes.push({
        id: 'fallback',
        label: fallback?.label || 'Senão',
        color: '#6b7280',
        gotoBlockId: fallback?.gotoBlockId,
        blocks: fallbackBlocks,
        routeLabels: [{ label: fallback?.label || 'Senão', color: '#6b7280' }],
      });
    }

    const hasManual = manualRoutes.some(r => r.blocks.length > 0);
    if (hasManual) {
      return manualRoutes.filter(r => r.blocks.length > 0);
    }

    // Auto: agrupar por destination_block_key (convergência vira 1 coluna)
    const byDest = new Map<string, { id: string; gotoBlockId?: string | null; blocks: FlowBlock[]; routeLabels: { label: string; color: string }[]; color: string }>();
    const getBlockByKey = (key?: string | null) =>
      allBlocks.find(b => (b as any).blockKey === key || b.id === key);
    const destKeys = new Set<string>();
    routes.forEach(route => {
      if (route.gotoBlockId) destKeys.add(route.gotoBlockId);
    });
    if (fallback?.gotoBlockId) destKeys.add(fallback.gotoBlockId);

    const collectRouteChain = (startKey?: string | null) => {
      if (!startKey) return [];
      const chain: FlowBlock[] = [];
      const visited = new Set<string>();
      let current = getBlockByKey(startKey);
      while (current) {
        const currentKey = (current as any).blockKey || current.id;
        if (visited.has(currentKey)) break;
        visited.add(currentKey);
        chain.push(current);
        const nextKey = current.nextBlock || null;
        if (!nextKey) break;
        // Se reentra na linha principal, parar
        if (mainLineKeys.has(nextKey)) break;
        // Se chegou no início de outro caminho, parar
        if (destKeys.has(nextKey) && nextKey !== startKey) break;
        current = getBlockByKey(nextKey);
      }
      return chain;
    };

    const pushRoute = (routeId: string, label: string, color: string, destKey?: string | null) => {
      if (!destKey) return;
      // Se destino está na linha principal, não cria coluna (só conexão)
      if (mainLineKeys.has(destKey)) return;
      const existing = byDest.get(destKey);
      if (existing) {
        existing.routeLabels.push({ label, color });
      } else {
        const destBlocks = collectRouteChain(destKey);
        byDest.set(destKey, {
          id: routeId,
          gotoBlockId: destKey,
          blocks: destBlocks,
          routeLabels: [{ label, color }],
          color,
        });
      }
    };

    routes.forEach(route => pushRoute(route.id, route.label, route.color, route.gotoBlockId));
    if (fallback?.gotoBlockId) {
      pushRoute('fallback', fallback?.label || 'Senão', '#6b7280', fallback.gotoBlockId);
    }

    return Array.from(byDest.values()).filter(r => r.blocks.length > 0);
  }, [routes, fallback, allBlocks, parentBlock.id, mainLineKeys, sortRouteBlocksByChain]);

  // Estado para forçar re-render das conexões
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Estado para posições de elementos para conexões externas
  const [externalConnections, setExternalConnections] = useState<Array<{
    id: string;
    fromElement: string;
    toBlockId: string;
    color: string;
  }>>([]);

  // Coletar todas as conexões externas - PRIORIDADE: conexões de blocos individuais
  useEffect(() => {
    const connections: typeof externalConnections = [];
    
    // 1. Blocos INDIVIDUAIS dentro das rotas que têm gotoBlockId
    // Estas são as conexões mais importantes - feitas manualmente pelo usuário
    routesWithBlocks.forEach(route => {
      route.blocks.forEach(block => {
        if (block.gotoBlockId) {
          connections.push({
            id: `block-${block.id}-to-${block.gotoBlockId}`,
            fromElement: block.id,
            toBlockId: block.gotoBlockId,
            color: getBlockTypeInfo(block).color,
          });
        }
      });
    });
    
    // 2. Rotas que têm gotoBlockId MAS nenhum bloco da rota tem conexão individual
    // A conexão sai do botão + da rota
    routes.forEach(route => {
      if (route.gotoBlockId) {
        const routeWithBlocks = routesWithBlocks.find(r => r.id === route.id);
        
        // Verificar se ALGUM bloco da rota tem gotoBlockId
        const hasBlockWithConnection = routeWithBlocks?.blocks.some(b => b.gotoBlockId);
        
        // Se nenhum bloco tem conexão individual, a conexão da rota deve ser renderizada
        if (!hasBlockWithConnection) {
          connections.push({
            id: `route-${route.id}-to-${route.gotoBlockId}`,
            fromElement: `route-button-${route.id}`,
            toBlockId: route.gotoBlockId,
            color: route.color,
          });
        }
      }
    });
    
    // 3. Fallback: mesma lógica
    if (parentBlock.fallback?.gotoBlockId) {
      const fallbackRoute = routesWithBlocks.find(r => r.id === 'fallback');
      const hasBlockWithConnection = fallbackRoute?.blocks.some(b => b.gotoBlockId);
      
      if (!hasBlockWithConnection) {
        connections.push({
          id: `fallback-to-${parentBlock.fallback.gotoBlockId}`,
          fromElement: `route-button-fallback`,
          toBlockId: parentBlock.fallback.gotoBlockId,
          color: '#6b7280',
        });
      }
    }
    
    setExternalConnections(connections);
  }, [routes, parentBlock.fallback, routesWithBlocks]);

  // Handler para conectar uma rota a um bloco de destino
  const handleRouteConnect = useCallback((routeId: string, targetBlockId: string) => {
    if (!onUpdateParentBlock) return;
    
    const targetBlock = allBlocks.find(b => b.id === targetBlockId);
    const targetKey = targetBlock?.blockKey || targetBlockId;
    const targetIndex = allBlocks.findIndex(b => b.id === targetBlockId) + 1;
    
    if (routeId === 'fallback') {
      const updatedFallback = {
        ...parentBlock.fallback,
        destinationType: 'goto' as const,
        gotoBlockId: targetKey,
      };
      onUpdateParentBlock(parentBlock.id, { fallback: updatedFallback });
    } else {
      const updatedRoutes = (parentBlock.routes || []).map(route => {
        if (route.id === routeId) {
          return { ...route, destinationType: 'goto' as const, gotoBlockId: targetKey };
        }
        return route;
      });
      onUpdateParentBlock(parentBlock.id, { routes: updatedRoutes });
    }
    
    const routeLabel = routeId === 'fallback' ? 'Fallback' : routes.find(r => r.id === routeId)?.label || routeId;
    toast.success(`Rota "${routeLabel}" → Bloco ${targetIndex}`);
  }, [parentBlock, allBlocks, onUpdateParentBlock, routes]);

  // Se não há blocos em nenhuma rota, não renderiza nada
  if (routesWithBlocks.length === 0) return null;

  // Handler para adicionar bloco a uma rota
  const handleAddToRoute = (routeId: string) => (action: AgentAction) => {
    onAddBlock(action.blockType, action.toolType, parentBlock.id, routeId, action.defaultContent);
  };

  // Handler para conectar bloco de rota a outro bloco
  const handleBlockConnect = (blockId: string, targetBlockId: string) => {
    if (!onUpdateBlock) {
      console.log('[RoutePathsRenderer] onUpdateBlock não definido!');
      return;
    }
    
    console.log('[RoutePathsRenderer] Conectando bloco:', blockId, '→', targetBlockId);
    
    const targetBlock = allBlocks.find(b => b.id === targetBlockId);
    const targetKey = (targetBlock as any)?.blockKey || targetBlockId;
    const targetIndex = allBlocks.findIndex(b => b.id === targetBlockId) + 1;
    const sourceIndex = allBlocks.findIndex(b => b.id === blockId) + 1;
    
    onUpdateBlock(blockId, { gotoBlockId: targetKey });
    toast.success(`Bloco ${sourceIndex} → Bloco ${targetIndex}`);
  };

  // Handler para desconectar um bloco
  const handleBlockDisconnect = (blockId: string) => {
    if (!onUpdateBlock) return;
    
    const sourceIndex = allBlocks.findIndex(b => b.id === blockId) + 1;
    onUpdateBlock(blockId, { gotoBlockId: undefined });
    toast.success(`Bloco ${sourceIndex} desconectado`);
  };

  // Handler para desconectar uma rota (remover gotoBlockId da rota)
  const handleRouteDisconnect = (routeId: string) => {
    if (!onUpdateParentBlock) return;
    
    if (routeId === 'fallback') {
      const updatedFallback = {
        ...parentBlock.fallback,
        destinationType: 'continue' as const,
        gotoBlockId: undefined,
      };
      onUpdateParentBlock(parentBlock.id, { fallback: updatedFallback });
    } else {
      const updatedRoutes = (parentBlock.routes || []).map(route => {
        if (route.id === routeId) {
          return { ...route, destinationType: 'continue' as const, gotoBlockId: undefined };
        }
        return route;
      });
      onUpdateParentBlock(parentBlock.id, { routes: updatedRoutes });
    }
    
    const routeLabel = routeId === 'fallback' ? 'Fallback' : routes.find(r => r.id === routeId)?.label || routeId;
    toast.success(`Rota "${routeLabel}" desconectada`);
  };

  // Layout constants
  const columnWidth = 280;
  const columnGap = 32;
  const totalColumnsWidth = routesWithBlocks.length * columnWidth + (routesWithBlocks.length - 1) * columnGap;
  
  // MultiConditionalNode é 480px de largura - calcular posições das bolinhas
  const multiNodeWidth = 480;
  const allHandles = [...routes, { id: 'fallback', label: fallback?.label || 'Senão', color: '#6b7280' }];
  const handleGap = 20; // gap-5 = 20px entre handles
  const handleSize = 32; // w-8 h-8 = 32px
  const totalHandlesWidth = allHandles.length * handleSize + (allHandles.length - 1) * handleGap;
  
  const svgHeight = 60;

  // Renderizar conexões externas via portal
  const renderExternalConnections = () => {
    if (externalConnections.length === 0) return null;
    
    const lines = externalConnections.map(conn => {
      // Encontrar elemento de origem
      let fromEl: Element | null = null;
      if (conn.fromElement.startsWith('route-button-')) {
        fromEl = document.querySelector(`[data-route-button="${conn.fromElement.replace('route-button-', '')}"]`);
      } else {
        fromEl = document.querySelector(`[data-block-id="${conn.fromElement}"]`);
      }
      
      // Encontrar elemento de destino
      const toEl = document.querySelector(`[data-block-id="${conn.toBlockId}"]`) 
        || document.querySelector(`[data-block-key="${conn.toBlockId}"]`);
      
      if (!fromEl || !toEl) return null;
      
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      
      // Calcular pontos de conexão
      const startX = fromRect.left + fromRect.width / 2;
      const startY = fromRect.bottom;
      
      // Determinar lado do destino
      const isLeft = toRect.right < fromRect.left - 50;
      const isRight = toRect.left > fromRect.right + 50;
      const isAbove = toRect.bottom < fromRect.top;
      
      let endX: number;
      let endY: number;
      
      if (isLeft) {
        endX = toRect.right;
        endY = toRect.top + toRect.height / 2;
      } else if (isRight) {
        endX = toRect.left;
        endY = toRect.top + toRect.height / 2;
      } else if (isAbove) {
        endX = toRect.left + toRect.width / 2;
        endY = toRect.bottom;
      } else {
        endX = toRect.left + toRect.width / 2;
        endY = toRect.top;
      }
      
      // Gerar curva bezier
      const deltaY = Math.abs(endY - startY);
      const controlOffset = Math.max(Math.min(deltaY * 0.5, 150), 40);
      
      let path: string;
      if (isLeft || isRight) {
        const midY = (startY + endY) / 2;
        path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      } else if (endY >= startY) {
        path = `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
      } else {
        const loopOffset = 80;
        path = `M ${startX} ${startY} C ${startX + loopOffset} ${startY + 60}, ${endX + loopOffset} ${endY - 60}, ${endX} ${endY}`;
      }
      
      return (
        <g key={conn.id}>
          <path d={path} fill="none" stroke={conn.color} strokeWidth={6} strokeOpacity={0.15} strokeLinecap="round" />
          <path d={path} fill="none" stroke={conn.color} strokeWidth={2.5} strokeOpacity={0.7} strokeLinecap="round" />
        </g>
      );
    }).filter(Boolean);
    
    if (lines.length === 0) return null;
    
    const connectionsLayer = document.getElementById('connections-layer') || document.body;
    
    return createPortal(
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1 }}>
        {lines}
      </svg>,
      connectionsLayer
    );
  };

  return (
    <div className="relative mt-6 flex flex-col items-center" ref={containerRef} style={{ overflow: 'visible', zIndex: 0 }}>
      {/* Renderizar conexões externas */}
      {renderExternalConnections()}
      
      {/* SVG para linhas curvas saindo das bolinhas para cada coluna */}
      <svg 
        className="absolute pointer-events-none left-1/2"
        style={{
          top: -24,
          transform: 'translateX(-50%)',
          width: Math.max(totalColumnsWidth, multiNodeWidth),
          height: svgHeight,
          overflow: 'visible',
        }}
      >
        {routesWithBlocks.map((route, idx) => {
          // Encontrar índice desta rota nos handles originais (todos, não só os com blocos)
          const handleIndex = allHandles.findIndex(h => h.id === route.id);
          
          // Posição X da bolinha no MultiConditionalNode (centralizado)
          const handleStartX = (multiNodeWidth - totalHandlesWidth) / 2;
          const handleCenterX = handleStartX + handleIndex * (handleSize + handleGap) + handleSize / 2;
          
          // Converter para coordenadas do SVG
          const svgWidth = Math.max(totalColumnsWidth, multiNodeWidth);
          const svgCenterOffset = svgWidth / 2;
          const nodeOffset = multiNodeWidth / 2;
          const startX = svgCenterOffset - nodeOffset + handleCenterX;
          
          // Posição X da coluna de destino
          const columnsStartX = (svgWidth - totalColumnsWidth) / 2;
          const colX = columnsStartX + idx * (columnWidth + columnGap) + columnWidth / 2;
          
          const startY = 0;
          const endY = svgHeight;
          const controlY1 = startY + 30;
          const controlY2 = endY - 20;
          
          const path = `
            M ${startX} ${startY}
            C ${startX} ${controlY1},
              ${colX} ${controlY2},
              ${colX} ${endY}
          `;
          
          return (
            <g key={route.id}>
              <path
                d={path}
                fill="none"
                stroke={route.color}
                strokeWidth={6}
                strokeOpacity={0.15}
                strokeLinecap="round"
              />
              <path
                d={path}
                fill="none"
                stroke={route.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>

      {/* Container das colunas de rotas - centralizado */}
      <div 
        className="flex justify-center"
        style={{ gap: columnGap, marginTop: svgHeight - 24, width: 'fit-content' }}
      >
        {routesWithBlocks.map((route) => (
          <div 
            key={route.id}
            data-route-column
            data-route-id={route.id}
            className="flex flex-col items-center"
            style={{ width: columnWidth }}
          >
            {/* Badges das rotas (suporta convergência) */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-3">
              {(route.routeLabels || [{ label: route.label, color: route.color }]).map((rl) => (
                <div
                  key={`${route.id}-${rl.label}`}
                  className="px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-md"
                  style={{ backgroundColor: rl.color }}
                >
                  {rl.label}
                </div>
              ))}
            </div>
            
            {/* Blocos da rota */}
            {route.blocks.map((block, blockIdx) => {
              const globalIndex = allBlocks.findIndex(b => b.id === block.id);
              return (
                <div key={block.id} className="flex flex-col items-center">
                  {/* Linha vertical conectando blocos dentro da mesma rota */}
                  {blockIdx > 0 && (
                    <div 
                      className="w-0.5 h-5"
                      style={{ backgroundColor: route.color }}
                    />
                  )}
                  
                  <RouteBlock
                    block={block}
                    index={globalIndex}
                    isSelected={selectedBlockId === block.id}
                    onClick={() => onSelectBlock(block.id)}
                    routeColor={route.color}
                    onConnect={(targetId) => handleBlockConnect(block.id, targetId)}
                    onDisconnect={() => handleBlockDisconnect(block.id)}
                  />
                </div>
              );
            })}
            
            {/* Botão unificado: double-click = adicionar, drag = conectar */}
            <div className="flex flex-col items-center">
              <div 
                className="w-0.5 h-4"
                style={{ backgroundColor: `${route.color}60` }}
              />
              <RouteConnectionButton
                color={route.color}
                routeId={route.id}
                onAddBlock={handleAddToRoute(route.id)}
                onConnect={(targetBlockId) => handleRouteConnect(route.id, targetBlockId)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});