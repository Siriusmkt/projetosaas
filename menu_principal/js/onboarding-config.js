/**
 * Configuração de Tooltips por Página
 * Mapeamento completo de todos os tooltips do sistema
 * 
 * IMPORTANTE: NÃO MEXER NO BANCO DE DADOS SUPABASE
 * Todo controle é feito via localStorage/sessionStorage apenas
 * 
 * Para adicionar novos tooltips, edite o array ONBOARDING_TOOLTIPS abaixo
 */

// Biblioteca de ícones SVG profissionais
const ONBOARDING_ICONS = {
    insights: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    filter: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    assistant: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    phone: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    create: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
    campaign: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>',
    call: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    card: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
    followup: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    add: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    time: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    target: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
    save: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    message: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    export: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    contact: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    import: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    whatsapp: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    send: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    webhook: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    test: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    copy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    number: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    buy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    help: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    support: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    rocket: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    disconnect: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>'
};

const ONBOARDING_TOOLTIPS = [
    // ========== DASHBOARD ==========
    {
        id: 'tooltip_dashboard_welcome',
        page: 'dashboard',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo ao Dashboard!',
        text: 'Este é o seu painel de controle completo. Aqui você acompanha todas as métricas das suas campanhas, analisa o desempenho dos seus assistentes e toma decisões baseadas em dados. Vamos te guiar pelos principais recursos!'
    },
    {
        id: 'tooltip_dashboard_1',
        page: 'dashboard',
        selector: '#minutesUsed, .minutes-usage',
        position: 'bottom',
        icon: 'time',
        title: 'Minutos de Uso',
        text: 'Acompanhe quantos minutos você já utilizou do seu plano. Este é o consumo total das suas ligações.'
    },
    {
        id: 'tooltip_dashboard_2',
        page: 'dashboard',
        selector: 'button.insights-btn',
        position: 'bottom',
        icon: 'insights',
        title: 'Grazi Insights - IA',
        text: 'A Grazi é sua assistente de IA que fornece análises inteligentes das suas métricas e sugestões personalizadas.',
        showArrowAfter: true // Mostrar seta animada após este tooltip
    },
    {
        id: 'tooltip_dashboard_2a',
        page: 'dashboard',
        selector: '#insightsPopup .insights-chat-section',
        position: 'right',
        icon: 'chat',
        title: 'Chat com a Grazi',
        text: 'Aqui você pode conversar diretamente com a Grazi. Faça perguntas sobre suas métricas, peça análises e receba insights personalizados em tempo real.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2b',
        page: 'dashboard',
        selector: '#insightsPopup .insights-questions-section, .insights-quick-questions',
        position: 'left',
        icon: 'target',
        title: 'Perguntas Rápidas',
        text: 'Use estas perguntas rápidas para obter insights instantâneos sobre suas métricas. Clique em qualquer uma para ver a resposta da Grazi.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2c',
        page: 'dashboard',
        selector: '#insightsPopup #section-geral',
        position: 'bottom',
        icon: 'insights',
        title: 'Geral',
        text: 'Aqui você vê uma visão geral consolidada de todas as suas métricas principais. A Grazi analisa seus dados e apresenta insights gerais sobre o desempenho.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2d',
        page: 'dashboard',
        selector: '#insightsPopup #section-calls',
        position: 'bottom',
        icon: 'phone',
        title: 'Ligações',
        text: 'Análise detalhada das suas ligações: taxa de conexão, duração média, horários de pico e recomendações para melhorar seus resultados.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2e',
        page: 'dashboard',
        selector: '#insightsPopup #section-conversas',
        position: 'bottom',
        icon: 'message',
        title: 'Conversas',
        text: 'Insights sobre suas conversas: volume de mensagens, taxa de resposta, engajamento e padrões de comunicação identificados pela IA.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2f',
        page: 'dashboard',
        selector: '#insightsPopup #section-agendamentos',
        position: 'bottom',
        icon: 'calendar',
        title: 'Agendamentos',
        text: 'Análise dos seus agendamentos: taxa de confirmação, horários mais solicitados, padrões de cancelamento e sugestões de otimização.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2g',
        page: 'dashboard',
        selector: '#insightsPopup #section-consideracoes',
        position: 'bottom',
        icon: 'help',
        title: 'Considerações Finais',
        text: 'Aqui a Grazi apresenta considerações finais, recomendações estratégicas e próximos passos baseados na análise completa dos seus dados.',
        requiresGraziOpen: true
    },
    {
        id: 'tooltip_dashboard_2h',
        page: 'dashboard',
        selector: '#insightsPopup .insights-close-btn',
        position: 'bottom',
        icon: 'close',
        title: 'Fechar Grazi',
        text: 'Após explorar a Grazi, clique aqui para fechar e continuar o tutorial do dashboard.',
        requiresGraziOpen: true,
        closeGraziAndContinue: true
    },
    {
        id: 'tooltip_dashboard_3',
        page: 'dashboard',
        selector: '#periodFilter, .filters-section select:first-of-type',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtrar Período',
        text: 'Use este filtro para ver suas métricas de hoje, ontem, últimos 7 ou 30 dias.'
    },
    {
        id: 'tooltip_dashboard_4',
        page: 'dashboard',
        selector: '#assistantFilter',
        position: 'bottom',
        icon: 'assistant',
        title: 'Filtrar por Assistente',
        text: 'Filtre as métricas por um assistente específico para análises detalhadas.'
    },
    {
        id: 'tooltip_dashboard_9',
        page: 'dashboard',
        selector: '#callsLabel, .kpi-card.with-chart .kpi-header',
        position: 'bottom',
        icon: 'phone',
        title: 'Total de Chamadas',
        text: 'Aqui você vê o total de ligações realizadas com gráfico de evolução. Este é o seu principal indicador de volume.'
    },
    {
        id: 'tooltip_dashboard_5',
        page: 'dashboard',
        selector: '#kpiTotalCost',
        position: 'bottom',
        icon: 'buy',
        title: 'Custo Total',
        text: 'Veja quanto você gastou com ligações no período selecionado. Este valor considera todos os custos de chamadas.'
    },
    {
        id: 'tooltip_dashboard_6',
        page: 'dashboard',
        selector: '#kpiTotalMinutes',
        position: 'bottom',
        icon: 'time',
        title: 'Total de Minutos',
        text: 'Acompanhe quantos minutos foram utilizados nas ligações. Importante para monitorar seu plano de minutos.'
    },
    {
        id: 'tooltip_dashboard_7',
        page: 'dashboard',
        selector: '#kpiSuccessRate',
        position: 'bottom',
        icon: 'target',
        title: 'Taxa de Sucesso',
        text: 'Veja a porcentagem de ligações que foram bem-sucedidas. Quanto maior, melhor o desempenho dos seus assistentes.'
    },
    {
        id: 'tooltip_dashboard_8',
        page: 'dashboard',
        selector: '#kpiAvgDuration',
        position: 'bottom',
        icon: 'time',
        title: 'Duração Média',
        text: 'Tempo médio das suas ligações. Ajuda a entender a qualidade das conversas e engajamento dos leads.'
    },
    {
        id: 'tooltip_dashboard_10',
        page: 'dashboard',
        selector: '#callsByType, .metric-card:first-child h3.metric-title',
        position: 'bottom',
        icon: 'phone',
        title: 'Chamadas por Tipo',
        text: 'Veja a distribuição das suas chamadas por tipo (atendida, não atendida, ocupado, etc).'
    },
    {
        id: 'tooltip_dashboard_11',
        page: 'dashboard',
        selector: '#assistantPerformance, .metric-card:last-child h3.metric-title',
        position: 'bottom',
        icon: 'assistant',
        title: 'Performance por Assistente',
        text: 'Compare o desempenho de cada assistente. Veja quantas ligações cada um fez e sua taxa de sucesso.',
        nextPage: '../campanhas/criar-campanhas.html'
    },

    // ========== DASHBOARD (PÁGINA DE TESTE DO TOUR) ==========
    // Tooltips duplicados para funcionar na página de teste do tour
    // Quando a página é detectada como 'dashboard' (incluindo via onboarding-tutorial-demo.html),
    // estes tooltips também serão exibidos
    {
        id: 'tooltip_dashboard_demo_welcome',
        page: 'dashboard',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo ao Dashboard!',
        text: 'Este é o seu painel de controle completo. Aqui você acompanha todas as métricas das suas campanhas, analisa o desempenho dos seus assistentes e toma decisões baseadas em dados. Vamos te guiar pelos principais recursos!'
    },
    {
        id: 'tooltip_dashboard_demo_1',
        page: 'dashboard',
        selector: '#minutesUsed, .minutes-usage',
        position: 'bottom',
        icon: 'time',
        title: 'Minutos de Uso',
        text: 'Acompanhe quantos minutos você já utilizou do seu plano. Este é o consumo total das suas ligações.'
    },
    {
        id: 'tooltip_dashboard_demo_2',
        page: 'dashboard',
        selector: 'button.insights-btn, #graziInsightsBtn',
        position: 'bottom',
        icon: 'insights',
        title: 'Grazi Insights - IA',
        text: 'A Grazi é sua assistente de IA que fornece análises inteligentes das suas métricas e sugestões personalizadas. Clique no botão para abrir.',
        showArrowAfter: true,
        requiresGraziOpen: false // Tooltip aparece ANTES de abrir, então não requer Grazi aberta ainda
    },
    {
        id: 'tooltip_dashboard_demo_3',
        page: 'dashboard',
        selector: '#periodFilter, .filters-section select:first-of-type, .filter-select:first-of-type',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtrar Período',
        text: 'Use este filtro para ver suas métricas de hoje, ontem, últimos 7 ou 30 dias. (Na versão de teste, os dados são fixos para demonstração)'
    },
    {
        id: 'tooltip_dashboard_demo_4',
        page: 'dashboard',
        selector: '#assistantFilter, .filters-section select:last-of-type, .filter-select:last-of-type',
        position: 'bottom',
        icon: 'assistant',
        title: 'Filtrar por Assistente',
        text: 'Filtre as métricas por um assistente específico para análises detalhadas. (Na versão de teste, os dados são fixos para demonstração)'
    },
    {
        id: 'tooltip_dashboard_demo_9',
        page: 'dashboard',
        selector: '#callsLabel, .kpi-card.with-chart .kpi-header, .kpi-card:first-child .kpi-header',
        position: 'bottom',
        icon: 'phone',
        title: 'Total de Chamadas',
        text: 'Aqui você vê o total de ligações realizadas com gráfico de evolução. Este é o seu principal indicador de volume.'
    },
    {
        id: 'tooltip_dashboard_demo_5',
        page: 'dashboard',
        selector: '#kpiTotalCost, .kpi-card:nth-child(2) .kpi-header',
        position: 'bottom',
        icon: 'buy',
        title: 'Custo Total',
        text: 'Veja quanto você gastou com ligações no período selecionado. Este valor considera todos os custos de chamadas.'
    },
    {
        id: 'tooltip_dashboard_demo_6',
        page: 'dashboard',
        selector: '#kpiTotalMinutes, .kpi-card:nth-child(3) .kpi-header',
        position: 'bottom',
        icon: 'time',
        title: 'Total de Minutos',
        text: 'Acompanhe quantos minutos foram utilizados nas ligações. Importante para monitorar seu plano de minutos.'
    },
    {
        id: 'tooltip_dashboard_demo_7',
        page: 'dashboard',
        selector: '#kpiSuccessRate, .kpi-card:nth-child(4) .kpi-header',
        position: 'bottom',
        icon: 'target',
        title: 'Taxa de Sucesso',
        text: 'Veja a porcentagem de ligações que foram bem-sucedidas. Quanto maior, melhor o desempenho dos seus assistentes.'
    },
    {
        id: 'tooltip_dashboard_demo_8',
        page: 'dashboard',
        selector: '#kpiAvgDuration, .kpi-card:nth-child(5) .kpi-header',
        position: 'bottom',
        icon: 'time',
        title: 'Duração Média',
        text: 'Tempo médio das suas ligações. Ajuda a entender a qualidade das conversas e engajamento dos leads.'
    },
    {
        id: 'tooltip_dashboard_demo_10',
        page: 'dashboard',
        selector: '.metric-card:first-child .metric-header, .metric-card:first-child h3.metric-title',
        position: 'top',
        icon: 'phone',
        title: 'Chamadas por Tipo',
        text: 'Veja a distribuição das suas chamadas por tipo (atendida, não atendida, ocupado, etc).'
    },
    {
        id: 'tooltip_dashboard_demo_11',
        page: 'dashboard',
        selector: '.metric-card:last-child .metric-header, .metric-card:last-child h3.metric-title',
        position: 'top',
        icon: 'assistant',
        title: 'Performance por Assistente',
        text: 'Compare o desempenho de cada assistente. Veja quantas ligações cada um fez e sua taxa de sucesso.'
    },
    {
        id: 'tooltip_dashboard_demo_12',
        page: 'dashboard',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Tutorial Concluído!',
        text: 'Você concluiu o tour do Dashboard! Deseja continuar para o tutorial de Campanhas ou voltar ao sistema?',
        showFinalOptions: true,
        nextPage: 'onboarding-tutorial-demo-campanhas.html'
    },

    // ========== CAMPANHAS ==========
    {
        id: 'tooltip_campanhas_welcome',
        page: 'campanhas',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo às Campanhas!',
        text: 'Aqui você cria e gerencia suas campanhas de prospecção. Crie campanhas, escolha assistentes, defina follow-ups e acompanhe o desempenho. Vamos te guiar pelos principais recursos!'
    },
    // ========== SELECIONA ASSISTENTE (CAMPANHAS) ==========
    {
        id: 'tooltip_seleciona_assistente_1',
        page: 'seleciona-assistente',
        selector: 'h1.title, .header .title',
        position: 'center',
        icon: 'assistant',
        title: 'Selecione seus Assistentes',
        text: 'Agora você vai escolher qual assistente virtual e qual número usar para sua campanha. Selecione um assistente e um número disponível.'
    },
    {
        id: 'tooltip_seleciona_assistente_2',
        page: 'seleciona-assistente',
        selector: '#assistantsList .item-card:first-child',
        position: 'right',
        icon: 'assistant',
        title: 'Assistentes Disponíveis',
        text: 'Escolha um assistente virtual para sua campanha. Cada assistente tem sua própria personalidade e voz. Clique em um card para selecioná-lo.'
    },
    {
        id: 'tooltip_seleciona_assistente_3',
        page: 'seleciona-assistente',
        selector: '#numbersList .item-card:first-child',
        position: 'right',
        icon: 'phone',
        title: 'Números Disponíveis',
        text: 'Selecione um número VoIP conectado ao provider que será usado para fazer as ligações. Certifique-se de que o número está ativo.'
    },
    {
        id: 'tooltip_seleciona_assistente_4',
        page: 'seleciona-assistente',
        selector: '#continueButton',
        position: 'top',
        icon: 'arrow-right',
        title: 'Continuar',
        text: 'Após selecionar um assistente e um número, clique em "Ver Tutorial de Follow-up" para aprender sobre sequências automatizadas de contato.',
        nextPage: '../follow-up/criar_follow-up.html',
        customOffset: { top: -100 } // Ajuste para ficar mais acima e não cortar na tela
    },
    {
        id: 'tooltip_campanhas_3',
        page: 'campanhas',
        selector: '#totalAttempted',
        position: 'bottom',
        icon: 'phone',
        title: 'Total de Tentativas',
        text: 'Veja quantas ligações foram tentadas em todas as suas campanhas. Este é o volume total de leads chamados.'
    },
    {
        id: 'tooltip_campanhas_4',
        page: 'campanhas',
        selector: '#connectedCalls',
        position: 'bottom',
        icon: 'phone',
        title: 'Chamadas Conectadas',
        text: 'Acompanhe quantas ligações foram conectadas com sucesso e a taxa de conexão das suas campanhas.'
    },
    {
        id: 'tooltip_campanhas_5',
        page: 'campanhas',
        selector: '#completedCalls',
        position: 'bottom',
        icon: 'target',
        title: 'Chamadas Completas',
        text: 'Veja quantas ligações foram completadas com sucesso e a taxa de conversão das suas campanhas.'
    },
    {
        id: 'tooltip_campanhas_5b',
        page: 'campanhas',
        selector: '.status-inline, #activeCampaigns',
        position: 'bottom',
        icon: 'card',
        title: 'Status das Campanhas',
        text: 'Acompanhe o status de todas as suas campanhas: quantas estão ativas, pausadas ou finalizadas. Isso ajuda a gerenciar melhor suas operações.'
    },
    {
        id: 'tooltip_campanhas_6',
        page: 'campanhas',
        selector: '.campaigns-filters .filter-btn:first-child',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtrar Campanhas',
        text: 'Use estes filtros para ver todas as campanhas, apenas as ativas, pausadas ou finalizadas.'
    },
    {
        id: 'tooltip_campanhas_7',
        page: 'campanhas',
        selector: '#campaignsGrid .campaign-card:first-child',
        position: 'bottom',
        icon: 'campaign',
        title: 'Suas Campanhas',
        text: 'Aqui aparecem todas as suas campanhas. Clique em uma para ver detalhes, pausar, retomar ou editar. Clique em "Próximo" para conhecer as funcionalidades de ligação e criação de campanhas.',
        continueToActions: true // Flag especial para continuar com tooltips de ações
    },
    {
        id: 'tooltip_campanhas_1',
        page: 'campanhas',
        selector: 'button[onclick*="openCallNowModal"]',
        position: 'right',
        icon: 'call',
        title: 'Ligue Agora',
        text: 'Use este botão para fazer uma ligação imediata. Selecione o assistente e digite o número para ligar na hora!',
        showArrowAfter: true,
        targetButtonSelector: 'button[onclick*="openCallNowModal"]',
        requiresModalOpen: true,
        modalId: 'callNowModal'
    },
    {
        id: 'tooltip_campanhas_1a',
        page: 'campanhas',
        selector: '#callNowModal #callAssistantSelect',
        position: 'bottom',
        icon: 'assistant',
        title: 'Selecionar Assistente',
        text: 'Escolha qual assistente virtual irá fazer a ligação. Cada assistente tem sua própria personalidade e voz.',
        requiresModalOpen: true,
        modalId: 'callNowModal'
    },
    {
        id: 'tooltip_campanhas_1b',
        page: 'campanhas',
        selector: '#callNowModal #callAssistantNumberSelect',
        position: 'bottom',
        icon: 'phone',
        title: 'Número da Assistente',
        text: 'Selecione o número VoIP conectado ao provider que será usado para fazer a ligação. Certifique-se de que o número está ativo.',
        requiresModalOpen: true,
        modalId: 'callNowModal'
    },
    {
        id: 'tooltip_campanhas_1c',
        page: 'campanhas',
        selector: '#callNowModal #callLeadNumberInput',
        position: 'bottom',
        icon: 'phone',
        title: 'Número do Lead',
        text: 'Digite o número de telefone do lead que você deseja ligar. O número será formatado automaticamente.',
        requiresModalOpen: true,
        modalId: 'callNowModal'
    },
    {
        id: 'tooltip_campanhas_1d',
        page: 'campanhas',
        selector: '#callNowModal #callNowSubmitBtn',
        position: 'right',
        icon: 'call',
        title: 'Iniciar Ligação',
        text: 'Após preencher todos os campos, clique aqui para iniciar a ligação imediatamente. A assistente virtual fará a chamada.',
        requiresModalOpen: true,
        modalId: 'callNowModal'
    },
    {
        id: 'tooltip_campanhas_1e',
        page: 'campanhas',
        selector: '#callNowModal .call-now-close',
        position: 'left',
        icon: 'close',
        title: 'Fechar Modal',
        text: 'Clique aqui para fechar o modal e voltar à tela de campanhas.',
        requiresModalOpen: true,
        modalId: 'callNowModal',
        closeModalAndContinue: true
    },
    {
        id: 'tooltip_campanhas_2',
        page: 'campanhas',
        selector: 'button[onclick*="createCampaign"]',
        position: 'right',
        icon: 'create',
        title: 'Nova Campanha',
        text: 'Aqui você cria uma nova campanha de prospecção. Você vai escolher assistente, follow-up e subir sua lista de leads. Clique em "Próximo" para continuar.',
        nextPage: 'seleciona-assistente.html'
    },

    // ========== ASSISTENTES ==========
    {
        id: 'tooltip_assistentes_welcome',
        page: 'assistentes',
        selector: 'body',
        position: 'center',
        icon: 'assistant',
        title: 'Bem-vindo aos Assistentes!',
        text: 'Aqui você cria e gerencia seus assistentes de IA para conversação. Você verá o total de assistentes, quantos estão ativos e o total de calls realizadas. Abaixo, seus assistentes ativos aparecerão visualmente. Vamos te guiar!',
        requiresModalOpen: true
    },
    {
        id: 'tooltip_assistentes_1',
        page: 'assistentes',
        selector: '.stats-container, .stat-card',
        position: 'top',
        icon: 'card',
        title: 'Estatísticas',
        text: 'Aqui você vê o total de assistentes criados, quantos estão ativos no momento e o total de calls realizadas. Essas métricas ajudam a acompanhar o desempenho.',
        requiresModalOpen: true
    },
    {
        id: 'tooltip_assistentes_2',
        page: 'assistentes',
        selector: '.section-header h2, h2:contains("Assistentes Ativos")',
        position: 'top',
        icon: 'assistant',
        title: 'Assistentes Ativos',
        text: 'Abaixo você verá todos os seus assistentes ativos visualmente. Cada card mostra informações do assistente e permite editar, testar voz e ver estatísticas.',
        requiresModalOpen: true
    },
    {
        id: 'tooltip_assistentes_3',
        page: 'assistentes',
        selector: '.create-btn, button[onclick="abrirModalCriar()"]',
        position: 'left',
        icon: 'add',
        title: 'Criar Assistente',
        text: 'Clique aqui para criar um novo assistente de IA. Vamos te mostrar o processo passo a passo!',
        showArrowAfter: true,
        targetButtonSelector: '.create-btn, button[onclick="abrirModalCriar()"]',
        requiresModalOpen: true,
        modalId: 'createModal'
    },
    {
        id: 'tooltip_assistentes_4',
        page: 'assistentes',
        selector: '#createModal #createAssistenteName',
        position: 'bottom',
        icon: 'create',
        title: 'Nome do Assistente',
        text: 'Aqui você preenche o nome do seu assistente (ex: Sofia - Vendas). Este campo identifica seu assistente no sistema.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_5',
        page: 'assistentes',
        selector: '#createModal #createFirstMessage',
        position: 'bottom',
        icon: 'message',
        title: 'Primeira Mensagem',
        text: 'Aqui você preenche a primeira mensagem que o assistente enviará ao iniciar uma conversa. É a apresentação inicial do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_5a',
        page: 'assistentes',
        selector: '#createModal #createPhoneNumber',
        position: 'bottom',
        icon: 'phone',
        title: 'Número de Telefone',
        text: 'Selecione o número de telefone que será usado pelo assistente para fazer ligações e enviar mensagens. Você precisa ter números cadastrados em "Conexões" para aparecerem aqui.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_5b',
        page: 'assistentes',
        selector: '#createModal #wizardStep2_1 button[onclick*="selectGender"]',
        position: 'top',
        icon: 'user',
        title: 'Escolha o Gênero',
        text: 'Selecione o gênero que melhor representa seu assistente: Feminino ou Masculino. Isso define a voz e a personalidade do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_5c',
        page: 'assistentes',
        selector: '#createModal #wizardStep2_2 .color-option',
        position: 'top',
        icon: 'eye',
        title: 'Cor dos Olhos',
        text: 'Escolha a cor dos olhos do seu assistente: Azul, Castanho, Verde, Mel ou Cinza. Isso personaliza a aparência visual do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_5d',
        page: 'assistentes',
        selector: '#createModal #wizardStep2_3 .color-option',
        position: 'top',
        icon: 'hair',
        title: 'Cor do Cabelo',
        text: 'Escolha a cor do cabelo do seu assistente: Loira, Morena, Ruiva, Castanha ou Preta. Isso completa a personalização visual do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6',
        page: 'assistentes',
        selector: '#createModal #avatarPersonalidade, #createModal #wizardStep2_4',
        position: 'bottom',
        icon: 'settings',
        title: 'Personalidade e Identidade Visual',
        text: 'Descreva as características do seu assistente (ex: Empática, profissional, carismática, amigável). Você também pode escolher se deseja usar a identidade visual da sua empresa. Essas informações ajudam a personalizar completamente o comportamento e a aparência do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6a',
        page: 'assistentes',
        selector: '#createModal #gerarAvatarBtn, #createModal button[onclick*="gerarAvatares"]',
        position: 'top',
        icon: 'create',
        title: 'Gerar Avatar',
        text: 'Após preencher todas as personalizações visuais (gênero, cor dos olhos, cor do cabelo e personalidade), clique em "Gerar Assistente" para gerar os avatares. Você poderá escolher entre os avatares gerados.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6b',
        page: 'assistentes',
        selector: '#createModal #avatarsContainer .avatar-card, #createModal .avatars-container .avatar-card',
        position: 'top',
        icon: 'image',
        title: 'Escolher Avatar',
        text: 'Escolha um dos avatares gerados que melhor representa seu assistente. Clique no avatar desejado para selecioná-lo e continuar.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6c',
        page: 'assistentes',
        selector: '#createModal #wizardStep3 .voices-grid, #createModal #voicesGrid',
        position: 'top',
        icon: 'voice',
        title: 'Seleção de Voz',
        text: 'Escolha a voz do seu assistente. As vozes disponíveis são filtradas pelo gênero selecionado anteriormente. Você pode ouvir uma prévia de cada voz antes de escolher.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6d',
        page: 'assistentes',
        selector: '#createModal #wizardStep4, #createModal #promptMethodChoice',
        position: 'top',
        icon: 'settings',
        title: 'Criação do Prompt',
        text: 'Escolha como deseja criar o prompt do assistente: escrever manualmente ou usar a IA para gerar automaticamente. O prompt define o comportamento e as respostas do assistente durante as conversas.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_6e',
        page: 'assistentes',
        selector: '#createModal #createSuccessEvaluation, #createModal #wizardStep4_5',
        position: 'bottom',
        icon: 'settings',
        title: 'Configurações Avançadas',
        text: 'Defina o critério de avaliação de sucesso (o que seria considerado uma chamada bem-sucedida), configure o modo de início da chamada, o prompt de resumo e outras opções avançadas para personalizar o comportamento do assistente.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_7',
        page: 'assistentes',
        selector: '#createModal #saveCreateBtn, #createModal button[onclick*="handleCreateAssistantClick"]',
        position: 'top',
        icon: 'create',
        title: 'Criar Assistente',
        text: 'Revise todas as informações na tela de revisão. Se estiver tudo correto, clique em "Criar Assistente" para finalizar a criação. O assistente será criado e aparecerá na aba de assistentes ativos, onde você poderá editá-lo, testar a voz, ver estatísticas ou excluí-lo quando necessário.',
        requiresModalOpen: true,
        modalId: 'createModal',
        skipValidation: true
    },
    {
        id: 'tooltip_assistentes_8',
        page: 'assistentes',
        selector: '.assistente-card:first-child, #assistentesGrid .assistente-card:first-child',
        position: 'top',
        icon: 'assistant',
        title: 'Assistente Criado',
        text: 'Aqui está seu assistente criado! Ele aparecerá na lista de assistentes ativos. Você pode clicar nele para editar configurações, testar a voz, ver estatísticas de performance ou excluí-lo se necessário. Todos os assistentes criados ficam organizados nesta aba.',
        requiresModalOpen: false,
        nextPage: '../conversas/contatos.html'
    },

    // ========== FOLLOW-UP ==========
    {
        id: 'tooltip_followup_welcome',
        page: 'follow-up',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo aos Follow-ups!',
        text: 'Aqui você cria sequências automatizadas de ações para manter contato com seus leads. Configure ligações, mensagens e agendamentos em sequência. Vamos te mostrar como funciona!'
    },
    {
        id: 'tooltip_followup_1',
        page: 'follow-up',
        selector: '#followupName',
        position: 'bottom',
        icon: 'create',
        title: 'Nome do Follow-up',
        text: 'Dê um nome descritivo para seu follow-up. Isso ajuda a identificar e organizar suas sequências de contato.'
    },
    {
        id: 'tooltip_followup_2',
        page: 'follow-up',
        selector: '#followupToggle, .toggle-switch',
        position: 'bottom',
        icon: 'settings',
        title: 'Tipo de Follow-up',
        text: 'Escolha entre Webhook (para campanhas de prospecção) ou WhatsApp (para leads que chegam via formulário). Cada tipo tem estratégias diferentes.'
    },
    {
        id: 'tooltip_followup_4',
        page: 'follow-up',
        selector: 'button[onclick*="openModal(\'d0_primeiro_contato\')"], .d0-option-btn[onclick*="d0_primeiro_contato"]',
        position: 'right',
        icon: 'target',
        title: 'Primeiro Contato',
        text: 'Configure o primeiro contato imediato após o cadastro. Clique em "Configurar Follow-up" para escolher entre mensagem, ligação ou ambos.',
        showArrowAfter: true,
        targetButtonSelector: 'button[onclick*="openModal(\'d0_primeiro_contato\')"], .d0-option-btn[onclick*="d0_primeiro_contato"]',
        requiresModalOpen: true,
        modalId: 'd0Modal'
    },
    // Tooltips dentro do modal D0 - Primeiro Contato
    {
        id: 'tooltip_followup_4a',
        page: 'follow-up',
        selector: '#d0Modal .strategy-option[data-strategy="both"]',
        position: 'bottom',
        icon: 'message',
        title: 'Mensagem + Ligação',
        text: 'Esta é a estratégia recomendada! Envia uma mensagem primeiro e depois faz a ligação. Aumenta muito a taxa de conexão.',
        requiresModalOpen: true,
        modalId: 'd0Modal',
        autoClick: true,
        clickSelector: '#d0Modal .strategy-option[data-strategy="both"]'
    },
    {
        id: 'tooltip_followup_4b',
        page: 'follow-up',
        selector: '#d0Modal .strategy-option[data-strategy="whatsapp"]',
        position: 'bottom',
        icon: 'message',
        title: 'Apenas WhatsApp',
        text: 'Escolha esta opção se quiser enviar apenas uma mensagem via WhatsApp, sem fazer ligação.',
        requiresModalOpen: true,
        modalId: 'd0Modal',
        autoClick: true,
        clickSelector: '#d0Modal .strategy-option[data-strategy="whatsapp"]'
    },
    {
        id: 'tooltip_followup_4c',
        page: 'follow-up',
        selector: '#d0Modal .strategy-option[data-strategy="call"]',
        position: 'bottom',
        icon: 'call',
        title: 'Apenas Ligação',
        text: 'Escolha esta opção se quiser fazer apenas uma ligação, sem enviar mensagem prévia.',
        requiresModalOpen: true,
        modalId: 'd0Modal',
        autoClick: true,
        clickSelector: '#d0Modal .strategy-option[data-strategy="call"]'
    },
    {
        id: 'tooltip_followup_4c2',
        page: 'follow-up',
        selector: '#d0Modal .close-btn',
        position: 'left',
        icon: 'info',
        title: 'Próximo Passo',
        text: 'A mesma lógica se aplica aos follow-ups de 30 minutos e 3 horas! A única diferença é que no primeiro contato você pode escolher "Mensagem + Ligação", enquanto nos outros (30min e 3h) você escolhe apenas WhatsApp ou apenas Ligação. Clique em "Próximo" para fechar e continuar.',
        requiresModalOpen: true,
        modalId: 'd0Modal',
        closeModalAndContinue: true
    },
    {
        id: 'tooltip_followup_5',
        page: 'follow-up',
        selector: 'button[onclick*="openModal(\'d0_30min\')"], .d0-option-btn[onclick*="d0_30min"]',
        position: 'right',
        icon: 'time',
        title: '30 Minutos',
        text: 'Configure um follow-up que será executado 30 minutos após o cadastro do lead. Ao clicar em "Configurar Follow-up", você poderá escolher entre enviar apenas uma mensagem via WhatsApp ou fazer apenas uma ligação (sem a opção "Mensagem + Ligação" que existe no primeiro contato).',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_6',
        page: 'follow-up',
        selector: 'button[onclick*="openModal(\'d0_3horas\')"], .d0-option-btn[onclick*="d0_3horas"]',
        position: 'right',
        icon: 'time',
        title: '3 Horas',
        text: 'Configure um follow-up que será executado 3 horas após o cadastro do lead. Funciona da mesma forma que o de 30 minutos: você escolhe entre apenas WhatsApp ou apenas Ligação.',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_7',
        page: 'follow-up',
        selector: '.schedule-table',
        position: 'top',
        icon: 'calendar',
        title: 'Tabela de Cadência',
        text: 'Esta é a tabela de cadência onde você pode configurar follow-ups para os dias 1, 3, 5, 7 e 10 após o cadastro, em diferentes horários.',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_7a',
        page: 'follow-up',
        selector: '.followup-btn',
        position: 'top',
        icon: 'target',
        title: 'Botões de Follow-up (D1, D3, D5, D7, D10)',
        text: 'Cada botão "Follow up" na tabela representa um ponto de contato na sua cadência. Ao clicar, você configurará o follow-up para aquele dia e horário específico. Diferente do primeiro contato, aqui você escolhe apenas uma opção: ou apenas WhatsApp ou apenas Ligação (não há a opção "Mensagem + Ligação").',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_8',
        page: 'follow-up',
        selector: '#weekendToggle, .weekend-toggle-btn',
        position: 'left',
        icon: 'calendar',
        title: 'Restringir Finais de Semana',
        text: 'Ative esta opção para evitar que os follow-ups sejam enviados durante os finais de semana (sábados e domingos). Isso ajuda a manter uma comunicação mais profissional e respeitosa.',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_9',
        page: 'follow-up',
        selector: '.create-followup-btn, button[onclick="createFollowup()"]',
        position: 'top',
        icon: 'check',
        title: 'Criar Follow-up',
        text: 'Após configurar todos os follow-ups desejados, clique aqui para salvar e criar sua cadência completa. Certifique-se de ter preenchido o nome do follow-up antes de criar.',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_9a',
        page: 'follow-up',
        selector: '.created-followups-section, #createdFollowupsContainer',
        position: 'top',
        icon: 'list',
        title: 'Follow-ups Criados',
        text: 'Aqui você verá todos os follow-ups que já foram criados e salvos. Você pode visualizar, editar ou excluir qualquer follow-up criado anteriormente.',
        requiresModalOpen: false
    },
    {
        id: 'tooltip_followup_10',
        page: 'follow-up',
        selector: '.floating-summary-btn, button[onclick="openSummaryModal()"]',
        position: 'top',
        icon: 'info',
        title: 'Resumo da Configuração',
        text: 'Veja um resumo completo de todos os follow-ups configurados na sua cadência. Revisar antes de criar.',
        nextPage: '../assistentes/assistente.html',
        customOffset: { top: -150 },
        requiresModalOpen: false
    },

    // ========== CONVERSAS - WHATSAPP ==========
    {
        id: 'tooltip_whatsapp_welcome',
        page: 'conversas-whatsapp',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo ao WhatsApp!',
        text: 'Aqui você gerencia todas as conversas do WhatsApp. Responda mensagens, veja histórico e configure respostas automáticas. Vamos te guiar!'
    },
    {
        id: 'tooltip_whatsapp_1',
        page: 'conversas-whatsapp',
        selector: '.whatsapp-conversa:first-child, .conversation-item:first-child',
        position: 'bottom',
        icon: 'whatsapp',
        title: 'Mensagens WhatsApp',
        text: 'Veja todas as conversas do WhatsApp. Clique para abrir e responder.'
    },
    {
        id: 'tooltip_whatsapp_2',
        page: 'conversas-whatsapp',
        selector: 'textarea, .mensagem-input, [data-mensagem]',
        position: 'top',
        icon: 'message',
        title: 'Enviar Mensagem',
        text: 'Digite sua mensagem aqui e clique em enviar para responder ao contato.'
    },
    {
        id: 'tooltip_whatsapp_3',
        page: 'conversas-whatsapp',
        selector: 'button:contains("Enviar"), .enviar-mensagem-btn',
        position: 'left',
        icon: 'send',
        title: 'Enviar',
        text: 'Envie sua mensagem para o contato selecionado.'
    },

    // ========== CONTATOS ==========
    {
        id: 'tooltip_contatos_welcome',
        page: 'contatos',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo aos Contatos!',
        text: 'Aqui você gerencia todos os seus contatos e leads. Visualize estatísticas, gerencie webhooks e acompanhe todas as interações. Vamos te mostrar como funciona!'
    },
    {
        id: 'tooltip_contatos_1',
        page: 'contatos',
        selector: '.stats-grid .stat-card:first-child',
        position: 'bottom',
        icon: 'stats',
        title: 'Total de Contatos',
        text: 'Aqui você vê o total de contatos cadastrados no sistema. Este número é atualizado automaticamente conforme novos contatos são adicionados através de chamadas ou mensagens.'
    },
    {
        id: 'tooltip_contatos_2',
        page: 'contatos',
        selector: '.stats-grid .stat-card:nth-child(2)',
        position: 'bottom',
        icon: 'phone',
        title: 'Inbound',
        text: 'Chamadas recebidas pelos seus assistentes. São contatos que entraram em contato com você através de ligações recebidas.'
    },
    {
        id: 'tooltip_contatos_3',
        page: 'contatos',
        selector: '.stats-grid .stat-card:nth-child(3)',
        position: 'bottom',
        icon: 'phone',
        title: 'Outbound',
        text: 'Chamadas realizadas pelos seus assistentes. São contatos que você ou seus assistentes ligaram ativamente.'
    },
    {
        id: 'tooltip_contatos_4',
        page: 'contatos',
        selector: '.stats-grid .webhooks-card',
        position: 'bottom',
        icon: 'webhook',
        title: 'Configurações de Webhook',
        text: 'Gerencie seus webhooks aqui. Webhooks permitem que você receba notificações em tempo real sobre novos contatos e interações. Clique para configurar e criar novos webhooks.'
    },
    {
        id: 'tooltip_contatos_5',
        page: 'contatos',
        selector: '#filterSearch, .filter-group:first-child',
        position: 'bottom',
        icon: 'search',
        title: 'Buscar',
        text: 'Use este campo para buscar contatos por nome ou assistente. Digite qualquer termo e a lista será filtrada automaticamente.'
    },
    {
        id: 'tooltip_contatos_6',
        page: 'contatos',
        selector: '#filterType, .filter-group:nth-child(2)',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtro de Tipo',
        text: 'Filtre os contatos por tipo de chamada: Todas, Entrada (Inbound) ou Saída (Outbound). Isso ajuda a visualizar apenas chamadas recebidas ou realizadas.'
    },
    {
        id: 'tooltip_contatos_7',
        page: 'contatos',
        selector: '#dateDisplay, .filter-group:nth-child(3)',
        position: 'bottom',
        icon: 'calendar',
        title: 'Filtro de Período',
        text: 'Selecione um período de datas para filtrar os contatos. Clique aqui para abrir o calendário e escolher a data inicial e final do período desejado.'
    },
    {
        id: 'tooltip_contatos_8',
        page: 'contatos',
        selector: '#filterSuccess, .filter-group:nth-child(4)',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtro de Status',
        text: 'Filtre os contatos por status da chamada: Todos, Sucesso (chamadas concluídas com sucesso) ou Falha (chamadas que não foram completadas).'
    },
    {
        id: 'tooltip_contatos_9',
        page: 'contatos',
        selector: '#filterWebhook, .filter-group:nth-child(5)',
        position: 'bottom',
        icon: 'webhook',
        title: 'Filtro de Webhook',
        text: 'Filtre os contatos por webhook configurado. Isso permite ver apenas contatos que foram processados por um webhook específico.'
    },
    {
        id: 'tooltip_contatos_10',
        page: 'contatos',
        selector: '#filterCampaign, .filter-group:nth-child(6)',
        position: 'bottom',
        icon: 'campaign',
        title: 'Filtro de Campanha',
        text: 'Filtre os contatos por campanha. Isso permite visualizar apenas contatos que foram gerados ou processados por uma campanha específica.'
    },
    {
        id: 'tooltip_contatos_11',
        page: 'contatos',
        selector: '.table-container, .table-title',
        position: 'top',
        icon: 'list',
        title: 'Lista de Contatos',
        text: 'Aqui estão todos os seus contatos organizados em uma tabela. Você pode ver nome, telefone, tipo de chamada e status. Use os filtros acima para encontrar contatos específicos.',
        nextPage: '../conversas/mensagens-whatsapp.html'
    },

    // ========== MENSAGENS WHATSAPP ==========
    {
        id: 'tooltip_mensagens_welcome',
        page: 'mensagens-whatsapp',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo às Mensagens!',
        text: 'Aqui você visualiza e gerencia todas as conversas do WhatsApp. Veja mensagens, responda leads e acompanhe interações em tempo real.'
    },
    {
        id: 'tooltip_mensagens_1',
        page: 'mensagens-whatsapp',
        selector: '#filterButton, .filter-button',
        position: 'bottom',
        icon: 'filter',
        title: 'Filtros',
        text: 'Clique aqui para filtrar suas conversas por tags (Novo, Importante, Suporte, etc.) ou trocar de instância do WhatsApp.',
        autoClick: true,
        clickSelector: '#filterButton',
        waitForDropdown: '#filterDropdown'
    },
    {
        id: 'tooltip_mensagens_2',
        page: 'mensagens-whatsapp',
        selector: '#tagFilterOptions, .filter-section:first-child',
        position: 'right',
        icon: 'tag',
        title: 'Tags',
        text: 'Use tags para organizar suas conversas: Novo, Importante, Suporte ou Resolvido. Clique em uma tag para filtrar as conversas.',
        requiresDropdownOpen: true,
        dropdownSelector: '#filterDropdown'
    },
    {
        id: 'tooltip_mensagens_3',
        page: 'mensagens-whatsapp',
        selector: '#instanceFilterOptions, .filter-section:last-child',
        position: 'right',
        icon: 'settings',
        title: 'Trocar Instância',
        text: 'Aqui você pode trocar entre diferentes números de WhatsApp conectados. Selecione uma instância para ver apenas conversas daquele número.',
        requiresDropdownOpen: true,
        dropdownSelector: '#filterDropdown',
        closeDropdownAfter: true,
        dropdownToClose: '#filterDropdown'
    },
    {
        id: 'tooltip_mensagens_4',
        page: 'mensagens-whatsapp',
        selector: '#conversationsList, .conversations-list',
        position: 'right',
        icon: 'list',
        title: 'Lista de Conversas',
        text: 'Aqui estão todas as suas conversas do WhatsApp. Clique em uma conversa para ver as mensagens e responder.'
    },
    {
        id: 'tooltip_mensagens_5',
        page: 'mensagens-whatsapp',
        selector: '#messagesContainer, .messages-container',
        position: 'left',
        icon: 'message',
        title: 'Mensagens',
        text: 'Aqui aparecem as mensagens da conversa selecionada. Você pode ver o histórico completo e enviar novas mensagens.'
    },
    {
        id: 'tooltip_mensagens_6',
        page: 'mensagens-whatsapp',
        selector: '#messageInput, .message-input',
        position: 'top',
        icon: 'send',
        title: 'Enviar Mensagem',
        text: 'Digite sua mensagem aqui e clique em "Enviar" para responder ao lead. A IA pode ajudar a responder automaticamente.',
        nextPage: '../conversas/conversas.html'
    },

    // ========== LIGAÇÕES (REGISTRO DE CHAMADAS) ==========
    {
        id: 'tooltip_ligacoes_welcome',
        page: 'ligacoes',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo ao Registro de Chamadas!',
        text: 'Aqui você visualiza e analisa todas as chamadas realizadas. Veja gravações, transcrições e estatísticas das suas ligações. Vamos te mostrar os principais recursos!'
    },
    {
        id: 'tooltip_ligacoes_1',
        page: 'ligacoes',
        selector: '#searchFilter, .filter-input',
        position: 'bottom',
        icon: 'search',
        title: 'Buscar Chamadas',
        text: 'Use este campo para buscar chamadas por resumo, assistente ou número de telefone.'
    },
    {
        id: 'tooltip_ligacoes_2',
        page: 'ligacoes',
        selector: '#sortFilter, .filter-select:first-of-type',
        position: 'bottom',
        icon: 'filter',
        title: 'Ordenar',
        text: 'Ordene as chamadas por: Mais Recentes, Mais Antigas, Maior Duração ou Menor Duração.'
    },
    {
        id: 'tooltip_ligacoes_3',
        page: 'ligacoes',
        selector: '#periodFilter, .filter-select:last-of-type',
        position: 'bottom',
        icon: 'calendar',
        title: 'Filtro de Período',
        text: 'Filtre as chamadas por período: Hoje, Ontem, Últimos 7 dias, Últimos 30 dias ou um período personalizado.'
    },
    {
        id: 'tooltip_ligacoes_4',
        page: 'ligacoes',
        selector: '.batch-download-btn, button[onclick="openBatchDownloadModal()"]',
        position: 'left',
        icon: 'download',
        title: 'Download em Lote',
        text: 'Baixe múltiplas gravações ou exporte uma planilha com todas as chamadas filtradas.'
    },
    {
        id: 'tooltip_ligacoes_5',
        page: 'ligacoes',
        selector: '#callsList, .calls-list',
        position: 'right',
        icon: 'list',
        title: 'Lista de Chamadas',
        text: 'Aqui estão todas as suas chamadas. Clique em uma chamada para ver detalhes, gravação e transcrição.'
    },
    {
        id: 'tooltip_ligacoes_6',
        page: 'ligacoes',
        selector: '#detailsPanel, .details-panel',
        position: 'left',
        icon: 'phone',
        title: 'Detalhes da Chamada',
        text: 'Quando você seleciona uma chamada, aqui aparecem os detalhes completos, gravação de áudio e transcrição.'
    },

    // ========== CONEXÕES - WHATSAPP ==========
    {
        id: 'tooltip_conexoes_whatsapp_welcome',
        page: 'conexoes-whatsapp',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo às Conexões WhatsApp!',
        text: 'Aqui você conecta e gerencia seus números de WhatsApp. Configure assistentes, follow-ups e respostas automáticas. Vamos te guiar!'
    },
    {
        id: 'tooltip_conexoes_whatsapp_1',
        page: 'conexoes-whatsapp',
        selector: 'button:contains("Nova Instância"), .nova-instancia-btn',
        position: 'right',
        icon: 'whatsapp',
        title: 'Conectar WhatsApp',
        text: 'Clique para conectar um novo número de WhatsApp. Você vai escanear um QR Code.'
    },
    {
        id: 'tooltip_conexoes_whatsapp_2',
        page: 'conexoes-whatsapp',
        selector: '.instancia-card:first-child, .whatsapp-instance:first-child',
        position: 'bottom',
        icon: 'webhook',
        title: 'Sua Conexão',
        text: 'Este é um WhatsApp conectado. Veja o status, configure qual assistente responde e gerencie a conexão.'
    },
    {
        id: 'tooltip_conexoes_whatsapp_3',
        page: 'conexoes-whatsapp',
        selector: 'input[type="checkbox"][name*="ia"], .toggle-ia, [data-toggle-ia]',
        position: 'left',
        icon: 'assistant',
        title: 'Ativar IA',
        text: 'Ative para que seu assistente de IA responda automaticamente as mensagens deste WhatsApp.'
    },
    {
        id: 'tooltip_conexoes_whatsapp_4',
        page: 'conexoes-whatsapp',
        selector: 'select[name*="assistente"], select[id*="assistente-whatsapp"]',
        position: 'bottom',
        icon: 'target',
        title: 'Escolher Assistente',
        text: 'Selecione qual assistente de IA vai atender este número de WhatsApp.'
    },
    {
        id: 'tooltip_conexoes_whatsapp_5',
        page: 'conexoes-whatsapp',
        selector: 'select[name*="followup"], select[id*="followup-whatsapp"]',
        position: 'bottom',
        icon: 'followup',
        title: 'Vincular Follow-up',
        text: 'Escolha um follow-up para ser executado automaticamente com os leads deste número.'
    },
    {
        id: 'tooltip_conexoes_whatsapp_6',
        page: 'conexoes-whatsapp',
        selector: 'button:contains("Desconectar"), .desconectar-btn',
        position: 'top',
        icon: 'disconnect',
        title: 'Desconectar',
        text: 'Use para desconectar este WhatsApp da plataforma. Você precisará escanear o QR novamente depois.'
    },

    // ========== CONEXÕES - WEBHOOKS ==========
    {
        id: 'tooltip_webhooks_welcome',
        page: 'conexoes-webhooks',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo aos Webhooks!',
        text: 'Aqui você configura webhooks para integrar com outros sistemas. Receba notificações em tempo real de eventos importantes. Vamos te mostrar como!'
    },
    {
        id: 'tooltip_webhooks_1',
        page: 'conexoes-webhooks',
        selector: 'button:contains("Criar Webhook"), .criar-webhook-btn',
        position: 'right',
        icon: 'webhook',
        title: 'Novo Webhook',
        text: 'Crie webhooks para receber notificações quando eventos acontecerem (agendamento, qualificação, etc).'
    },
    {
        id: 'tooltip_webhooks_2',
        page: 'conexoes-webhooks',
        selector: '.webhook-item:first-child, .webhook-card:first-child',
        position: 'bottom',
        icon: 'card',
        title: 'Seus Webhooks',
        text: 'Gerencie seus webhooks configurados. Teste, edite ou exclua conforme necessário.'
    },
    {
        id: 'tooltip_webhooks_3',
        page: 'conexoes-webhooks',
        selector: 'button:contains("Testar"), .testar-webhook-btn',
        position: 'left',
        icon: 'test',
        title: 'Testar Webhook',
        text: 'Envie um payload de teste para verificar se seu webhook está funcionando.'
    },
    {
        id: 'tooltip_webhooks_4',
        page: 'conexoes-webhooks',
        selector: 'button:contains("Copiar URL"), .copiar-url-btn',
        position: 'left',
        icon: 'copy',
        title: 'Copiar Endpoint',
        text: 'Copie a URL do webhook para configurar em sistemas externos.'
    },

    // ========== CONEXÕES - COMPRAR NÚMEROS ==========
    {
        id: 'tooltip_numeros_welcome',
        page: 'conexoes-numeros',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo à Loja de Números!',
        text: 'Aqui você pode comprar números de telefone para suas campanhas. Escolha o DDD desejado e adquira números disponíveis. Vamos te guiar!'
    },
    {
        id: 'tooltip_numeros_1',
        page: 'conexoes-numeros',
        selector: '.numero-item:first-child, .phone-number-card:first-child',
        position: 'bottom',
        icon: 'number',
        title: 'Números Disponíveis',
        text: 'Veja os números de telefone disponíveis para compra. Escolha o DDD desejado.'
    },
    {
        id: 'tooltip_numeros_2',
        page: 'conexoes-numeros',
        selector: 'button:contains("Comprar"), .comprar-numero-btn',
        position: 'left',
        icon: 'buy',
        title: 'Adquirir Número',
        text: 'Clique para comprar este número. Ele será vinculado à sua conta automaticamente.'
    },
    {
        id: 'tooltip_numeros_3',
        page: 'conexoes-numeros',
        selector: 'input[type="search"], .filtro-ddd, select[name*="ddd"]',
        position: 'bottom',
        icon: 'search',
        title: 'Filtrar por Região',
        text: 'Filtre os números disponíveis por DDD/região.'
    },

    // ========== AJUDA ==========
    {
        id: 'tooltip_ajuda_welcome',
        page: 'ajuda',
        selector: 'body',
        position: 'center',
        icon: 'welcome',
        title: 'Bem-vindo à Central de Ajuda!',
        text: 'Aqui você encontra respostas para suas dúvidas, tutoriais e documentação completa. Se não encontrar o que precisa, entre em contato com nosso suporte!'
    },
    {
        id: 'tooltip_ajuda_1',
        page: 'ajuda',
        selector: 'input[type="search"], .buscar-ajuda-input',
        position: 'bottom',
        icon: 'search',
        title: 'Buscar Ajuda',
        text: 'Digite sua dúvida para encontrar respostas rapidamente no nosso FAQ.'
    },
    {
        id: 'tooltip_ajuda_2',
        page: 'ajuda',
        selector: '.primeiros-passos, [data-section="primeiros-passos"]',
        position: 'right',
        icon: 'rocket',
        title: 'Comece Aqui',
        text: 'Se você é novo, comece lendo esta seção para entender o básico da plataforma.'
    },
    {
        id: 'tooltip_ajuda_3',
        page: 'ajuda',
        selector: 'button:contains("Suporte"), .falar-suporte-btn',
        position: 'top',
        icon: 'support',
        title: 'Precisa de Ajuda?',
        text: 'Não encontrou sua resposta? Clique para falar diretamente com nosso suporte.'
    }
];

// Função auxiliar para seletores mais flexíveis
function findElement(selector) {
    // Tentar seletores CSS primeiro
    let element = document.querySelector(selector);
    if (element) return element;

    // Se contém "contains", buscar por texto
    if (selector.includes(':contains(')) {
        const text = selector.match(/:contains\("([^"]+)"\)/)?.[1];
        if (text) {
            const allElements = document.querySelectorAll('button, a, [role="button"]');
            for (let el of allElements) {
                if (el.textContent.includes(text)) {
                    return el;
                }
            }
        }
    }

    // Tentar por data attributes
    const dataAttr = selector.match(/\[data-([^\]]+)\]/)?.[1];
    if (dataAttr) {
        element = document.querySelector(`[data-${dataAttr}]`);
        if (element) return element;
    }

    // Tentar por classe parcial
    const classMatch = selector.match(/\.([a-z-]+)/)?.[1];
    if (classMatch) {
        const allElements = document.querySelectorAll('[class*="' + classMatch + '"]');
        if (allElements.length > 0) return allElements[0];
    }

    return null;
}

// Exportar configuração
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ONBOARDING_TOOLTIPS, findElement };
}

