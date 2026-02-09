import { 
  Video, 
  Image, 
  Mic, 
  FileText, 
  Calendar, 
  UserCheck, 
  Link, 
  FileSearch,
  LucideIcon 
} from 'lucide-react';
import { ToolType } from '@/types/tools';

interface ToolIconProps {
  type: ToolType;
  className?: string;
  style?: React.CSSProperties;
}

const iconMap: Record<ToolType, LucideIcon> = {
  video: Video,
  imagem: Image,
  audio: Mic,
  arquivo: FileText,
  agendamento: Calendar,
  transferencia: UserCheck,
  link: Link,
  ler_documentos: FileSearch,
};

export function ToolIcon({ type, className, style }: ToolIconProps) {
  const Icon = iconMap[type] || FileText;
  return <Icon className={className} style={style} />;
}