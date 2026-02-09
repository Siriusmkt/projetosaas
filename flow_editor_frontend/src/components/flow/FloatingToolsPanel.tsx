import { memo, useState, useRef, useCallback } from 'react';
import { Wrench, X, GripVertical } from 'lucide-react';
import { FlowBlockType, ToolBlockType, TOOL_BLOCKS } from '@/types/flow';
import { FlowBlockIcon } from './FlowBlockIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingToolsPanelProps {
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType) => void;
}

export const FloatingToolsPanel = memo(function FloatingToolsPanel({
  onAddBlock,
}: FloatingToolsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragRef.current) {
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.startPosX + deltaX,
        y: dragRef.current.startPosY + deltaY,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  const handleToolClick = () => {
    onAddBlock('tool');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 gap-2 shadow-lg"
        size="sm"
      >
        <Wrench className="w-4 h-4" />
        Tools
      </Button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 bg-card border rounded-xl shadow-xl",
        isDragging && "cursor-grabbing select-none"
      )}
      style={{ 
        left: position.x, 
        top: position.y,
        width: 200,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header com drag handle */}
      <div 
        className="flex items-center justify-between p-2 border-b cursor-grab active:cursor-grabbing"
        data-drag-handle
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">Tools</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Lista de tools */}
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {TOOL_BLOCKS.map((block) => (
          <button
            key={block.label}
            onClick={handleToolClick}
            className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: block.bgColor }}
            >
              <FlowBlockIcon 
                type="tool" 
                className="w-4 h-4"
                style={{ color: block.color }}
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium block truncate">{block.label}</span>
              {block.description && (
                <span className="text-[10px] text-muted-foreground block truncate">
                  {block.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
