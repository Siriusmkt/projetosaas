import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FlowBlock, getBlockTypeInfo } from '@/types/flow';

interface ConnectionLine {
  id: string;
  fromBlockId: string;
  toBlockId: string;
  color: string;
}

interface BlockPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PermanentConnectionsProps {
  blocks: (FlowBlock & { blockKey?: string })[];
  containerRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Renderiza conexões entre blocos normais via gotoBlockId
 * NÃO renderiza rotas do multi-condicional (isso é feito pelo RoutePathsRenderer)
 */
export const PermanentConnections = memo(function PermanentConnections({
  blocks,
  containerRef,
  zoom,
  pan,
}: PermanentConnectionsProps) {
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [positions, setPositions] = useState<Record<string, BlockPosition>>({});
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // Encontrar bloco pelo blockKey ou id
  const findBlockByKeyOrId = (keyOrId: string | null | undefined) => {
    if (!keyOrId) return null;
    return blocks.find(b => b.blockKey === keyOrId) || blocks.find(b => b.id === keyOrId);
  };

  // Calcular conexões - gotoBlockId e nextBlock de blocos individuais
  useEffect(() => {
    const newConnections: ConnectionLine[] = [];

    blocks.forEach((block) => {
      // Ignorar blocos do tipo ramificações - rotas são renderizadas separadamente
      if (block.type === 'ramificacoes') {
        return;
      }
      
      const typeInfo = getBlockTypeInfo(block);

      // Conexão gotoBlockId - qualquer bloco que tenha (incluindo blocos de rotas)
      if (block.gotoBlockId) {
        const targetBlock = findBlockByKeyOrId(block.gotoBlockId);
        if (targetBlock) {
          newConnections.push({
            id: `${block.id}-goto-${targetBlock.id}`,
            fromBlockId: block.id,
            toBlockId: targetBlock.id,
            color: typeInfo.color,
          });
        }
      }
      
      // Conexão nextBlock - fluxo normal
      if (block.nextBlock) {
        const targetBlock = findBlockByKeyOrId(block.nextBlock);
        if (targetBlock) {
          newConnections.push({
            id: `${block.id}-next-${targetBlock.id}`,
            fromBlockId: block.id,
            toBlockId: targetBlock.id,
            color: typeInfo.color,
          });
        }
      }
    });

    setConnections(newConnections);
  }, [blocks]);

  // Atualizar posições dos blocos (coordenadas relativas ao container)
  useEffect(() => {
    let rafId = 0;
    let mounted = true;

    const updatePositions = () => {
      if (!mounted) return;
      const containerEl = containerRef.current;
      if (!containerEl) {
        rafId = requestAnimationFrame(updatePositions);
        return;
      }

      const containerBounds = containerEl.getBoundingClientRect();
      setContainerRect(containerBounds);

      const newPositions: Record<string, BlockPosition> = {};
      document.querySelectorAll('[data-block-id]').forEach((el) => {
        const blockId = el.getAttribute('data-block-id');
        if (!blockId) return;
        const rect = el.getBoundingClientRect();
        newPositions[blockId] = {
          x: rect.left - containerBounds.left,
          y: rect.top - containerBounds.top,
          w: rect.width,
          h: rect.height,
        };
      });

      setPositions(newPositions);
      rafId = requestAnimationFrame(updatePositions);
    };

    rafId = requestAnimationFrame(updatePositions);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, [blocks, zoom, pan]);

  // Gerar path bezier simples e estável
  const generateBezierPath = (fromRect: BlockPosition, toRect: BlockPosition): string => {
    const startX = fromRect.x + fromRect.w / 2;
    const startY = fromRect.y + fromRect.h;
    const endX = toRect.x + toRect.w / 2;
    const endY = toRect.y;

    const deltaY = Math.abs(endY - startY);
    const controlOffset = Math.max(Math.min(deltaY * 0.6, 180), 40);

    return `M ${startX} ${startY} C ${startX} ${startY + controlOffset}, ${endX} ${endY - controlOffset}, ${endX} ${endY}`;
  };

  if (connections.length === 0) {
    return null;
  }

  const svgContent = (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: containerRect?.width || '100%',
        height: containerRect?.height || '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {connections.map((conn) => {
        const fromRect = positions[conn.fromBlockId];
        const toRect = positions[conn.toBlockId];

        if (!fromRect || !toRect) {
          return null;
        }

        const path = generateBezierPath(fromRect, toRect);

        return (
          <g key={conn.id}>
            <path
              d={path}
              fill="none"
              stroke={conn.color}
              strokeWidth={6}
              strokeOpacity={0.15}
              strokeLinecap="round"
            />
            <path
              d={path}
              fill="none"
              stroke={conn.color}
              strokeWidth={2.5}
              strokeOpacity={0.6}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );

  const connectionsLayer = document.getElementById('connections-layer') || document.body;
  
  return createPortal(svgContent, connectionsLayer);
});
