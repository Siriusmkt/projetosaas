import React, { forwardRef, memo } from 'react';
import {
  MessageSquare,
  MessageCircle,
  Clock,
  XCircle,
  FileSearch,
  GitBranch,
  Wrench,
  Calendar,
  LucideIcon,
} from 'lucide-react';
import { FlowBlockType, ToolBlockType } from '@/types/flow';

interface FlowBlockIconProps {
  type: FlowBlockType;
  toolType?: ToolBlockType;
  className?: string;
  style?: React.CSSProperties;
}

const structureIcons: Record<FlowBlockType, LucideIcon> = {
  primeira_mensagem: MessageCircle,
  texto: MessageSquare,
  ramificacoes: GitBranch,
  aguardar: Clock,
  encerrar: XCircle,
  tool: Wrench,
};

/** Ícone por tipo de ferramenta (vapi_tools): agendamento, mensagem, encerramento, documento */
const toolTypeIcons: Record<string, LucideIcon> = {
  agendamento: Calendar,
  mensagem: MessageCircle,
  encerramento: XCircle,
  documento: FileSearch,
};

export const FlowBlockIcon = memo(forwardRef<SVGSVGElement, FlowBlockIconProps>(
  function FlowBlockIcon({ type, toolType, className, style }, ref) {
    let Icon: LucideIcon;
    if (type === 'tool' && toolType) {
      Icon = toolTypeIcons[String(toolType)] || Wrench;
    } else {
      Icon = structureIcons[type] || MessageSquare;
    }
    return <Icon ref={ref} className={className} style={style} />;
  }
));
