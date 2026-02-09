import { TOOL_TYPES_INFO, ToolType } from '@/types/tools';
import { ToolIcon } from '../ToolIcon';

interface ToolTypeSelectorProps {
  onSelect: (type: ToolType) => void;
}

export function ToolTypeSelector({ onSelect }: ToolTypeSelectorProps) {
  return (
    <div className="py-4">
      <p className="text-muted-foreground mb-6">
        Escolha o tipo de tool que deseja criar:
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOL_TYPES_INFO.map((typeInfo) => (
          <button
            key={typeInfo.type}
            onClick={() => onSelect(typeInfo.type)}
            className="group flex flex-col items-center p-4 rounded-xl border border-border bg-secondary/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${typeInfo.color}20` }}
            >
              <ToolIcon 
                type={typeInfo.type} 
                className="w-6 h-6" 
                style={{ color: typeInfo.color }} 
              />
            </div>
            <span className="font-medium text-foreground text-sm">
              {typeInfo.label}
            </span>
            <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
              {typeInfo.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
