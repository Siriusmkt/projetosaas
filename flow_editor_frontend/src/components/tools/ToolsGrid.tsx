import { Tool } from '@/types/tools';
import { ToolCard } from './ToolCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ToolsGridProps {
  tools: Tool[];
  isLoading: boolean;
  onEdit: (tool: Tool) => void;
  onDuplicate: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
  onToggleStatus: (toolId: string, isActive: boolean) => void;
}

export function ToolsGrid({ 
  tools, 
  isLoading, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onToggleStatus 
}: ToolsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
