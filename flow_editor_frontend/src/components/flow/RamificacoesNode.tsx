import { memo, useState } from 'react';
import { 
  GitBranch, ChevronDown, ChevronUp, Plus, X, 
  ArrowRight, XCircle, RotateCcw, GripVertical,
  CornerDownRight, MessageSquare
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { 
  FlowBlock, RouterRoute, RouterFallback, 
  RouteDestinationType, ROUTER_COLORS, FALLBACK_COLOR, createRouterRoute 
} from '@/types/flow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLUMN_WIDTH = 280;
const COLUMN_GAP = 24;

interface RamificacoesNodeProps {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  allBlocks: FlowBlock[];
  onClick: () => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
}

export const RamificacoesNode = memo(function RamificacoesNode({
  block,
  index,
  isSelected,
  allBlocks,
  onClick,
  onUpdateBlock,
}: RamificacoesNodeProps) {
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-block-${block.id}`,
    data: { source: 'canvas', blockId: block.id, block },
  });

  const routes = block.routes || [];
  const fallback: RouterFallback = block.fallback || { 
    label: 'Outros', 
    response: '',
    destinationType: 'loop',
    gotoBlockId: null,
  };
  const canAddMore = routes.length < 5;
  const availableBlocks = allBlocks.filter(b => b.id !== block.id);
  
  // Todos os paths incluindo fallback
  const allPaths = [...routes, { 
    id: 'fallback', 
    label: fallback.label, 
    color: FALLBACK_COLOR,
    keywords: [],
    response: fallback.response,
    destinationType: fallback.destinationType,
    gotoBlockId: fallback.gotoBlockId,
  }];
  
  // Calcular largura total baseado no número de rotas
  const totalWidth = allPaths.length * COLUMN_WIDTH + (allPaths.length - 1) * COLUMN_GAP;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleAddRoute = () => {
    if (!canAddMore) return;
    const newRoute = createRouterRoute(routes.length);
    onUpdateBlock(block.id, { routes: [...routes, newRoute] });
  };

  const handleRemoveRoute = (routeId: string) => {
    if (routes.length <= 2) return;
    onUpdateBlock(block.id, { routes: routes.filter(r => r.id !== routeId) });
  };

  const handleUpdateRoute = (routeId: string, updates: Partial<RouterRoute>) => {
    onUpdateBlock(block.id, {
      routes: routes.map(r => r.id === routeId ? { ...r, ...updates } : r),
    });
  };

  const handleUpdateFallback = (updates: Partial<RouterFallback>) => {
    onUpdateBlock(block.id, { fallback: { ...fallback, ...updates } });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col items-center cursor-pointer transition-all",
        isDragging && "opacity-60 scale-[0.98] z-50"
      )}
      onClick={onClick}
    >
      {/* Header compacto central */}
      <div 
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-xl shadow-lg border-2 bg-card mb-3",
          isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary"
        )}
        style={{ borderColor: 'hsl(262 83% 58%)' }}
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
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))' }}
        >
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">🔀 Multi caminhos</span>
          <span 
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: 'hsl(262 83% 58%)' }}
          >
            {index + 1}
          </span>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <MessageSquare className="w-3 h-3 text-muted-foreground" />
          <span 
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'hsl(262 83% 58% / 0.15)', color: 'hsl(262 83% 58%)' }}
          >
            {block.analyzeVariable || "{{ultima_resposta}}"}
          </span>
        </div>
        
        {canAddMore && (
          <button
            onClick={(e) => { e.stopPropagation(); handleAddRoute(); }}
            className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
          >
            <Plus className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Rotas alinhadas horizontalmente - cada uma acima de sua coluna */}
      <div 
        className="flex items-start"
        style={{ gap: COLUMN_GAP, width: totalWidth }}
      >
        {allPaths.map((path, idx) => {
          const isRoute = path.id !== 'fallback';
          const isEditing = editingRouteId === path.id;
          
          return (
            <RouteCard
              key={path.id}
              route={path as RouterRoute}
              index={idx}
              isEditing={isEditing}
              isFallback={!isRoute}
              canRemove={isRoute && routes.length > 2}
              availableBlocks={availableBlocks}
              onToggleEdit={() => setEditingRouteId(isEditing ? null : path.id)}
              onUpdate={(updates) => {
                if (isRoute) {
                  handleUpdateRoute(path.id, updates);
                } else {
                  handleUpdateFallback(updates as Partial<RouterFallback>);
                }
              }}
              onRemove={() => handleRemoveRoute(path.id)}
            />
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// ROUTE CARD - Card compacto de cada rota, alinhado com sua coluna
// ============================================================================
interface RouteCardProps {
  route: RouterRoute;
  index: number;
  isEditing: boolean;
  isFallback: boolean;
  canRemove: boolean;
  availableBlocks: FlowBlock[];
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<RouterRoute>) => void;
  onRemove: () => void;
}

function RouteCard({
  route,
  index,
  isEditing,
  isFallback,
  canRemove,
  availableBlocks,
  onToggleEdit,
  onUpdate,
  onRemove,
}: RouteCardProps) {
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const newKeywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
    onUpdate({ keywords: [...(route.keywords || []), ...newKeywords] });
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    onUpdate({ keywords: (route.keywords || []).filter(k => k !== kw) });
  };

  return (
    <div 
      className="flex flex-col items-center"
      style={{ width: COLUMN_WIDTH }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Card da rota */}
      <div 
        className="w-full rounded-xl border-2 overflow-hidden shadow-md bg-card"
        style={{ borderColor: route.color }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-2 px-3 py-2 cursor-pointer"
          style={{ backgroundColor: `${route.color}15` }}
          onClick={onToggleEdit}
        >
          <div 
            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white" 
            style={{ backgroundColor: route.color }} 
          >
            {isFallback ? '⚡' : index + 1}
          </div>
          
          <input
            type="text"
            value={route.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-sm font-semibold border-none outline-none min-w-0"
            style={{ color: route.color }}
            placeholder="Nome..."
          />
          
          <ChevronDown 
            className={cn("w-4 h-4 transition-transform flex-shrink-0", isEditing && "rotate-180")} 
            style={{ color: route.color }} 
          />
          
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Keywords preview (when collapsed) */}
        {!isEditing && !isFallback && route.keywords && route.keywords.length > 0 && (
          <div className="px-3 py-1.5 border-t flex flex-wrap gap-1" style={{ borderColor: `${route.color}20` }}>
            {route.keywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: `${route.color}15`, color: route.color }}
              >
                {kw}
              </span>
            ))}
            {route.keywords.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{route.keywords.length - 3}</span>
            )}
          </div>
        )}

        {/* Expanded config */}
        {isEditing && (
          <div className="px-3 py-3 space-y-2.5 bg-background border-t" style={{ borderColor: `${route.color}30` }}>
            {/* Keywords (not for fallback) */}
            {!isFallback && (
              <div>
                <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                  Quando disser:
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5 min-h-[20px]">
                  {(route.keywords || []).map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                      style={{ backgroundColor: `${route.color}20`, color: route.color }}
                    >
                      {kw}
                      <button onClick={() => handleRemoveKeyword(kw)} className="hover:bg-black/10 rounded-full">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="palavra1, palavra2..."
                    className="h-7 text-[11px] flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                  />
                  <Button size="sm" variant="secondary" className="h-7 px-2" onClick={handleAddKeyword}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Response */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">💬 Responde:</label>
              <Textarea
                value={route.response || ''}
                onChange={(e) => onUpdate({ response: e.target.value })}
                placeholder="Resposta..."
                className="min-h-[40px] text-[11px] resize-none"
              />
            </div>

            {/* Destination */}
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Depois:</label>
              <Select
                value={route.destinationType}
                onValueChange={(v) => onUpdate({ 
                  destinationType: v as RouteDestinationType,
                  gotoBlockId: v === 'goto' ? route.gotoBlockId : null,
                })}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continue">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-green-500" />
                      <span>Continuar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="end">
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-3 h-3 text-red-500" />
                      <span>Encerrar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="loop">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3 text-amber-500" />
                      <span>Loop</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="goto">
                    <div className="flex items-center gap-1.5">
                      <CornerDownRight className="w-3 h-3 text-blue-500" />
                      <span>Ir para...</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {route.destinationType === 'goto' && (
                <Select
                  value={route.gotoBlockId || ''}
                  onValueChange={(v) => onUpdate({ gotoBlockId: v })}
                >
                  <SelectTrigger className="h-7 text-[11px] mt-1.5">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBlocks.map((b, idx) => (
                      <SelectItem key={b.id} value={b.id}>
                        #{idx + 1} - {b.content.substring(0, 20)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Conector visual: linha + bolinha colorida */}
      <div className="flex flex-col items-center mt-2">
        {/* Linha vertical superior */}
        <div 
          className="w-0.5 h-3"
          style={{ backgroundColor: route.color }}
        />
        
        {/* Bolinha colorida - ponto de conexão */}
        <div 
          className="w-3 h-3 rounded-full border-2 shadow-sm flex-shrink-0"
          style={{ 
            backgroundColor: `${route.color}30`,
            borderColor: route.color,
            boxShadow: `0 0 6px ${route.color}50`,
          }}
        />
        
        {/* Linha vertical inferior */}
        <div 
          className="w-0.5 h-3"
          style={{ backgroundColor: route.color }}
        />
      </div>
    </div>
  );
}
