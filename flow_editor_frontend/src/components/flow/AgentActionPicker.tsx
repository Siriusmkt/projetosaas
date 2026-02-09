import { memo } from 'react';
import { 
  MessageSquare, 
  HandMetal, 
  Wrench, 
  XCircle,
  Clock,
  ChevronRight,
  GitBranch
} from 'lucide-react';
import { FlowBlockType, ToolBlockType } from '@/types/flow';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Ações do agente com linguagem simples
export interface AgentAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  blockType: FlowBlockType;
  toolType?: ToolBlockType;
  defaultContent?: string;
}

export const AGENT_ACTIONS: AgentAction[] = [
  {
    id: 'respond',
    label: 'Vai responder',
    description: 'Envia uma mensagem para o lead',
    icon: MessageSquare,
    color: 'hsl(160 84% 39%)',
    bgColor: 'hsl(160 84% 39% / 0.1)',
    blockType: 'texto',
    defaultContent: 'Digite a mensagem...',
  },
  {
    id: 'first_message',
    label: 'Primeira mensagem',
    description: 'Saudação inicial do agente',
    icon: HandMetal,
    color: 'hsl(280 80% 60%)',
    bgColor: 'hsl(280 80% 60% / 0.1)',
    blockType: 'primeira_mensagem',
    defaultContent: 'Olá! Sou a assistente virtual. Como posso ajudar?',
  },
  {
    id: 'tool',
    label: 'Usa ferramenta',
    description: 'Executa uma ferramenta',
    icon: Wrench,
    color: 'hsl(38 92% 50%)',
    bgColor: 'hsl(38 92% 50% / 0.1)',
    blockType: 'tool',
    defaultContent: 'Selecionar tool',
  },
  {
    id: 'ramificacoes',
    label: 'Multi caminhos',
    description: 'Define múltiplos caminhos no fluxo',
    icon: GitBranch,
    color: 'hsl(262 83% 58%)',
    bgColor: 'hsl(262 83% 58% / 0.1)',
    blockType: 'ramificacoes',
    defaultContent: 'Como o lead respondeu?',
  },
  {
    id: 'wait',
    label: 'Aguarda resposta',
    description: 'Espera o lead responder',
    icon: Clock,
    color: 'hsl(217 91% 60%)',
    bgColor: 'hsl(217 91% 60% / 0.1)',
    blockType: 'aguardar',
    defaultContent: 'Aguardando resposta...',
  },
  {
    id: 'end',
    label: 'Encerra',
    description: 'Finaliza a conversa',
    icon: XCircle,
    color: 'hsl(0 84% 60%)',
    bgColor: 'hsl(0 84% 60% / 0.1)',
    blockType: 'encerrar',
    defaultContent: 'Até logo!',
  },
];

interface AgentActionPickerProps {
  onSelect: (action: AgentAction) => void;
  trigger: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  /** Excluir tipos de bloco do menu (ex.: ramificacoes ao adicionar dentro de uma rota) */
  excludeBlockTypes?: FlowBlockType[];
}

export const AgentActionPicker = memo(function AgentActionPicker({
  onSelect,
  trigger,
  align = 'center',
  excludeBlockTypes,
}: AgentActionPickerProps) {
  const actions = excludeBlockTypes?.length
    ? AGENT_ACTIONS.filter((a) => !excludeBlockTypes.includes(a.blockType))
    : AGENT_ACTIONS;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-72 p-2">
        <div className="px-2 py-1.5 mb-1">
          <span className="text-xs font-semibold text-muted-foreground">O que acontece?</span>
        </div>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem 
              key={action.id}
              onClick={() => onSelect(action)}
              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: action.bgColor }}
              >
                <Icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

// Botão simplificado de adicionar ação
interface AddActionButtonProps {
  onAdd: (type: FlowBlockType, toolType?: ToolBlockType, content?: string) => void;
  className?: string;
}

export const AddActionButton = memo(function AddActionButton({
  onAdd,
  className,
}: AddActionButtonProps) {
  const handleSelect = (action: AgentAction) => {
    onAdd(action.blockType, action.toolType, action.defaultContent);
  };

  return (
    <AgentActionPicker
      onSelect={handleSelect}
      trigger={
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed",
            "border-muted-foreground/30 hover:border-primary hover:bg-primary/5",
            "text-muted-foreground hover:text-primary transition-all",
            "text-sm font-medium",
            className
          )}
        >
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary text-lg leading-none">+</span>
          </span>
          Adicionar ação
        </button>
      }
    />
  );
});
