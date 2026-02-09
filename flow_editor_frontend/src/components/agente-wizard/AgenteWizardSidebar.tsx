import { memo } from 'react';
import { 
  User, 
  Building2, 
  Shield, 
  Zap, 
  MessageSquare, 
  Target, 
  Volume2,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AGENTE_SECTIONS, AgenteSection, AgenteValidation } from '@/types/agente';

const SECTION_ICONS: Record<string, React.ElementType> = {
  identidade: User,
  empresa: Building2,
  regras: Shield,
  gatilhos: Zap,
  respostas: MessageSquare,
  qualificacao: Target,
  voz: Volume2,
};

interface AgenteWizardSidebarProps {
  currentSection: AgenteSection;
  validation: AgenteValidation;
  onSectionChange: (section: AgenteSection) => void;
  onClose: () => void;
}

export const AgenteWizardSidebar = memo(function AgenteWizardSidebar({
  currentSection,
  validation,
  onSectionChange,
  onClose,
}: AgenteWizardSidebarProps) {
  return (
    <div className="w-72 border-r bg-card flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-primary/5">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          Configurar Agente
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{validation.progress}%</span>
        </div>
        <Progress value={validation.progress} className="h-2" />
      </div>

      {/* Sections */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {AGENTE_SECTIONS.map((section, index) => {
            const Icon = SECTION_ICONS[section.id];
            const isComplete = validation.completedSections.includes(section.id);
            const isCurrent = currentSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                  isCurrent 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  isComplete 
                    ? "bg-primary/10 text-primary" 
                    : isCurrent 
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                )}>
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    isComplete && !isCurrent && "text-muted-foreground"
                  )}>
                    {index + 1}. {section.nome}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {section.descricao}
                  </p>
                </div>
                {isCurrent && (
                  <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      {validation.isValid && (
        <div className="p-4 border-t">
          <Button className="w-full" size="sm">
            🚀 Ativar Agente
          </Button>
        </div>
      )}
    </div>
  );
});
