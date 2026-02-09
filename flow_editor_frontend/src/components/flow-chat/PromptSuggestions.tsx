import { cn } from "@/lib/utils";
import { 
  MessageSquarePlus, 
  GitBranch, 
  Settings, 
  Zap,
  UserCircle,
  Brain,
  ShieldAlert,
  Mic
} from "lucide-react";

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const suggestions = [
  {
    icon: MessageSquarePlus,
    label: "Mensagem inicial",
    prompt: "Adicione uma mensagem de boas-vindas que diz 'Olá! Sou a Isabela, como posso ajudar você hoje?'",
  },
  {
    icon: UserCircle,
    label: "Mudar identidade",
    prompt: "Mude o nome da IA para Sofia e ajuste a primeira mensagem também",
  },
  {
    icon: Mic,
    label: "Tom de voz",
    prompt: "Mude a personalidade para ser mais formal e profissional nas respostas",
  },
  {
    icon: GitBranch,
    label: "Criar rota",
    prompt: "Crie uma rota de decisão para quando o cliente disser 'sim' ou 'não'",
  },
  {
    icon: Brain,
    label: "Adicionar pergunta",
    prompt: "Adicione uma pergunta para capturar o orçamento disponível do cliente",
  },
  {
    icon: ShieldAlert,
    label: "Adicionar regra",
    prompt: "Adicione uma regra para nunca mencionar preços específicos ou concorrentes",
  },
  {
    icon: Settings,
    label: "Configurar objeções",
    prompt: "Adicione tratamento para quando o cliente disser que está ocupado ou sem tempo",
  },
  {
    icon: Zap,
    label: "Ferramenta",
    prompt: "Adicione uma ferramenta para enviar link de agendamento via WhatsApp",
  },
];

const PromptSuggestions = ({ onSelect, disabled }: PromptSuggestionsProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center px-4">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={index}
            onClick={() => onSelect(suggestion.prompt)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
              "bg-white dark:bg-slate-800",
              "border-2 border-[rgba(165,148,255,0.2)] dark:border-[rgba(165,148,255,0.3)]",
              "text-slate-700 dark:text-slate-200",
              "hover:border-[#A594FF] dark:hover:border-[#A594FF]",
              "hover:bg-[rgba(165,148,255,0.05)] dark:hover:bg-[rgba(165,148,255,0.1)]",
              "hover:shadow-[0_4px_12px_rgba(165,148,255,0.2)]",
              "transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[rgba(165,148,255,0.2)] dark:disabled:hover:border-[rgba(165,148,255,0.3)] disabled:hover:bg-transparent"
            )}
          >
            <Icon className="w-4 h-4 text-[#A594FF]" />
            <span>{suggestion.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default PromptSuggestions;
