import { memo, useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { FlowBlock, RouterRoute, ROUTER_COLORS, FALLBACK_COLOR, createRouterRoute } from '@/types/flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MultiConditionalPropertiesProps {
  block: FlowBlock;
  allBlocks: FlowBlock[];
  onUpdate: (updates: Partial<FlowBlock>) => void;
}

// Opções de condições
const CONDITION_OPTIONS = [
  { value: 'contains', label: 'Contém palavra-chave' },
  { value: 'equals', label: 'É exatamente igual a' },
  { value: 'starts_with', label: 'Começa com' },
  { value: 'ends_with', label: 'Termina com' },
  { value: 'intent', label: 'Intenção detectada' },
  { value: 'variable', label: 'Valor de variável' },
];

// Opções de destino
const DESTINATION_OPTIONS = [
  { value: 'continue', label: 'Continuar no fluxo' },
  { value: 'end', label: 'Encerrar conversa' },
  { value: 'loop', label: 'Voltar ao início' },
  { value: 'goto', label: 'Ir para bloco específico' },
];

interface ConditionGroupProps {
  route: RouterRoute;
  index: number;
  canDelete: boolean;
  allBlocks: FlowBlock[];
  currentBlockId: string;
  onUpdateRoute: (routeId: string, updates: Partial<RouterRoute>) => void;
  onRemoveRoute: (routeId: string) => void;
}

const ConditionGroup = memo(function ConditionGroup({
  route,
  index,
  canDelete,
  allBlocks,
  currentBlockId,
  onUpdateRoute,
  onRemoveRoute,
}: ConditionGroupProps) {
  const [conditions, setConditions] = useState<{ type: string; value: string }[]>(
    route.keywords.length > 0 
      ? route.keywords.map(k => ({ type: 'contains', value: k }))
      : [{ type: '', value: '' }]
  );

  const availableBlocks = allBlocks.filter(b => b.id !== currentBlockId);

  const handleConditionChange = (condIndex: number, field: 'type' | 'value', value: string) => {
    const newConditions = [...conditions];
    newConditions[condIndex] = { ...newConditions[condIndex], [field]: value };
    setConditions(newConditions);
    
    // Update keywords from conditions
    const keywords = newConditions
      .filter(c => c.value.trim())
      .map(c => c.value.trim());
    onUpdateRoute(route.id, { keywords });
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { type: '', value: '' }]);
  };

  const handleRemoveCondition = (condIndex: number) => {
    if (conditions.length <= 1) return;
    const newConditions = conditions.filter((_, i) => i !== condIndex);
    setConditions(newConditions);
    
    const keywords = newConditions
      .filter(c => c.value.trim())
      .map(c => c.value.trim());
    onUpdateRoute(route.id, { keywords });
  };

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
      {/* Group name input */}
      <Input
        value={route.label}
        onChange={(e) => onUpdateRoute(route.id, { label: e.target.value })}
        placeholder={`Nome do ${index + 1}º grupo de condições`}
        className="bg-background/50"
      />

      {/* Conditions */}
      {conditions.map((cond, condIndex) => (
        <div key={condIndex} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-8">
              {condIndex === 0 ? 'Se:' : 'E se:'}
            </span>
            <div className="flex-1" />
            {condIndex > 0 && (
              <button
                onClick={() => handleRemoveCondition(condIndex)}
                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <Select
            value={cond.type}
            onValueChange={(v) => handleConditionChange(condIndex, 'type', v)}
          >
            <SelectTrigger className="bg-background/80">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {CONDITION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {cond.type && (
            <Input
              value={cond.value}
              onChange={(e) => handleConditionChange(condIndex, 'value', e.target.value)}
              placeholder="Digite o valor..."
              className="bg-background/80"
            />
          )}
        </div>
      ))}

      {/* Add condition link */}
      <button
        onClick={handleAddCondition}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <Plus className="w-3 h-3" />
        Adicionar condição
      </button>

      {/* Destination selector */}
      <div className="pt-3 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Então:
          </span>
          {canDelete && (
            <button
              onClick={() => onRemoveRoute(route.id)}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <Select
          value={route.destinationType}
          onValueChange={(v) => onUpdateRoute(route.id, { 
            destinationType: v as RouterRoute['destinationType'],
            gotoBlockId: v === 'goto' ? route.gotoBlockId : null
          })}
        >
          <SelectTrigger className="bg-background/80">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {DESTINATION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {route.destinationType === 'goto' && (
          <Select
            value={route.gotoBlockId || ''}
            onValueChange={(v) => onUpdateRoute(route.id, { gotoBlockId: v || null })}
          >
            <SelectTrigger className="bg-background/80">
              <SelectValue placeholder="Selecione o bloco" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50 max-h-[200px]">
              {availableBlocks.map((b, idx) => (
                <SelectItem key={b.id} value={b.id}>
                  #{allBlocks.findIndex(ab => ab.id === b.id) + 1} - {b.content.substring(0, 30)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
});

export const MultiConditionalProperties = memo(function MultiConditionalProperties({
  block,
  allBlocks,
  onUpdate,
}: MultiConditionalPropertiesProps) {
  const routes = block.routes || [];
  const fallback = block.fallback;
  const canAddMore = routes.length < 5;

  const handleUpdateRoute = (routeId: string, updates: Partial<RouterRoute>) => {
    onUpdate({
      routes: routes.map(r => r.id === routeId ? { ...r, ...updates } : r),
    });
  };

  const handleRemoveRoute = (routeId: string) => {
    if (routes.length <= 1) return;
    onUpdate({ routes: routes.filter(r => r.id !== routeId) });
  };

  const handleAddRoute = () => {
    if (!canAddMore) return;
    const newRoute = createRouterRoute(routes.length);
    onUpdate({ routes: [...routes, newRoute] });
  };

  const handleUpdateFallback = (updates: Partial<typeof fallback>) => {
    onUpdate({ fallback: { ...fallback, ...updates } as any });
  };

  // Check if all conditions are valid
  const hasInvalidConditions = routes.some(r => r.keywords.length === 0);

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="config" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 pt-2 bg-transparent border-b rounded-none h-auto pb-0">
          <TabsTrigger 
            value="config" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
          >
            ⚙️ Configurações
          </TabsTrigger>
          <TabsTrigger 
            value="help" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
          >
            ❓ Ajuda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {/* Route groups */}
          {routes.map((route, idx) => (
            <ConditionGroup
              key={route.id}
              route={route}
              index={idx}
              canDelete={routes.length > 1}
              allBlocks={allBlocks}
              currentBlockId={block.id}
              onUpdateRoute={handleUpdateRoute}
              onRemoveRoute={handleRemoveRoute}
            />
          ))}

          {/* Fallback section */}
          <div 
            className="p-4 rounded-xl border-2 border-dashed space-y-3"
            style={{ borderColor: `${FALLBACK_COLOR}40`, backgroundColor: `${FALLBACK_COLOR}08` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm" style={{ color: FALLBACK_COLOR }}>
                Senão, executar esta condição
              </span>
              <button
                onClick={() => handleUpdateFallback({ destinationType: 'continue' })}
                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Select
              value={fallback?.destinationType || 'loop'}
              onValueChange={(v) => handleUpdateFallback({ 
                destinationType: v as any,
                gotoBlockId: v === 'goto' ? fallback?.gotoBlockId : null
              })}
            >
              <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {DESTINATION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {fallback?.destinationType === 'goto' && (
              <Select
                value={fallback?.gotoBlockId || ''}
                onValueChange={(v) => handleUpdateFallback({ gotoBlockId: v || null })}
              >
                <SelectTrigger className="bg-background/80">
                  <SelectValue placeholder="Selecione o bloco" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[200px]">
                  {allBlocks.filter(b => b.id !== block.id).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      #{allBlocks.findIndex(ab => ab.id === b.id) + 1} - {b.content.substring(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Add new group button */}
          {canAddMore && (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={handleAddRoute}
            >
              Senão, adicionar condição
            </Button>
          )}
        </TabsContent>

        <TabsContent value="help" className="flex-1 overflow-y-auto p-4 mt-0">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">Como funciona?</h4>
              <p>O bloco Multi caminhos permite criar até 5 caminhos diferentes baseados em condições.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Grupos de condições</h4>
              <p>Cada grupo pode ter múltiplas condições que devem ser atendidas (lógica E).</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Senão (Fallback)</h4>
              <p>Define o que acontece quando nenhuma condição é atendida.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer with validation */}
      <div className="p-4 border-t space-y-3">
        {hasInvalidConditions && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-600">
              É necessário definir um tipo de condição para cada uma das condições.
            </span>
          </div>
        )}
        
        <Button 
          className="w-full"
          disabled={hasInvalidConditions}
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
});
