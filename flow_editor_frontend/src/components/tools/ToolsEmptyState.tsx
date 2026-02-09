import { Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolsEmptyStateProps {
  onCreateTool: () => void;
}

export function ToolsEmptyState({ onCreateTool }: ToolsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Wrench className="w-10 h-10 text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        Nenhuma tool criada ainda
      </h3>
      
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Tools são ações que sua IA pode executar durante as conversas, como enviar vídeos, 
        agendar consultas ou transferir para um atendente.
      </p>
      
      <Button onClick={onCreateTool} className="gap-2">
        <Plus className="w-4 h-4" />
        Criar primeira tool
      </Button>
    </div>
  );
}
