import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionHandleProps {
  color: string;
  onConnect?: (targetBlockId: string) => void;
  onAddBlock?: () => void;
  className?: string;
  type?: 'output' | 'input';
  size?: 'sm' | 'md';
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Handle de entrada (input) - círculos nas LATERAIS do bloco
export const InputHandle = memo(function InputHandle({
  color,
  blockId,
  side = 'left',
  className,
}: {
  color: string;
  blockId: string;
  side?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div 
      data-input-handle={blockId}
      data-input-side={side}
      className={cn(
        "w-4 h-4 rounded-full border-[3px] bg-background transition-all",
        "hover:scale-150 hover:shadow-lg hover:ring-4 hover:ring-primary/20",
        "cursor-crosshair",
        className
      )}
      style={{ 
        borderColor: color,
        boxShadow: `0 0 8px ${color}40`,
      }}
      title={`Entrada ${side === 'left' ? 'esquerda' : 'direita'} - arraste uma conexão aqui`}
    />
  );
});

// Handle de saída (output) - círculo arrastável na BASE do bloco
export const OutputHandle = memo(function OutputHandle({
  color,
  blockId,
  onConnect,
  className,
}: {
  color: string;
  blockId: string;
  onConnect?: (targetBlockId: string) => void;
  className?: string;
}) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setDragState({
      isDragging: true,
      startX: centerX,
      startY: centerY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    setDragState(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));
  }, [dragState.isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    // Usar elementsFromPoint para encontrar todos os elementos na posição (mais robusto)
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    
    let targetBlockId: string | null = null;
    
    // Procurar primeiro por input handles, depois por blocos
    for (const el of elements) {
      // Verificar se é um input handle
      const inputHandle = el.closest('[data-input-handle]');
      if (inputHandle) {
        targetBlockId = inputHandle.getAttribute('data-input-handle');
        break;
      }
      
      // Verificar se é um bloco
      const blockElement = el.closest('[data-block-id]');
      if (blockElement) {
        targetBlockId = blockElement.getAttribute('data-block-id');
        break;
      }
    }
    
    // Conectar se encontrou um bloco válido diferente do atual
    if (targetBlockId && targetBlockId !== blockId && onConnect) {
      console.log('Conectando ao bloco:', targetBlockId);
      onConnect(targetBlockId);
    }
    
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [dragState.isDragging, blockId, onConnect]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // Gerar path SVG para linha curva bezier
  const generatePath = () => {
    if (!dragState.isDragging) return '';
    
    const { startX, startY, currentX, currentY } = dragState;
    const deltaY = Math.abs(currentY - startY);
    const controlOffset = Math.max(Math.min(deltaY * 0.5, 150), 50);
    
    // Direção da curva baseada na posição do cursor
    if (currentY >= startY) {
      return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${currentX} ${currentY - controlOffset}, ${currentX} ${currentY}`;
    } else {
      return `M ${startX} ${startY} C ${startX} ${startY - controlOffset}, ${currentX} ${currentY + controlOffset}, ${currentX} ${currentY}`;
    }
  };

  // Renderizar SVG via portal para evitar problemas de transformação
  const renderDragLine = () => {
    if (!dragState.isDragging) return null;

    const svgElement = (
      <svg
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Glow effect */}
        <path
          d={generatePath()}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
        {/* Linha principal animada */}
        <path
          d={generatePath()}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="8 4"
          style={{ animation: 'dash 0.5s linear infinite' }}
        />
        {/* Círculo no ponto inicial */}
        <circle
          cx={dragState.startX}
          cy={dragState.startY}
          r={8}
          fill={color}
        />
        {/* Círculo no cursor */}
        <circle
          cx={dragState.currentX}
          cy={dragState.currentY}
          r={10}
          fill="transparent"
          stroke={color}
          strokeWidth={3}
        />
        <circle
          cx={dragState.currentX}
          cy={dragState.currentY}
          r={4}
          fill={color}
        />
      </svg>
    );

    const connectionsLayer = document.getElementById('connections-layer') || document.body;
    
    return createPortal(svgElement, connectionsLayer);
  };

  return (
    <>
      <div
        ref={handleRef}
        data-output-handle={blockId}
        className={cn(
          "w-5 h-5 rounded-full border-[3px] bg-background transition-all cursor-grab active:cursor-grabbing",
          "hover:scale-150 hover:shadow-xl hover:ring-4 hover:ring-primary/30",
          "flex items-center justify-center",
          dragState.isDragging && "scale-150 shadow-xl ring-4 ring-primary/30",
          className
        )}
        style={{ 
          borderColor: color,
          backgroundColor: dragState.isDragging ? color : undefined,
          boxShadow: `0 0 12px ${color}50`,
        }}
        onMouseDown={handleMouseDown}
        title="Saída - arraste para conectar a outro bloco"
      >
        {!dragState.isDragging && (
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </div>

      {renderDragLine()}
    </>
  );
});

// Componente de handle arrastável estilo N8N (para rotas)
export const ConnectionHandle = memo(function ConnectionHandle({
  color,
  onConnect,
  onAddBlock,
  className,
}: ConnectionHandleProps) {
  const handleRef = useRef<HTMLButtonElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Usar clientX/Y diretamente
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    setDragState(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
    }));
  }, [dragState.isDragging]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const inputHandle = target?.closest('[data-input-handle]');
    const blockElement = target?.closest('[data-block-id]');
    
    if (inputHandle) {
      const targetBlockId = inputHandle.getAttribute('data-input-handle');
      if (targetBlockId && onConnect) {
        onConnect(targetBlockId);
      }
    } else if (blockElement) {
      const targetBlockId = blockElement.getAttribute('data-block-id');
      if (targetBlockId && onConnect) {
        onConnect(targetBlockId);
      }
    }
    
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  }, [dragState.isDragging, onConnect]);

  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const generatePath = () => {
    if (!dragState.isDragging) return '';
    
    const { startX, startY, currentX, currentY } = dragState;
    const controlOffset = Math.max(Math.abs(currentY - startY) * 0.5, 50);
    
    if (currentY >= startY) {
      return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${currentX} ${currentY - controlOffset}, ${currentX} ${currentY}`;
    } else {
      return `M ${startX} ${startY} C ${startX} ${startY - controlOffset}, ${currentX} ${currentY + controlOffset}, ${currentX} ${currentY}`;
    }
  };

  return (
    <>
      <button
        ref={handleRef}
        className={cn(
          "w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center",
          "transition-all hover:scale-110 hover:border-solid",
          "cursor-grab active:cursor-grabbing",
          dragState.isDragging && "scale-125 border-solid shadow-lg",
          className
        )}
        style={{ 
          borderColor: `${color}80`, 
          color: color,
          backgroundColor: dragState.isDragging ? `${color}30` : `${color}15`,
        }}
        onMouseDown={handleMouseDown}
        title="Arraste para conectar ou clique para adicionar"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {dragState.isDragging && (
        <svg
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ width: '100vw', height: '100vh' }}
        >
          <path
            d={generatePath()}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeOpacity={0.2}
            strokeLinecap="round"
          />
          <path
            d={generatePath()}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle
            cx={dragState.startX}
            cy={dragState.startY}
            r={6}
            fill={color}
          />
          <circle
            cx={dragState.currentX}
            cy={dragState.currentY}
            r={8}
            fill="transparent"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        </svg>
      )}
    </>
  );
});
