import { memo } from 'react';
import { Settings, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AGENTE_SECTIONS, AgenteSection } from '@/types/agente';

interface AgenteLockScreenProps {
  completedSections: AgenteSection[];
  onConfigure: () => void;
}

export const AgenteLockScreen = memo(function AgenteLockScreen({
  completedSections,
  onConfigure,
}: AgenteLockScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="max-w-md text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Settings className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
          Configure seu Agente de Voz
        </h2>
        <p className="text-muted-foreground mb-6">
          Para usar o agente, você precisa configurar as informações essenciais.
        </p>

        <div className="bg-card border rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-medium mb-3">Configurações obrigatórias:</p>
          <ul className="space-y-2">
            {AGENTE_SECTIONS.map((section) => {
              const isComplete = completedSections.includes(section.id);
              return (
                <li key={section.id} className="flex items-center gap-2 text-sm">
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={isComplete ? 'text-muted-foreground line-through' : ''}>
                    {section.nome}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          ⏱️ Tempo estimado: 15-20 minutos
        </p>

        <Button size="lg" onClick={onConfigure} className="gap-2">
          <Settings className="w-4 h-4" />
          Configurar Agente
        </Button>
      </div>
    </div>
  );
});
