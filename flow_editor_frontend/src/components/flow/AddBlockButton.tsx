import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { FlowBlockType, ToolBlockType, STRUCTURE_BLOCKS, TOOL_BLOCKS } from '@/types/flow';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FlowBlockIcon } from './FlowBlockIcon';

interface AddBlockButtonProps {
  onAdd: (type: FlowBlockType, toolType?: ToolBlockType) => void;
}

export function AddBlockButton({ onAdd }: AddBlockButtonProps) {
  const [open, setOpen] = useState(false);

  const handleAdd = (type: FlowBlockType, toolType?: ToolBlockType) => {
    onAdd(type, toolType);
    setOpen(false);
  };

  return (
    <div className="flex justify-center py-4 relative z-10">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="gap-2 rounded-full border-2 border-dashed px-6 py-5 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            Adicionar Bloco
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="center">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Escolha o tipo de bloco</span>
          </div>

          {/* Structure blocks */}
          <div className="pb-3 mb-3 border-b">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Estrutura
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {STRUCTURE_BLOCKS.map((block) => (
                <button
                  key={block.type}
                  onClick={() => handleAdd(block.type)}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-all duration-200 text-left group"
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: block.bgColor }}
                  >
                    <FlowBlockIcon 
                      type={block.type} 
                      className="w-4 h-4" 
                      style={{ color: block.color }}
                    />
                  </div>
                  <span className="text-sm font-medium">{block.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tool blocks */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
              Tools / Ações
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {TOOL_BLOCKS.map((block) => (
                <button
                  key={block.label}
                  onClick={() => handleAdd('tool')}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-all duration-200 text-left group"
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: block.bgColor }}
                  >
                    <FlowBlockIcon 
                      type="tool" 
                      toolType={block.toolType}
                      className="w-4 h-4" 
                      style={{ color: block.color }}
                    />
                  </div>
                  <span className="text-sm font-medium">{block.label}</span>
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
