import { FlowBlock, FlowBlockType, ToolBlockType, getBlockLabel, getBlockTypeInfo } from '@/types/flow';
import { FlowBlockIcon } from '@/components/flow/FlowBlockIcon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ListEnd, ListStart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InsertPosition = 'start' | { afterBlockId: string } | 'end';

interface InsertBlockPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todos os blocos do fluxo; o diálogo filtra e ordena os raiz internamente para evitar use-before-init no pai */
  blocks: (FlowBlock & { blockKey?: string })[];
  blockType: FlowBlockType;
  toolType?: ToolBlockType;
  onConfirm: (position: InsertPosition) => void;
}

export function InsertBlockPositionDialog({
  open,
  onOpenChange,
  blocks,
  blockType,
  toolType,
  onConfirm,
}: InsertBlockPositionDialogProps) {
  const typeInfo = getBlockTypeInfo({ type: blockType, content: '', toolType } as FlowBlock);

  const rootBlocks = useMemo(() => {
    return [...(blocks || [])]
      .filter((b) => !b.parentRouterId)
      .sort((a, b) => ((a as { order_index?: number }).order_index ?? 999999) - ((b as { order_index?: number }).order_index ?? 999999));
  }, [blocks]);

  const handleChoose = (position: InsertPosition) => {
    onConfirm(position);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: typeInfo.bgColor }}
            >
              <FlowBlockIcon type={blockType} toolType={toolType} className="w-4 h-4" style={{ color: typeInfo.color }} />
            </div>
            Onde inserir o bloco?
          </DialogTitle>
          <DialogDescription>
            Escolha a posição exata no fluxo. O novo bloco ficará <strong>antes</strong> ou <strong>depois</strong> do bloco escolhido, e a ordem será salva corretamente no banco.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[320px] rounded-md border border-border/60">
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => handleChoose('start')}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ListStart className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">No início do fluxo</p>
                <p className="text-xs text-muted-foreground">O bloco será o primeiro (posição 1)</p>
              </div>
              <ArrowDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>

            {rootBlocks.map((block, index) => (
              <button
                key={block.id}
                type="button"
                onClick={() => handleChoose({ afterBlockId: block.id })}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                  'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/40'
                )}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getBlockTypeInfo(block).bgColor }}
                >
                  <FlowBlockIcon
                    type={block.type}
                    toolType={block.toolType}
                    className="w-4 h-4"
                    style={{ color: getBlockTypeInfo(block).color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">
                    Após: {(block as { blockKey?: string }).blockKey || block.id} • {getBlockLabel(block)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Posição {index + 2} no fluxo (logo depois deste bloco)
                  </p>
                </div>
                <ArrowDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleChoose('end')}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors',
                'border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/40'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ListEnd className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">No final do fluxo</p>
                <p className="text-xs text-muted-foreground">
                  O bloco será o último (posição {rootBlocks.length + 1})
                </p>
              </div>
              <ArrowUp className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-180" />
            </button>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
