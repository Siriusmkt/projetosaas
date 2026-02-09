import { memo, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { Plus, ChevronDown, ChevronUp, GripVertical, Merge } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { FlowBlock, FlowBlockType, ToolBlockType, getBlockTypeInfo, getBlockLabel, RouterRoute, FALLBACK_COLOR } from '@/types/flow';
import { FlowBlockIcon } from './FlowBlockIcon';
import { AgentActionPicker, AgentAction } from './AgentActionPicker';
import { cn } from '@/lib/utils';
import { FLOW_LAYOUT } from '@/constants/flowLayout';


// ============================================================================
// CONSTANTS - Alinhados com RamificacoesNode
// ============================================================================
const BRANCH_COLORS = {
  SIM: '#22c55e',
  NAO: '#ef4444',
  DEFAULT: '#64748b'
};

// Mesmas dimensões do RamificacoesNode para alinhamento perfeito
const COLUMN_WIDTH = 280;
const COLUMN_GAP = 24;
const NODE_WIDTH = 260;

// ============================================================================
// Context for expand state
// ============================================================================
const ExpandAllContext = createContext<boolean>(false);
export const useExpandAll = () => useContext(ExpandAllContext);
export { ExpandAllContext };

// ============================================================================
// TYPES
// ============================================================================
export interface BranchPath {
  routeId: string;
  routeLabel: string;
  routeColor: string;
  blocks: FlowBlock[];
  destinationType: 'continue' | 'end' | 'loop' | 'goto';
  gotoBlockId?: string | null;
}
export interface DroppableData {
  position: 'root' | 'branch' | 'router';
  afterBlockId?: string;
  parentRouterId?: string;
  routeId?: string;
}

// ============================================================================
// VERTICAL LINE
// ============================================================================
export const VerticalLine = memo(function VerticalLine({
  height = 20,
  color = BRANCH_COLORS.DEFAULT,
  animated = false
}: {
  height?: number;
  color?: string;
  animated?: boolean;
}) {
  return <div className="relative flex-shrink-0 mx-auto" style={{
    width: FLOW_LAYOUT.LINE_WIDTH,
    height,
    backgroundColor: color,
    borderRadius: 1
  }}>
      {animated && height > 15 && <div className="absolute rounded-full" style={{
      width: 4,
      height: 6,
      backgroundColor: 'white',
      opacity: 0.6,
      left: -1,
      top: '50%',
      transform: 'translateY(-50%)',
      animation: 'flowDown 1.5s ease-in-out infinite'
    }} />}
    </div>;
});

// ============================================================================
// HORIZONTAL LINE
// ============================================================================
export const HorizontalLine = memo(function HorizontalLine({
  width = 50,
  color = BRANCH_COLORS.DEFAULT
}: {
  width?: number;
  color?: string;
}) {
  return <div className="flex-shrink-0" style={{
    width,
    height: FLOW_LAYOUT.LINE_WIDTH,
    backgroundColor: color,
    borderRadius: 1
  }} />;
});

// ============================================================================
// BRANCH CONNECTOR - T invertido saindo do nó
// ============================================================================
export const BranchConnector = memo(function BranchConnector({
  routes,
  fallbackLabel
}: {
  routes: RouterRoute[];
  fallbackLabel?: string;
}) {
  const allPaths = [...routes.map(r => ({
    label: r.label,
    color: r.color
  })), {
    label: fallbackLabel || 'Outros',
    color: FALLBACK_COLOR
  }];
  const totalWidth = (allPaths.length - 1) * COLUMN_GAP;
  return <div className="flex flex-col items-center">
      {/* Linha vertical descendo */}
      <VerticalLine height={30} color={BRANCH_COLORS.DEFAULT} />
      
      {/* Linha horizontal conectando todos os branches */}
      <div className="relative flex items-start justify-center" style={{
      width: totalWidth + 40
    }}>
        {/* Linha horizontal principal */}
        <div className="absolute top-0" style={{
        width: totalWidth,
        height: FLOW_LAYOUT.LINE_WIDTH,
        backgroundColor: BRANCH_COLORS.DEFAULT,
        left: '50%',
        transform: 'translateX(-50%)'
      }} />
        
        {/* Conectores verticais para cada branch */}
        <div className="flex justify-between w-full" style={{
        width: totalWidth
      }}>
          {allPaths.map((path, idx) => <div key={idx} className="flex flex-col items-center" style={{
          position: 'relative'
        }}>
              {/* Linha vertical do branch */}
              <VerticalLine height={25} color={path.color} />
              
              {/* Badge do branch */}
              <div className="px-2 py-1 rounded-full text-white text-[10px] font-semibold shadow-sm whitespace-nowrap" style={{
            backgroundColor: path.color
          }}>
                {path.label}
              </div>
            </div>)}
        </div>
      </div>
    </div>;
});

// ============================================================================
// BRANCH COLUMN - Coluna de um caminho específico
// ============================================================================
interface BranchColumnProps {
  routeId: string;
  routeLabel: string;
  routeColor: string;
  blocks: FlowBlock[];
  parentRouterId: string;
  selectedBlockId: string | null;
  allBlocks: FlowBlock[];
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType, parentRouterId?: string, routeId?: string, content?: string) => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
  destinationType: 'continue' | 'end' | 'loop' | 'goto';
  gotoBlockId?: string | null;
}
export const BranchColumn = memo(function BranchColumn({
  routeId,
  routeLabel,
  routeColor,
  blocks,
  parentRouterId,
  selectedBlockId,
  allBlocks,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  destinationType,
  gotoBlockId
}: BranchColumnProps) {
  const handleAddBlock = useCallback((type: FlowBlockType, toolType?: ToolBlockType, content?: string) => {
    onAddBlock(type, toolType, parentRouterId, routeId, content);
  }, [onAddBlock, parentRouterId, routeId]);

  return (
    <div 
      className="flex flex-col items-center"
      style={{ width: COLUMN_WIDTH }}
    >
      {/* Branch label */}
      <div 
        className="px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-sm whitespace-nowrap mb-3"
        style={{ backgroundColor: routeColor }}
      >
        {routeLabel}
      </div>
      
      {/* Blocks in this branch */}
      {blocks.map((block, idx) => {
        const globalIndex = allBlocks.findIndex(b => b.id === block.id);
        return (
          <div key={block.id} className="flex flex-col items-center">
            <VerticalLine height={16} color={routeColor} />
            <BranchFlowNode
              block={block}
              index={globalIndex}
              isSelected={selectedBlockId === block.id}
              onClick={() => onSelectBlock(block.id)}
              allBlocks={allBlocks}
              branchColor={routeColor}
            />
          </div>
        );
      })}
      
      {/* Add block zone */}
      <div className="mt-3">
        <BranchDropZone
          routeId={routeId}
          parentRouterId={parentRouterId}
          onAdd={handleAddBlock}
          afterBlockId={blocks[blocks.length - 1]?.id}
          color={routeColor}
          isFirst={blocks.length === 0}
        />
      </div>
    </div>
  );
});

// ============================================================================
// BRANCH DROP ZONE - Zona de drop dentro de um branch
// ============================================================================
interface BranchDropZoneProps {
  routeId: string;
  parentRouterId: string;
  onAdd: (type: FlowBlockType, toolType?: ToolBlockType, content?: string) => void;
  afterBlockId?: string;
  color: string;
  isFirst?: boolean;
}
const BranchDropZone = memo(function BranchDropZone({
  routeId,
  parentRouterId,
  onAdd,
  afterBlockId,
  color,
  isFirst = false
}: BranchDropZoneProps) {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: `drop-branch-${parentRouterId}-${routeId}-${afterBlockId || 'first'}`,
    data: {
      position: 'branch',
      parentRouterId,
      routeId,
      afterBlockId
    } as DroppableData
  });
  const handleActionSelect = (action: AgentAction) => {
    onAdd(action.blockType, action.toolType, action.defaultContent);
  };
  return <AgentActionPicker onSelect={handleActionSelect} trigger={<button ref={setNodeRef} className={cn("w-6 h-6 rounded-full border-2 border-dashed bg-background flex items-center justify-center transition-all", "hover:border-solid hover:scale-110", isOver && "scale-125 border-solid ring-4")} style={{
    borderColor: isOver ? color : `${color}60`,
    ...(isOver && {
      backgroundColor: `${color}20`,
      '--tw-ring-color': `${color}30`
    } as any)
  }}>
          <Plus className="w-3 h-3" style={{
      color: isOver ? color : `${color}80`
    }} />
        </button>} />;
});

// ============================================================================
// BRANCH FLOW NODE - Nó dentro de um branch
// ============================================================================
interface BranchFlowNodeProps {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  allBlocks: FlowBlock[];
  branchColor: string;
}
const BranchFlowNode = memo(function BranchFlowNode({
  block,
  index,
  isSelected,
  onClick,
  allBlocks,
  branchColor
}: BranchFlowNodeProps) {
  const expandAll = useContext(ExpandAllContext);
  const [isLocalExpanded, setIsLocalExpanded] = useState(false);
  const isExpanded = expandAll || isLocalExpanded;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `canvas-block-${block.id}`,
    data: {
      source: 'canvas',
      blockId: block.id,
      block
    }
  });
  const typeInfo = getBlockTypeInfo(block);
  const label = getBlockLabel(block);
  const hasLongContent = block.content.length > 30;
  const displayContent = isExpanded ? block.content : block.content.substring(0, 30) + (hasLongContent ? '...' : '');
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;
  return <div ref={setNodeRef} style={style} className={cn("w-[280px] cursor-pointer transition-all relative", "border-2 rounded-xl shadow-md", isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary", isDragging && "opacity-60 scale-105 z-50 shadow-2xl", !isSelected && "hover:shadow-lg hover:scale-[1.02]")} onClick={onClick}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-t-xl" style={{
      backgroundColor: typeInfo.bgColor,
      borderColor: typeInfo.color
    }}>
        <div {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-background/50" onClick={e => e.stopPropagation()}>
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{
        backgroundColor: `${typeInfo.color}20`
      }}>
          <FlowBlockIcon type={block.type} toolType={block.toolType} className="w-4 h-4" style={{
          color: typeInfo.color
        }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-primary-foreground" style={{
            backgroundColor: typeInfo.color
          }}>
              {index + 1}
            </span>
            <span className="font-medium text-xs text-foreground truncate">{label}</span>
          </div>
        </div>
        
        {hasLongContent && <button onClick={e => {
        e.stopPropagation();
        setIsLocalExpanded(!isLocalExpanded);
      }} className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center bg-background/60 hover:bg-background">
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>}
      </div>
      
      {/* Content */}
      <div className="px-2.5 py-2 bg-card rounded-b-xl border-t" style={{
      borderColor: `${typeInfo.color}30`
    }}>
        {!block.content.trim() ? <span className="text-xs text-muted-foreground italic">Configurar...</span> : <p className={cn("text-xs text-foreground leading-relaxed", isExpanded && "max-h-[150px] overflow-y-auto")}>
            {displayContent}
          </p>}
      </div>
      
      {/* Branch color indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{
      backgroundColor: branchColor
    }} />
    </div>;
});

// ============================================================================
// MERGE NODE - Ponto onde branches se juntam
// ============================================================================
export const MergeNode = memo(function MergeNode({
  color = BRANCH_COLORS.DEFAULT
}: {
  color?: string;
}) {
  return <div className="w-6 h-6 rounded-full border-[3px] bg-card flex items-center justify-center shadow-md" style={{
    borderColor: color
  }}>
      <Merge className="w-3 h-3 rotate-180" style={{
      color
    }} />
    </div>;
});

// ============================================================================
// VISUAL BRANCHES LAYOUT - Layout de ramificações visuais
// ============================================================================
interface VisualBranchesLayoutProps {
  parentBlock: FlowBlock;
  allBlocks: FlowBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType, parentRouterId?: string, routeId?: string, content?: string) => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
}
export const VisualBranchesLayout = memo(function VisualBranchesLayout({
  parentBlock,
  allBlocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock
}: VisualBranchesLayoutProps) {
  const routes = parentBlock.routes || [];
  const fallback = parentBlock.fallback || {
    label: 'Outros',
    destinationType: 'loop' as const
  };

  // Preparar paths incluindo fallback
  const allPaths: BranchPath[] = [...routes.map(route => ({
    routeId: route.id,
    routeLabel: route.label,
    routeColor: route.color,
    blocks: allBlocks.filter(b => b.parentRouterId === parentBlock.id && b.routeId === route.id),
    destinationType: route.destinationType,
    gotoBlockId: route.gotoBlockId
  })), {
    routeId: 'fallback',
    routeLabel: fallback.label || 'Outros',
    routeColor: FALLBACK_COLOR,
    blocks: allBlocks.filter(b => b.parentRouterId === parentBlock.id && b.routeId === 'fallback'),
    destinationType: fallback.destinationType,
    gotoBlockId: fallback.gotoBlockId
  }];

  // Calcular largura total - mesmas dimensões do RamificacoesNode
  const totalWidth = allPaths.length * COLUMN_WIDTH + (allPaths.length - 1) * COLUMN_GAP;

  // Preparar info dos branches para o SmartMergeConnector (incluindo destinationType)
  const branchInfos = useMemo(() => allPaths.map(path => ({
    id: path.routeId,
    color: path.routeColor,
    width: COLUMN_WIDTH,
    hasBlocks: path.blocks.length > 0,
    destinationType: path.destinationType,
    gotoLabel: path.gotoBlockId ? `#${allBlocks.findIndex(b => b.id === path.gotoBlockId) + 1}` : undefined
  })), [allPaths, allBlocks]);
  return (
    <div className="flex flex-col items-center">
      {/* Colunas de branches */}
      <div 
        className="flex" 
        style={{
          gap: COLUMN_GAP,
          width: totalWidth
        }}
      >
        {allPaths.map(path => (
          <BranchColumn 
            key={path.routeId} 
            routeId={path.routeId} 
            routeLabel={path.routeLabel} 
            routeColor={path.routeColor} 
            blocks={path.blocks} 
            parentRouterId={parentBlock.id} 
            selectedBlockId={selectedBlockId} 
            allBlocks={allBlocks} 
            onSelectBlock={onSelectBlock} 
            onAddBlock={onAddBlock} 
            onUpdateBlock={onUpdateBlock} 
            destinationType={path.destinationType} 
            gotoBlockId={path.gotoBlockId} 
          />
        ))}
      </div>
    </div>
  );
});