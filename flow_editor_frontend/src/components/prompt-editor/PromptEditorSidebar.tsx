import { cn } from '@/lib/utils';
import { PROMPT_SECTIONS, type PromptSection } from '@/types/prompt';
import { 
  User, Building, Shield, Zap, MessageSquare, GitBranch, 
  HelpCircle, AlertTriangle, Link, Target, Filter, 
  ClipboardList, Smile, Volume2, Eye, Check, Circle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PromptEditorSidebarProps {
  currentSection: PromptSection;
  onSectionChange: (section: PromptSection) => void;
  getSectionProgress: (section: PromptSection) => 'complete' | 'partial' | 'empty';
  getItemCount?: (section: PromptSection) => number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  User, Building, Shield, Zap, MessageSquare, GitBranch,
  HelpCircle, AlertTriangle, Link, Target, Filter,
  ClipboardList, Smile, Volume2, Eye,
};

export function PromptEditorSidebar({ 
  currentSection, 
  onSectionChange, 
  getSectionProgress,
  getItemCount,
}: PromptEditorSidebarProps) {
  return (
    <div className="w-64 bg-card border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Seções do Prompt
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {PROMPT_SECTIONS.map((section) => {
          const Icon = iconMap[section.icon] || Circle;
          const progress = getSectionProgress(section.id);
          const isActive = currentSection === section.id;
          const count = getItemCount?.(section.id);
          
          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                "hover:bg-muted/50",
                isActive && "bg-primary/10 border-r-2 border-primary"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isActive && "text-primary"
                  )}>
                    {section.nome}
                  </span>
                  {section.required && (
                    <span className="text-destructive text-xs">*</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {count !== undefined && count > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                    {count}
                  </Badge>
                )}
                
                {progress === 'complete' ? (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                ) : progress === 'partial' ? (
                  <div className="w-5 h-5 rounded-full bg-accent/40 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <Circle className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
