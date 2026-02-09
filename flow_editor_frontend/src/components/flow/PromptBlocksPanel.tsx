import { memo, useMemo, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, Plus } from 'lucide-react';
import { FlowBlock, getBlockTypeInfo, getBlockLabel } from '@/types/flow';
import { FlowBlockIcon } from './FlowBlockIcon';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface PromptDraggableBlockData {
  source: 'prompt';
  blockKey: string;
  label: string;
  type: FlowBlock['type'];
  toolType?: FlowBlock['toolType'];
  color: string;
  bgColor: string;
}

interface PromptBlocksPanelProps {
  blocks: (FlowBlock & { blockKey?: string })[];
  usedKeys: Set<string>;
  onAddBlock: (blockKey: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  disableSave?: boolean;
  orderOptions?: { key: string; label: string }[];
  /** Quando 'whatsapp', esconde o tipo "aguardar" do seletor e do filtro. */
  canalAtivo?: 'voz' | 'whatsapp';
  onCreateBlock?: (payload: {
    type: FlowBlock['type'];
    content: string;
    insertAfterKey: string;
    insertBeforeKey: string;
  }) => Promise<string | null> | string | null;
  embedded?: boolean;
}

const PromptBlockItem = memo(function PromptBlockItem({
  block,
  used,
  onAdd,
}: {
  block: FlowBlock & { blockKey?: string };
  used: boolean;
  onAdd: () => void;
}) {
  const typeInfo = getBlockTypeInfo(block);
  const label = getBlockLabel(block);
  const blockKey = block.blockKey || block.id;
  const displayKey = (blockKey.startsWith('vapi_') && block.type === 'tool') ? label : blockKey;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `prompt-${blockKey}`,
    data: {
      source: 'prompt',
      blockKey,
      label,
      type: block.type,
      toolType: block.toolType,
      color: typeInfo.color,
      bgColor: typeInfo.bgColor,
    } as PromptDraggableBlockData,
    disabled: used,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
        used
          ? 'border-muted bg-muted/30 text-muted-foreground cursor-not-allowed'
          : 'border-border bg-card hover:bg-muted/50 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-60 ring-2 ring-primary'
      )}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: typeInfo.bgColor }}
      >
        <FlowBlockIcon
          type={block.type}
          toolType={block.toolType}
          className="w-4 h-4"
          style={{ color: typeInfo.color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2.5">
          <div className="text-xs font-semibold truncate">{label}</div>
          <div className="text-[11px] font-mono px-2 py-0.5 rounded-full border shrink-0"
            style={{ borderColor: typeInfo.color, color: typeInfo.color }}
          >
            {displayKey}
          </div>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {block.content || 'Sem conteúdo'}
        </div>
      </div>
      <button
        type="button"
        className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center border transition-all',
          used
            ? 'border-muted text-muted-foreground cursor-not-allowed'
            : 'border-primary/40 text-primary hover:bg-primary/10'
        )}
        onClick={used ? undefined : onAdd}
        title={used ? 'Bloco já usado' : 'Adicionar ao canvas'}
        disabled={used}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

export const PromptBlocksPanel = memo(function PromptBlocksPanel({
  blocks,
  usedKeys,
  onAddBlock,
  onSave,
  isSaving,
  disableSave,
  orderOptions,
  canalAtivo,
  onCreateBlock,
  embedded = false,
}: PromptBlocksPanelProps) {
  const [query, setQuery] = useState('');
  const [quickId, setQuickId] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'primeira_mensagem' | 'texto' | 'aguardar' | 'ramificacoes' | 'encerrar' | 'tool'>('all');
  const [createType, setCreateType] = useState<FlowBlock['type']>('texto');
  const [createContent, setCreateContent] = useState('');
  const [insertAfter, setInsertAfter] = useState('');
  const [insertBefore, setInsertBefore] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const sortedOrderOptions = orderOptions || [];
  const afterIndex = sortedOrderOptions.findIndex((o) => o.key === insertAfter);
  const beforeOptions =
    afterIndex >= 0 ? sortedOrderOptions.slice(afterIndex + 1) : sortedOrderOptions;

  useEffect(() => {
    if (!sortedOrderOptions.length) return;
    if (!insertAfter && sortedOrderOptions[0]) {
      setInsertAfter(sortedOrderOptions[0].key);
    }
    if (!insertBefore && sortedOrderOptions.length > 1) {
      setInsertBefore(sortedOrderOptions[1].key);
    }
  }, [sortedOrderOptions, insertAfter, insertBefore]);

  useEffect(() => {
    if (canalAtivo === 'whatsapp' && createType === 'aguardar') {
      setCreateType('texto');
    }
  }, [canalAtivo, createType]);

  const handleCreate = async () => {
    if (!onCreateBlock) return;
    if (!insertAfter || !insertBefore || !createContent.trim()) return;
    try {
      setIsCreating(true);
      const newKey = await onCreateBlock({
        type: createType,
        content: createContent.trim(),
        insertAfterKey: insertAfter,
        insertBeforeKey: insertBefore,
      });
      if (newKey) {
        setCreateContent('');
        setCreateOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks.filter((b) => {
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;
      if (!q) return true;
      const label = getBlockLabel(b).toLowerCase();
      const key = (b.blockKey || b.id).toLowerCase();
      const content = (b.content || '').toLowerCase();
      return label.includes(q) || key.includes(q) || content.includes(q);
    });
  }, [blocks, query, typeFilter]);

  const panelContent = (
    <>
      <div className="p-3 border-b">
        <div className="text-sm font-semibold">Prompt</div>
        <div className="text-[11px] text-muted-foreground">
          Arraste ou clique no + para inserir
        </div>
        <div className="mt-2 relative">
          <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="w-full h-8 pl-7 pr-2 rounded-md border bg-background text-xs"
            placeholder="Buscar por numero, tipo ou mensagem..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className="flex-1 h-8 px-2 rounded-md border bg-background text-xs font-mono"
            placeholder="Adicionar por ID (ex: MSG001)"
            value={quickId}
            onChange={(e) => setQuickId(e.target.value)}
          />
          <button
            type="button"
            className={cn(
              'h-8 px-2 rounded-md text-xs font-semibold border',
              quickId.trim()
                ? 'border-primary text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground cursor-not-allowed'
            )}
            onClick={() => {
              const id = quickId.trim();
              if (!id) return;
              const match = blocks.find((b) => ((b.blockKey || b.id) === id));
              if (match && !usedKeys.has(match.blockKey || match.id)) {
                onAddBlock(match.blockKey || match.id);
                setQuickId('');
              }
            }}
            disabled={!quickId.trim()}
          >
            Inserir
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'primeira_mensagem', label: 'Primeira' },
            { id: 'texto', label: 'Mensagem' },
            ...(canalAtivo !== 'whatsapp' ? [{ id: 'aguardar' as const, label: 'Aguardar' }] : []),
            { id: 'ramificacoes', label: 'Caminhos' },
            { id: 'encerrar', label: 'Encerrar' },
            { id: 'tool', label: 'Tool' },
          ]).map((item: { id: string; label: string }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTypeFilter(item.id)}
              className={cn(
                'px-2 py-1 rounded-md border text-[10px] font-semibold transition-all',
                typeFilter === item.id
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {onCreateBlock && (
        <div className="p-3 border-b">
          <button
            type="button"
            className={cn(
              'w-full h-9 rounded-md text-xs font-semibold transition-all border',
              sortedOrderOptions.length >= 2
                ? 'border-primary text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground cursor-not-allowed'
            )}
            onClick={() => setCreateOpen(true)}
            disabled={sortedOrderOptions.length < 2}
          >
            Adicionar novo bloco
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            Nenhum bloco encontrado
          </div>
        ) : (
          filtered.map((block) => {
            const key = block.blockKey || block.id;
            return (
              <PromptBlockItem
                key={key}
                block={block}
                used={usedKeys.has(key)}
                onAdd={() => onAddBlock(key)}
              />
            );
          })
        )}
      </div>
      {onSave && (
        <div className="p-3 border-t">
          <button
            type="button"
            className={cn(
              'w-full h-9 rounded-md text-sm font-semibold transition-all',
              disableSave
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            onClick={disableSave ? undefined : onSave}
            disabled={disableSave || isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar montagem'}
          </button>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar novo bloco</DialogTitle>
            <DialogDescription>
              Defina o tipo, onde entrar no fluxo e o conteúdo do bloco.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                className="h-9 px-2 rounded-md border bg-background text-sm"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as FlowBlock['type'])}
              >
                <option value="texto">Mensagem</option>
                {canalAtivo !== 'whatsapp' && <option value="aguardar">Aguardar</option>}
                <option value="ramificacoes">Caminhos</option>
                <option value="encerrar">Encerrar</option>
              </select>
              <select
                className="h-9 flex-1 px-2 rounded-md border bg-background text-sm"
                value={insertAfter}
                onChange={(e) => {
                  setInsertAfter(e.target.value);
                  setInsertBefore('');
                }}
              >
                <option value="">Depois de...</option>
                {sortedOrderOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              className="h-9 w-full px-2 rounded-md border bg-background text-sm"
              value={insertBefore}
              onChange={(e) => setInsertBefore(e.target.value)}
              disabled={!insertAfter}
            >
              <option value="">Antes de...</option>
              {beforeOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <textarea
              className="w-full min-h-[90px] px-3 py-2 rounded-md border bg-background text-sm resize-y"
              placeholder="Conteúdo do bloco..."
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
            />
            <button
              type="button"
              className={cn(
                'w-full h-9 rounded-md text-sm font-semibold transition-all border',
                createContent.trim() && insertAfter && insertBefore && !isCreating
                  ? 'border-primary text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground cursor-not-allowed'
              )}
              onClick={handleCreate}
              disabled={!createContent.trim() || !insertAfter || !insertBefore || isCreating}
            >
              {isCreating ? 'Criando...' : 'Criar bloco'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col h-full">{panelContent}</div>;
  }

  return (
    <aside
      className="w-80 shrink-0 border-r bg-card flex flex-col overscroll-contain h-full"
      onWheel={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {panelContent}
    </aside>
  );
});
