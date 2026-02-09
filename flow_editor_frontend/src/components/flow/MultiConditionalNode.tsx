import { memo, useState, useRef, useEffect } from 'react';
import { GitBranch, Plus, ArrowRight, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { FlowBlock, FlowBlockType, ToolBlockType, RouterRoute, FALLBACK_COLOR } from '@/types/flow';
import { cn } from '@/lib/utils';
import { AgentActionPicker, AgentAction } from './AgentActionPicker';
import { InputHandle } from './ConnectionHandle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface MultiConditionalNodeProps {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
  allBlocks?: FlowBlock[];
  onAddBlockToRoute?: (routeId: string, type: FlowBlockType, toolType?: ToolBlockType, content?: string) => void;
  onConnectRoute?: (routeId: string, targetBlockId: string) => void;
  manualMode?: boolean;
  onRequestPromptInsert?: (data: {
    position: 'root' | 'branch' | 'router';
    afterBlockId?: string;
    parentRouterId?: string;
    routeId?: string;
  }) => void;
}

// Interface para posições das bolinhas (para desenhar linhas)
export interface RouteHandlePosition {
  routeId: string;
  color: string;
  x: number;
  y: number;
  hasConnection: boolean;
  connectedBlockId?: string | null;
}

export const MultiConditionalNode = memo(function MultiConditionalNode({
  block,
  index,
  isSelected,
  onClick,
  onUpdateBlock,
  allBlocks = [],
  onAddBlockToRoute,
  onConnectRoute,
  manualMode,
  onRequestPromptInsert,
}: MultiConditionalNodeProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-block-${block.id}`,
    data: { source: 'canvas', blockId: block.id, block },
  });

  // Combinar refs
  const combinedRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    (nodeRef as any).current = el;
  };

  const routes = block.routes || [];
  const fallback = block.fallback;

  // Blocos conectados a cada rota
  const getRouteBlocks = (routeId: string) => {
    return allBlocks.filter(b => b.parentRouterId === block.id && b.routeId === routeId);
  };

  // Handler para adicionar bloco a uma rota
  const handleAddToRoute = (routeId: string, action: AgentAction) => {
    if (onAddBlockToRoute) {
      onAddBlockToRoute(routeId, action.blockType, action.toolType, action.defaultContent);
    }
    setActivePopover(null);
  };

  // Handler para conectar a bloco existente
  const handleConnectToBlock = (routeId: string, targetBlockId: string) => {
    // Atualizar a rota com o destino
    if (routeId === 'fallback') {
      onUpdateBlock(block.id, {
        fallback: { ...fallback, gotoBlockId: targetBlockId || null, destinationType: targetBlockId ? 'goto' : 'continue' } as any
      });
    } else {
      onUpdateBlock(block.id, {
        routes: routes.map(r => r.id === routeId 
          ? { ...r, gotoBlockId: targetBlockId || null, destinationType: targetBlockId ? 'goto' : 'continue' } 
          : r
        ),
      });
    }
    onConnectRoute?.(routeId, targetBlockId);
    setActivePopover(null);
  };

  // Construir lista de handles (rotas + fallback)
  const allRouteHandles = [
    ...routes.map(r => ({ 
      id: r.id, 
      color: r.color, 
      label: r.label, 
      gotoBlockId: r.gotoBlockId,
      blocks: getRouteBlocks(r.id),
    })),
    { 
      id: 'fallback', 
      color: FALLBACK_COLOR, 
      label: fallback?.label || 'Senão', 
      gotoBlockId: fallback?.gotoBlockId,
      blocks: getRouteBlocks('fallback'),
    }
  ];

  // Blocos disponíveis para conectar (excluindo self e blocos já em rotas deste multi-condicional)
  const availableBlocks = allBlocks.filter(b => 
    b.id !== block.id && 
    b.parentRouterId !== block.id
  );

  return (
    <div
      ref={combinedRef}
      data-block-id={block.id}
      data-block-key={(block as any).blockKey}
      className={cn(
        "w-[480px] rounded-2xl border-2 overflow-hidden shadow-lg bg-card transition-all",
        isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary",
        isDragging && "opacity-60 scale-[0.98] z-50"
      )}
      style={{ 
        borderColor: 'hsl(262 83% 58%)',
        ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {})
      }}
      onClick={onClick}
    >
      {/* INPUT HANDLES - laterais para permitir conexão de outros blocos */}
      <div
        className="absolute z-30"
        style={{
          left: -12,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <InputHandle color={'hsl(262 83% 58%)'} blockId={block.id} side="left" />
      </div>
      <div
        className="absolute z-30"
        style={{
          right: -12,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <InputHandle color={'hsl(262 83% 58%)'} blockId={block.id} side="right" />
      </div>
      {/* Header compacto */}
      <div 
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: 'hsl(262 83% 58% / 0.1)' }}
      >
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))' }}
        >
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Multi caminhos</span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: 'hsl(262 83% 58%)' }}
            >
              Bloco {index + 1}
            </span>
            {(block as any).blockKey && (
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                style={{ borderColor: 'hsl(262 83% 58%)', color: 'hsl(262 83% 58%)' }}
              >
                {(block as any).blockKey}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {routes.length} {routes.length === 1 ? 'caminho' : 'caminhos'} • Clique para configurar
          </span>
        </div>
      </div>

      {/* Footer com bolinhas coloridas */}
      <div 
        className="flex items-center justify-center gap-5 px-4 py-4 border-t"
        style={{ borderColor: 'hsl(262 83% 58% / 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {allRouteHandles.map((handle, handleIndex) => {
          const hasBlocks = handle.blocks.length > 0;
          const hasGoto = !!handle.gotoBlockId;
          const isConnected = hasBlocks || hasGoto;
          
          return (
            <div key={handle.id} className="flex flex-col items-center gap-1.5">
              {/* Label da rota - ACIMA da bolinha */}
              <span 
                className="text-[9px] font-medium max-w-[60px] truncate text-center"
                style={{ color: handle.color }}
              >
                {handle.label}
              </span>
              
              <Popover 
                open={activePopover === handle.id}
                onOpenChange={(open) => setActivePopover(open ? handle.id : null)}
              >
                <PopoverTrigger asChild>
                  <button
                    data-route-handle={`${block.id}:${handle.id}`}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all duration-200",
                      "hover:scale-110 hover:shadow-lg cursor-pointer",
                      "flex items-center justify-center relative",
                      isConnected && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{ 
                      backgroundColor: handle.color,
                      borderColor: handle.color,
                      boxShadow: `0 4px 12px ${handle.color}50`,
                      ['--tw-ring-color' as any]: handle.color,
                    }}
                    title={handle.label}
                  >
                    {isConnected ? (
                      <div className="w-3 h-3 rounded-full bg-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-72 p-0 overflow-hidden" 
                  align="center"
                  side="bottom"
                >
                  {/* Header do popover */}
                  <div 
                    className="flex items-center gap-2 px-3 py-2.5 border-b"
                    style={{ backgroundColor: `${handle.color}15` }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: handle.color }}
                    />
                    <span className="font-medium text-sm">{handle.label}</span>
                  </div>
                  
                  {/* Opções */}
                  <div className="p-2 space-y-1">
                    {/* Adicionar bloco */}
                    {manualMode && onRequestPromptInsert ? (
                      <button
                        onClick={() =>
                          onRequestPromptInsert({
                            position: 'router',
                            parentRouterId: block.id,
                            routeId: handle.id,
                          })
                        }
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Adicionar do Prompt</p>
                          <p className="text-xs text-muted-foreground">Escolher bloco existente</p>
                        </div>
                      </button>
                    ) : (
                      <AgentActionPicker
                        onSelect={(action) => handleAddToRoute(handle.id, action)}
                        excludeBlockTypes={['ramificacoes']}
                        trigger={
                          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-muted transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">Adicionar ação</p>
                              <p className="text-xs text-muted-foreground">Criar novo bloco neste caminho</p>
                            </div>
                          </button>
                        }
                        align="start"
                      />
                    )}

                    {/* Conectar ao fluxo principal */}
                    <button
                      onClick={() => handleConnectToBlock(handle.id, '')}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Continuar no fluxo</p>
                        <p className="text-xs text-muted-foreground">Segue para o próximo bloco</p>
                      </div>
                    </button>

                    {/* Conectar a bloco existente */}
                    {availableBlocks.length > 0 && (
                      <div className="pt-2 border-t mt-2">
                        <span className="text-xs text-muted-foreground px-3 block mb-1">
                          Ir para bloco existente:
                        </span>
                        <div className="max-h-40 overflow-y-auto space-y-0.5">
                          {availableBlocks.map((b) => {
                            const bIndex = allBlocks.findIndex(ab => ab.id === b.id);
                            return (
                              <button
                                key={b.id}
                                onClick={() => handleConnectToBlock(handle.id, b.id)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-left hover:bg-muted transition-colors",
                                  handle.gotoBlockId === b.id && "bg-primary/10"
                                )}
                              >
                                <span className="w-5 h-5 rounded bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold">
                                  {bIndex + 1}
                                </span>
                                <span className="truncate flex-1">{b.content.substring(0, 30) || b.type}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          );
        })}
      </div>
    </div>
  );
});
