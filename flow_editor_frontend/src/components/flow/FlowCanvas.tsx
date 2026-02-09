import { memo, useState, useCallback, useMemo, createContext, useContext, useRef, useEffect } from 'react';
import { Plus, Play, ZoomIn, ZoomOut, Maximize2, GripVertical, ChevronDown, ChevronUp, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { FlowBlock, FlowBlockType, ToolBlockType, getBlockTypeInfo, getBlockLabel, FALLBACK_COLOR } from '@/types/flow';
import { FIRST_MESSAGE_BLOCK_ID } from '@/services/flowService';
import { FlowBlockIcon } from './FlowBlockIcon';
import { AgentHeader } from './AgentHeader';
import { AgentActionPicker, AgentAction } from './AgentActionPicker';
import { MultiConditionalNode } from './MultiConditionalNode';
import { RoutePathsRenderer } from './RoutePathsRenderer';
import { InputHandle, OutputHandle } from './ConnectionHandle';
import { PermanentConnections } from './PermanentConnections';
import { VisualBranchesLayout, VerticalLine, MergeNode, ExpandAllContext } from './BranchingLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FLOW_LAYOUT } from '@/constants/flowLayout';
import { toast } from 'sonner';

// ============================================================================
// EXPORTED TYPES
// ============================================================================
export interface DroppableData {
  parentConditionId?: string;
  branchType?: 'yes' | 'no';
  position: 'root' | 'branch' | 'router';
  /** undefined = após último; null = no início; string = após esse block id */
  afterBlockId?: string | null;
  parentRouterId?: string;
  routeId?: string;
}

export interface DraggableCanvasBlockData {
  source: 'canvas';
  blockId: string;
  block: FlowBlock;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const COLORS = {
  NORMAL: '#64748b',
  RAMIFICACOES: '#a855f7',
};

// ============================================================================
// HIGHLIGHTED CONTENT
// ============================================================================
export const HighlightedContent = memo(function HighlightedContent({ 
  content, 
  className 
}: { 
  content: string; 
  className?: string;
}) {
  const parts = content.split(/(\{\{?[^}]+\}\}?)/g);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(/^\{\{?[^}]+\}\}?$/)) {
          return (
            <span key={index} className="font-semibold" style={{ color: 'hsl(262 83% 58%)' }}>
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
});

// ============================================================================
// DROP ZONE
// ============================================================================
const DropZone = memo(function DropZone({ 
  id,
  onAdd,
  afterBlockId,
  isFirst = false,
  manualMode = false,
  onRequestPromptInsert,
}: { 
  id: string;
  onAdd: (type: FlowBlockType, toolType?: ToolBlockType, content?: string) => void;
  afterBlockId?: string;
  isFirst?: boolean;
  manualMode?: boolean;
  onRequestPromptInsert?: (data: DroppableData) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { position: 'root', afterBlockId } as DroppableData,
  });

  const handleActionSelect = (action: AgentAction) => {
    onAdd(action.blockType, action.toolType, action.defaultContent);
  };

  const handlePromptInsert = () => {
    if (!onRequestPromptInsert) return;
    onRequestPromptInsert({ position: 'root', afterBlockId });
  };

  if (isFirst) {
    return (
      manualMode && onRequestPromptInsert ? (
        <button
          ref={setNodeRef}
          onClick={handlePromptInsert}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed",
            "border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
            "text-muted-foreground hover:text-primary transition-all text-sm font-medium",
            isOver && "scale-105 border-solid bg-primary/20 border-primary ring-4 ring-primary/30"
          )}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-primary" />
          </span>
          Escolher bloco do Prompt
        </button>
      ) : (
        <AgentActionPicker
          onSelect={handleActionSelect}
          trigger={
            <button
              ref={setNodeRef}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed",
                "border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
                "text-muted-foreground hover:text-primary transition-all text-sm font-medium",
                isOver && "scale-105 border-solid bg-primary/20 border-primary ring-4 ring-primary/30"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-primary" />
              </span>
              O que o agente faz?
            </button>
          }
        />
      )
    );
  }

  return (
    <AgentActionPicker
      onSelect={handleActionSelect}
      trigger={
        <button
          ref={setNodeRef}
          className={cn(
            "w-7 h-7 rounded-full border-2 border-dashed bg-background flex items-center justify-center transition-all",
            "border-muted-foreground/30 hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary",
            isOver && "scale-125 border-solid bg-primary/20 border-primary ring-4 ring-primary/30"
          )}
          onClick={manualMode && onRequestPromptInsert ? handlePromptInsert : undefined}
        >
          <Plus className={cn("w-3.5 h-3.5", isOver && "text-primary")} />
        </button>
      }
    />
  );
});

// ============================================================================
// FLOW NODE
// ============================================================================
const FlowNode = memo(function FlowNode({
  block,
  index,
  isSelected,
  onClick,
  allBlocks,
  isDisconnected = false,
  onConnect,
}: {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  allBlocks?: FlowBlock[];
  isDisconnected?: boolean;
  onConnect?: (fromBlockId: string, toBlockId: string) => void;
}) {
  const expandAll = useContext(ExpandAllContext);
  const [isLocalExpanded, setIsLocalExpanded] = useState(false);
  const isExpanded = expandAll || isLocalExpanded;
  const blockKey = (block as any).blockKey as string | undefined;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-block-${block.id}`,
    data: { source: 'canvas', blockId: block.id, block } as DraggableCanvasBlockData,
  });

  const typeInfo = getBlockTypeInfo(block);
  const label = getBlockLabel(block);
  const hasLongContent = block.content.length > 40;
  const displayContent = isExpanded ? block.content : block.content.substring(0, 40) + (hasLongContent ? '...' : '');
  const isPrimeiraMensagem = block.type === 'primeira_mensagem';
  const isAssistantFirstMessage = block.id === FIRST_MESSAGE_BLOCK_ID;

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const getBalloonStyle = () => ({
    backgroundColor: typeInfo.bgColor,
    borderColor: isDisconnected ? '#ef4444' : typeInfo.color,
  });

  const balloonWidth = isExpanded ? "w-[480px]" : "w-[360px]";

  return (
    <div className="flex flex-col items-center relative" style={{ overflow: 'visible' }}>
      {isDisconnected && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-2 -right-2 z-20">
                <div className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center shadow-lg animate-pulse">
                  <AlertCircle className="w-4 h-4 text-destructive-foreground" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-destructive text-destructive-foreground border-destructive">
              <p className="text-xs font-medium">Este bloco não está conectado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Container do bloco com handles laterais */}
      <div className="relative" style={{ overflow: 'visible' }}>
        {/* INPUT HANDLES - nas LATERAIS do bloco */}
        {!isPrimeiraMensagem && (
          <>
            {/* Input esquerdo */}
            <div 
              className="absolute z-30"
              style={{ 
                left: -12, 
                top: '50%', 
                transform: 'translateY(-50%)',
              }}
            >
              <InputHandle color={typeInfo.color} blockId={block.id} side="left" />
            </div>
            {/* Input direito */}
            <div 
              className="absolute z-30"
              style={{ 
                right: -12, 
                top: '50%', 
                transform: 'translateY(-50%)',
              }}
            >
              <InputHandle color={typeInfo.color} blockId={block.id} side="right" />
            </div>
          </>
        )}

        <div
          ref={setNodeRef}
          data-block-id={block.id}
          data-block-key={blockKey}
          style={{ ...style, ...getBalloonStyle() }}
          className={cn(
            balloonWidth,
            "cursor-pointer transition-all relative border-2 rounded-2xl shadow-lg",
            block.canal === 'whatsapp' && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
            isPrimeiraMensagem && "rounded-tl-sm",
            !isPrimeiraMensagem && "rounded-bl-sm",
            isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary",
            isDragging && "opacity-60 scale-105 z-50 shadow-2xl",
            !isSelected && "hover:shadow-xl hover:scale-[1.02]",
            isDisconnected && "ring-2 ring-destructive/50 ring-offset-2 ring-offset-background"
          )}
        >
          {block.canal === 'whatsapp' && (
            <span className="absolute top-1 right-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded z-10">
              WhatsApp
            </span>
          )}
          <div 
            className={cn(
              "absolute w-3 h-3 rotate-45",
              isPrimeiraMensagem && "-top-1.5 left-3",
              !isPrimeiraMensagem && "-bottom-1.5 left-4"
            )}
            style={{ 
              backgroundColor: typeInfo.bgColor,
              borderColor: isDisconnected ? '#ef4444' : typeInfo.color,
              borderWidth: isPrimeiraMensagem ? '2px 0 0 2px' : '0 2px 2px 0',
            }}
          />
          
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div 
              {...attributes} 
              {...listeners}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-lg hover:bg-background/50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div 
              className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: `${typeInfo.color}20` }}
              onClick={onClick}
            >
              <FlowBlockIcon type={block.type} toolType={block.toolType} className="w-5 h-5" style={{ color: typeInfo.color }} />
            </div>
            
            <div className="flex-1 min-w-0" onClick={onClick}>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-foreground">{label}</h4>
                {isPrimeiraMensagem && (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      isAssistantFirstMessage
                        ? 'border-emerald-300/70 text-emerald-700 bg-emerald-50'
                        : 'border-violet-300/70 text-violet-700 bg-violet-50'
                    )}
                  >
                    {isAssistantFirstMessage ? 'Primeira (SaaS)' : 'Primeira (Prompt)'}
                  </span>
                )}
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: typeInfo.color }}
                >
                  Bloco {index + 1}
                </span>
                {(blockKey || block.type === 'tool') && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ borderColor: typeInfo.color, color: typeInfo.color }}
                  >
                    {blockKey?.startsWith('vapi_') ? label : (blockKey || label)}
                  </span>
                )}
              </div>
              {isPrimeiraMensagem && <span className="text-[10px] text-muted-foreground">Saudação inicial</span>}
              {block.type === 'aguardar' && <span className="text-[10px] text-muted-foreground">Aguarda resposta</span>}
            </div>
            
            {hasLongContent && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsLocalExpanded(!isLocalExpanded); }}
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground",
                  "transition-all border border-border/50",
                  isExpanded && "bg-primary/10 text-primary border-primary/30"
                )}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
          
          <div className="px-4 py-3 border-t" style={{ borderTopColor: `${typeInfo.color}30` }} onClick={onClick}>
            {!block.content.trim() ? (
              <span className="text-sm text-muted-foreground italic">Clique para configurar</span>
            ) : (
              <HighlightedContent 
                content={displayContent}
                className={cn(
                  "text-sm text-foreground leading-relaxed whitespace-pre-wrap",
                  isExpanded && "max-h-[300px] overflow-y-auto pr-2"
                )}
              />
            )}
          </div>
        </div>
        
        {/* OUTPUT HANDLE - na BASE do bloco */}
        {block.type !== 'encerrar' && (
          <div 
            className="absolute z-30"
            style={{ 
              bottom: -12, 
              left: '50%', 
              transform: 'translateX(-50%)',
            }}
          >
            <OutputHandle 
              color={typeInfo.color} 
              blockId={block.id}
              onConnect={(targetId) => {
                if (onConnect) {
                  onConnect(block.id, targetId);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// START / END NODES
// ============================================================================
const StartNode = memo(function StartNode() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-md">
      <Play className="w-3.5 h-3.5" fill="currentColor" />
      <span className="font-semibold text-xs">Início</span>
    </div>
  );
});

const EndNode = memo(function EndNode() {
  return (
    <div className="px-4 py-1.5 bg-foreground text-background rounded-full font-semibold text-[10px]">
      FIM
    </div>
  );
});

// ============================================================================
// ZOOM CONTROLS
// ============================================================================
const ZoomControls = memo(function ZoomControls({
  zoom, onZoomIn, onZoomOut, onFitView,
}: {
  zoom: number; onZoomIn: () => void; onZoomOut: () => void; onFitView: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-lg">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} disabled={zoom <= 0.3}>
        <ZoomOut className="w-3.5 h-3.5" />
      </Button>
      <span className="text-[10px] font-medium w-10 text-center">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} disabled={zoom >= 2}>
        <ZoomIn className="w-3.5 h-3.5" />
      </Button>
      <div className="w-px h-4 bg-border mx-0.5" />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFitView}>
        <Maximize2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
});

// ============================================================================
// FLOW CANVAS
// ============================================================================
interface FlowCanvasProps {
  blocks: FlowBlock[];
  selectedBlockId: string | null;
  agentName: string;
  agentPhotoUrl?: string;
  onOpenAgentConfig: () => void;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType, parentRouterId?: string, routeId?: string, content?: string) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
  manualMode?: boolean;
  onRequestPromptInsert?: (data: DroppableData) => void;
}

export const FlowCanvas = memo(function FlowCanvas({
  blocks,
  selectedBlockId,
  agentName,
  agentPhotoUrl,
  onOpenAgentConfig,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  manualMode = false,
  onRequestPromptInsert,
}: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [expandAll, setExpandAll] = useState(false);

  // Root blocks (not inside any branch)
  const rootBlocks = useMemo(() => 
    blocks.filter(b => !b.parentRouterId),
    [blocks]
  );

  const handleZoomIn = useCallback(() => setZoom(z => Math.min(z + 0.15, 2)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(z - 0.15, 0.3)), []);
  const handleFitView = useCallback(() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }, []);

  // Prevenir zoom do navegador dentro do canvas usando native event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Sempre prevenir o comportamento padrão dentro do canvas
      e.preventDefault();
      e.stopPropagation();
      
      // Zoom com Ctrl/Cmd + scroll OU pinch (trackpad)
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(z => Math.max(0.3, Math.min(2, z + delta)));
      } else {
        // Pan normal com scroll
        setPan(p => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY,
        }));
      }
    };

    // Usar passive: false para poder chamar preventDefault
    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  }, [isPanning, startPan]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleAddRoot = useCallback((type: FlowBlockType, toolType?: ToolBlockType, content?: string) => {
    onAddBlock(type, toolType, undefined, undefined, content);
  }, [onAddBlock]);


  // Handler para adicionar bloco a uma rota específica do Multi-condicional
  const handleAddBlockToRoute = useCallback((parentRouterId: string, routeId: string) => 
    (type: FlowBlockType, toolType?: ToolBlockType, content?: string) => {
      onAddBlock(type, toolType, parentRouterId, routeId, content);
    }, [onAddBlock]);

  // Handler para conectar dois blocos
  const handleConnectBlocks = useCallback((fromBlockId: string, toBlockId: string) => {
    const fromBlock = blocks.find(b => b.id === fromBlockId) as (FlowBlock & { blockKey?: string }) | undefined;
    const toBlock = blocks.find(b => b.id === toBlockId) as (FlowBlock & { blockKey?: string }) | undefined;
    
    if (fromBlock && toBlock) {
      const fromIndex = blocks.findIndex(b => b.id === fromBlockId) + 1;
      const toIndex = blocks.findIndex(b => b.id === toBlockId) + 1;
      
      // Usar blockKey se disponível (para persistência correta), senão usar ID
      const targetKey = toBlock.blockKey || toBlockId;
      
      console.log('Conectando blocos:', `Bloco ${fromIndex}`, '->', `Bloco ${toIndex}`, '| Target key:', targetKey);
      
      // Atualiza o bloco de origem com o destino (usando blockKey para o banco)
      onUpdateBlock(fromBlockId, { nextBlock: targetKey });
      toast.success(`Conectado: Bloco ${fromIndex} → Bloco ${toIndex}`);
    }
  }, [blocks, onUpdateBlock]);

  const getGlobalIndex = (blockId: string) => blocks.findIndex(b => b.id === blockId);

  return (
    <ExpandAllContext.Provider value={expandAll}>
      <div 
        ref={canvasRef}
        className="flex-1 overflow-hidden bg-muted/30 relative select-none flow-canvas-area"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : undefined, touchAction: 'none' }}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            zIndex: 0,
          }}
        />


        {/* Layer de conexões - renderizado atrás do conteúdo */}
        <div 
          id="connections-layer"
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* Canvas content */}
        <div
          className="absolute inset-0 flex items-start justify-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center top',
            zIndex: 2,
          }}
        >
          <div className="py-8 px-16 inline-flex flex-col items-center relative">
            <AgentHeader agentName={agentName} agentPhotoUrl={agentPhotoUrl} onOpenConfig={onOpenAgentConfig} />
            
            <StartNode />
            <VerticalLine height={30} color={COLORS.NORMAL} />
            
            {rootBlocks.length === 0 && (
              <>
                <DropZone
                  id="drop-root-first"
                  onAdd={handleAddRoot}
                  isFirst
                  manualMode={manualMode}
                  onRequestPromptInsert={onRequestPromptInsert}
                />
                <VerticalLine height={30} color={COLORS.NORMAL} />
              </>
            )}

            {rootBlocks.map((block) => {
              const isRamificacoes = block.type === 'ramificacoes';
              const globalIndex = getGlobalIndex(block.id);
              
              return (
                <div key={block.id} className="flex flex-col items-center flex-shrink-0" style={{ overflow: 'visible' }}>
                  {isRamificacoes ? (
                    <div className="flex flex-col items-center" style={{ overflow: 'visible' }}>
                      <VerticalLine height={20} color={COLORS.NORMAL} animated />
                      
                      {/* Nó Multi-condicional */}
                      <MultiConditionalNode
                        block={block}
                        index={globalIndex}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => onSelectBlock(block.id)}
                        onUpdateBlock={onUpdateBlock}
                        allBlocks={blocks}
                        manualMode={manualMode}
                        onRequestPromptInsert={onRequestPromptInsert}
                        onAddBlockToRoute={(routeId, type, toolType, content) => 
                          onAddBlock(type, toolType, block.id, routeId, content)
                        }
                      />
                      
                      {/* Wrapper único: espinha central percorre toda a área (rotas + continuação) para não quebrar com 3+ caminhos */}
                      <div className="flex flex-col items-center relative flex-shrink-0" style={{ overflow: 'visible' }}>
                        {/* Espinha central contínua - do topo ao fim desta seção (pointer-events-none para não bloquear cliques) */}
                        <div
                          className="absolute left-1/2 top-0 bottom-0 pointer-events-none"
                          style={{
                            transform: 'translateX(-50%)',
                            width: 2,
                            backgroundColor: COLORS.NORMAL,
                            zIndex: 1,
                          }}
                        />
                        <div className="flex flex-col items-center relative z-10 flex-shrink-0">
                          {/* Renderizar blocos das rotas APENAS se houver blocos adicionados */}
                          {blocks.some(b => b.parentRouterId === block.id) && (
                            <RoutePathsRenderer
                              parentBlock={block}
                              allBlocks={blocks}
                              selectedBlockId={selectedBlockId}
                              onSelectBlock={onSelectBlock}
                              onAddBlock={onAddBlock}
                              onUpdateParentBlock={onUpdateBlock}
                              onUpdateBlock={onUpdateBlock}
                            />
                          )}
                          <VerticalLine height={30} color={COLORS.NORMAL} animated />
                          <DropZone
                            id={`drop-root-after-${block.id}`}
                            onAdd={handleAddRoot}
                            afterBlockId={block.id}
                            manualMode={manualMode}
                            onRequestPromptInsert={onRequestPromptInsert}
                          />
                          <VerticalLine height={20} color={COLORS.NORMAL} animated />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <VerticalLine height={20} color={COLORS.NORMAL} />
                      <FlowNode
                        block={block}
                        index={globalIndex}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => onSelectBlock(block.id)}
                        allBlocks={blocks}
                        onConnect={handleConnectBlocks}
                      />
                      <VerticalLine height={20} color={COLORS.NORMAL} />
                      <DropZone
                        id={`drop-root-after-${block.id}`}
                        onAdd={handleAddRoot}
                        afterBlockId={block.id}
                        manualMode={manualMode}
                        onRequestPromptInsert={onRequestPromptInsert}
                      />
                      <VerticalLine height={20} color={COLORS.NORMAL} />
                    </>
                  )}
                </div>
              );
            })}

            <EndNode />
          </div>
        </div>

        {/* Renderizar conexões permanentes */}
        <PermanentConnections
          blocks={blocks}
          containerRef={canvasRef}
          zoom={zoom}
          pan={pan}
        />

        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
          <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFitView={handleFitView} />
          
          <Button
            variant={expandAll ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-2 bg-card border shadow-lg"
            onClick={() => setExpandAll(!expandAll)}
          >
            {expandAll ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="text-xs">Recolher</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-xs">Expandir todos</span>
              </>
            )}
          </Button>

        </div>

        <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded border z-10">
          Ctrl+Scroll = Zoom • Arrastar = Mover
        </div>
      </div>
    </ExpandAllContext.Provider>
  );
});
