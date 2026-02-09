import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToolType, TOOL_TYPES_INFO } from '@/types/tools';
import { ToolIcon } from './ToolIcon';

interface ToolsFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: ToolType | 'all';
  onTypeFilterChange: (type: ToolType | 'all') => void;
}

export function ToolsFilter({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: ToolsFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tools..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as ToolType | 'all')}>
        <SelectTrigger className="w-full sm:w-48 bg-card border-border">
          <SelectValue placeholder="Filtrar por tipo" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Todos os tipos</SelectItem>
          {TOOL_TYPES_INFO.map((type) => (
            <SelectItem key={type.type} value={type.type} className="gap-2">
              <div className="flex items-center gap-2">
                <ToolIcon type={type.type} className="h-4 w-4" style={{ color: type.color }} />
                {type.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
