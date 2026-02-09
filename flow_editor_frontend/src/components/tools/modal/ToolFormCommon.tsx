import { HelpCircle } from 'lucide-react';
import { ToolType, getToolTypeInfo } from '@/types/tools';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ToolIcon } from '../ToolIcon';

interface ToolFormCommonProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  aiDescription: string;
  onAiDescriptionChange: (value: string) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  toolType: ToolType | null;
}

export function ToolFormCommon({
  displayName,
  onDisplayNameChange,
  aiDescription,
  onAiDescriptionChange,
  isActive,
  onIsActiveChange,
  toolType,
}: ToolFormCommonProps) {
  const typeInfo = toolType ? getToolTypeInfo(toolType) : null;
  const descriptionLength = aiDescription.length;
  const isDescriptionValid = descriptionLength >= 20;

  return (
    <div className="space-y-5">
      {/* Type badge */}
      {typeInfo && (
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${typeInfo.color}20` }}
          >
            <ToolIcon type={toolType!} className="w-5 h-5" style={{ color: typeInfo.color }} />
          </div>
          <div>
            <Badge variant="secondary" className="text-xs">
              {typeInfo.label}
            </Badge>
            <p className="text-sm text-muted-foreground mt-0.5">
              {typeInfo.description}
            </p>
          </div>
        </div>
      )}

      {/* Display name */}
      <div className="space-y-2">
        <Label htmlFor="display-name">Nome de exibição *</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Ex: Vídeo de apresentação da clínica"
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          Nome amigável que será mostrado na interface
        </p>
      </div>

      {/* AI Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="ai-description">Quando usar esta tool *</Label>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-popover border-border">
              <p>
                A IA lê este texto para decidir QUANDO usar esta tool durante a conversa. 
                Quanto mais detalhado e específico, melhor será a decisão da IA.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          id="ai-description"
          value={aiDescription}
          onChange={(e) => onAiDescriptionChange(e.target.value)}
          placeholder="Ex: Use esta ferramenta quando o cliente quiser conhecer a clínica, pedir para ver o espaço, perguntar sobre a estrutura, ou demonstrar interesse em ver um vídeo de apresentação."
          className="min-h-[100px] bg-secondary border-border resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Descreva em quais situações a IA deve usar esta tool
          </p>
          <span className={`text-xs ${isDescriptionValid ? 'text-muted-foreground' : 'text-destructive'}`}>
            {descriptionLength}/20 mínimo
          </span>
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
        <div>
          <Label htmlFor="is-active" className="text-sm font-medium">
            Status da tool
          </Label>
          <p className="text-xs text-muted-foreground">
            Tools inativas não serão usadas pelos assistentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isActive ? 'text-success' : 'text-muted-foreground'}`}>
            {isActive ? 'Ativa' : 'Inativa'}
          </span>
          <Switch
            id="is-active"
            checked={isActive}
            onCheckedChange={onIsActiveChange}
            className="data-[state=checked]:bg-success"
          />
        </div>
      </div>
    </div>
  );
}
