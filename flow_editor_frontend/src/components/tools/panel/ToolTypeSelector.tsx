import { TOOL_TYPES_INFO, ToolType } from '@/types/tools';
import { ToolIcon } from '../ToolIcon';

interface ToolTypeSelectorProps {
  onSelect: (type: ToolType) => void;
  onBack: () => void;
}

export function ToolTypeSelector({ onSelect, onBack }: ToolTypeSelectorProps) {
  return (
    <div className="p-4 space-y-4">
      <button 
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Voltar
      </button>
      
      <div>
        <h3 className="font-medium text-foreground mb-1">Nova Tool</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de tool que deseja criar:
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {TOOL_TYPES_INFO.map((typeInfo) => (
          <button
            key={typeInfo.type}
            onClick={() => onSelect(typeInfo.type)}
            className="group flex flex-col items-center p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${typeInfo.color}20` }}
            >
              <ToolIcon 
                type={typeInfo.type} 
                className="w-5 h-5" 
                style={{ color: typeInfo.color }} 
              />
            </div>
            <span className="font-medium text-foreground text-xs">
              {typeInfo.label}
            </span>
            <span className="text-[10px] text-muted-foreground text-center mt-0.5 line-clamp-2">
              {typeInfo.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
