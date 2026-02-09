import { memo, useMemo } from 'react';
import { FLOW_LAYOUT } from '@/constants/flowLayout';
import { RotateCcw, XCircle, CornerDownRight, ArrowDown } from 'lucide-react';

// ============================================================================
// SMART CONNECTORS - Sistema de conexões inteligentes entre nodes
// ============================================================================

export interface BranchInfo {
  id: string;
  color: string;
  width: number;
  hasBlocks: boolean;
  destinationType: 'continue' | 'end' | 'loop' | 'goto';
  gotoLabel?: string;
}

// ============================================================================
// SMART MERGE CONNECTOR - Conecta APENAS branches que continuam ao merge
// ============================================================================
interface SmartMergeConnectorProps {
  branches: BranchInfo[];
  columnWidth: number;
  columnGap: number;
}
export const SmartMergeConnector = memo(function SmartMergeConnector({
  branches,
  columnWidth,
  columnGap
}: SmartMergeConnectorProps) {
  const totalWidth = branches.length * columnWidth + (branches.length - 1) * columnGap;
  const centerX = totalWidth / 2;

  // Calcular posição X de cada coluna
  const columnPositions = branches.map((_, idx) => {
    return idx * (columnWidth + columnGap) + columnWidth / 2;
  });

  // Filtrar apenas branches que continuam para o merge
  const continuingBranches = branches.map((b, idx) => ({
    ...b,
    x: columnPositions[idx],
    idx
  })).filter(b => b.destinationType === 'continue');

  // Se nenhum branch continua, não mostrar o merge
  if (continuingBranches.length === 0) {
    return null;
  }
  const svgHeight = 50;
  const mergeY = svgHeight - 12;
  const curveRadius = 12;

  // Encontrar as extremidades dos branches que continuam
  const leftMostX = Math.min(...continuingBranches.map(b => b.x));
  const rightMostX = Math.max(...continuingBranches.map(b => b.x));
  return <div className="relative flex justify-center mt-1" style={{
    width: totalWidth
  }}>
      
    </div>;
});

// ============================================================================
// BRANCH ENTRY CONNECTOR - Conector de entrada para cada branch column
// ============================================================================
interface BranchEntryConnectorProps {
  color: string;
}
export const BranchEntryConnector = memo(function BranchEntryConnector({
  color
}: BranchEntryConnectorProps) {
  return <div className="flex flex-col items-center">
      {/* Círculo de conexão com glow - ponto de entrada */}
      <div className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 relative" style={{
      backgroundColor: `${color}25`,
      borderColor: color,
      boxShadow: `0 0 8px ${color}40`
    }}>
        {/* Inner dot */}
        <div className="absolute inset-1 rounded-full" style={{
        backgroundColor: color
      }} />
      </div>
      
      {/* Linha vertical de saída */}
      <div className="w-0.5 h-4" style={{
      backgroundColor: color
    }} />
    </div>;
});

// ============================================================================
// BRANCH EXIT CONNECTOR - Conector de saída para cada branch column
// ============================================================================
interface BranchExitConnectorProps {
  color: string;
  destinationType: 'continue' | 'end' | 'loop' | 'goto';
  gotoLabel?: string;
}
export const BranchExitConnector = memo(function BranchExitConnector({
  color,
  destinationType,
  gotoLabel
}: BranchExitConnectorProps) {
  // Diferentes estilos visuais para cada tipo de destino
  const getDestinationStyle = () => {
    switch (destinationType) {
      case 'end':
        return {
          icon: <XCircle className="w-3 h-3" />,
          label: 'Encerra',
          bgColor: '#fef2f2',
          borderColor: '#ef4444',
          textColor: '#dc2626'
        };
      case 'loop':
        return {
          icon: <RotateCcw className="w-3 h-3" />,
          label: 'Volta ao início',
          bgColor: '#fffbeb',
          borderColor: '#f59e0b',
          textColor: '#d97706'
        };
      case 'goto':
        return {
          icon: <CornerDownRight className="w-3 h-3" />,
          label: gotoLabel || 'Ir para...',
          bgColor: '#eff6ff',
          borderColor: '#3b82f6',
          textColor: '#2563eb'
        };
      case 'continue':
      default:
        return {
          icon: <ArrowDown className="w-3 h-3" />,
          label: 'Continua',
          bgColor: `${color}10`,
          borderColor: color,
          textColor: color
        };
    }
  };
  const style = getDestinationStyle();
  return <div className="flex flex-col items-center mt-1">
      {/* Linha vertical antes do badge */}
      <div className="w-0.5 h-3" style={{
      backgroundColor: destinationType === 'continue' ? color : style.borderColor
    }} />
      
      {/* Badge de destino - estilizado por tipo */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border-2 shadow-sm" style={{
      borderColor: style.borderColor,
      backgroundColor: style.bgColor,
      color: style.textColor
    }}>
        {style.icon}
        <span>{style.label}</span>
      </div>
      
      {/* Linha de conexão ao merge apenas se for 'continue' */}
      {destinationType === 'continue' && <div className="w-0.5 h-4" style={{
      backgroundColor: color
    }} />}
    </div>;
});