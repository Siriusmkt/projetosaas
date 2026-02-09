import { useState } from 'react';
import { 
  Plus, X, GitBranch, ChevronDown, ChevronUp, ArrowRight, 
  CornerDownRight, XCircle, GripVertical, RotateCcw, 
  MessageSquare, ArrowDown
} from 'lucide-react';
import { FlowBlock, RouterRoute, ROUTER_COLORS, FALLBACK_COLOR, createRouterRoute, getBlockTypeInfo, RouteDestinationType, RouterFallback } from '@/types/flow';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RouterNodeCardProps {
  block: FlowBlock;
  index: number;
  isSelected: boolean;
  allBlocks: FlowBlock[];
  onClick: () => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
}

export function RouterNodeCard({
  block,
  index,
  isSelected,
  allBlocks,
  onClick,
  onUpdateBlock,
}: RouterNodeCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [draggedRouteId, setDraggedRouteId] = useState<string | null>(null);
  
  const routes = block.routes || [];
  const fallback: RouterFallback = block.fallback || { 
    label: 'Outros', 
    response: '',
    destinationType: 'continue',
    gotoBlockId: null,
  };
  const canAddMore = routes.length < 5;

  // Blocos disponíveis para goto (exceto o próprio conectivo)
  const availableBlocks = allBlocks.filter(b => b.id !== block.id);

  const handleAddRoute = () => {
    if (!canAddMore) return;
    const newRoute = createRouterRoute(routes.length);
    onUpdateBlock(block.id, {
      routes: [...routes, newRoute],
    });
  };

  const handleRemoveRoute = (routeId: string) => {
    if (routes.length <= 2) return;
    onUpdateBlock(block.id, {
      routes: routes.filter(r => r.id !== routeId),
    });
  };

  const handleUpdateRoute = (routeId: string, updates: Partial<RouterRoute>) => {
    onUpdateBlock(block.id, {
      routes: routes.map(r => r.id === routeId ? { ...r, ...updates } : r),
    });
  };

  const handleUpdateFallback = (updates: Partial<RouterFallback>) => {
    onUpdateBlock(block.id, {
      fallback: { ...fallback, ...updates },
    });
  };

  const handleUpdateContent = (content: string) => {
    onUpdateBlock(block.id, { content });
  };

  // Reordenação de rotas
  const handleDragStart = (routeId: string) => {
    setDraggedRouteId(routeId);
  };

  const handleDragOver = (e: React.DragEvent, targetRouteId: string) => {
    e.preventDefault();
    if (!draggedRouteId || draggedRouteId === targetRouteId) return;
    
    const draggedIndex = routes.findIndex(r => r.id === draggedRouteId);
    const targetIndex = routes.findIndex(r => r.id === targetRouteId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newRoutes = [...routes];
    const [draggedRoute] = newRoutes.splice(draggedIndex, 1);
    newRoutes.splice(targetIndex, 0, draggedRoute);
    
    onUpdateBlock(block.id, { routes: newRoutes });
  };

  const handleDragEnd = () => {
    setDraggedRouteId(null);
  };

  return (
    <div 
      className={cn(
        "w-[420px] bg-card border-2 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all",
        isSelected && "ring-2 ring-offset-2 ring-offset-background ring-primary",
        !isSelected && "hover:shadow-xl hover:scale-[1.01]"
      )}
      style={{ borderColor: 'hsl(262 83% 58%)' }}
      onClick={onClick}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))' }}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">🔀 Multi caminhos</h3>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-white/30 text-white">
              {index + 1}
            </span>
            {(block as any).blockKey && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white/90">
                {(block as any).blockKey}
              </span>
            )}
          </div>
          <p className="text-white/70 text-xs">{routes.length} caminhos + fallback</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Source Variable Info */}
      <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Analisando:</span>
        <span 
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
          style={{
            background: 'linear-gradient(135deg, hsl(262 83% 58% / 0.15), hsl(262 83% 58% / 0.3))',
            boxShadow: '0 0 12px 3px hsl(262 83% 58% / 0.4), 0 0 4px 1px hsl(262 83% 58% / 0.6)',
            color: 'hsl(262 83% 58%)',
            border: '1px solid hsl(262 83% 58% / 0.5)',
            textShadow: '0 0 8px hsl(262 83% 58% / 0.5)',
          }}
        >
          {block.analyzeVariable || "{{ultima_resposta}}"}
        </span>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-border">
        <input
          type="text"
          value={block.content}
          onChange={(e) => { e.stopPropagation(); handleUpdateContent(e.target.value); }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-transparent text-sm font-medium text-foreground border-none outline-none placeholder:text-muted-foreground"
          placeholder="Descrição do conectivo..."
        />
      </div>

      {/* Routes List */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {/* Priority Info */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <ArrowDown className="w-3 h-3 text-amber-600" />
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Ordem = Prioridade (arraste para reordenar)
            </span>
          </div>

          {routes.map((route, idx) => (
            <RouteConfigItem
              key={route.id}
              route={route}
              index={idx}
              canRemove={routes.length > 2}
              isEditing={editingRouteId === route.id}
              isDragging={draggedRouteId === route.id}
              availableBlocks={availableBlocks}
              onToggleEdit={() => setEditingRouteId(editingRouteId === route.id ? null : route.id)}
              onUpdate={(updates) => handleUpdateRoute(route.id, updates)}
              onRemove={() => handleRemoveRoute(route.id)}
              onDragStart={() => handleDragStart(route.id)}
              onDragOver={(e) => handleDragOver(e, route.id)}
              onDragEnd={handleDragEnd}
            />
          ))}

          {/* Fallback */}
          <FallbackConfigItem
            fallback={fallback}
            availableBlocks={availableBlocks}
            onUpdate={handleUpdateFallback}
          />

          {/* Add Route Button */}
          {canAddMore && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAddRoute(); }}
              className="w-full px-3 py-2.5 border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar caminho ({routes.length}/5)
            </button>
          )}
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {routes.map((route) => (
            <Badge 
              key={route.id} 
              variant="outline" 
              className="text-[10px] gap-1"
              style={{ borderColor: route.color, color: route.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: route.color }} />
              {route.label}
            </Badge>
          ))}
          <Badge variant="secondary" className="text-[10px] gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FALLBACK_COLOR }} />
            {fallback.label}
          </Badge>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ROUTE CONFIG ITEM - Item de rota com configuração completa
// ============================================================================
interface RouteConfigItemProps {
  route: RouterRoute;
  index: number;
  canRemove: boolean;
  isEditing: boolean;
  isDragging: boolean;
  availableBlocks: FlowBlock[];
  onToggleEdit: () => void;
  onUpdate: (updates: Partial<RouterRoute>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function RouteConfigItem({
  route,
  index,
  canRemove,
  isEditing,
  isDragging,
  availableBlocks,
  onToggleEdit,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: RouteConfigItemProps) {
  const [keywordInput, setKeywordInput] = useState('');

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    // Suporta adicionar múltiplas keywords separadas por vírgula
    const newKeywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
    onUpdate({
      keywords: [...route.keywords, ...newKeywords],
    });
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    onUpdate({
      keywords: route.keywords.filter(k => k !== kw),
    });
  };

  // Determinar o texto do destino para preview
  const getDestinationPreview = () => {
    switch (route.destinationType) {
      case 'continue': return 'Próximo';
      case 'end': return 'Encerra';
      case 'loop': return 'Loop';
      case 'goto':
        if (route.gotoBlockId) {
          const targetBlock = availableBlocks.find(b => b.id === route.gotoBlockId);
          if (targetBlock) {
            const idx = availableBlocks.findIndex(b => b.id === route.gotoBlockId);
            return `#${idx + 1}`;
          }
        }
        return 'Indefinido';
      default: return 'Próximo';
    }
  };

  return (
    <div 
      className={cn(
        "rounded-xl border-2 overflow-hidden transition-all",
        isDragging && "opacity-50 scale-[0.98]"
      )}
      style={{ borderColor: route.color }}
      onClick={(e) => e.stopPropagation()}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {/* Route Header - sempre visível */}
      <div 
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        style={{ backgroundColor: `${route.color}15` }}
        onClick={onToggleEdit}
      >
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="w-4 h-4" />
        </div>

        <div 
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white" 
          style={{ backgroundColor: route.color }} 
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={route.label}
            onChange={(e) => { e.stopPropagation(); onUpdate({ label: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm font-semibold border-none outline-none"
            style={{ color: route.color }}
            placeholder="Nome do caminho..."
          />
        </div>
        
        <ChevronDown 
          className={cn(
            "w-4 h-4 transition-transform flex-shrink-0",
            isEditing && "rotate-180"
          )} 
          style={{ color: route.color }} 
        />
        
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expanded Configuration */}
      {isEditing && (
        <div className="px-3 py-3 space-y-3 bg-background border-t" style={{ borderColor: `${route.color}30` }}>
          {/* Palavras de ativação */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Quando o lead disser:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
              {route.keywords.length === 0 ? (
                <span className="text-xs text-muted-foreground italic py-1">Nenhuma palavra configurada</span>
              ) : (
                route.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${route.color}20`, color: route.color }}
                  >
                    {kw}
                    <button
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:bg-black/10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Ex: comprar, preço, valor (separar por vírgula)"
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button 
                size="sm" 
                variant="secondary"
                className="h-8 px-3"
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Resposta automática */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              💬 Responde:
            </label>
            <Textarea
              value={route.response || ''}
              onChange={(e) => onUpdate({ response: e.target.value })}
              placeholder="Resposta automática quando ativa este caminho..."
              className="min-h-[60px] text-xs"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Depois vai para:
            </label>
            <Select
              value={route.destinationType}
              onValueChange={(v) => onUpdate({ 
                destinationType: v as RouteDestinationType,
                gotoBlockId: v === 'goto' ? route.gotoBlockId : null,
              })}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <SelectItem value="continue">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                    <span>Continuar no fluxo</span>
                    <span className="text-muted-foreground text-[10px]">(Próximo bloco)</span>
                  </div>
                </SelectItem>
                <SelectItem value="end">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Encerrar conversa</span>
                  </div>
                </SelectItem>
                <SelectItem value="loop">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Voltar ao início</span>
                    <span className="text-muted-foreground text-[10px]">(Loop)</span>
                  </div>
                </SelectItem>
                <SelectItem value="goto">
                  <div className="flex items-center gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ir para bloco específico</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Block selector when goto is selected */}
            {route.destinationType === 'goto' && (
              <Select
                value={route.gotoBlockId || ''}
                onValueChange={(v) => onUpdate({ gotoBlockId: v })}
              >
                <SelectTrigger className="w-full h-9 text-xs mt-2">
                  <SelectValue placeholder="Selecione o bloco destino" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableBlocks.map((b) => {
                    const info = getBlockTypeInfo(b);
                    const idx = availableBlocks.findIndex(ab => ab.id === b.id);
                    return (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: info.color }}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[150px]">
                            {b.content.substring(0, 25)}{b.content.length > 25 ? '...' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Color Selector */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Cor:</span>
            <div className="flex gap-1.5">
              {ROUTER_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onUpdate({ color: c.hex })}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all border-2",
                    route.color === c.hex 
                      ? "border-foreground scale-110" 
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview quando fechado */}
      {!isEditing && (
        <div className="px-3 py-2 bg-background flex items-center gap-2 text-xs text-muted-foreground">
          {route.keywords.length > 0 ? (
            <span className="truncate flex-1">
              "{route.keywords.slice(0, 3).join('", "')}"
              {route.keywords.length > 3 && ` +${route.keywords.length - 3}`}
            </span>
          ) : (
            <span className="italic flex-1">Clique para configurar</span>
          )}
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <span 
            className="flex-shrink-0 font-medium"
            style={{ color: route.color }}
          >
            {getDestinationPreview()}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FALLBACK CONFIG ITEM
// ============================================================================
interface FallbackConfigItemProps {
  fallback: RouterFallback;
  availableBlocks: FlowBlock[];
  onUpdate: (updates: Partial<RouterFallback>) => void;
}

function FallbackConfigItem({
  fallback,
  availableBlocks,
  onUpdate,
}: FallbackConfigItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getDestinationPreview = () => {
    switch (fallback.destinationType) {
      case 'continue': return 'Próximo';
      case 'end': return 'Encerra';
      case 'loop': return 'Loop';
      case 'goto':
        if (fallback.gotoBlockId) {
          const targetBlock = availableBlocks.find(b => b.id === fallback.gotoBlockId);
          if (targetBlock) {
            const idx = availableBlocks.findIndex(b => b.id === fallback.gotoBlockId);
            return `#${idx + 1}`;
          }
        }
        return 'Indefinido';
      default: return 'Próximo';
    }
  };

  return (
    <div 
      className="rounded-xl border-2 border-dashed overflow-hidden"
      style={{ borderColor: FALLBACK_COLOR }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div 
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
        style={{ backgroundColor: `${FALLBACK_COLOR}10` }}
        onClick={() => setIsEditing(!isEditing)}
      >
        <div 
          className="w-5 h-5 rounded-full flex-shrink-0" 
          style={{ backgroundColor: FALLBACK_COLOR }} 
        />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={fallback.label}
            onChange={(e) => { e.stopPropagation(); onUpdate({ label: e.target.value }); }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm font-medium border-none outline-none text-muted-foreground"
            placeholder="Fallback..."
          />
        </div>
        <Badge variant="secondary" className="text-[10px]">padrão</Badge>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isEditing && "rotate-180"
          )} 
        />
      </div>

      {/* Preview quando fechado */}
      {!isEditing && (
        <div className="px-3 py-2 bg-background flex items-center gap-2 text-xs text-muted-foreground">
          <span className="italic flex-1">Quando nenhuma condição acima</span>
          <ArrowRight className="w-3 h-3 flex-shrink-0" />
          <span className="flex-shrink-0 font-medium" style={{ color: FALLBACK_COLOR }}>
            {getDestinationPreview()}
          </span>
        </div>
      )}

      {/* Expanded */}
      {isEditing && (
        <div className="px-3 py-3 bg-background border-t space-y-3" style={{ borderColor: `${FALLBACK_COLOR}30` }}>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            ⚡ Ativado quando nenhuma das condições acima for atendida
          </p>

          {/* Resposta automática */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              💬 Responde:
            </label>
            <Textarea
              value={fallback.response || ''}
              onChange={(e) => onUpdate({ response: e.target.value })}
              placeholder="Resposta automática para fallback..."
              className="min-h-[60px] text-xs"
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Depois vai para:
            </label>
            <Select
              value={fallback.destinationType}
              onValueChange={(v) => onUpdate({ 
                destinationType: v as RouteDestinationType,
                gotoBlockId: v === 'goto' ? fallback.gotoBlockId : null,
              })}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent className="max-h-[250px]">
                <SelectItem value="continue">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-green-500" />
                    <span>Continuar no fluxo</span>
                  </div>
                </SelectItem>
                <SelectItem value="end">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Encerrar conversa</span>
                  </div>
                </SelectItem>
                <SelectItem value="loop">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Voltar ao início</span>
                    <span className="text-muted-foreground text-[10px]">(Loop)</span>
                  </div>
                </SelectItem>
                <SelectItem value="goto">
                  <div className="flex items-center gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
                    <span>Ir para bloco específico</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Block selector when goto is selected */}
            {fallback.destinationType === 'goto' && (
              <Select
                value={fallback.gotoBlockId || ''}
                onValueChange={(v) => onUpdate({ gotoBlockId: v })}
              >
                <SelectTrigger className="w-full h-9 text-xs mt-2">
                  <SelectValue placeholder="Selecione o bloco destino" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {availableBlocks.map((b) => {
                    const info = getBlockTypeInfo(b);
                    const idx = availableBlocks.findIndex(ab => ab.id === b.id);
                    return (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
                            style={{ backgroundColor: info.color }}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate max-w-[150px]">
                            {b.content.substring(0, 25)}{b.content.length > 25 ? '...' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
