import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  MessageSquare, GitBranch, Clock, XCircle,
  Video, Image, Volume2, Calendar, UserCheck, Link, Webhook, FileText
} from 'lucide-react';
import { FlowBlockType, ToolBlockType, STRUCTURE_BLOCKS, TOOL_BLOCKS } from '@/types/flow';
import { FlowBlockIcon } from './FlowBlockIcon';
import { cn } from '@/lib/utils';

interface BlocksPaletteProps {
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType) => void;
}

// Draggable data type
export interface DraggableBlockData {
  type: FlowBlockType;
  toolType?: ToolBlockType;
  label: string;
  color: string;
  bgColor: string;
}

// Draggable palette item
const DraggablePaletteItem = memo(function DraggablePaletteItem({ 
  id,
  type,
  toolType,
  label, 
  icon, 
  color, 
  bgColor, 
  onClick,
  compact = false,
}: { 
  id: string;
  type: FlowBlockType;
  toolType?: ToolBlockType;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  onClick: () => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type, toolType, label, color, bgColor } as DraggableBlockData,
  });
  
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full text-left transition-all touch-none",
        "hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing",
        compact 
          ? "flex-col justify-center p-3 bg-muted/50 border border-border rounded-lg" 
          : "p-2.5 bg-muted/30 border border-border rounded-lg hover:bg-muted/60",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <div 
        className={cn(
          "rounded-lg flex items-center justify-center flex-shrink-0",
          compact ? "w-8 h-8" : "w-7 h-7"
        )}
        style={{ backgroundColor: bgColor }}
      >
        <FlowBlockIcon 
          type={type}
          toolType={toolType}
          className={cn(compact ? "w-4 h-4" : "w-3.5 h-3.5")}
          style={{ color }}
        />
      </div>
      <span className={cn(
        "font-medium",
        compact ? "text-[11px] text-muted-foreground text-center" : "text-xs text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
});

export const BlocksPalette = memo(function BlocksPalette({ onAddBlock }: BlocksPaletteProps) {
  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
        <div>
          <span className="font-semibold text-sm">Blocos</span>
          <p className="text-[10px] text-muted-foreground">Arraste para o canvas</p>
        </div>
      </div>

      {/* Structure Blocks */}
      <div className="p-3 border-b">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Estrutura
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {STRUCTURE_BLOCKS.map((block) => (
            <DraggablePaletteItem
              key={block.type}
              id={`palette-${block.type}`}
              type={block.type}
              label={block.label}
              icon={block.icon}
              color={block.color}
              bgColor={block.bgColor}
              onClick={() => onAddBlock(block.type)}
              compact
            />
          ))}
        </div>
      </div>

      {/* Tool Blocks */}
      <div className="flex-1 p-3 overflow-y-auto">
        <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Tools
        </h4>
        <div className="space-y-1.5">
          {TOOL_BLOCKS.map((block) => (
            <DraggablePaletteItem
              key={block.label}
              id="palette-tool"
              type="tool"
              label={block.label}
              icon={block.icon}
              color={block.color}
              bgColor={block.bgColor}
              onClick={() => onAddBlock('tool')}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
