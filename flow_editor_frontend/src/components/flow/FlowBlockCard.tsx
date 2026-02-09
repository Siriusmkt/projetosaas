import React, { useState, memo, useCallback } from 'react';
import { ChevronDown, Trash2, Copy, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FlowBlock, getBlockTypeInfo, getBlockLabel } from '@/types/flow';
import { Button } from '@/components/ui/button';
import { FlowBlockIcon } from './FlowBlockIcon';
import { FlowBlockBody } from './FlowBlockBody';
import { InputHandle, OutputHandle } from './ConnectionHandle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FlowBlockCardProps {
  block: FlowBlock;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<FlowBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  allBlocks: FlowBlock[];
  onConnect?: (fromBlockId: string, toBlockId: string) => void;
}

export const FlowBlockCard = memo(function FlowBlockCard({
  block,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  allBlocks,
  onConnect,
}: FlowBlockCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const typeInfo = getBlockTypeInfo(block);
  const label = getBlockLabel(block);
  const toolTypeLabel = block.toolConfig?.toolType || block.toolType || 'tool';
  const preview = block.content.substring(0, 60) + (block.content.length > 60 ? '...' : '');
  
  // Verifica se é o primeiro bloco (não mostra input) ou bloco final (não mostra output)
  const isFirstBlock = index === 0;
  const isEndBlock = block.type === 'encerrar';
  
  const handleOutputConnect = useCallback((targetBlockId: string) => {
    if (onConnect && targetBlockId !== block.id) {
      onConnect(block.id, targetBlockId);
    }
  }, [block.id, onConnect]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 10,
  };

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    onDelete();
    setShowDeleteDialog(false);
  }, [onDelete]);

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate();
  }, [onDuplicate]);

  return (
    <>
      {/* Wrapper com overflow visible para os handles aparecerem fora do card */}
      <div className="relative z-10" style={{ overflow: 'visible' }}>
        {/* INPUT HANDLES - nas LATERAIS do bloco (fora do card principal) */}
        {!isFirstBlock && (
          <>
            {/* Input esquerdo */}
            <div 
              className="absolute z-20"
              style={{ 
                left: -8, 
                top: '50%', 
                transform: 'translateY(-50%)',
              }}
            >
              <InputHandle color={typeInfo.color} blockId={block.id} side="left" />
            </div>
            {/* Input direito */}
            <div 
              className="absolute z-20"
              style={{ 
                right: -8, 
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
          style={style}
          data-block-id={block.id}
          data-block-key={(block as any).blockKey}
          className={`
            relative bg-card border rounded-2xl shadow-sm
            ${isDragging 
              ? 'border-primary shadow-2xl shadow-primary/20 ring-2 ring-primary/30 opacity-90' 
              : isExpanded 
                ? 'border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20' 
                : 'border-border hover:border-primary/30 hover:shadow-md'
            }
          `}
        >
          {/* Colored accent bar */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{ backgroundColor: typeInfo.color }}
          />

        {/* Header */}
        <div className="flex items-center gap-3 p-4 pl-5">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -m-1 rounded-lg hover:bg-muted/80 touch-none"
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Number badge */}
          <div 
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
              ${isExpanded 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'bg-muted text-muted-foreground'
              }
            `}
          >
            {index + 1}
          </div>
          
          {/* Icon with colored background - clickable area for toggle */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={onToggle}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ backgroundColor: typeInfo.bgColor }}
            >
              <FlowBlockIcon 
                type={block.type} 
                toolType={block.toolType} 
                className="w-5 h-5"
                style={{ color: typeInfo.color }}
              />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm">{label}</h4>
                <span 
                  className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full"
                  style={{ 
                    backgroundColor: typeInfo.bgColor, 
                    color: typeInfo.color 
                  }}
                >
                  {block.type === 'tool' ? toolTypeLabel : block.type}
                </span>
                {block.type === 'tool' && block.toolConfig?.toolId && (
                  <span
                    className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                    title={block.toolConfig.toolId}
                  >
                    ...{String(block.toolConfig.toolId).slice(-4)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
              onClick={handleDuplicate}
              title="Duplicar bloco"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              title="Excluir bloco"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Expand/Collapse chevron */}
          <div 
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 cursor-pointer
              ${isExpanded ? 'rotate-180 bg-primary/10' : ''}
            `}
            onClick={onToggle}
          >
            <ChevronDown className={`h-4 w-4 ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
        
        {/* Body (expandable) */}
        {isExpanded && (
          <FlowBlockBody 
            block={block} 
            onUpdate={onUpdate}
            allBlocks={allBlocks}
          />
        )}
        
          {/* OUTPUT HANDLE - base do bloco */}
          {!isEndBlock && (
            <div 
              className="absolute z-20"
              style={{ 
                bottom: -10, 
                left: '50%', 
                transform: 'translateX(-50%)',
              }}
            >
              <OutputHandle 
                color={typeInfo.color} 
                blockId={block.id}
                onConnect={handleOutputConnect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Excluir bloco</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Tem certeza que deseja excluir o bloco <strong>"{label}"</strong>? 
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="sm:w-32">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className="sm:w-32 bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
