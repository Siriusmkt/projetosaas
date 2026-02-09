import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowBlock, FlowBlockType, ToolBlockType, getBlockTypeInfo, getBlockLabel, FALLBACK_COLOR } from '@/types/flow';
import { FlowBlockIcon } from './FlowBlockIcon';
import { cn } from '@/lib/utils';
import { Plus, X, GripVertical, MessageSquare } from 'lucide-react';

// ============================================================================
// NODE DATA TYPES
// ============================================================================
interface FlowNodeData extends Record<string, unknown> {
  block: FlowBlock;
  label: string;
}

// Message Node - for text/primeira_mensagem blocks
const MessageNode = ({ data, selected }: NodeProps<Node<FlowNodeData>>) => {
  const block = data.block;
  const typeInfo = getBlockTypeInfo(block);
  
  return (
    <div 
      className={cn(
        "min-w-[280px] rounded-xl border-2 bg-card shadow-lg transition-all",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ borderColor: typeInfo.color }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      {/* Header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
        style={{ backgroundColor: `${typeInfo.color}15` }}
      >
      <div 
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${typeInfo.color}30` }}
      >
        <FlowBlockIcon 
          type={block.type} 
          toolType={block.toolType}
          className="w-4 h-4"
          style={{ color: typeInfo.color }}
        />
      </div>
      <span className="font-semibold text-sm">{getBlockLabel(block)}</span>
      </div>
      
    {/* Content */}
    <div className="px-3 py-2 border-t" style={{ borderColor: `${typeInfo.color}20` }}>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {block.content || 'Configurar mensagem...'}
        </p>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
};

// Multi-Conditional Node - for ramificacoes blocks
const MultiConditionalNode = ({ data, selected }: NodeProps<Node<FlowNodeData>>) => {
  const block = data.block;
  const routes = block.routes || [];
  const fallback = block.fallback || { label: 'Outros' };
  
  return (
    <div 
      className={cn(
        "min-w-[280px] rounded-xl border-2 bg-card shadow-lg transition-all",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ borderColor: 'hsl(262 83% 58%)' }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
        style={{ top: 24 }}
      />
      
      {/* Header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl"
        style={{ backgroundColor: 'hsl(262 83% 58% / 0.1)' }}
      >
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))' }}
        >
          <span className="text-white text-sm">⚡</span>
        </div>
        <span className="font-semibold text-sm">Multi caminhos</span>
        <button className="ml-auto w-5 h-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-primary hover:bg-primary/10">
          <Plus className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      
      {/* Conditions */}
      <div className="p-2 space-y-2">
        {/* Add condition button */}
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors">
          <Plus className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Adicionar condição</span>
        </button>
        
        {/* Condition rows */}
        {routes.map((route, idx) => (
          <div 
            key={route.id} 
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
          >
            <span className="text-xs font-medium text-muted-foreground w-8">Se:</span>
            <input
              type="text"
              value={route.label}
              onChange={() => {}}
              className="flex-1 bg-transparent border-none text-sm outline-none"
              placeholder="Condição..."
            />
            
            {/* Route output handle */}
            <Handle
              type="source"
              position={Position.Right}
              id={`route-${route.id}`}
              className="!w-3 !h-3 !border-2 !border-white"
              style={{ 
                top: 76 + (idx * 40), 
                backgroundColor: route.color,
              }}
            />
          </div>
        ))}
        
        {/* Senão / Else row */}
        <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground w-8">Senão:</span>
          <input
            type="text"
            className="flex-1 bg-transparent border-none text-sm outline-none"
            placeholder="Fallback..."
          />
          
          {/* Fallback handle */}
          <Handle
            type="source"
            position={Position.Right}
            id="route-fallback"
            className="!w-3 !h-3 !bg-gray-500 !border-2 !border-white"
            style={{ 
              top: 76 + (routes.length * 40),
            }}
          />
        </div>
        
        {/* Fallback warning */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600">
          <X className="w-4 h-4" />
          <span className="text-xs">Não atende nenhuma das condições</span>
        </div>
        
        {/* Configure button */}
        <button className="w-full py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
          Configurar
        </button>
        
        {/* Warning */}
        <div className="px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-[10px]">
          É necessário definir um tipo de condição para cada uma das condições.
        </div>
      </div>
    </div>
  );
};

// Wait Node - for aguardar blocks
const WaitNode = ({ data, selected }: NodeProps<Node<FlowNodeData>>) => {
  const block = data.block;
  const typeInfo = getBlockTypeInfo(block);
  
  return (
    <div 
      className={cn(
        "min-w-[200px] rounded-xl border-2 bg-card shadow-lg transition-all",
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      style={{ borderColor: typeInfo.color }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
      
      <div className="flex items-center gap-2 px-3 py-2">
        <div 
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${typeInfo.color}30` }}
        >
          <FlowBlockIcon 
            type={block.type}
            className="w-4 h-4"
            style={{ color: typeInfo.color }}
          />
        </div>
        <span className="font-semibold text-sm">Aguardar resposta</span>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white"
      />
    </div>
  );
};

// Node types registry
const nodeTypes = {
  message: MessageNode,
  multiConditional: MultiConditionalNode,
  wait: WaitNode,
};

// ============================================================================
// HELPER: Convert FlowBlocks to React Flow format
// ============================================================================
function blocksToNodes(blocks: FlowBlock[]): Node[] {
  let yOffset = 0;
  const nodes: Node[] = [];
  
  blocks.forEach((block, idx) => {
    let nodeType = 'message';
    if (block.type === 'ramificacoes') nodeType = 'multiConditional';
    if (block.type === 'aguardar') nodeType = 'wait';
    
    nodes.push({
      id: block.id,
      type: nodeType,
      position: { x: 100 + (idx % 3) * 350, y: yOffset },
      data: { block, label: getBlockLabel(block) },
    });
    
    yOffset += block.type === 'ramificacoes' ? 350 : 150;
  });
  
  return nodes;
}

function blocksToEdges(blocks: FlowBlock[]): Edge[] {
  const edges: Edge[] = [];
  
  blocks.forEach((block, idx) => {
    if (idx < blocks.length - 1) {
      const nextBlock = blocks[idx + 1];
      
      if (block.type === 'ramificacoes') {
        // Connect each route to subsequent blocks
        block.routes?.forEach(route => {
          edges.push({
            id: `e-${block.id}-${route.id}`,
            source: block.id,
            sourceHandle: `route-${route.id}`,
            target: nextBlock.id,
            type: 'smoothstep',
            style: { stroke: route.color, strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: route.color },
          });
        });
      } else {
        edges.push({
          id: `e-${block.id}-${nextBlock.id}`,
          source: block.id,
          target: nextBlock.id,
          type: 'smoothstep',
          style: { stroke: '#64748b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        });
      }
    }
  });
  
  return edges;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface ReactFlowCanvasProps {
  blocks: FlowBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onAddBlock: (type: FlowBlockType, toolType?: ToolBlockType) => void;
  onUpdateBlock: (id: string, updates: Partial<FlowBlock>) => void;
}

export function ReactFlowCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
}: ReactFlowCanvasProps) {
  const initialNodes = useMemo(() => blocksToNodes(blocks), [blocks]);
  const initialEdges = useMemo(() => blocksToEdges(blocks), [blocks]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      style: { stroke: '#64748b', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
    }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onSelectBlock(node.id);
  }, [onSelectBlock]);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2 },
        }}
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className="!bg-card !border !shadow-lg" />
        <MiniMap 
          className="!bg-card !border !shadow-lg"
          nodeColor={(node) => {
            const block = node.data?.block as FlowBlock;
            if (block) {
              return getBlockTypeInfo(block).color;
            }
            return '#64748b';
          }}
        />
      </ReactFlow>
    </div>
  );
}
