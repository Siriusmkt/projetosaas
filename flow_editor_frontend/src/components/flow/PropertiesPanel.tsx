import { memo } from 'react';
import { X, Trash2, Copy, MousePointer } from 'lucide-react';
import { FlowBlock, getBlockTypeInfo, getBlockLabel } from '@/types/flow';
import { VapiTool } from '@/types/vapiTools';
import { FlowBlockIcon } from './FlowBlockIcon';
import { FlowBlockBody } from './FlowBlockBody';
import { Button } from '@/components/ui/button';

interface PropertiesPanelProps {
  selectedBlock: FlowBlock | null;
  allBlocks: FlowBlock[];
  onUpdate: (updates: Partial<FlowBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
  vapiTools?: VapiTool[];
}

const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <MousePointer className="w-6 h-6 text-muted-foreground" />
      </div>
      <h4 className="font-medium text-sm text-foreground mb-1">
        Nenhum bloco selecionado
      </h4>
      <p className="text-xs text-muted-foreground">
        Clique em um bloco para editar suas propriedades
      </p>
    </div>
  );
});

export const PropertiesPanel = memo(function PropertiesPanel({
  selectedBlock,
  allBlocks,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  vapiTools,
}: PropertiesPanelProps) {
  if (!selectedBlock) {
    return (
      <div className="w-[280px] bg-card border-l flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">Propriedades</span>
        </div>
        <EmptyState />
      </div>
    );
  }

  const typeInfo = getBlockTypeInfo(selectedBlock);
  const label = getBlockLabel(selectedBlock);
  const toolTypeLabel = selectedBlock.toolConfig?.toolType || selectedBlock.toolType || 'tool';

  // Multi-condicional usa layout especial mais largo
  const isMultiConditional = selectedBlock.type === 'ramificacoes';
  const panelWidth = isMultiConditional ? 'w-[380px]' : 'w-[280px]';

  return (
    <div className={`${panelWidth} flex-shrink-0 bg-card border-l flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: typeInfo.bgColor }}
          >
            <FlowBlockIcon 
              type={selectedBlock.type} 
              toolType={selectedBlock.toolType} 
              className="w-4.5 h-4.5"
              style={{ color: typeInfo.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{label}</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {selectedBlock.type === 'tool' ? toolTypeLabel : selectedBlock.type}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Body - scrollable - sem padding para multi-condicional */}
      <div className={`flex-1 overflow-y-auto ${isMultiConditional ? '' : ''}`}>
        <FlowBlockBody 
          block={selectedBlock} 
          onUpdate={onUpdate}
          allBlocks={allBlocks}
          vapiTools={vapiTools}
        />
      </div>

      {/* Actions */}
      <div className="p-3 border-t flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onDuplicate}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
});
