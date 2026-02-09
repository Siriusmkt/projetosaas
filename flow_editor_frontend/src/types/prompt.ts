// Tipos para o sistema de prompts

export interface Prompt {
  id: string;
  user_id?: string;
  nome_prompt: string;
  status: 'rascunho' | 'ativo' | 'arquivado';
  created_at: string;
  updated_at: string;
}

export interface PromptIdentidade {
  id: string;
  prompt_id: string;
  nome_ia: string;
  genero: 'feminino' | 'masculino' | 'neutro';
  empresa_nome: string;
  empresa_nome_curto?: string;
  funcao: string;
  setor: string;
  personalidade?: string;
}

export interface PromptInstitucional {
  id: string;
  prompt_id: string;
  cidade?: string;
  estado?: string;
  pais: string;
  area_entrega?: string;
  nome_ceo?: string;
  tipo_produto: string;
  diferenciais: string[];
  sobre_empresa?: string;
}

export interface PromptRegra {
  id: string;
  prompt_id: string;
  regra_key: string;
  regra_nome: string;
  regra_descricao?: string;
  is_active: boolean;
  ordem: number;
}

export interface PromptGatilho {
  id: string;
  prompt_id: string;
  tipo: 'global' | 'etapa' | 'consultivo' | 'saida_rapida';
  frase_gatilho: string;
  acao: string; // 'seguir_fluxo' | 'encerrar_transferir' | 'ir_para:caminho_id' | 'ir_para_etapa:etapa_id'
  ordem: number;
}

export interface PromptScript {
  id: string;
  prompt_id: string;
  script_key: string;
  contexto: string;
  conteudo: string;
  instrucao_uso?: string;
  ordem: number;
}

export interface PromptFluxoQualificacao {
  id: string;
  prompt_id: string;
  etapa_numero: number;
  etapa_nome: string;
  contexto_gatilho?: string;
  pergunta: string;
  instrucoes_adicionais?: string;
  ordem: number;
}

export interface PromptFAQ {
  id: string;
  prompt_id: string;
  topico: string;
  palavras_chave: string[];
  resposta: string;
  ordem: number;
}

export interface PromptObjecao {
  id: string;
  prompt_id: string;
  objecao_gatilho: string;
  resposta: string;
  estrategia?: string;
  ordem: number;
}

export interface PromptConectivo {
  id: string;
  prompt_id: string;
  tipo: 'validacao' | 'concordancia' | 'transicao' | 'empatia' | 'explicacao';
  expressoes: string[];
}

export interface PromptDiferencialPorDor {
  id: string;
  prompt_id: string;
  dor_mencionada: string;
  argumento: string;
  ordem: number;
}

export interface PromptCriterioLead {
  id: string;
  prompt_id: string;
  tipo_lead: 'quente' | 'morno' | 'frio';
  criterio: string;
  acao_recomendada?: string;
  is_active: boolean;
  ordem: number;
}

export interface PromptCampoColeta {
  id: string;
  prompt_id: string;
  campo_nome: string;
  campo_descricao?: string;
  is_obrigatorio: boolean;
  ordem: number;
}

export interface PromptTom {
  id: string;
  prompt_id: string;
  usa_girias: boolean;
  usa_emojis: boolean;
  nivel_formalidade: 'formal' | 'semi-formal' | 'informal';
  proporcao_fala_escuta: string;
  posicionamento: 'consultivo' | 'vendedor' | 'suporte' | 'receptivo';
  instrucoes_adicionais?: string;
}

export interface PromptPronuncia {
  id: string;
  prompt_id: string;
  simbolo: string;
  pronuncia: string;
}

export interface PromptCompleto {
  prompt: Prompt;
  identidade: PromptIdentidade | null;
  institucional: PromptInstitucional | null;
  regras: PromptRegra[];
  gatilhos: PromptGatilho[];
  scripts: PromptScript[];
  fluxo: PromptFluxoQualificacao[];
  faq: PromptFAQ[];
  objecoes: PromptObjecao[];
  conectivos: PromptConectivo[];
  diferenciais: PromptDiferencialPorDor[];
  criterios: PromptCriterioLead[];
  coleta: PromptCampoColeta[];
  tom: PromptTom | null;
  pronuncia: PromptPronuncia[];
}

export type PromptSection = 
  | 'identidade'
  | 'empresa'
  | 'regras'
  | 'fluxo'
  | 'scripts'
  | 'faq'
  | 'objecoes'
  | 'conectivos'
  | 'diferenciais'
  | 'criterios'
  | 'coleta'
  | 'tom'
  | 'pronuncia'
  | 'preview';

export interface SectionConfig {
  id: PromptSection;
  nome: string;
  icon: string;
  required: boolean;
  description: string;
}

export const PROMPT_SECTIONS: SectionConfig[] = [
  { id: 'identidade', nome: 'Identidade da IA', icon: 'User', required: true, description: 'Defina quem é sua assistente virtual' },
  { id: 'empresa', nome: 'Dados da Empresa', icon: 'Building', required: true, description: 'Informações que a IA pode mencionar' },
  { id: 'regras', nome: 'Regras e Limites', icon: 'Shield', required: true, description: 'O que a IA NÃO pode fazer' },
  { id: 'fluxo', nome: 'Fluxo e Gatilhos', icon: 'GitBranch', required: true, description: 'Etapas e desvios da conversa' },
  { id: 'scripts', nome: 'Frases Obrigatórias', icon: 'MessageSquare', required: true, description: 'Scripts que a IA deve usar' },
  { id: 'faq', nome: 'Respostas Padrão', icon: 'HelpCircle', required: false, description: 'Respostas para perguntas frequentes' },
  { id: 'objecoes', nome: 'Tratamento de Objeções', icon: 'AlertTriangle', required: false, description: 'Como responder resistências' },
  { id: 'conectivos', nome: 'Expressões e Conectivos', icon: 'Link', required: false, description: 'Palavras que dão naturalidade' },
  { id: 'diferenciais', nome: 'Argumentos por Dor', icon: 'Target', required: false, description: 'Respostas por preocupação' },
  { id: 'criterios', nome: 'Critérios de Lead', icon: 'Filter', required: false, description: 'Como classificar leads' },
  { id: 'coleta', nome: 'Campos a Coletar', icon: 'ClipboardList', required: false, description: 'Informações a capturar' },
  { id: 'tom', nome: 'Tom e Personalidade', icon: 'Smile', required: true, description: 'Como a IA se comunica' },
  { id: 'pronuncia', nome: 'Pronúncia (Voz)', icon: 'Volume2', required: false, description: 'Para IAs de voz' },
  { id: 'preview', nome: 'Preview e Exportar', icon: 'Eye', required: false, description: 'Visualize e exporte o prompt' },
];

// Regras padrão recomendadas
export const DEFAULT_RULES: Omit<PromptRegra, 'id' | 'prompt_id'>[] = [
  {
    regra_key: 'nao_mencionar_precos',
    regra_nome: 'Não mencionar preços ou valores',
    regra_descricao: 'A IA nunca fala valores, faixas de preço ou estimativas. Sempre redireciona para time humano.',
    is_active: true,
    ordem: 0,
  },
  {
    regra_key: 'nao_capturar_dados_sensiveis',
    regra_nome: 'Não capturar dados sensíveis',
    regra_descricao: 'Não pede CPF, telefone completo, email, dados bancários. Não repete números ditados.',
    is_active: true,
    ordem: 1,
  },
  {
    regra_key: 'numeros_por_extenso',
    regra_nome: 'Números sempre por extenso',
    regra_descricao: 'Para IA de voz: "30 minutos" vira "trinta minutos", "R$ 15.000" vira "quinze mil reais".',
    is_active: true,
    ordem: 2,
  },
  {
    regra_key: 'uma_pergunta_por_vez',
    regra_nome: 'Uma pergunta por vez',
    regra_descricao: 'Nunca faz múltiplas perguntas na mesma mensagem. Aguarda resposta completa.',
    is_active: true,
    ordem: 3,
  },
  {
    regra_key: 'sem_loops_despedida',
    regra_nome: 'Sem loops de despedida',
    regra_descricao: 'Uma despedida final e encerra. Não repete "até logo" várias vezes.',
    is_active: true,
    ordem: 4,
  },
  {
    regra_key: 'sem_promessas_imediatas',
    regra_nome: 'Não prometer ações técnicas imediatas',
    regra_descricao: 'Não diz "vou transferir agora". Usa "o time vai continuar", "você receberá".',
    is_active: true,
    ordem: 5,
  },
];

// Estados brasileiros
export const ESTADOS_BRASILEIROS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];
