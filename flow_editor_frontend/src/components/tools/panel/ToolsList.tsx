import { useState } from 'react';
import { Search, Plus, Star, MoreHorizontal, Pencil, Copy, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolIcon } from '../ToolIcon';
import { Tool, ToolType, getToolTypeInfo } from '@/types/tools';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ToolsListProps {
  tools: Tool[];
  isLoading: boolean;
  onCreateNew: () => void;
  onEdit: (tool: Tool) => void;
  onDuplicate: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
  onToggleActive: (tool: Tool) => void;
}

export function ToolsList({ 
  tools, 
  isLoading, 
  onCreateNew, 
  onEdit, 
  onDuplicate, 
  onDelete,
  onToggleActive,
}: ToolsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'ativas'>('todas');

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.tool_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'todas' || tool.is_active;
    return matchesSearch && matchesTab;
  });

  // Agrupar por tipo
  const groupedTools = filteredTools.reduce((acc, tool) => {
    const type = tool.tool_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(tool);
    return acc;
  }, {} as Record<ToolType, Tool[]>);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tools..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2 flex gap-2 border-b">
        <Button
          variant={activeTab === 'todas' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('todas')}
        >
          Todas ({tools.length})
        </Button>
        <Button
          variant={activeTab === 'ativas' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('ativas')}
          className="gap-1"
        >
          <Power className="w-3 h-3" />
          Ativas ({tools.filter(t => t.is_active).length})
        </Button>
      </div>

      {/* Tools List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.entries(groupedTools).map(([type, typeTools]) => {
            const typeInfo = getToolTypeInfo(type as ToolType);
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <ToolIcon 
                    type={type as ToolType} 
                    className="w-4 h-4" 
                    style={{ color: typeInfo.color }} 
                  />
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {typeInfo.label}s
                  </span>
                  <span className="text-xs text-muted-foreground">({typeTools.length})</span>
                </div>
                
                <div className="space-y-2">
                  {typeTools.map((tool) => (
                    <div
                      key={tool.id}
                      className={cn(
                        "p-3 rounded-lg border bg-card transition-all",
                        tool.is_active 
                          ? "border-border hover:border-primary/50" 
                          : "border-border/50 opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${typeInfo.color}20` }}
                        >
                          <ToolIcon 
                            type={type as ToolType} 
                            className="w-4 h-4" 
                            style={{ color: typeInfo.color }} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">{tool.display_name}</span>
                            {!tool.is_active && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                Inativa
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {tool.ai_description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(tool)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(tool)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleActive(tool)}>
                              {tool.is_active ? (
                                <>
                                  <PowerOff className="w-4 h-4 mr-2" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Power className="w-4 h-4 mr-2" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(tool)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma tool encontrada</p>
              <Button 
                variant="link" 
                size="sm" 
                onClick={onCreateNew}
                className="mt-2"
              >
                Criar primeira tool
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button className="w-full gap-2" onClick={onCreateNew}>
          <Plus className="w-4 h-4" />
          Criar Nova Tool
        </Button>
      </div>
    </div>
  );
}
