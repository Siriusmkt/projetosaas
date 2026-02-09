// Flow Layout Constants
// Regras de espaçamento e cores para condições IF/ELSE

export const FLOW_LAYOUT = {
  // Espaçamento
  COLUMN_WIDTH: 360,           // Largura de cada coluna (deve acomodar NODE_WIDTH + padding)
  MIN_HORIZONTAL_GAP: 200,     // Distância mínima entre caminhos SIM/NÃO
  VERTICAL_GAP: 80,            // Distância entre nós verticalmente
  CONDITION_SPREAD: 250,       // Distância do centro para cada lado na condição
  
  // Tamanhos de nós
  NODE_WIDTH: 320,             // Largura padrão dos nós
  NODE_WIDTH_EXPANDED: 400,    // Largura dos nós expandidos
  NODE_MIN_HEIGHT: 100,
  BADGE_WIDTH: 120,
  BADGE_HEIGHT: 32,
  MERGE_SIZE: 24,
  
  // Cores (design system)
  COLORS: {
    SIM: '#22c55e',        // Verde para caminho SIM
    NAO: '#ef4444',        // Vermelho para caminho NÃO
    NORMAL: '#94a3b8',     // Cinza para conexões normais
    MERGE: '#64748b',      // Cinza escuro para merge
    CONDITION: '#8b5cf6',  // Roxo para condição
    CONDITION_BG: '#f3e8ff', // Background roxo claro
  },
  
  // Espessura das linhas
  LINE_WIDTH: 2,
  
  // Tamanhos do merge
  MERGE_NODE_SIZE: 24,       // Tamanho do círculo de merge
  MERGE_BORDER_WIDTH: 3,
  
  // Indentação para condições aninhadas
  NESTED_INDENT_REDUCTION: 40, // Reduz o spread em cada nível
} as const;

// Tipo para os tipos de branch
export type BranchType = 'yes' | 'no';

// Função helper para obter cor do branch
export const getBranchColor = (branchType: BranchType): string => {
  return branchType === 'yes' ? FLOW_LAYOUT.COLORS.SIM : FLOW_LAYOUT.COLORS.NAO;
};

// Função helper para calcular largura do junction baseado no nível de aninhamento
export const getJunctionWidth = (depth: number = 0): number => {
  const baseWidth = FLOW_LAYOUT.MIN_HORIZONTAL_GAP + (FLOW_LAYOUT.COLUMN_WIDTH * 2);
  return Math.max(baseWidth - (depth * FLOW_LAYOUT.NESTED_INDENT_REDUCTION * 2), 300);
};
