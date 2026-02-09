// Tipos para o sistema de agentes de voz

export interface Agente {
  id: string;
  user_id?: string;
  nome: string;
  status: 'rascunho' | 'ativo' | 'arquivado';
  created_at: string;
  updated_at: string;
}

export interface AgenteIdentidade {
  id: string;
  agente_id: string;
  nome_ia: string;
  genero: 'feminino' | 'masculino' | 'neutro';
  empresa_nome: string;
  empresa_nome_curto?: string;
  funcao: string;
  setor: string;
  personalidade?: string;
}

export interface AgenteEmpresa {
  id: string;
  agente_id: string;
  cidade?: string;
  estado?: string;
  pais: string;
  setor?: string;
  area_entrega?: string;
  nome_ceo?: string;
  tipo_produto: string;
  diferenciais: string[];
  sobre_empresa?: string;
}

export interface AgenteRegra {
  id: string;
  agente_id: string;
  regra_key: string;
  regra_nome: string;
  regra_descricao?: string;
  is_active: boolean;
  ordem: number;
}

export interface AgenteGatilho {
  id: string;
  agente_id: string;
  tipo: 'consultivo' | 'saida_rapida';
  frase_gatilho: string;
  acao: string;
  ordem: number;
}

export interface AgenteFluxoEtapa {
  id: string;
  agente_id: string;
  numero: number;
  nome: string;
  pergunta_principal: string;
  variacoes: Array<{ contexto: string; pergunta: string }>;
  respostas_condicionais: Array<{ resposta: string; acao: string }>;
  campo_coleta?: string;
  instrucoes_adicionais?: string;
  contexto_gatilho?: string;
  ordem: number;
}

export interface AgenteFAQ {
  id: string;
  agente_id: string;
  topico: string;
  palavras_chave: string[];
  resposta: string;
  ordem: number;
}

export interface AgenteObjecao {
  id: string;
  agente_id: string;
  objecao_gatilho: string;
  resposta: string;
  estrategia?: string;
  ordem: number;
}

export interface AgenteCriterioLead {
  id: string;
  agente_id: string;
  tipo_lead: 'quente' | 'morno' | 'frio';
  criterio: string;
  acao_recomendada?: string;
  is_active: boolean;
  ordem: number;
}

export interface AgenteCampoColeta {
  id: string;
  agente_id: string;
  campo_nome: string;
  campo_descricao?: string;
  is_obrigatorio: boolean;
  ordem: number;
}

export interface AgenteArgumentoDor {
  id: string;
  agente_id: string;
  dor: string;
  palavras_chave: string[];
  argumento: string;
  ordem: number;
}

export interface AgenteVozConfig {
  id: string;
  agente_id: string;
  velocidade_fala: 'lento' | 'normal' | 'rapido';
  nivel_formalidade: 'formal' | 'semi-formal' | 'informal';
  posicionamento: 'consultivo' | 'vendedor' | 'suporte' | 'receptivo';
  pausas_naturais: boolean;
  usa_emojis: boolean;
  usa_girias: boolean;
  proporcao_fala_escuta: string;
  confirmacoes: string[];
  transicoes: string[];
  empatia: string[];
  concordancia: string[];
  max_perguntas_seguidas: number;
  tempo_espera_resposta: number;
  detectar_interrupcao: boolean;
  instrucoes_adicionais?: string;
}

export interface AgentePronuncia {
  id: string;
  agente_id: string;
  simbolo: string;
  pronuncia: string;
  exemplo?: string;
}

export interface AgenteScript {
  id: string;
  agente_id: string;
  script_key: string;
  contexto: string;
  conteudo: string;
  instrucao_uso?: string;
  ordem: number;
}

export interface AgenteConectivo {
  id: string;
  agente_id: string;
  tipo: 'validacao' | 'concordancia' | 'transicao' | 'empatia' | 'explicacao';
  expressoes: string[];
}

export interface AgenteCompleto {
  agente: Agente;
  identidade: AgenteIdentidade | null;
  empresa: AgenteEmpresa | null;
  regras: AgenteRegra[];
  gatilhos: AgenteGatilho[];
  fluxo: AgenteFluxoEtapa[];
  faq: AgenteFAQ[];
  objecoes: AgenteObjecao[];
  criterios: AgenteCriterioLead[];
  coleta: AgenteCampoColeta[];
  argumentos: AgenteArgumentoDor[];
  voz: AgenteVozConfig | null;
  pronuncia: AgentePronuncia[];
  scripts: AgenteScript[];
  conectivos: AgenteConectivo[];
}

// Seções do wizard
export type AgenteSection = 
  | 'identidade'
  | 'empresa'
  | 'regras'
  | 'gatilhos'
  | 'respostas'
  | 'qualificacao'
  | 'voz';

export interface AgenteSectionConfig {
  id: AgenteSection;
  nome: string;
  descricao: string;
  icon: string;
  required: boolean;
}

export const AGENTE_SECTIONS: AgenteSectionConfig[] = [
  { id: 'identidade', nome: 'Identidade', descricao: 'Quem é o agente', icon: 'User', required: true },
  { id: 'empresa', nome: 'Empresa', descricao: 'Dados da empresa', icon: 'Building2', required: true },
  { id: 'regras', nome: 'Regras', descricao: 'O que NÃO pode fazer', icon: 'Shield', required: true },
  { id: 'gatilhos', nome: 'Gatilhos', descricao: 'Quando mudar comportamento', icon: 'Zap', required: true },
  { id: 'respostas', nome: 'Respostas', descricao: 'FAQ e objeções', icon: 'MessageSquare', required: true },
  { id: 'qualificacao', nome: 'Qualificação', descricao: 'Critérios de lead', icon: 'Target', required: true },
  { id: 'voz', nome: 'Voz', descricao: 'Config específica de voz', icon: 'Volume2', required: true },
];

// Regras padrão
export const DEFAULT_AGENTE_REGRAS: Omit<AgenteRegra, 'id' | 'agente_id'>[] = [
  {
    regra_key: 'nao_mencionar_precos',
    regra_nome: 'Não mencionar preços ou valores',
    regra_descricao: 'Nunca fala valores ou estimativas. Redireciona para time humano.',
    is_active: true,
    ordem: 0,
  },
  {
    regra_key: 'nao_capturar_dados_sensiveis',
    regra_nome: 'Não capturar dados sensíveis',
    regra_descricao: 'Não pede CPF, telefone completo, email, dados bancários.',
    is_active: true,
    ordem: 1,
  },
  {
    regra_key: 'nao_promessas_imediatas',
    regra_nome: 'Não prometer ações imediatas',
    regra_descricao: 'Não diz "vou transferir agora". Usa "o time vai continuar".',
    is_active: true,
    ordem: 2,
  },
  {
    regra_key: 'numeros_por_extenso',
    regra_nome: 'Números sempre por extenso',
    regra_descricao: '"30 min" vira "trinta minutos", "R$ 15.000" vira "quinze mil reais".',
    is_active: true,
    ordem: 3,
  },
  {
    regra_key: 'uma_pergunta_por_vez',
    regra_nome: 'Uma pergunta por vez',
    regra_descricao: 'Nunca faz múltiplas perguntas na mesma mensagem.',
    is_active: true,
    ordem: 4,
  },
  {
    regra_key: 'sem_loops_despedida',
    regra_nome: 'Sem loops de despedida',
    regra_descricao: 'Uma despedida final e encerra.',
    is_active: true,
    ordem: 5,
  },
  {
    regra_key: 'sem_frases_quebradas',
    regra_nome: 'Sem frases quebradas',
    regra_descricao: 'Não corta frases no meio. Completa o pensamento.',
    is_active: true,
    ordem: 6,
  },
];

// FAQs padrão
export const DEFAULT_FAQ_TOPICS = [
  { topico: 'Preço/Valor', palavras_chave: ['preço', 'valor', 'quanto custa', 'custo'] },
  { topico: 'Frete/Entrega', palavras_chave: ['frete', 'entrega', 'prazo', 'demora'] },
  { topico: 'Pagamento', palavras_chave: ['pagamento', 'parcela', 'cartão', 'pix', 'boleto'] },
  { topico: 'Suporte/Garantia', palavras_chave: ['suporte', 'garantia', 'assistência', 'problema'] },
  { topico: 'Instagram/Catálogo', palavras_chave: ['instagram', 'catálogo', 'fotos', 'ver mais'] },
  { topico: 'Falar com Vendedor', palavras_chave: ['falar', 'vendedor', 'humano', 'pessoa'] },
];

// Objeções padrão
export const DEFAULT_OBJECOES = [
  { objecao: 'Está caro', estrategia: 'Valor vs preço' },
  { objecao: 'Vou ver outro fornecedor', estrategia: 'Diferenciação' },
  { objecao: 'Não conheço a marca', estrategia: 'Credibilidade' },
  { objecao: 'Agora não é o momento', estrategia: 'Urgência/timing' },
  { objecao: 'Preciso pensar', estrategia: 'Clarificar dúvidas' },
  { objecao: 'Só quero orçamento rápido', estrategia: 'Qualificação' },
];

// Critérios padrão por tipo de lead
export const DEFAULT_CRITERIOS_QUENTE = [
  'Projeto definido e com prazo',
  'Decisor identificado',
  'Demonstra urgência',
  'Disponível para reunião',
  'Entende o investimento necessário',
];

export const DEFAULT_CRITERIOS_MORNO = [
  'Projeto em fase inicial',
  'É influenciador, não decisor',
  'Interesse sem urgência',
  'Comparando opções',
  'Precisa mais informações',
];

export const DEFAULT_CRITERIOS_FRIO = [
  'Apenas curiosidade',
  'Sem poder de decisão',
  'Resistência clara',
  'Só quer preço sem contexto',
  'Perfil incompatível',
];

// Pronúncias padrão
export const DEFAULT_PRONUNCIAS: Omit<AgentePronuncia, 'id' | 'agente_id'>[] = [
  { simbolo: '%', pronuncia: 'por cento', exemplo: '"50%" → "cinquenta por cento"' },
  { simbolo: 'R$', pronuncia: 'reais', exemplo: '"R$ 15.000" → "quinze mil reais"' },
  { simbolo: 'kg', pronuncia: 'quilos', exemplo: '"100kg" → "cem quilos"' },
  { simbolo: 'm²', pronuncia: 'metros quadrados', exemplo: '"50m²" → "cinquenta metros quadrados"' },
  { simbolo: '@', pronuncia: 'arroba', exemplo: '"@empresa" → "arroba empresa"' },
  { simbolo: 'min', pronuncia: 'minutos', exemplo: '"30min" → "trinta minutos"' },
];

// Validação do agente
export interface AgenteValidation {
  isValid: boolean;
  completedSections: AgenteSection[];
  missingSections: AgenteSection[];
  errors: { section: AgenteSection; message: string }[];
  progress: number;
}

export function validateAgente(agente: AgenteCompleto): AgenteValidation {
  const errors: { section: AgenteSection; message: string }[] = [];
  const completedSections: AgenteSection[] = [];
  const missingSections: AgenteSection[] = [];

  // 1. Identidade
  if (agente.identidade?.nome_ia && agente.identidade?.genero && agente.identidade?.funcao) {
    completedSections.push('identidade');
  } else {
    missingSections.push('identidade');
    errors.push({ section: 'identidade', message: 'Preencha nome, gênero e função' });
  }

  // 2. Empresa
  if (agente.empresa?.tipo_produto && (agente.empresa?.diferenciais?.length || 0) >= 1) {
    completedSections.push('empresa');
  } else {
    missingSections.push('empresa');
    errors.push({ section: 'empresa', message: 'Informe o que vende e pelo menos 1 diferencial' });
  }

  // 3. Regras
  const activeRules = agente.regras.filter(r => r.is_active);
  if (activeRules.length >= 3) {
    completedSections.push('regras');
  } else {
    missingSections.push('regras');
    errors.push({ section: 'regras', message: 'Ative pelo menos 3 regras' });
  }

  // 4. Gatilhos
  const consultivos = agente.gatilhos.filter(g => g.tipo === 'consultivo');
  const saidaRapida = agente.gatilhos.filter(g => g.tipo === 'saida_rapida');
  if (consultivos.length >= 3 && saidaRapida.length >= 3) {
    completedSections.push('gatilhos');
  } else {
    missingSections.push('gatilhos');
    errors.push({ section: 'gatilhos', message: 'Mínimo 3 gatilhos consultivos e 3 de saída rápida' });
  }

  // 5. Respostas (FAQ + Objeções)
  if (agente.faq.length >= 3 && agente.objecoes.length >= 3) {
    completedSections.push('respostas');
  } else {
    missingSections.push('respostas');
    errors.push({ section: 'respostas', message: 'Mínimo 3 FAQs e 3 objeções' });
  }

  // 6. Qualificação
  const quentes = agente.criterios.filter(c => c.tipo_lead === 'quente' && c.is_active);
  if (quentes.length >= 1) {
    completedSections.push('qualificacao');
  } else {
    missingSections.push('qualificacao');
    errors.push({ section: 'qualificacao', message: 'Defina critérios para leads quentes' });
  }

  // 7. Voz
  if (agente.voz) {
    completedSections.push('voz');
  } else {
    missingSections.push('voz');
    errors.push({ section: 'voz', message: 'Configure as opções de voz' });
  }

  const progress = Math.round((completedSections.length / 7) * 100);

  return {
    isValid: missingSections.length === 0,
    completedSections,
    missingSections,
    errors,
    progress,
  };
}

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
