import { memo, useState, useRef, useCallback } from 'react';
import { X, GripVertical, Mic, Palette, Brain, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface EssentialNode {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled: boolean;
}

interface EssentialNodesPanelProps {
  onNodeToggle?: (nodeId: string, enabled: boolean) => void;
}

const ESSENTIAL_NODES: EssentialNode[] = [
  {
    id: 'voice',
    label: 'Voz',
    description: 'Tom e estilo de fala',
    icon: Mic,
    color: '#8B5CF6',
    bgColor: '#8B5CF620',
    enabled: true,
  },
  {
    id: 'personality',
    label: 'Personalização',
    description: 'Comportamento único',
    icon: Palette,
    color: '#EC4899',
    bgColor: '#EC489920',
    enabled: true,
  },
  {
    id: 'memory',
    label: 'Memória',
    description: 'Lembra contexto',
    icon: Brain,
    color: '#10B981',
    bgColor: '#10B98120',
    enabled: true,
  },
  {
    id: 'speed',
    label: 'Velocidade',
    description: 'Tempo de resposta',
    icon: Zap,
    color: '#F59E0B',
    bgColor: '#F59E0B20',
    enabled: true,
  },
  {
    id: 'guardrails',
    label: 'Guardrails',
    description: 'Limites de segurança',
    icon: Shield,
    color: '#EF4444',
    bgColor: '#EF444420',
    enabled: false,
  },
  {
    id: 'availability',
    label: 'Disponibilidade',
    description: 'Horários de ativação',
    icon: Clock,
    color: '#6366F1',
    bgColor: '#6366F120',
    enabled: false,
  },
];

export const EssentialNodesPanel = memo(function EssentialNodesPanel({
  onNodeToggle,
}: EssentialNodesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nodes, setNodes] = useState(ESSENTIAL_NODES);
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

  const handleToggle = (nodeId: string, enabled: boolean) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, enabled } : node
    ));
    onNodeToggle?.(nodeId, enabled);
  };

  const enabledCount = nodes.filter(n => n.enabled).length;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-4 left-4 z-50 gap-2 shadow-lg bg-background/95 backdrop-blur-sm border-primary/20"
        size="sm"
      >
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Mic className="w-2.5 h-2.5 text-primary" />
          </div>
          <div className="w-4 h-4 rounded-full bg-accent/40 flex items-center justify-center">
            <Palette className="w-2.5 h-2.5 text-accent-foreground" />
          </div>
        </div>
        <span className="text-xs">Nós Essenciais</span>
        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
          {enabledCount}
        </span>
      </Button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl",
        isDragging && "cursor-grabbing select-none"
      )}
      style={{ 
        left: position.x, 
        top: position.y,
        width: 260,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header com drag handle */}
      <div 
        className="flex items-center justify-between p-3 border-b cursor-grab active:cursor-grabbing"
        data-drag-handle
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="font-medium text-sm">Nós Essenciais</span>
            <p className="text-[10px] text-muted-foreground">Conectados ao agente</p>
          </div>
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

      {/* Connection indicator */}
      <div className="px-3 py-2 bg-primary/5 border-b">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-muted-foreground">
            {enabledCount} nós ativos conectados
          </span>
        </div>
      </div>

      {/* Lista de nodes */}
      <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-lg transition-all",
              node.enabled 
                ? "bg-muted/40 border border-transparent" 
                : "opacity-60 hover:opacity-80"
            )}
          >
            <div 
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative",
                node.enabled && "ring-2 ring-offset-1 ring-primary/50"
              )}
              style={{ 
                backgroundColor: node.bgColor,
              }}
            >
              <node.icon 
                className="w-4 h-4"
                style={{ color: node.color }}
              />
              {node.enabled && (
                <div 
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background"
                  style={{ backgroundColor: node.color }}
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium block truncate">{node.label}</span>
              <span className="text-[10px] text-muted-foreground block truncate">
                {node.description}
              </span>
            </div>

            <Switch
              checked={node.enabled}
              onCheckedChange={(checked) => handleToggle(node.id, checked)}
              className="scale-75"
            />
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center">
          Clique no agente para configurar cada nó
        </p>
      </div>
    </div>
  );
});
