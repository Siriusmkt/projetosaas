/**
 * Sistema de Onboarding - Tooltips Interativos
 * Versão: 1.0
 * 
 * IMPORTANTE: NÃO MEXER NO BANCO DE DADOS SUPABASE
 * Todo controle é feito via localStorage/sessionStorage apenas
 * 
 * Funcionalidades:
 * - Tooltips aparecem no primeiro login do usuário (ou sempre se MODO_TESTE = true)
 * - Controle via localStorage (sem banco de dados)
 * - Botão de reativação disponível
 * - Posicionamento inteligente automático
 * 
 * MODO TESTE: Ativar para testar sempre (ignora verificação de primeiro login)
 */

// ========== CONFIGURAÇÃO ==========
const MODO_TESTE = true; // Mude para false em produção para usar verificação de primeiro login
// ==================================

class OnboardingTooltip {
    constructor() {
        this.currentTooltipIndex = 0;
        this.tooltips = [];
        this.currentPage = this.getCurrentPage();
        this.isActive = false;
        this.tooltipHistory = []; // Histórico de tooltips visitados para navegação
        this.isShowing = false; // Flag para evitar múltiplas chamadas simultâneas
        this.isInitializing = false; // Flag para evitar múltiplas inicializações
        this.activeTimeouts = []; // Array para rastrear timeouts ativos
        
        // Verificar se tooltips devem ser exibidos
        this.checkEligibility();
    }

    /**
     * Identifica a página atual baseado no caminho
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        const fullPath = window.location.href;
        const hash = window.location.hash;
        
        console.log('[Onboarding] ========================================');
        console.log('[Onboarding] Detectando página...');
        console.log('[Onboarding] Pathname:', path);
        console.log('[Onboarding] Filename:', filename);
        console.log('[Onboarding] Full URL:', fullPath);
        console.log('[Onboarding] Hash:', hash);
        console.log('[Onboarding] Está em iframe?', window.parent !== window);
        
        // Mapeamento de páginas
        const pageMap = {
            'dashboard.html': 'dashboard',
            'onboarding-tutorial-demo.html': 'dashboard', // Página de teste do dashboard
            'criar-campanhas.html': 'campanhas',
            'onboarding-tutorial-demo-campanhas.html': 'campanhas', // Página de teste de campanhas
            'seleciona-assistente.html': 'seleciona-assistente',
            'assistente.html': 'assistentes',
            'criar_follow-up.html': 'follow-up',
            'criar_followup.html': 'follow-up',
            'follow-up.html': 'follow-up',
            'followup.html': 'follow-up',
            'conversas.html': 'ligacoes',
            'mensagens-whatsapp.html': 'mensagens-whatsapp',
            'contatos.html': 'contatos',
            'configurar-whatsapp.html': 'conexoes-whatsapp',
            'webhooks.html': 'conexoes-webhooks',
            'comprar-numero.html': 'conexoes-numeros',
            'ajuda.html': 'ajuda'
        };
        
        // PRIORIDADE 1: Verificar hash primeiro (importante para iframes)
        if (hash) {
            const hashLower = hash.toLowerCase();
            if (hashLower.includes('contatos')) {
                console.log('[Onboarding] Página detectada como contatos (por hash)');
                console.log('[Onboarding] ========================================');
                return 'contatos';
            }
            if (hashLower.includes('mensagens') || hashLower.includes('mensagens-whatsapp')) {
                console.log('[Onboarding] Página detectada como mensagens-whatsapp (por hash)');
                console.log('[Onboarding] ========================================');
                return 'mensagens-whatsapp';
            }
            if (hashLower.includes('ligacoes')) {
                console.log('[Onboarding] Página detectada como ligacoes (por hash)');
                console.log('[Onboarding] ========================================');
                return 'ligacoes';
            }
            if (hashLower.includes('assistente')) {
                console.log('[Onboarding] Página detectada como assistentes (por hash)');
                console.log('[Onboarding] ========================================');
                return 'assistentes';
            }
            if (hashLower.includes('follow-up') || hashLower.includes('followup')) {
                console.log('[Onboarding] Página detectada como follow-up (por hash)');
                console.log('[Onboarding] ========================================');
                return 'follow-up';
            }
        }
        
        // PRIORIDADE 2: Verificar se o path contém 'follow-up' ou 'followup'
        if (path.includes('follow-up') || path.includes('followup')) {
            console.log('[Onboarding] Página detectada como follow-up (por path)');
            console.log('[Onboarding] ========================================');
            return 'follow-up';
        }
        
        // PRIORIDADE 3: Verificar se o path contém 'assistentes' ou 'assistente'
        if (path.includes('assistentes') || path.includes('assistente')) {
            console.log('[Onboarding] Página detectada como assistentes (por path)');
            console.log('[Onboarding] ========================================');
            return 'assistentes';
        }
        
        // PRIORIDADE 4: Verificar se o path contém 'mensagens-whatsapp'
        if (path.includes('mensagens-whatsapp')) {
            console.log('[Onboarding] Página detectada como mensagens-whatsapp (por path)');
            console.log('[Onboarding] ========================================');
            return 'mensagens-whatsapp';
        }
        
        // PRIORIDADE 5: Verificar se o path contém 'conversas.html' (ligações - registro de chamadas)
        if (path.includes('conversas.html') || (path.includes('conversas') && !path.includes('mensagens') && !path.includes('contatos') && filename === 'conversas.html')) {
            console.log('[Onboarding] Página detectada como ligacoes (por path/filename)');
            console.log('[Onboarding] ========================================');
            return 'ligacoes';
        }
        
        // PRIORIDADE 6: Verificar se o path contém 'contatos'
        if (path.includes('contatos')) {
            console.log('[Onboarding] Página detectada como contatos (por path)');
            console.log('[Onboarding] ========================================');
            return 'contatos';
        }
        
        // PRIORIDADE 5: Verificar por filename
        let detectedPage = pageMap[filename] || filename.replace('.html', '');
        
        // Se for página de demo, verificar seção escolhida
        if (path.includes('onboarding-tutorial-demo') || detectedPage === 'onboarding-tutorial-demo') {
            const selectedSection = localStorage.getItem('onboarding_section');
            if (selectedSection) {
                console.log('[Onboarding] Página de demo detectada com seção escolhida:', selectedSection);
                detectedPage = selectedSection;
            } else {
                // Se não tem seção escolhida mas está na página de demo do dashboard, tratar como dashboard
                if (path.includes('onboarding-tutorial-demo.html') && !path.includes('onboarding-tutorial-demo-')) {
                    console.log('[Onboarding] Página de demo do dashboard detectada, tratando como dashboard');
                    detectedPage = 'dashboard';
                }
            }
        }
        
        console.log('[Onboarding] Página detectada (por filename):', detectedPage);
        console.log('[Onboarding] ========================================');
        
        return detectedPage;
    }

    /**
     * Verifica se o usuário é elegível para ver tooltips
     * NÃO MEXER NO BANCO DE DADOS - Tudo via localStorage
     */
    checkEligibility() {
        console.log('[Onboarding] Verificando elegibilidade...');
        console.log('[Onboarding] MODO_TESTE:', MODO_TESTE);
        
        // ========== MODO TESTE: SEMPRE ATIVO ==========
        if (MODO_TESTE) {
            // Verificar se foi reativado pelo botão - se sim, ignorar disabled
            const reactivated = localStorage.getItem('onboarding_reactivated');
            if (reactivated === 'true') {
                console.log('[Onboarding] Tooltips reativados pelo botão - ignorando disabled');
                localStorage.removeItem('onboarding_disabled');
                localStorage.removeItem('onboarding_auto_show_disabled');
                this.isActive = true;
                return;
            }
            
            // Verificar apenas se não foi desativado manualmente
            const disabled = localStorage.getItem('onboarding_disabled');
            if (disabled === 'true') {
                console.log('[Onboarding] Tooltips desativados manualmente (mesmo em modo teste)');
                console.log('[Onboarding] DICA: Clique no botão de tutorial para reativar!');
                this.isActive = false;
                return;
            }
            
            // Em modo teste, ignorar onboarding_auto_show_disabled
            // Tooltips sempre aparecem (exceto se desativados permanentemente)
            console.log('[Onboarding] MODO TESTE ATIVO - Tooltips sempre aparecerão!');
            this.isActive = true;
            return;
        }
        // ==============================================
        
        // ========== MODO PRODUÇÃO: VERIFICAÇÃO NORMAL ==========
        // Verificar se tooltips foram desativados permanentemente
        const disabled = localStorage.getItem('onboarding_disabled');
        if (disabled === 'true') {
            console.log('[Onboarding] Tooltips desativados permanentemente');
            this.isActive = false;
            return;
        }

        // Verificar se usuário está logado (tem tenant_id)
        const tenantId = localStorage.getItem('tenant_id');
        console.log('[Onboarding] Tenant ID:', tenantId);
        
        if (!tenantId) {
            console.log('[Onboarding] Usuário não está logado (sem tenant_id)');
            this.isActive = false;
            return;
        }

        // Verificar se é o primeiro login para este usuário específico
        // TUDO VIA LOCALSTORAGE - NÃO MEXER NO BANCO
        const userKey = `onboarding_first_login_${tenantId}`;
        const firstLogin = localStorage.getItem(userKey);
        console.log('[Onboarding] Primeiro login?', !firstLogin);
        
        if (!firstLogin) {
            // Marcar primeiro login para este usuário (APENAS LOCALSTORAGE)
            localStorage.setItem(userKey, 'true');
            localStorage.setItem(`onboarding_first_login_date_${tenantId}`, new Date().toISOString());
            console.log('[Onboarding] Primeiro login detectado! Tooltips serão exibidos.');
            this.isActive = true;
            return;
        }

        // Se já foi o primeiro login, verificar se foi marcado para não aparecer automaticamente
        const autoShowDisabled = localStorage.getItem('onboarding_auto_show_disabled');
        if (autoShowDisabled === 'true') {
            console.log('[Onboarding] Tooltips não aparecerão automaticamente (cliente finalizou ou clicou "não mostrar mais")');
            this.isActive = false;
            return;
        }

        // Se já foi o primeiro login mas não foi desativado, verificar se tooltips foram reativados pelo botão
        const reactivated = localStorage.getItem('onboarding_reactivated');
        console.log('[Onboarding] Reativado pelo botão?', reactivated === 'true');
        console.log('[Onboarding] Página atual:', this.currentPage);
        
        if (reactivated === 'true') {
            console.log('[Onboarding] Tooltips reativados pelo botão!');
            this.isActive = true;
            return;
        }
        
        // EM MODO TESTE: Se estiver na página seleciona-assistente, sempre ativar
        if (MODO_TESTE && this.currentPage === 'seleciona-assistente') {
            console.log('[Onboarding] MODO TESTE + página seleciona-assistente: FORÇANDO ATIVAÇÃO!');
            this.isActive = true;
            return;
        }

        console.log('[Onboarding] Tooltips não serão exibidos (já foi primeiro login e não foi reativado)');
        this.isActive = false;
    }

    /**
     * Inicializa os tooltips para a página atual
     * NÃO MEXER NO BANCO DE DADOS - Tudo via sessionStorage/localStorage
     */
    init(tooltipsConfig) {
        // Proteção contra múltiplas inicializações
        if (this.isInitializing) {
            console.log('[Onboarding] Já está inicializando, ignorando chamada duplicada...');
            return;
        }
        
        // Verificar se já existe uma instância ativa
        if (window.currentOnboarding && window.currentOnboarding !== this && window.currentOnboarding.isActive) {
            console.log('[Onboarding] Já existe uma instância ativa, não inicializando novamente...');
            return;
        }
        
        this.isInitializing = true;
        console.log('[Onboarding] Inicializando tooltips...');
        console.log('[Onboarding] Página atual:', this.currentPage);
        console.log('[Onboarding] Sistema ativo?', this.isActive);
        
        if (!this.isActive) {
            console.log('[Onboarding] Sistema não está ativo, tooltips não serão exibidos');
            this.isInitializing = false;
            return;
        }

        // Filtrar tooltips da página atual
        console.log('[Onboarding] ========================================');
        console.log('[Onboarding] Filtrando tooltips. Página atual:', this.currentPage);
        console.log('[Onboarding] Total de tooltips na config:', tooltipsConfig.length);
        console.log('[Onboarding] Páginas disponíveis:', [...new Set(tooltipsConfig.map(t => t.page))]);
        
        // Log detalhado de todos os tooltips de assistentes
        const assistentesTooltips = tooltipsConfig.filter(t => t.page === 'assistentes');
        console.log('[Onboarding] Tooltips configurados para "assistentes":', assistentesTooltips.length);
        assistentesTooltips.forEach(t => {
            console.log('[Onboarding]   -', t.id, '| selector:', t.selector);
        });
        
        // Verificar se há uma seção específica escolhida (para tutorial por seção)
        const selectedSection = localStorage.getItem('onboarding_section');
        if (selectedSection && this.currentPage === 'onboarding-tutorial-demo') {
            // Filtrar apenas tooltips da seção escolhida
            console.log('[Onboarding] Seção específica escolhida:', selectedSection);
            this.tooltips = tooltipsConfig.filter(t => t.page === selectedSection);
            console.log('[Onboarding] Tooltips encontrados para a seção:', this.tooltips.length);
        } else {
            // Filtrar tooltips da página atual (comportamento normal)
            this.tooltips = tooltipsConfig.filter(t => t.page === this.currentPage);
            console.log('[Onboarding] Tooltips encontrados para esta página:', this.tooltips.length);
        }
        console.log('[Onboarding] Tooltips IDs:', this.tooltips.map(t => t.id));
        
        if (this.tooltips.length === 0) {
            console.error('[Onboarding] ========================================');
            console.error('[Onboarding] ERRO: Nenhum tooltip configurado para esta página!');
            console.error('[Onboarding] Página detectada:', this.currentPage);
            console.error('[Onboarding] URL completa:', window.location.href);
            console.error('[Onboarding] Pathname:', window.location.pathname);
            console.error('[Onboarding] Filename:', window.location.pathname.split('/').pop());
            console.error('[Onboarding] Tooltips disponíveis:', tooltipsConfig.map(t => ({ id: t.id, page: t.page })));
            console.error('[Onboarding] ========================================');
            return;
        }
        console.log('[Onboarding] ========================================');

        // Em modo teste, limpar tooltips vistos na sessão para sempre mostrar
        if (MODO_TESTE) {
            console.log('[Onboarding] MODO TESTE: Limpando tooltips vistos na sessão');
            sessionStorage.removeItem('onboarding_seen');
        }

        // Verificar quais tooltips já foram vistos nesta sessão
        const seenInSession = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        console.log('[Onboarding] Tooltips já vistos nesta sessão:', seenInSession.length);
        
        this.tooltips = this.tooltips.filter(t => !seenInSession.includes(t.id));
        console.log('[Onboarding] Tooltips restantes para exibir:', this.tooltips.length);

        if (this.tooltips.length === 0) {
            console.log('[Onboarding] Todos os tooltips já foram vistos nesta sessão');
            return;
        }

        // Limpar timeouts anteriores
        this.clearAllTimeouts();
        
        // SEMPRE começar do índice 0 quando inicializa em uma nova página
        this.currentTooltipIndex = 0;
        this.isShowing = false;
        this.tooltipHistory = [];
        console.log('[Onboarding] Resetando para começar do primeiro tooltip (índice 0)');
        
        // Prevenir scroll automático e garantir que página está no topo
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        console.log('[Onboarding] Scroll resetado para o topo da página');
        
        // Verificar se o primeiro tooltip é do tipo 'body' (boas-vindas) - pode aparecer imediatamente
        const firstTooltip = this.tooltips[0];
        const isWelcomeTooltip = firstTooltip && (firstTooltip.selector === 'body' || firstTooltip.selector.toLowerCase().includes('body'));
        
        if (isWelcomeTooltip) {
            // Tooltip de boas-vindas pode aparecer imediatamente, sem esperar carregamento
            console.log('[Onboarding] Tooltip de boas-vindas detectado - aparecendo imediatamente!');
            this.isInitializing = false;
            this.currentTooltipIndex = 0;
            // Mostrar imediatamente, sem delay
            setTimeout(() => {
                this.showNextTooltip();
            }, 100); // Delay mínimo apenas para garantir que DOM está pronto
        } else {
            // Para outros tooltips, aguardar página carregar completamente
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('[Onboarding] DOM carregado, aguardando renderização...');
                    // Garantir que está no topo após DOM carregar
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                    const timeout = setTimeout(() => {
                        this.isInitializing = false;
                        // Garantir que começa do primeiro tooltip
                        this.currentTooltipIndex = 0;
                        // Garantir que está no topo antes de mostrar tooltip
                        window.scrollTo(0, 0);
                        document.documentElement.scrollTop = 0;
                        document.body.scrollTop = 0;
                        this.showNextTooltip();
                    }, 500); // Aumentado para 500ms para garantir que a página carregou
                    this.activeTimeouts.push(timeout);
                });
            } else {
                // Aguardar um pouco mais para garantir que elementos estão renderizados
                console.log('[Onboarding] DOM já carregado, aguardando renderização...');
                // Garantir que está no topo
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                const timeout = setTimeout(() => {
                    this.isInitializing = false;
                    // Garantir que começa do primeiro tooltip
                    this.currentTooltipIndex = 0;
                    // Garantir que está no topo antes de mostrar tooltip
                    window.scrollTo(0, 0);
                    document.documentElement.scrollTop = 0;
                    document.body.scrollTop = 0;
                    this.showNextTooltip();
                }, 500); // Aumentado para 500ms para garantir que a página carregou
                this.activeTimeouts.push(timeout);
            }
        }
    }
    
    /**
     * Limpa todos os timeouts ativos
     */
    clearAllTimeouts() {
        this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
        this.activeTimeouts = [];
    }

    /**
     * Exibe o próximo tooltip
     */
    showNextTooltip() {
        // Proteção contra múltiplas chamadas simultâneas
        if (this.isShowing) {
            console.log('[Onboarding] Já está mostrando um tooltip, ignorando chamada duplicada...');
            return;
        }
        
        // Verificar se já existe um tooltip ativo
        const existingTooltip = document.getElementById('onboarding-tooltip');
        if (existingTooltip && existingTooltip.classList.contains('show')) {
            console.log('[Onboarding] Tooltip já está sendo exibido, ignorando chamada duplicada...');
            return;
        }
        
        this.isShowing = true;
        console.log(`[Onboarding] ========================================`);
        console.log(`[Onboarding] Tentando exibir tooltip ${this.currentTooltipIndex + 1} de ${this.tooltips.length}`);
        console.log(`[Onboarding] Total de tooltips disponíveis: ${this.tooltips.length}`);
        console.log(`[Onboarding] Índice atual: ${this.currentTooltipIndex}`);
        
        if (this.currentTooltipIndex >= this.tooltips.length) {
            console.log('[Onboarding] Todos os tooltips foram exibidos!');
            this.isShowing = false;
            return;
        }

        const tooltip = this.tooltips[this.currentTooltipIndex];
        console.log('[Onboarding] Buscando elemento:', tooltip.selector);
        console.log('[Onboarding] Tooltip ID:', tooltip.id);
        console.log('[Onboarding] Tooltip título:', tooltip.title);
        
        // Se o tooltip é do tipo 'body' (boas-vindas), pode aparecer imediatamente sem esperar elementos
        const isBodyTooltip = tooltip.selector === 'body' || tooltip.selector.toLowerCase().includes('body');
        if (isBodyTooltip) {
            console.log('[Onboarding] Tooltip de boas-vindas - criando imediatamente sem esperar elementos!');
            const bodyElement = document.body;
            if (bodyElement) {
                // Garantir que está no topo
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                // Criar tooltip imediatamente
                setTimeout(() => {
                    this.createTooltip(bodyElement, tooltip);
                }, 50); // Delay mínimo apenas para garantir que DOM está pronto
                return;
            }
        }
        
        // Verificar se tooltip requer que Grazi esteja aberta
        if (tooltip.requiresGraziOpen === true) {
            const graziPopup = document.getElementById('insightsPopup');
            if (!graziPopup || !graziPopup.classList.contains('active')) {
                console.log('[Onboarding] Tooltip requer Grazi aberta, mas popup não está ativo. Aguardando...');
                // Aguardar Grazi abrir
                let attempts = 0;
                const maxAttempts = 50; // 10 segundos máximo
                const checkGrazi = setInterval(() => {
                    attempts++;
                    const popup = document.getElementById('insightsPopup');
                    if (popup && popup.classList.contains('active')) {
                        clearInterval(checkGrazi);
                        console.log('[Onboarding] Grazi aberta! Continuando com tooltip...');
                        setTimeout(() => {
                            this.isShowing = false; // Resetar flag para tentar novamente
                            this.showNextTooltip();
                        }, 500);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkGrazi);
                        console.warn('[Onboarding] Timeout aguardando Grazi abrir. Pulando tooltip...');
                        this.currentTooltipIndex++;
                        this.isShowing = false;
                        if (this.currentTooltipIndex < this.tooltips.length) {
                            setTimeout(() => this.showNextTooltip(), 100);
                        }
                    }
                }, 200);
                return false;
            }
        }
        
        // Verificar se requer dropdown aberto
        if (tooltip.requiresDropdownOpen === true && tooltip.dropdownSelector) {
            // Se tem closeDropdownAfter, fechar o dropdown antes de mostrar o tooltip
            if (tooltip.closeDropdownAfter === true && tooltip.dropdownToClose) {
                const dropdownToClose = document.querySelector(tooltip.dropdownToClose);
                if (dropdownToClose) {
                    dropdownToClose.classList.remove('active');
                    dropdownToClose.classList.remove('show');
                    const filterButton = document.querySelector('#filterButton');
                    if (filterButton) {
                        filterButton.classList.remove('active');
                    }
                    console.log('[Onboarding] Dropdown fechado antes de mostrar tooltip de instância');
                }
            } else {
                // Se não tem closeDropdownAfter, verificar se dropdown está aberto
                const dropdown = document.querySelector(tooltip.dropdownSelector);
                const isDropdownOpen = dropdown && (
                    dropdown.classList.contains('active') || 
                    dropdown.classList.contains('show') ||
                    getComputedStyle(dropdown).display !== 'none'
                );
                if (!isDropdownOpen) {
                    console.log('[Onboarding] Dropdown não está aberto, aguardando...');
                    let dropdownAttempts = 0;
                    const maxDropdownAttempts = 50;
                    const checkDropdown = setInterval(() => {
                        dropdownAttempts++;
                        const dropdownCheck = document.querySelector(tooltip.dropdownSelector);
                        const isOpen = dropdownCheck && (
                            dropdownCheck.classList.contains('active') || 
                            dropdownCheck.classList.contains('show') ||
                            getComputedStyle(dropdownCheck).display !== 'none'
                        );
                        if (isOpen || dropdownAttempts >= maxDropdownAttempts) {
                            clearInterval(checkDropdown);
                            if (isOpen) {
                                console.log('[Onboarding] Dropdown aberto, continuando...');
                                setTimeout(() => this.showNextTooltip(), 300);
                            } else {
                                console.warn('[Onboarding] Dropdown não abriu, pulando tooltip...');
                                this.currentTooltipIndex++;
                                this.isShowing = false;
                                setTimeout(() => this.showNextTooltip(), 100);
                            }
                        }
                    }, 100);
                    return;
                }
            }
        }
        
        // Verificar se tooltip requer modal aberto (campanhas)
        if (tooltip.requiresModalOpen === true && tooltip.modalId) {
            const modal = document.getElementById(tooltip.modalId);
            // Modal usa classe 'show' para ser exibido
            const isVisible = modal && (
                modal.classList.contains('show') || 
                modal.classList.contains('active') || 
                modal.style.display !== 'none' ||
                getComputedStyle(modal).display !== 'none'
            );
            if (!isVisible) {
                console.log('[Onboarding] Tooltip requer modal aberto, mas modal não está ativo. Aguardando...', tooltip.modalId);
                // Aguardar modal abrir
                let attempts = 0;
                const maxAttempts = 50; // 10 segundos máximo
                const checkModal = setInterval(() => {
                    attempts++;
                    const checkModalEl = document.getElementById(tooltip.modalId);
                    const checkVisible = checkModalEl && (
                        checkModalEl.classList.contains('show') ||
                        checkModalEl.classList.contains('active') || 
                        checkModalEl.style.display !== 'none' ||
                        getComputedStyle(checkModalEl).display !== 'none'
                    );
                    if (checkVisible) {
                        clearInterval(checkModal);
                        console.log('[Onboarding] Modal aberto! Continuando com tooltip...');
                        setTimeout(() => {
                            this.isShowing = false; // Resetar flag para tentar novamente
                            this.showNextTooltip();
                        }, 500);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkModal);
                        console.warn('[Onboarding] Timeout aguardando modal abrir. Pulando tooltip...');
                        this.isShowing = false;
                        this.currentTooltipIndex++;
                        if (this.currentTooltipIndex < this.tooltips.length) {
                            setTimeout(() => this.showNextTooltip(), 100);
                        }
                    }
                }, 200);
                return false;
            }
        }
        
        // Para páginas com carregamento dinâmico (follow-up e seleciona-assistente), aguardar um pouco mais se elemento não for encontrado
        const isFollowUpPage = this.currentPage === 'follow-up';
        const isSelecionaAssistentePage = this.currentPage === 'seleciona-assistente';
        const isDynamicPage = isFollowUpPage || isSelecionaAssistentePage;
        let element = this.findElementBySelector(tooltip.selector);
        
        // LOG DETALHADO para tooltips dentro de modal
        if (tooltip.requiresModalOpen === true && tooltip.modalId) {
            console.log('[Onboarding] ========================================');
            console.log('[Onboarding] TOOLTIP DENTRO DE MODAL DETECTADO!');
            console.log('[Onboarding] Tooltip ID:', tooltip.id);
            console.log('[Onboarding] Selector:', tooltip.selector);
            console.log('[Onboarding] Modal ID:', tooltip.modalId);
            console.log('[Onboarding] Elemento encontrado:', element ? 'SIM' : 'NÃO');
            if (element) {
                console.log('[Onboarding] Elemento:', element.tagName, element.className, element.id);
                console.log('[Onboarding] Elemento visível:', getComputedStyle(element).display !== 'none');
                console.log('[Onboarding] Elemento position:', getComputedStyle(element).position);
                console.log('[Onboarding] Elemento z-index:', getComputedStyle(element).zIndex);
            }
            const modal = document.getElementById(tooltip.modalId);
            if (modal) {
                console.log('[Onboarding] Modal encontrado:', modal.id);
                console.log('[Onboarding] Modal display:', getComputedStyle(modal).display);
                console.log('[Onboarding] Modal z-index:', getComputedStyle(modal).zIndex);
                // Listar todos os elementos dentro do modal
                const allElements = Array.from(modal.querySelectorAll('*')).map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className,
                    display: getComputedStyle(el).display,
                    visible: getComputedStyle(el).display !== 'none' && getComputedStyle(el).opacity !== '0'
                })).filter(el => el.visible);
                console.log('[Onboarding] Elementos visíveis no modal:', allElements.slice(0, 10)); // Primeiros 10
            } else {
                console.warn('[Onboarding] Modal NÃO encontrado:', tooltip.modalId);
            }
            console.log('[Onboarding] ========================================');
        }
        
        // Se não encontrou e é página com carregamento dinâmico, tentar novamente após um delay
        if (!element && isDynamicPage) {
            const pageName = isFollowUpPage ? 'follow-up' : 'seleciona-assistente';
            console.log(`[Onboarding] Elemento não encontrado na primeira tentativa (${pageName}). Aguardando carregamento dinâmico...`);
            
            // Para seleciona-assistente, verificar se o container está visível primeiro
            if (isSelecionaAssistentePage) {
                const selectionContainer = document.getElementById('selectionContainer');
                const isContainerVisible = selectionContainer && selectionContainer.style.display !== 'none';
                
                if (!isContainerVisible) {
                    console.log('[Onboarding] Container de seleção ainda não está visível. Aguardando...');
                    // Aguardar container ficar visível
                    let attempts = 0;
                    const maxAttempts = 30; // 6 segundos máximo
                    const checkContainer = setInterval(() => {
                        attempts++;
                        const container = document.getElementById('selectionContainer');
                        const visible = container && container.style.display !== 'none';
                        if (visible) {
                            clearInterval(checkContainer);
                            console.log('[Onboarding] Container visível! Buscando elemento novamente...');
                            // Aguardar um pouco mais para elementos serem renderizados
                            setTimeout(() => {
                                element = this.findElementBySelector(tooltip.selector);
                                if (!element) {
                                    console.warn(`[Onboarding] Elemento ainda não encontrado: ${tooltip.selector}`);
                                    this.currentTooltipIndex++;
                                    this.isShowing = false;
                                    setTimeout(() => this.showNextTooltip(), 100);
                                    return;
                                }
                                console.log('[Onboarding] Elemento encontrado! Aguardando estar visível...');
                                this.waitForElement(element, () => {
                                    console.log('[Onboarding] Elemento visível! Rolar até elemento antes de criar tooltip...');
                                    // Não rolar se for tooltip da lista de contatos (apenas sinalizar)
                                    if (tooltip.id === 'tooltip_contatos_11') {
                                        console.log('[Onboarding] Tooltip de lista de contatos - não rolando, apenas sinalizando...');
                                        this.createTooltip(element, tooltip);
                                    } else {
                                        this.scrollToElement(element, () => {
                                            console.log('[Onboarding] Rolou até elemento. Criando tooltip...');
                                            this.createTooltip(element, tooltip);
                                        });
                                    }
                                });
                            }, 500);
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkContainer);
                            console.warn('[Onboarding] Timeout aguardando container ficar visível. Pulando tooltip...');
                            this.currentTooltipIndex++;
                            this.isShowing = false;
                            setTimeout(() => this.showNextTooltip(), 100);
                        }
                    }, 200);
                    return;
                }
            }
            
            // Para seleciona-assistente, aguardar mais tempo pois precisa carregar dados da API
            const delay = isSelecionaAssistentePage ? 2500 : 1500;
            setTimeout(() => {
                element = this.findElementBySelector(tooltip.selector);
                if (!element) {
                    console.warn(`[Onboarding] Elemento ainda não encontrado após delay: ${tooltip.selector}`);
                    console.log('[Onboarding] Tentando mais uma vez após delay adicional...');
                    // Tentar mais uma vez após delay adicional
                    setTimeout(() => {
                        element = this.findElementBySelector(tooltip.selector);
                        if (!element) {
                            console.warn(`[Onboarding] Elemento não encontrado após múltiplas tentativas: ${tooltip.selector}`);
                            console.log('[Onboarding] Pulando para próximo tooltip...');
                            this.currentTooltipIndex++;
                            this.isShowing = false;
                            setTimeout(() => this.showNextTooltip(), 100);
                            return;
                        }
                        // Elemento encontrado na segunda tentativa
                        console.log('[Onboarding] Elemento encontrado na segunda tentativa! Aguardando estar visível...');
                        this.waitForElement(element, () => {
                            console.log('[Onboarding] Elemento visível! Rolar até elemento antes de criar tooltip...');
                            // Não rolar se for tooltip da lista de contatos (apenas sinalizar)
                            if (tooltip.id === 'tooltip_contatos_11') {
                                console.log('[Onboarding] Tooltip de lista de contatos - não rolando, apenas sinalizando...');
                                this.createTooltip(element, tooltip);
                            } else {
                                this.scrollToElement(element, () => {
                                    console.log('[Onboarding] Rolou até elemento. Criando tooltip...');
                                    this.createTooltip(element, tooltip);
                                });
                            }
                        });
                    }, 2000);
                    return;
                }
                // Elemento encontrado, continuar normalmente
                console.log('[Onboarding] Elemento encontrado após delay! Aguardando estar visível...');
                this.waitForElement(element, () => {
                    console.log('[Onboarding] Elemento visível! Rolar até elemento antes de criar tooltip...');
                    // Não rolar se for tooltip da lista de contatos (apenas sinalizar)
                    if (tooltip.id === 'tooltip_contatos_11') {
                        console.log('[Onboarding] Tooltip de lista de contatos - não rolando, apenas sinalizando...');
                        this.createTooltip(element, tooltip);
                    } else {
                        this.scrollToElement(element, () => {
                            console.log('[Onboarding] Rolou até elemento. Criando tooltip...');
                            this.createTooltip(element, tooltip);
                        });
                    }
                });
            }, delay);
            return;
        }

        if (!element) {
            console.warn(`[Onboarding] Elemento não encontrado: ${tooltip.selector}`);
            
            // Se o tooltip tem autoClick e requiresModalOpen, o elemento pode não estar visível ainda
            // Nesse caso, não pular - aguardar um pouco e tentar novamente
            if (tooltip.autoClick === true && tooltip.requiresModalOpen === true) {
                console.log('[Onboarding] Tooltip tem autoClick e requiresModalOpen - aguardando elemento aparecer...');
                // Aguardar um pouco e tentar novamente
                setTimeout(() => {
                    const retryElement = this.findElement(tooltip.selector);
                    if (retryElement) {
                        console.log('[Onboarding] Elemento encontrado na segunda tentativa!');
                        this.waitForElement(retryElement, () => {
                            this.scrollToElement(retryElement, () => {
                                this.createTooltip(retryElement, tooltip);
                            });
                        });
                    } else {
                        console.warn('[Onboarding] Elemento ainda não encontrado após retry, pulando...');
                        this.currentTooltipIndex++;
                        setTimeout(() => this.showNextTooltip(), 500);
                    }
                }, 1000);
                return;
            }
            
            console.log('[Onboarding] Pulando para próximo tooltip...');
            this.currentTooltipIndex++;
            setTimeout(() => this.showNextTooltip(), 500);
            return;
        }

        console.log('[Onboarding] Elemento encontrado! Aguardando estar visível...');
        console.log(`[Onboarding] Tooltip ${this.currentTooltipIndex + 1} de ${this.tooltips.length}`);
        console.log(`[Onboarding] ========================================`);
        
        // Se for tooltip centralizado (boas-vindas), não rolar - apenas criar
        if (tooltip.position === 'center') {
            console.log('[Onboarding] Tooltip centralizado - não precisa rolar, criando diretamente...');
            // Garantir que está no topo antes de criar tooltip centralizado
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            // Prevenir scroll durante a criação do tooltip
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                this.createTooltip(element, tooltip);
                // Restaurar scroll após tooltip ser criado
                setTimeout(() => {
                    document.body.style.overflow = originalOverflow;
                }, 200);
            }, 100);
            return;
        }
        
        // Verificar se elemento já está visível (otimização para dashboard)
        const rect = element.getBoundingClientRect();
        const isAlreadyVisible = rect.width > 0 && rect.height > 0 && 
                                rect.top >= 0 && rect.left >= 0 &&
                                rect.bottom <= window.innerHeight && 
                                rect.right <= window.innerWidth;
        
        // Se tooltip requer Grazi aberta ou modal aberto, sempre rolar para garantir visibilidade
        const requiresGraziOpen = tooltip.requiresGraziOpen === true;
        const requiresModalOpen = tooltip.requiresModalOpen === true;
        
        // Tooltips do dashboard que precisam sempre rolar (elementos que podem estar fora da viewport)
        const dashboardTooltipsThatNeedScroll = [
            'tooltip_dashboard_10', // Chamadas por Tipo
            'tooltip_dashboard_11'  // Performance por Assistente
        ];
        const needsScroll = dashboardTooltipsThatNeedScroll.includes(tooltip.id);
        
        // Verificar se elemento está bem visível (com margem de segurança)
        const isWellVisible = isAlreadyVisible && 
                             rect.top >= 100 && // Pelo menos 100px do topo
                             rect.bottom <= window.innerHeight - 100; // Pelo menos 100px do fundo
        
        if (isWellVisible && this.currentPage === 'dashboard' && !requiresGraziOpen && !requiresModalOpen && !needsScroll) {
            // No dashboard, se já está bem visível e não precisa de scroll forçado, criar tooltip IMEDIATAMENTE
            console.log('[Onboarding] Elemento já está bem visível no dashboard. Criando tooltip IMEDIATAMENTE...');
            this.createTooltip(element, tooltip);
        } else {
            // Aguardar elemento estar visível e rolar se necessário
            this.waitForElement(element, () => {
                console.log('[Onboarding] Elemento visível! Rolar até elemento antes de criar tooltip...');
                
                // Se está dentro da Grazi ou modal, rolar dentro do popup/modal
                if (requiresGraziOpen) {
                    // Aguardar um pouco para garantir que o popup está totalmente renderizado
                    setTimeout(() => {
                        this.scrollInsideGrazi(element, () => {
                            console.log('[Onboarding] Rolou dentro da Grazi. Criando tooltip...');
                            // Aguardar mais um pouco após o scroll para garantir que o elemento está visível
                            setTimeout(() => {
                                this.createTooltip(element, tooltip);
                            }, 100);
                        });
                    }, 200);
                } else if (requiresModalOpen) {
                    // Aguardar um pouco para garantir que o modal está totalmente renderizado
                    setTimeout(() => {
                        // Não rolar se for tooltip da lista de contatos (apenas sinalizar)
                        if (tooltip.id === 'tooltip_contatos_11') {
                            console.log('[Onboarding] Tooltip de lista de contatos - não rolando, apenas sinalizando...');
                            this.createTooltip(element, tooltip);
                        } else {
                            this.scrollInsideModal(element, tooltip.modalId, () => {
                                console.log('[Onboarding] Rolou dentro do modal. Criando tooltip...');
                                // Aguardar mais um pouco após o scroll para garantir que o elemento está visível
                                setTimeout(() => {
                                    this.createTooltip(element, tooltip);
                                }, 100);
                            });
                        }
                    }, 200);
                } else {
                    // Não rolar se for tooltip da lista de contatos (apenas sinalizar)
                    if (tooltip.id === 'tooltip_contatos_11') {
                        console.log('[Onboarding] Tooltip de lista de contatos - não rolando, apenas sinalizando...');
                        this.createTooltip(element, tooltip);
                    } else {
                        // Rolar suavemente até o elemento (especialmente importante para páginas com scroll)
                        // IMPORTANTE: Para tooltips do dashboard que precisam scroll, garantir que rolem
                        const dashboardTooltipsThatNeedScroll = [
                            'tooltip_dashboard_10', // Chamadas por Tipo
                            'tooltip_dashboard_11'  // Performance por Assistente
                        ];
                        const needsScroll = dashboardTooltipsThatNeedScroll.includes(tooltip.id);
                        
                        if (needsScroll) {
                            console.log('[Onboarding] Tooltip do dashboard que precisa scroll - rolando até elemento...');
                            // Verificar se elemento está visível
                            const rect = element.getBoundingClientRect();
                            const isVisible = rect.width > 0 && rect.height > 0;
                            
                            if (!isVisible) {
                                console.log('[Onboarding] Elemento não está visível, aguardando...');
                                // Aguardar elemento aparecer
                                setTimeout(() => {
                                    // Re-verificar elemento após delay
                                    const retryElement = this.findElementBySelector(tooltip.selector);
                                    if (retryElement) {
                                        this.scrollToElement(retryElement, () => {
                                            console.log('[Onboarding] Rolou até elemento. Aguardando estabilizar antes de criar tooltip...');
                                            // Aguardar um pouco mais para garantir que tudo está estável
                                            setTimeout(() => {
                                                // Re-verificar elemento novamente antes de criar
                                                const finalElement = this.findElementBySelector(tooltip.selector);
                                                if (finalElement) {
                                                    console.log('[Onboarding] Criando tooltip após scroll...');
                                                    this.createTooltip(finalElement, tooltip);
                                                } else {
                                                    console.warn('[Onboarding] Elemento não encontrado após scroll, tentando com elemento original...');
                                                    this.createTooltip(element, tooltip);
                                                }
                                            }, 200);
                                        });
                                    } else {
                                        console.warn('[Onboarding] Elemento não encontrado no retry, tentando scroll com elemento original...');
                                        this.scrollToElement(element, () => {
                                            setTimeout(() => {
                                                this.createTooltip(element, tooltip);
                                            }, 200);
                                        });
                                    }
                                }, 300);
                            } else {
                                // Elemento está visível, rolar mesmo assim para centralizar
                                this.scrollToElement(element, () => {
                                    console.log('[Onboarding] Rolou até elemento. Aguardando estabilizar antes de criar tooltip...');
                                    // Aguardar um pouco mais para garantir que tudo está estável
                                    setTimeout(() => {
                                        // Re-verificar elemento antes de criar
                                        const finalElement = this.findElementBySelector(tooltip.selector);
                                        if (finalElement) {
                                            console.log('[Onboarding] Criando tooltip após scroll...');
                                            this.createTooltip(finalElement, tooltip);
                                        } else {
                                            console.warn('[Onboarding] Elemento não encontrado após scroll, tentando com elemento original...');
                                            this.createTooltip(element, tooltip);
                                        }
                                    }, 200);
                                });
                            }
                        } else {
                            // Para outros tooltips, rolar normalmente
                            this.scrollToElement(element, () => {
                                console.log('[Onboarding] Rolou até elemento. Criando tooltip...');
                                this.createTooltip(element, tooltip);
                            });
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Reseta a flag de exibição (chamado quando tooltip é fechado)
     */
    resetShowingFlag() {
        this.isShowing = false;
    }

    /**
     * Encontra elemento por seletor (com suporte a :contains e outros)
     */
    findElementBySelector(selector) {
        // Remover :contains() se existir e extrair texto
        let cleanSelector = selector;
        let textToFind = null;
        
        if (selector.includes(':contains(')) {
            const match = selector.match(/:contains\("([^"]+)"\)/);
            if (match) {
                textToFind = match[1];
                cleanSelector = selector.replace(/:contains\("([^"]+)"\)/, '');
            }
        }

        // Se o seletor é especificamente para insights-btn, buscar diretamente o botão
        if (cleanSelector.includes('insights-btn') || cleanSelector === 'button.insights-btn') {
            // Buscar especificamente o botão, não minutos
            const insightsBtn = document.querySelector('button.insights-btn');
            if (insightsBtn) {
                console.log('[Onboarding] Botão Grazi Insights encontrado');
                return insightsBtn;
            }
            
            // Fallback: tentar por onclick
            const insightsBtnByOnclick = document.querySelector('button[onclick*="openInsightsPopup"]');
            if (insightsBtnByOnclick) return insightsBtnByOnclick;
            
            // Fallback: tentar por texto
            const allButtons = document.querySelectorAll('button');
            for (let btn of allButtons) {
                if (btn.textContent.includes('Grazi Insights') && btn.classList.contains('insights-btn')) {
                    return btn;
                }
            }
        }

        // Se o seletor é para floating-summary-btn, buscar diretamente o botão
        if (cleanSelector.includes('floating-summary-btn') || cleanSelector === '.floating-summary-btn') {
            const summaryBtn = document.querySelector('.floating-summary-btn');
            if (summaryBtn) {
                console.log('[Onboarding] Botão de Resumo encontrado');
                return summaryBtn;
            }
            
            // Fallback: tentar por onclick
            const summaryBtnByOnclick = document.querySelector('button[onclick*="openSummaryModal"]');
            if (summaryBtnByOnclick) {
                console.log('[Onboarding] Botão de Resumo encontrado por onclick');
                return summaryBtnByOnclick;
            }
        }
        
        // Se o seletor for 'body', retornar diretamente
        if (cleanSelector === 'body' || cleanSelector.trim() === 'body') {
            return document.body;
        }
        
        // Tentar seletores CSS diretos
        let element = document.querySelector(cleanSelector);
        if (element) {
            // Se encontrou um elemento interno de KPI, buscar o card pai
            if (element.id && element.id.startsWith('kpi') && element.closest('.kpi-card')) {
                return element.closest('.kpi-card');
            }
            // Se for um elemento de métrica, buscar o card pai
            if (element.id && (element.id === 'callsByType' || element.id === 'assistantPerformance')) {
                const metricCard = element.closest('.metric-card');
                if (metricCard) return metricCard;
            }
            // Se encontrou minutos-usage, retornar o container completo
            if (element.classList.contains('minutes-usage') || element.id === 'minutesUsed') {
                // Se o elemento é o span interno, buscar o container pai
                if (element.id === 'minutesUsed') {
                    const container = element.closest('.minutes-usage');
                    if (container) {
                        console.log('[Onboarding] Container de minutos encontrado');
                        return container;
                    }
                }
                return element;
            }
            return element;
        }

        // Se tem texto para buscar
        if (textToFind) {
            const allElements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
            for (let el of allElements) {
                if (el.textContent.trim().includes(textToFind)) {
                    return el;
                }
            }
        }

        // Tentar por data attributes
        const dataMatch = selector.match(/\[data-([^\]=]+)/);
        if (dataMatch) {
            const attrName = dataMatch[1];
            element = document.querySelector(`[data-${attrName}]`);
            if (element) return element;
        }

        // Tentar por classe parcial
        const classMatch = selector.match(/\.([a-z0-9-]+)/);
        if (classMatch) {
            const className = classMatch[1];
            const elements = document.querySelectorAll(`[class*="${className}"]`);
            if (elements.length > 0) return elements[0];
        }

        // Tentar por ID exato primeiro
        const idMatch = selector.match(/#([a-z0-9-]+)/);
        if (idMatch) {
            const idName = idMatch[1];
            // Tentar ID exato primeiro
            element = document.getElementById(idName);
            if (!element) {
                // Se não encontrar, tentar parcial
                element = document.querySelector(`[id*="${idName}"]`);
            }
            if (element) {
                // Se for um elemento interno de KPI, buscar o card pai
                if (element.id && element.id.startsWith('kpi') && element.closest('.kpi-card')) {
                    return element.closest('.kpi-card');
                }
                // Se for um elemento de métrica, buscar o card pai
                if (element.id && (element.id === 'callsByType' || element.id === 'assistantPerformance')) {
                    const metricCard = element.closest('.metric-card');
                    if (metricCard) return metricCard;
                }
                return element;
            }
        }

        return null;
    }

    /**
     * Aguarda elemento estar visível na tela
     */
    waitForElement(element, callback, maxAttempts = 5) {
        const checkVisibility = () => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;

            if (isVisible || maxAttempts <= 0) {
                callback();
            } else {
                setTimeout(checkVisibility, 100); // Reduzido de 200ms para 100ms
                maxAttempts--;
            }
        };

        checkVisibility();
    }

    /**
     * Rola dentro do modal para mostrar o elemento (campanhas)
     */
    scrollInsideModal(element, modalId, callback) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('[Onboarding] Modal não encontrado para scroll:', modalId);
            setTimeout(callback, 100);
            return;
        }
        
        // Encontrar o container scrollável dentro do modal
        const scrollableContainer = modal.querySelector('.call-now-dialog') || modal;
        
        if (!scrollableContainer) {
            console.warn('[Onboarding] Container scrollável do modal não encontrado');
            setTimeout(callback, 100);
            return;
        }
        
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollableContainer.getBoundingClientRect();
        
        // Calcular posição do elemento relativa ao container
        const elementTopRelative = elementRect.top - containerRect.top + (scrollableContainer.scrollTop || 0);
        // Centralizar o elemento na viewport do container
        const elementCenter = elementTopRelative - (containerRect.height / 2) + (elementRect.height / 2);
        
        // Verificar se precisa rolar
        const currentScroll = scrollableContainer.scrollTop || 0;
        const distance = Math.abs(elementCenter - currentScroll);
        
        if (distance < 50) {
            // Já está próximo, não precisa rolar
            console.log('[Onboarding] Elemento já está visível dentro do modal, não precisa rolar');
            setTimeout(callback, 100);
            return;
        }
        
        console.log('[Onboarding] Rolando dentro do modal até elemento...', {
            currentScroll,
            targetScroll: elementCenter,
            distance,
            elementTop: elementRect.top,
            containerTop: containerRect.top
        });
        
        // Rolar suavemente dentro do container
        scrollableContainer.scrollTo({
            top: Math.max(0, Math.min(elementCenter, (scrollableContainer.scrollHeight || 0) - containerRect.height)),
            behavior: 'smooth'
        });
        
        // Aguardar scroll terminar antes de chamar callback
        let scrollTimeout;
        const checkScroll = () => {
            const newScroll = scrollableContainer.scrollTop || 0;
            const newDistance = Math.abs(elementCenter - newScroll);
            
            if (newDistance < 10) {
                // Scroll terminou
                clearTimeout(scrollTimeout);
                console.log('[Onboarding] Scroll dentro do modal concluído!');
                setTimeout(callback, 150);
            } else {
                scrollTimeout = setTimeout(checkScroll, 50);
            }
        };
        
        // Começar a verificar após um pequeno delay
        setTimeout(checkScroll, 100);
        
        // Timeout de segurança (máximo 1 segundo)
        setTimeout(() => {
            clearTimeout(scrollTimeout);
            console.log('[Onboarding] Scroll timeout dentro do modal, continuando mesmo assim...');
            setTimeout(callback, 100);
        }, 1000);
    }
    
    /**
     * Rola dentro do popup da Grazi para mostrar o elemento
     */
    scrollInsideGrazi(element, callback) {
        const graziPopup = document.getElementById('insightsPopup');
        if (!graziPopup) {
            console.warn('[Onboarding] Popup da Grazi não encontrado para scroll');
            setTimeout(callback, 100);
            return;
        }
        
        // Encontrar o container scrollável dentro da Grazi
        // O .insights-popup-content tem overflow-y: scroll
        const scrollableContainer = graziPopup.querySelector('.insights-popup-content');
        
        if (!scrollableContainer) {
            console.warn('[Onboarding] Container scrollável da Grazi não encontrado');
            setTimeout(callback, 100);
            return;
        }
        
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollableContainer.getBoundingClientRect();
        
        // Calcular posição do elemento relativa ao container (mesma lógica do follow-up)
        const elementTopRelative = elementRect.top - containerRect.top + scrollableContainer.scrollTop;
        // Centralizar o elemento na viewport do container, deixando espaço para o tooltip
        const elementCenter = elementTopRelative - (containerRect.height / 2) + (elementRect.height / 2);
        
        // Verificar se precisa rolar
        const currentScroll = scrollableContainer.scrollTop;
        const distance = Math.abs(elementCenter - currentScroll);
        
        if (distance < 50) {
            // Já está próximo, não precisa rolar
            console.log('[Onboarding] Elemento já está visível dentro da Grazi, não precisa rolar');
            setTimeout(callback, 100);
            return;
        }
        
        console.log('[Onboarding] Rolando dentro da Grazi até elemento...', {
            currentScroll,
            targetScroll: elementCenter,
            distance,
            elementTop: elementRect.top,
            containerTop: containerRect.top,
            scrollHeight: scrollableContainer.scrollHeight,
            clientHeight: scrollableContainer.clientHeight
        });
        
        // Rolar suavemente dentro do container
        scrollableContainer.scrollTo({
            top: Math.max(0, Math.min(elementCenter, scrollableContainer.scrollHeight - containerRect.height)),
            behavior: 'smooth'
        });
        
        // Aguardar scroll terminar antes de chamar callback (mesma lógica do follow-up)
        let scrollTimeout;
        const checkScroll = () => {
            const newScroll = scrollableContainer.scrollTop;
            const newDistance = Math.abs(elementCenter - newScroll);
            
            if (newDistance < 10) {
                // Scroll terminou
                clearTimeout(scrollTimeout);
                console.log('[Onboarding] Scroll dentro da Grazi concluído!');
                setTimeout(callback, 150);
            } else {
                scrollTimeout = setTimeout(checkScroll, 50);
            }
        };
        
        // Começar a verificar após um pequeno delay
        setTimeout(checkScroll, 100);
        
        // Timeout de segurança (máximo 1 segundo)
        setTimeout(() => {
            clearTimeout(scrollTimeout);
            console.log('[Onboarding] Scroll timeout dentro da Grazi, continuando mesmo assim...');
            setTimeout(callback, 100);
        }, 1000);
    }
    
    /**
     * Rola suavemente até o elemento (importante para páginas com scroll)
     */
    scrollToElement(element, callback) {
        if (!element) {
            console.warn('[Onboarding] Elemento não encontrado para scroll');
            if (callback) callback();
            return;
        }
        
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + (window.pageYOffset || document.documentElement.scrollTop);
        const elementCenter = elementTop + (rect.height / 2);
        const viewportHeight = window.innerHeight;
        const targetScroll = Math.max(0, elementCenter - (viewportHeight / 2));
        
        // Verificar se precisa rolar
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const distance = Math.abs(targetScroll - currentScroll);
        
        console.log('[Onboarding] Verificando scroll necessário...', {
            elementTop,
            elementCenter,
            targetScroll,
            currentScroll,
            distance,
            rect: {
                top: rect.top,
                bottom: rect.bottom,
                height: rect.height,
                width: rect.width
            }
        });
        
        if (distance < 50) {
            // Já está próximo, não precisa rolar
            console.log('[Onboarding] Elemento já está visível, não precisa rolar');
            setTimeout(() => {
                if (callback) callback();
            }, 100);
            return;
        }
        
        console.log('[Onboarding] Rolando até elemento...', { currentScroll, targetScroll, distance });
        
        // Rolar suavemente
        window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
        });
        
        // Aguardar scroll terminar antes de chamar callback
        let scrollTimeout;
        let checkCount = 0;
        const maxChecks = 20; // Máximo de 20 verificações (1 segundo)
        
        const checkScroll = () => {
            checkCount++;
            const newScroll = window.pageYOffset || document.documentElement.scrollTop;
            const newDistance = Math.abs(targetScroll - newScroll);
            
            console.log('[Onboarding] Verificando scroll...', {
                checkCount,
                newScroll,
                targetScroll,
                newDistance
            });
            
            if (newDistance < 20 || checkCount >= maxChecks) {
                // Scroll terminou ou atingiu máximo de verificações
                clearTimeout(scrollTimeout);
                console.log('[Onboarding] Scroll concluído!', { newDistance, checkCount });
                setTimeout(() => {
                    if (callback) callback();
                }, 200); // Dar um tempo extra para o scroll finalizar completamente
            } else {
                scrollTimeout = setTimeout(checkScroll, 50);
            }
        };
        
        // Começar a verificar após um pequeno delay
        setTimeout(checkScroll, 100);
        
        // Timeout de segurança (máximo 1.5s)
        setTimeout(() => {
            clearTimeout(scrollTimeout);
            console.log('[Onboarding] Scroll timeout, continuando mesmo assim...');
            setTimeout(() => {
                if (callback) callback();
            }, 100);
        }, 1500);
    }

    /**
     * Cria e exibe o tooltip
     */
    createTooltip(targetElement, config) {
        // Limpar tooltips e overlays anteriores completamente
        const existingTooltip = document.getElementById('onboarding-tooltip');
        if (existingTooltip) {
            // Se já existe um tooltip sendo exibido, não criar novo
            if (existingTooltip.classList.contains('show')) {
                console.log('[Onboarding] Tooltip já está sendo exibido, não criando novo...');
                this.isShowing = false;
                return;
            }
            existingTooltip.style.display = 'none';
            existingTooltip.remove();
        }
        
        // Remover todos os overlays existentes
        const existingOverlays = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
        existingOverlays.forEach(ov => {
            ov.style.display = 'none';
            ov.style.pointerEvents = 'none';
            ov.remove();
        });
        
        // Para todos os tooltips, bloquear scroll e criar normalmente
        // O scroll já foi feito em showNextTooltip antes de chamar createTooltip
        this.blockScrollAndCreateTooltip(targetElement, config);
    }
    
    /**
     * Bloqueia scroll e cria o tooltip
     */
    blockScrollAndCreateTooltip(targetElement, config) {
        // BLOQUEAR SCROLL E INTERAÇÕES quando tooltip está ativo
        const originalOverflow = document.body.style.overflow;
        const originalPosition = document.body.style.position;
        const originalTop = document.body.style.top;
        const scrollY = window.scrollY;
        
        // Bloquear scroll
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        
        // Armazenar referência para restaurar depois
        this._scrollBlocked = true;
        this._originalBodyStyles = {
            overflow: originalOverflow,
            position: originalPosition,
            top: originalTop,
            scrollY: scrollY
        };
        
        // Bloquear scroll globalmente (prevenir wheel, touchmove, keydown)
        const preventScroll = (e) => {
            // Permitir scroll apenas dentro do tooltip
            if (e.target.closest('#onboarding-tooltip')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        };
        
        const preventKeys = (e) => {
            // Bloquear teclas de scroll (setas, page up/down, home, end)
            if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        
        // Adicionar listeners
        window.addEventListener('wheel', preventScroll, { passive: false, capture: true });
        window.addEventListener('touchmove', preventScroll, { passive: false, capture: true });
        window.addEventListener('keydown', preventKeys, { capture: true });
        
        // Armazenar listeners para remover depois
        this._scrollPreventers = {
            wheel: preventScroll,
            touchmove: preventScroll,
            keydown: preventKeys
        };

        // Verificar se está em página de demo
        const isDemoPage = window.location.pathname.includes('onboarding-tutorial-demo') || 
                          window.location.href.includes('onboarding-tutorial-demo');
        
        // Criar novo overlay (fundo escurecido)
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';
        
        // BLOQUEAR TODOS OS CLIQUES EXCETO NO ELEMENTO ALVO E NO TOOLTIP
        overlay.addEventListener('click', (e) => {
            // Permitir clique apenas no tooltip ou no elemento alvo
            const clickedElement = e.target;
            const isTooltip = clickedElement.closest('#onboarding-tooltip');
            const isTargetElement = targetElement && (
                clickedElement === targetElement || 
                clickedElement.closest(targetElement.tagName) ||
                (targetElement.id && clickedElement.closest(`#${targetElement.id}`)) ||
                (targetElement.className && clickedElement.closest(`.${targetElement.className.split(' ')[0]}`))
            );
            
            if (!isTooltip && !isTargetElement) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Clique bloqueado - apenas elemento alvo e tooltip são clicáveis');
                return false;
            }
        }, true); // Usar capture phase para interceptar antes
        
        // Bloquear scroll no overlay
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        overlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Se tooltip requer Grazi aberta, CRIAR overlay escurecido mas permitir clique no popup
        if (config.requiresGraziOpen === true) {
            // Criar overlay escurecido mas permitir interação com o popup da Grazi
            overlay.style.display = 'block';
            overlay.style.pointerEvents = 'auto';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            overlay.style.backdropFilter = 'blur(5px)';
            overlay.classList.add('onboarding-overlay-inside-grazi');
            // Permitir clique no popup da Grazi
            overlay.addEventListener('click', (e) => {
                const graziPopup = document.getElementById('insightsPopup');
                if (graziPopup && (e.target === graziPopup || e.target.closest('#insightsPopup'))) {
                    return; // Permitir clique no popup
                }
                e.preventDefault();
                e.stopPropagation();
            }, true);
        } else if (config.requiresModalOpen === true) {
            overlay.style.zIndex = '100049'; // Logo abaixo do tooltip
            overlay.classList.add('onboarding-overlay-inside-modal');
        } else {
            // Garantir z-index máximo para overlay normal
            overlay.style.zIndex = '99998';
        }
        
        // Se está em página de demo, bloquear TODOS os cliques exceto no elemento alvo e tooltip
        if (isDemoPage) {
            // Bloquear cliques em TODOS os elementos exceto o alvo e tooltip
            const blockClicks = (e) => {
                const clickedElement = e.target;
                const isTooltip = clickedElement.closest('#onboarding-tooltip');
                const isTargetElement = targetElement && (
                    clickedElement === targetElement || 
                    clickedElement.closest(targetElement.tagName) ||
                    (targetElement.id && clickedElement.closest(`#${targetElement.id}`)) ||
                    (targetElement.className && clickedElement.closest(`.${targetElement.className.split(' ')[0]}`))
                );
                
                if (!isTooltip && !isTargetElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    console.log('[Onboarding Demo] Clique bloqueado - apenas elemento alvo permitido');
                    return false;
                }
            };
            
            // Adicionar listeners para bloquear cliques
            document.addEventListener('click', blockClicks, true);
            document.addEventListener('mousedown', blockClicks, true);
            
            // Armazenar para remover depois
            if (!this._clickBlockers) {
                this._clickBlockers = [];
            }
            this._clickBlockers.push({
                type: 'click',
                handler: blockClicks,
                capture: true
            });
            this._clickBlockers.push({
                type: 'mousedown',
                handler: blockClicks,
                capture: true
            });
        }
        
        document.body.appendChild(overlay);

        // Criar tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'onboarding-tooltip';
        tooltip.className = 'onboarding-tooltip';
        
        // FORÇAR opacity e visibility IMEDIATAMENTE na criação
        tooltip.style.setProperty('opacity', '1', 'important');
        tooltip.style.setProperty('visibility', 'visible', 'important');
        tooltip.style.setProperty('display', 'block', 'important');
        
        // Se estiver na página seleciona-assistente, aplicar z-index máximo
        if (this.currentPage === 'seleciona-assistente') {
            tooltip.style.zIndex = '99999';
            overlay.style.zIndex = '99998';
            // Adicionar classe ao body para CSS
            document.body.classList.add('seleciona-assistente-page');
        }
        
        // Se não for tooltip centralizado (boas-vindas), destacar elemento alvo
        // Passar config para highlightTargetElement verificar se deve rolar
        if (config.position !== 'center') {
            this.highlightTargetElement(targetElement, config);
        }

        // Calcular posição
        const position = this.calculatePosition(targetElement, config.position, config);
        
        // Se for tooltip centralizado, usar posicionamento fixo absoluto
        if (config.position === 'center') {
            tooltip.style.position = 'fixed';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.style.margin = '0';
        } else {
            tooltip.style.top = position.top + 'px';
            tooltip.style.left = position.left + 'px';
        }
        tooltip.setAttribute('data-position', position.arrowPosition);
        tooltip.setAttribute('data-arrow-offset', position.arrowOffset || '50%');

        // Obter ícone SVG (se for chave, buscar na biblioteca; se for SVG direto, usar)
        let iconHTML = '';
        if (config.icon) {
            // Verificar se é uma chave da biblioteca de ícones
            if (typeof ONBOARDING_ICONS !== 'undefined' && ONBOARDING_ICONS[config.icon]) {
                iconHTML = ONBOARDING_ICONS[config.icon];
            } else if (config.icon.startsWith('<svg')) {
                // Já é SVG direto
                iconHTML = config.icon;
            } else {
                // Fallback: ícone padrão
                iconHTML = ONBOARDING_ICONS?.help || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            }
        } else {
            // Ícone padrão
            iconHTML = ONBOARDING_ICONS?.help || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        }

        // Calcular offset da seta em porcentagem ou pixels
        let arrowOffsetStyle = '50%';
        if (position.arrowOffset !== undefined) {
            if (typeof position.arrowOffset === 'number') {
                arrowOffsetStyle = position.arrowOffset + 'px';
            } else {
                arrowOffsetStyle = position.arrowOffset;
            }
        }

        // Verificar se é o primeiro tooltip
        const isFirstTooltip = this.currentTooltipIndex === 0;
        // Verificar se é o último tooltip
        const isLastTooltip = this.currentTooltipIndex === this.tooltips.length - 1;
        const tooltipId = config.id || `tooltip_${this.currentTooltipIndex}`;
        console.log('[Onboarding] Verificando tooltip:', {
            tooltipId: tooltipId,
            currentIndex: this.currentTooltipIndex,
            totalTooltips: this.tooltips.length,
            isLastTooltip: isLastTooltip,
            hasShowFinalOptions: config && config.showFinalOptions,
            tooltipIds: this.tooltips.map(t => t.id)
        });
        // Verificar se pode voltar (tem histórico)
        // Verificar se pode voltar
        // REGRA: Se estiver dentro de um modal/popup, NÃO pode voltar até que o modal seja fechado
        let canGoBack = false;
        if (this.tooltipHistory.length > 0) {
            // Se o tooltip atual requer modal aberto, NÃO pode voltar (regra estabelecida)
            if (config.requiresModalOpen === true && config.modalId) {
                // Verificar se o modal está realmente aberto
                const modal = document.getElementById(config.modalId);
                const isModalOpen = modal && (
                    modal.classList.contains('show') ||
                    modal.classList.contains('active') || 
                    modal.style.display !== 'none' &&
                    getComputedStyle(modal).display !== 'none'
                );
                
                // Se o modal está aberto, NÃO pode voltar
                if (isModalOpen) {
                    canGoBack = false;
                    console.log('[Onboarding] Modal aberto detectado. Botão "Voltar" desabilitado.');
                } else {
                    // Se o modal está fechado, pode voltar normalmente
                    canGoBack = true;
                }
            } else if (config.requiresGraziOpen === true) {
                // Se está em tooltip da Grazi, verificar se há tooltip anterior que também requer Grazi
                const previousIndex = this.tooltipHistory[this.tooltipHistory.length - 1];
                const previousTooltip = this.tooltips[previousIndex];
                // Só pode voltar se o tooltip anterior também requer Grazi (ou seja, está dentro da Grazi)
                canGoBack = previousTooltip && previousTooltip.requiresGraziOpen === true;
            } else {
                // Se não está em tooltip da Grazi ou modal, pode voltar normalmente
                canGoBack = true;
            }
        }
        // Verificar se tooltip atual tem nextPage configurado (navegação direta)
        const hasDirectNextPage = config && config.nextPage;
        
        // Verificar se é dashboard e tem próxima página (campanhas)
        const hasNextPage = this.currentPage === 'dashboard';
        const isLastTooltipDashboard = isLastTooltip && hasNextPage;
        
        // Verificar se é campanhas e tem próxima página (follow-up)
        const hasNextPageFollowUp = this.currentPage === 'campanhas';
        const isLastTooltipCampanhas = isLastTooltip && hasNextPageFollowUp;
        
        // Verificar se é follow-up e tem próxima página (assistentes)
        const hasNextPageAssistentes = this.currentPage === 'follow-up';
        const isLastTooltipFollowUp = isLastTooltip && hasNextPageAssistentes;
        

        // Conteúdo do tooltip
        const arrowHTML = position.arrowPosition !== 'none' 
            ? `<div class="onboarding-tooltip-arrow" data-position="${position.arrowPosition}" style="--arrow-offset: ${arrowOffsetStyle}"></div>`
            : '';
        
        // Determinar qual botão mostrar
        const hasReturnToPage = config.returnToPage;
        const hasContinueToActions = config.continueToActions;
        // Verificar se nextPage aponta para follow-up, assistentes ou seleciona-assistente para mostrar texto especial
        const isNextPageToFollowUp = hasDirectNextPage && config.nextPage && config.nextPage.includes('follow-up');
        const isNextPageToAssistentes = hasDirectNextPage && config.nextPage && config.nextPage.includes('assistente');
        const isNextPageToSelecionaAssistente = hasDirectNextPage && config.nextPage && config.nextPage.includes('seleciona-assistente');
        let actionButton = '';
        if (hasDirectNextPage) {
            // Se tem nextPage configurado, verificar se é follow-up, assistentes ou seleciona-assistente para mostrar texto especial
            if (isNextPageToFollowUp) {
                actionButton = '<button class="onboarding-tooltip-btn understood next-page-direct">Continuar</button>';
            } else if (isNextPageToSelecionaAssistente) {
                actionButton = '<button class="onboarding-tooltip-btn understood next-page-direct">Ver Nova Campanha</button>';
            } else if (isNextPageToAssistentes) {
                actionButton = '<button class="onboarding-tooltip-btn understood next-page-direct">Ver Tutorial dos Assistentes</button>';
            } else {
                actionButton = '<button class="onboarding-tooltip-btn understood next-page-direct">Próximo</button>';
            }
        } else if (hasReturnToPage && isLastTooltip) {
            // Se tem returnToPage e é o último tooltip, mostrar botão "Próximo" para voltar
            actionButton = '<button class="onboarding-tooltip-btn understood finish">Próximo</button>';
        } else if (hasContinueToActions) {
            // Se tem continueToActions, mostrar "Próximo" para continuar com ações (não precisa ser último)
            actionButton = '<button class="onboarding-tooltip-btn understood continue-actions">Próximo</button>';
        } else if (config.showFinalOptions && isLastTooltip) {
            // Tooltip final com opções: Ver Tutorial de Campanhas, Voltar, Fechar
            console.log('[Onboarding] Mostrando tooltip final com opções!', {
                tooltipId: tooltipId,
                isLastTooltip: isLastTooltip,
                currentIndex: this.currentTooltipIndex,
                totalTooltips: this.tooltips.length,
                config: config
            });
            actionButton = `
                <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                    <button class="onboarding-tooltip-btn next-page campanhas" style="width: 100%;">Ver Tutorial de Campanhas</button>
                    <div style="display: flex; gap: 0.5rem; width: 100%;">
                        <button class="onboarding-tooltip-btn back" style="flex: 1;">Voltar</button>
                        <button class="onboarding-tooltip-btn understood finish encerrar-tutorial" style="flex: 1;">Fechar Tutorial</button>
                    </div>
                </div>
            `;
        } else if (isLastTooltipDashboard) {
            actionButton = '<button class="onboarding-tooltip-btn next-page campanhas">Tutorial de Campanhas</button>';
        } else if (isLastTooltipCampanhas) {
            actionButton = '<button class="onboarding-tooltip-btn next-page follow-up">Tutorial de Follow-up</button>';
        } else if (isLastTooltipFollowUp) {
            actionButton = '<button class="onboarding-tooltip-btn next-page assistentes">Tutorial de Assistentes</button>';
        } else if (isLastTooltip) {
            // Se for o último tooltip e estiver na página de demo, mostrar opções "Repetir" e "Encerrar"
            if (this.currentPage === 'onboarding-tutorial-demo') {
                actionButton = `
                    <div style="display: flex; gap: 0.5rem; width: 100%;">
                        <button class="onboarding-tooltip-btn understood repeat-tutorial" style="flex: 1;">Repetir</button>
                        <button class="onboarding-tooltip-btn understood finish encerrar-tutorial" style="flex: 1;">Encerrar</button>
                    </div>
                `;
            } else {
                actionButton = '<button class="onboarding-tooltip-btn understood finish">Entendi, finalizar</button>';
            }
        } else {
            actionButton = '<button class="onboarding-tooltip-btn understood">Próximo</button>';
        }
        
        // Verificar se está em página de demo - remover botão X
        const isDemoPage = window.location.pathname.includes('onboarding-tutorial-demo') || 
                          window.location.href.includes('onboarding-tutorial-demo');
        const closeButtonHTML = isDemoPage ? '' : '<button class="onboarding-tooltip-close" aria-label="Fechar">×</button>';
        
        tooltip.innerHTML = `
            ${arrowHTML}
            ${closeButtonHTML}
            <div class="onboarding-tooltip-icon">${iconHTML}</div>
            <div class="onboarding-tooltip-content">
                <h3 class="onboarding-tooltip-title">${config.title}</h3>
                <p class="onboarding-tooltip-text">${config.text}</p>
            </div>
            <div class="onboarding-tooltip-actions">
                ${canGoBack ? '<button class="onboarding-tooltip-btn back">Voltar</button>' : ''}
                ${actionButton}
                <button class="onboarding-tooltip-btn disable-all">Não mostrar mais</button>
            </div>
        `;
        
        // Se for tooltip centralizado, adicionar classe especial e aumentar tamanho
        if (config.position === 'center') {
            tooltip.classList.add('onboarding-tooltip-center');
            tooltip.style.width = '400px';
            tooltip.style.minHeight = '220px';
            // Garantir centralização absoluta
            tooltip.style.position = 'fixed';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            tooltip.style.margin = '0';
        }
        
        // FORÇAR z-index MÁXIMO para todos os tooltips - acima de TUDO
        tooltip.style.zIndex = '9999999';
        tooltip.style.position = 'fixed'; // Sempre usar fixed para garantir posicionamento correto
        
        // Se tooltip requer Grazi aberta ou modal aberto, garantir z-index ainda mais alto
        if (config.requiresGraziOpen === true) {
            tooltip.style.zIndex = '100050'; // Acima do popup da Grazi (geralmente 10000-10040)
            tooltip.classList.add('onboarding-tooltip-inside-grazi');
        } else if (config.requiresModalOpen === true) {
            // FORÇAR z-index máximo para tooltips dentro de modal
            tooltip.style.zIndex = '9999999'; // Z-index extremamente alto
            tooltip.style.position = 'fixed'; // Garantir position fixed
            tooltip.classList.add('onboarding-tooltip-inside-modal');
            console.log('[Onboarding] Tooltip dentro de modal criado com z-index 9999999');
        }
        
        // FORÇAR z-index MÁXIMO para overlay também
        if (overlay) {
            overlay.style.zIndex = '9999998';
            overlay.style.position = 'fixed';
        }
        
        // Garantir que overlay também tenha z-index alto se tooltip está em modal
        if (config.requiresModalOpen === true && overlay) {
            // FORÇAR z-index máximo para overlay dentro de modal
            overlay.style.zIndex = '9999998'; // Z-index extremamente alto
            overlay.style.position = 'fixed'; // Garantir position fixed
            overlay.classList.add('onboarding-overlay-inside-modal');
            console.log('[Onboarding] Overlay dentro de modal criado com z-index 9999998');
        }

        // FORÇAR opacity ANTES de adicionar ao DOM
        tooltip.style.setProperty('opacity', '1', 'important');
        tooltip.style.setProperty('visibility', 'visible', 'important');
        tooltip.style.setProperty('display', 'block', 'important');
        
        document.body.appendChild(tooltip);
        
        // FORÇAR NOVAMENTE DEPOIS de adicionar ao DOM
        tooltip.style.setProperty('opacity', '1', 'important');
        tooltip.style.setProperty('visibility', 'visible', 'important');
        tooltip.style.setProperty('display', 'block', 'important');
        
        // Verificar e ajustar posição após tooltip ser renderizado (para pegar tamanho real)
        this.adjustTooltipPositionIfClipped(tooltip, targetElement, config);
        
        // LOG DETALHADO para TODOS os tooltips - após criar
        console.log('[Onboarding] ========================================');
        console.log('[Onboarding] TOOLTIP CRIADO E ADICIONADO AO DOM!');
        console.log('[Onboarding] Tooltip ID:', config.id);
        console.log('[Onboarding] Tooltip elemento:', tooltip);
        console.log('[Onboarding] Tooltip z-index:', tooltip.style.zIndex);
        console.log('[Onboarding] Tooltip position:', tooltip.style.position);
        console.log('[Onboarding] Tooltip top:', tooltip.style.top);
        console.log('[Onboarding] Tooltip left:', tooltip.style.left);
        console.log('[Onboarding] Tooltip classes:', tooltip.className);
        console.log('[Onboarding] Tooltip no DOM:', document.body.contains(tooltip));
        console.log('[Onboarding] Tooltip display:', getComputedStyle(tooltip).display);
        console.log('[Onboarding] Tooltip visibility:', getComputedStyle(tooltip).visibility);
        console.log('[Onboarding] Tooltip opacity:', getComputedStyle(tooltip).opacity);
        console.log('[Onboarding] Tooltip opacity (inline):', tooltip.style.opacity);
        console.log('[Onboarding] Overlay z-index:', overlay ? overlay.style.zIndex : 'N/A');
        console.log('[Onboarding] ========================================');

        // Animar entrada
        setTimeout(() => {
            // Verificar novamente se não há outro tooltip sendo exibido
            const otherTooltip = document.getElementById('onboarding-tooltip');
            if (otherTooltip && otherTooltip !== tooltip && otherTooltip.classList.contains('show')) {
                console.log('[Onboarding] Outro tooltip detectado durante criação, cancelando...');
                tooltip.remove();
                if (overlay) overlay.remove();
                this.isShowing = false;
                return;
            }
            // FORÇAR opacity ANTES de adicionar classe show
            tooltip.style.cssText += 'opacity: 1 !important; visibility: visible !important; display: block !important;';
            tooltip.style.setProperty('opacity', '1', 'important');
            tooltip.style.setProperty('visibility', 'visible', 'important');
            tooltip.style.setProperty('display', 'block', 'important');
            
            tooltip.classList.add('show');
            if (overlay) overlay.classList.add('show');
            
            // Se for tooltip centralizado, garantir que o transform de centralização seja mantido
            if (config.position === 'center') {
                tooltip.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
                tooltip.style.setProperty('position', 'fixed', 'important');
                tooltip.style.setProperty('top', '50%', 'important');
                tooltip.style.setProperty('left', '50%', 'important');
            }
            
            // FORÇAR NOVAMENTE DEPOIS de adicionar classe
            tooltip.style.cssText += 'opacity: 1 !important; visibility: visible !important; display: block !important;';
            tooltip.style.setProperty('opacity', '1', 'important');
            tooltip.style.setProperty('visibility', 'visible', 'important');
            tooltip.style.setProperty('display', 'block', 'important');
            
            if (overlay) {
                overlay.style.setProperty('opacity', '1', 'important');
                overlay.style.setProperty('visibility', 'visible', 'important');
            }
            
            // FORÇAR MÚLTIPLAS VEZES para garantir
            setTimeout(() => {
                tooltip.style.setProperty('opacity', '1', 'important');
                tooltip.style.setProperty('visibility', 'visible', 'important');
                tooltip.style.setProperty('display', 'block', 'important');
            }, 0);
            
            requestAnimationFrame(() => {
                tooltip.style.setProperty('opacity', '1', 'important');
                tooltip.style.setProperty('visibility', 'visible', 'important');
                tooltip.style.setProperty('display', 'block', 'important');
                
                // Se for tooltip centralizado, garantir centralização novamente
                if (config.position === 'center') {
                    tooltip.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
                    tooltip.style.setProperty('position', 'fixed', 'important');
                    tooltip.style.setProperty('top', '50%', 'important');
                    tooltip.style.setProperty('left', '50%', 'important');
                }
                
                requestAnimationFrame(() => {
                    tooltip.style.setProperty('opacity', '1', 'important');
                    tooltip.style.setProperty('visibility', 'visible', 'important');
                    tooltip.style.setProperty('display', 'block', 'important');
                    
                    // Se for tooltip centralizado, garantir centralização novamente
                    if (config.position === 'center') {
                        tooltip.style.setProperty('transform', 'translate(-50%, -50%) scale(1)', 'important');
                        tooltip.style.setProperty('position', 'fixed', 'important');
                        tooltip.style.setProperty('top', '50%', 'important');
                        tooltip.style.setProperty('left', '50%', 'important');
                    }
                    
                    // LOG DETALHADO para TODOS os tooltips - após mostrar
                    console.log('[Onboarding] ========================================');
                    console.log('[Onboarding] TOOLTIP MOSTRADO (classe "show" adicionada)!');
                    console.log('[Onboarding] Tooltip ID:', config.id);
                    console.log('[Onboarding] Tooltip visível:', tooltip.classList.contains('show'));
                    console.log('[Onboarding] Tooltip display:', getComputedStyle(tooltip).display);
                    console.log('[Onboarding] Tooltip opacity:', getComputedStyle(tooltip).opacity);
                    console.log('[Onboarding] Tooltip opacity (style inline):', tooltip.style.opacity);
                    console.log('[Onboarding] Tooltip visibility:', getComputedStyle(tooltip).visibility);
                    console.log('[Onboarding] Tooltip z-index:', getComputedStyle(tooltip).zIndex);
                    console.log('[Onboarding] Tooltip position:', getComputedStyle(tooltip).position);
                    console.log('[Onboarding] Tooltip top:', getComputedStyle(tooltip).top);
                    console.log('[Onboarding] Tooltip left:', getComputedStyle(tooltip).left);
                    console.log('[Onboarding] Tooltip width:', getComputedStyle(tooltip).width);
                    console.log('[Onboarding] Tooltip height:', getComputedStyle(tooltip).height);
                    console.log('[Onboarding] Tooltip no viewport:', tooltip.getBoundingClientRect());
                    console.log('[Onboarding] Overlay visível:', overlay ? overlay.classList.contains('show') : 'N/A');
                    console.log('[Onboarding] ========================================');
                    
                    // Verificar novamente após animação se tooltip ainda está visível
                    this.adjustTooltipPositionIfClipped(tooltip, targetElement, config);
                });
            });
        }, 10);

        // Event listeners
        this.attachEventListeners(tooltip, config.id, targetElement);
    }

    /**
     * Calcula a posição ideal do tooltip - apontando exatamente para o elemento
     * Usa coordenadas da viewport (getBoundingClientRect) para posicionamento fixo
     */
    calculatePosition(element, preferredPosition, config = null) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        // Reduzir spacing para tooltips dentro de modais (mais próximo dos elementos)
        const spacing = (config && config.requiresModalOpen === true) ? 6 : 12;
        const arrowSize = 10;

        // Se for posição centralizada, retornar valores diretos
        if (preferredPosition === 'center') {
            return {
                top: (viewportHeight / 2) - (tooltipHeight / 2),
                left: (viewportWidth / 2) - (tooltipWidth / 2),
                arrowPosition: 'none',
                arrowOffset: 0
            };
        }

        const rect = element.getBoundingClientRect();
        
        // Coordenadas do elemento na viewport
        const elementCenterX = rect.left + (rect.width / 2);
        const elementCenterY = rect.top + (rect.height / 2);
        const elementTop = rect.top;
        const elementLeft = rect.left;
        const elementRight = rect.right;
        const elementBottom = rect.bottom;

        let top, left, arrowPosition, arrowOffset = 0;

        // Tentar posição preferida primeiro
        switch (preferredPosition) {
            case 'center':
                // Centralizar tooltip na tela (para mensagem de boas-vindas)
                top = (viewportHeight / 2) - (tooltipHeight / 2);
                left = (viewportWidth / 2) - (tooltipWidth / 2);
                arrowPosition = 'none'; // Sem seta para tooltip centralizado
                arrowOffset = 0;
                break;
            case 'bottom':
                top = elementBottom + spacing;
                // Para tooltips dentro de modais, alinhar mais próximo do elemento (borda esquerda)
                if (config && config.requiresModalOpen === true) {
                    // Alinhar com a borda esquerda do elemento (mais próximo e alinhado)
                    left = elementLeft;
                } else {
                    // Alinhar mais à direita: tooltip começa próximo à borda direita do elemento
                    // Mas mantém uma margem para não sair da tela
                    left = elementRight - tooltipWidth + 40; // Alinha com a borda direita, mas deixa 40px de margem
                }
                arrowPosition = 'top';
                // Seta aponta para o centro do elemento (offset relativo ao tooltip)
                arrowOffset = elementCenterX - left;
                break;
            case 'top':
                // Aplicar offset customizado se configurado
                const customTopOffset = (config && config.customOffset && config.customOffset.top) ? config.customOffset.top : 0;
                top = elementTop - tooltipHeight - spacing + customTopOffset;
                left = elementCenterX - (tooltipWidth / 2);
                arrowPosition = 'bottom';
                arrowOffset = elementCenterX - left;
                break;
            case 'right':
                top = elementCenterY - (tooltipHeight / 2);
                // Para tooltips dentro de modais, garantir que fique bem visível à direita
                if (config && config.requiresModalOpen === true) {
                    left = elementRight + spacing;
                } else {
                    left = elementRight + spacing;
                }
                arrowPosition = 'left';
                arrowOffset = elementCenterY - top;
                break;
            case 'left':
                top = elementCenterY - (tooltipHeight / 2);
                // Posicionar à esquerda do elemento
                left = elementLeft - tooltipWidth - spacing;
                arrowPosition = 'right';
                arrowOffset = elementCenterY - top;
                break;
            default:
                top = elementBottom + spacing;
                left = elementCenterX - (tooltipWidth / 2);
                arrowPosition = 'top';
                arrowOffset = elementCenterX - left;
        }

        // Ajustar se sair da tela
        const padding = 20;

        // Ajustar horizontalmente
        // Se a posição preferida é 'left', tentar manter à esquerda do elemento
        if (preferredPosition === 'left' && left < padding) {
            // Tooltip não cabe completamente à esquerda, ajustar apenas o mínimo necessário
            // para não sair da tela, mas manter o máximo possível à esquerda
            left = padding;
            // Ajustar offset da seta para apontar para o centro do elemento
            arrowOffset = elementCenterY - top;
        } else if (left < padding) {
            const adjustment = padding - left;
            left = padding;
            // Ajustar offset da seta quando tooltip é movido
            arrowOffset = Math.max(30, arrowOffset - adjustment);
        } else if (left + tooltipWidth > viewportWidth - padding) {
            const adjustment = (left + tooltipWidth) - (viewportWidth - padding);
            left = viewportWidth - tooltipWidth - padding;
            arrowOffset = Math.min(tooltipWidth - 30, arrowOffset + adjustment);
        }

        // Ajustar verticalmente
        if (top < padding) {
            top = elementBottom + spacing;
            arrowPosition = 'top';
            arrowOffset = elementCenterX - left;
            // Reajustar horizontalmente se necessário
            if (left < padding) left = padding;
            if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding;
            arrowOffset = elementCenterX - left;
        } else if (top + tooltipHeight > viewportHeight - padding) {
            top = elementTop - tooltipHeight - spacing;
            arrowPosition = 'bottom';
            arrowOffset = elementCenterX - left;
            // Reajustar horizontalmente se necessário
            if (left < padding) left = padding;
            if (left + tooltipWidth > viewportWidth - padding) left = viewportWidth - tooltipWidth - padding;
            arrowOffset = elementCenterX - left;
        }

        // Garantir que arrowOffset está dentro dos limites do tooltip (30px de margem)
        arrowOffset = Math.max(30, Math.min(tooltipWidth - 30, arrowOffset));

        return { 
            top, 
            left, 
            arrowPosition,
            arrowOffset 
        };
    }

    /**
     * Restaura o scroll do body após tooltip ser fechado
     */
    restoreBodyScroll() {
        if (this._scrollBlocked && this._originalBodyStyles) {
            document.body.style.overflow = this._originalBodyStyles.overflow || '';
            document.body.style.position = this._originalBodyStyles.position || '';
            document.body.style.top = this._originalBodyStyles.top || '';
            document.body.style.width = '';
            
            // Restaurar posição de scroll
            if (this._originalBodyStyles.scrollY !== undefined) {
                window.scrollTo(0, this._originalBodyStyles.scrollY);
            }
            
            // Remover listeners de prevenção de scroll
            if (this._scrollPreventers) {
                window.removeEventListener('wheel', this._scrollPreventers.wheel, { capture: true });
                window.removeEventListener('touchmove', this._scrollPreventers.touchmove, { capture: true });
                window.removeEventListener('keydown', this._scrollPreventers.keydown, { capture: true });
                this._scrollPreventers = null;
            }
            
            // Remover bloqueadores de clique (páginas de demo)
            if (this._clickBlockers && Array.isArray(this._clickBlockers)) {
                this._clickBlockers.forEach(blocker => {
                    document.removeEventListener(blocker.type, blocker.handler, blocker.capture);
                });
                this._clickBlockers = [];
            }
            
            this._scrollBlocked = false;
            this._originalBodyStyles = null;
            console.log('[Onboarding] Scroll do body restaurado');
        }
    }

    /**
     * Remove tooltip e overlay de forma segura, restaurando scroll
     */
    safeRemoveTooltip(tooltip, overlay) {
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        // Restaurar scroll
        this.restoreBodyScroll();
        
        setTimeout(() => {
            if (tooltip && tooltip.parentNode) tooltip.remove();
            if (overlay && overlay.parentNode) overlay.remove();
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
        }, 300);
    }

    /**
     * Ajusta a posição do tooltip se estiver cortado pelas bordas da tela
     * Usa o tamanho real do tooltip após renderização
     */
    adjustTooltipPositionIfClipped(tooltip, targetElement, config) {
        // Não ajustar tooltips centralizados
        if (config.position === 'center') {
            return;
        }

        // Aguardar um frame para o tooltip ter seu tamanho real calculado
        requestAnimationFrame(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 20; // Margem mínima das bordas
            
            let needsAdjustment = false;
            let newTop = parseFloat(tooltip.style.top) || 0;
            let newLeft = parseFloat(tooltip.style.left) || 0;
            
            // Verificar se está cortado à esquerda
            if (tooltipRect.left < padding) {
                const adjustment = padding - tooltipRect.left;
                newLeft = newLeft + adjustment;
                needsAdjustment = true;
                console.log('[Onboarding] Tooltip cortado à esquerda, ajustando...', { left: tooltipRect.left, adjustment, newLeft });
            }
            
            // Verificar se está cortado à direita
            if (tooltipRect.right > viewportWidth - padding) {
                const adjustment = tooltipRect.right - (viewportWidth - padding);
                newLeft = newLeft - adjustment;
                needsAdjustment = true;
                console.log('[Onboarding] Tooltip cortado à direita, ajustando...', { right: tooltipRect.right, viewportWidth, adjustment, newLeft });
            }
            
            // Verificar se está cortado no topo
            if (tooltipRect.top < padding) {
                const adjustment = padding - tooltipRect.top;
                newTop = newTop + adjustment;
                needsAdjustment = true;
                console.log('[Onboarding] Tooltip cortado no topo, ajustando...', { top: tooltipRect.top, adjustment, newTop });
            }
            
            // Verificar se está cortado na parte inferior
            if (tooltipRect.bottom > viewportHeight - padding) {
                const adjustment = tooltipRect.bottom - (viewportHeight - padding);
                newTop = newTop - adjustment;
                needsAdjustment = true;
                console.log('[Onboarding] Tooltip cortado na parte inferior, ajustando...', { bottom: tooltipRect.bottom, viewportHeight, adjustment, newTop });
            }
            
            // Aplicar ajustes se necessário
            if (needsAdjustment) {
                // Garantir que não saia da tela após ajuste
                newLeft = Math.max(padding, Math.min(newLeft, viewportWidth - tooltipRect.width - padding));
                newTop = Math.max(padding, Math.min(newTop, viewportHeight - tooltipRect.height - padding));
                
                tooltip.style.top = newTop + 'px';
                tooltip.style.left = newLeft + 'px';
                
                // Recalcular offset da seta se necessário
                if (targetElement) {
                    const elementRect = targetElement.getBoundingClientRect();
                    const elementCenterX = elementRect.left + (elementRect.width / 2);
                    const elementCenterY = elementRect.top + (elementRect.height / 2);
                    
                    const arrowPosition = tooltip.getAttribute('data-position');
                    let arrowOffset = 0;
                    
                    if (arrowPosition === 'top' || arrowPosition === 'bottom') {
                        arrowOffset = elementCenterX - newLeft;
                    } else if (arrowPosition === 'left' || arrowPosition === 'right') {
                        arrowOffset = elementCenterY - newTop;
                    }
                    
                    // Garantir que arrowOffset está dentro dos limites (30px de margem)
                    const tooltipWidth = tooltipRect.width;
                    const tooltipHeight = tooltipRect.height;
                    if (arrowPosition === 'top' || arrowPosition === 'bottom') {
                        arrowOffset = Math.max(30, Math.min(tooltipWidth - 30, arrowOffset));
                    } else {
                        arrowOffset = Math.max(30, Math.min(tooltipHeight - 30, arrowOffset));
                    }
                    
                    tooltip.setAttribute('data-arrow-offset', arrowOffset + 'px');
                    console.log('[Onboarding] Offset da seta recalculado:', arrowOffset);
                }
                
                console.log('[Onboarding] Posição do tooltip ajustada para evitar corte:', { newTop, newLeft });
            }
        });
    }

    /**
     * Anexa event listeners ao tooltip
     */
    attachEventListeners(tooltip, tooltipId, targetElement) {
        const closeBtn = tooltip.querySelector('.onboarding-tooltip-close');
        const understoodBtn = tooltip.querySelector('.onboarding-tooltip-btn.understood');
        const backBtn = tooltip.querySelector('.onboarding-tooltip-btn.back');
        const nextPageBtn = tooltip.querySelector('.onboarding-tooltip-btn.next-page');
        const disableAllBtn = tooltip.querySelector('.onboarding-tooltip-btn.disable-all');
        const openGraziBtn = tooltip.querySelector('.onboarding-tooltip-btn.open-grazi');
        const overlay = document.getElementById('onboarding-overlay');

        const isLastTooltip = this.currentTooltipIndex === this.tooltips.length - 1;
        
        // Debug: verificar se botões foram encontrados
        console.log('[Onboarding] Botões encontrados:', {
            closeBtn: !!closeBtn,
            understoodBtn: !!understoodBtn,
            backBtn: !!backBtn,
            nextPageBtn: !!nextPageBtn,
            disableAllBtn: !!disableAllBtn,
            openGraziBtn: !!openGraziBtn,
            nextPageBtnClasses: nextPageBtn ? nextPageBtn.className : null
        });
        
        // Se está em página de demo, não permitir fechar pelo X (só pelo "Não mostrar mais")
        const isDemoPage = window.location.pathname.includes('onboarding-tutorial-demo') || 
                          window.location.href.includes('onboarding-tutorial-demo');

        const closeTooltip = () => {
            // Se o tooltip tem closeDropdownAfter, fechar o dropdown ao fechar o tooltip
            if (currentTooltipConfig && currentTooltipConfig.closeDropdownAfter && currentTooltipConfig.dropdownToClose) {
                const dropdownToClose = document.querySelector(currentTooltipConfig.dropdownToClose);
                if (dropdownToClose) {
                    dropdownToClose.classList.remove('active');
                    dropdownToClose.classList.remove('show');
                    const filterButton = document.querySelector('#filterButton');
                    if (filterButton) {
                        filterButton.classList.remove('active');
                    }
                    console.log('[Onboarding] Dropdown fechado após tooltip de instância');
                }
            }
            this.closeTooltip(tooltip, tooltipId, false);
        };

        const advanceTooltip = () => {
            // Se o tooltip tem skipValidation e está dentro de um modal, avançar step sem validar
            if (currentTooltipConfig && currentTooltipConfig.skipValidation === true && currentTooltipConfig.requiresModalOpen === true) {
                console.log('[Onboarding] Tooltip com skipValidation detectado. Avançando step do wizard sem validar...');
                
                const modal = document.getElementById(currentTooltipConfig.modalId);
                if (modal && modal.style.display !== 'none') {
                    // Encontrar o step atual ativo
                    const activeStep = modal.querySelector('.wizard-step.active');
                    if (activeStep) {
                        const stepId = activeStep.id;
                        console.log('[Onboarding] Step atual:', stepId);
                        
                        // Avançar para o próximo step sem validar
                        if (stepId === 'wizardStep1_1' && typeof nextSubStep === 'function') {
                            window.__onboardingSkipValidation = true;
                            try {
                                nextSubStep('1_2');
                                console.log('[Onboarding] Avançado para step 1_2 sem validar');
                            } catch (err) {
                                console.warn('[Onboarding] Erro ao avançar step:', err);
                            }
                            window.__onboardingSkipValidation = false;
                        } else if (stepId === 'wizardStep1_2' && typeof nextSubStep === 'function') {
                            window.__onboardingSkipValidation = true;
                            try {
                                nextSubStep('1_3');
                                console.log('[Onboarding] Avançado para step 1_3 sem validar');
                            } catch (err) {
                                console.warn('[Onboarding] Erro ao avançar step:', err);
                            }
                            window.__onboardingSkipValidation = false;
                        } else if (stepId === 'wizardStep1_3' && typeof nextStep === 'function') {
                            window.__onboardingSkipValidation = true;
                            try {
                                nextStep(2);
                                console.log('[Onboarding] Avançado para step 2 sem validar');
                            } catch (err) {
                                console.warn('[Onboarding] Erro ao avançar step:', err);
                            }
                            window.__onboardingSkipValidation = false;
                        } else if (stepId === 'wizardStep4' && typeof nextStep === 'function') {
                            // Para o step 4 (prompt), avançar sem validar
                            window.__onboardingSkipValidation = true;
                            try {
                                nextStep(5);
                                console.log('[Onboarding] Avançado para step 5 (revisão) sem validar');
                            } catch (err) {
                                console.warn('[Onboarding] Erro ao avançar step:', err);
                            }
                            window.__onboardingSkipValidation = false;
                        }
                    }
                }
            }
            
            // Usar sempre a função closeTooltip normal (fluxo natural)
            this.closeTooltip(tooltip, tooltipId, true);
        };

        const finishOnboarding = () => {
            this.finishOnboarding(tooltip, tooltipId);
        };

        // Só adicionar listener do X se não estiver em página de demo
        if (closeBtn && !isDemoPage) {
            closeBtn.addEventListener('click', closeTooltip);
        }
        
        // Botão "Continuar Ações" - para tooltips que têm continueToActions
        const continueActionsBtn = tooltip.querySelector('.onboarding-tooltip-btn.continue-actions');
        if (continueActionsBtn) {
            continueActionsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão Continuar Ações clicado! Avançando para tooltips de ações...');
                
                // Fechar tooltip atual
                if (tooltip) {
                    tooltip.classList.remove('show');
                    const overlay = document.getElementById('onboarding-overlay');
                    if (overlay) overlay.classList.remove('show');
                    setTimeout(() => {
                        if (tooltip.parentNode) tooltip.remove();
                        if (overlay && overlay.parentNode) overlay.remove();
                        
                        // Avançar para o próximo tooltip (que será o primeiro de ações)
                        // Os tooltips de ações já estão na lista, só precisamos avançar o índice
                        this.currentTooltipIndex++;
                        if (this.currentTooltipIndex < this.tooltips.length) {
                            this.isShowing = false;
                            this.showNextTooltip();
                        }
                    }, 300);
                }
            });
        }
        
        // Botão "Entendi" / "Próximo" - verificar se tem nextPage direto
        const nextPageDirectBtn = tooltip.querySelector('.onboarding-tooltip-btn.next-page-direct');
        const currentTooltipConfig = this.tooltips[this.currentTooltipIndex];
        const hasDirectNextPage = currentTooltipConfig && currentTooltipConfig.nextPage;
        
        console.log('[Onboarding] Verificando botão nextPage:', {
            nextPageDirectBtn: !!nextPageDirectBtn,
            hasDirectNextPage: hasDirectNextPage,
            nextPage: currentTooltipConfig ? currentTooltipConfig.nextPage : null,
            tooltipId: tooltipId
        });
        
        if (nextPageDirectBtn && hasDirectNextPage) {
            // Botão "Próximo" com navegação direta
            console.log('[Onboarding] Adicionando event listener ao botão next-page-direct');
            nextPageDirectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão Próximo com nextPage clicado! Navegando para:', currentTooltipConfig.nextPage);
                
                // Marcar para reativar onboarding na próxima página ANTES de navegar
                console.log('[Onboarding] Marcando localStorage ANTES da navegação...');
                localStorage.setItem('onboarding_reactivated', 'true');
                localStorage.removeItem('onboarding_auto_show_disabled');
                localStorage.removeItem('onboarding_disabled');
                // Limpar tooltips vistos da sessão para a nova página começar do zero
                const seenInSession = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
                // Remover apenas tooltips da página atual da lista de vistos
                const tooltipsToRemove = this.tooltips.map(t => t.id);
                const newSeenList = seenInSession.filter(id => !tooltipsToRemove.includes(id));
                sessionStorage.setItem('onboarding_seen', JSON.stringify(newSeenList));
                console.log('[Onboarding] Tooltips da página atual removidos da lista de vistos para reiniciar na próxima página');
                console.log('[Onboarding] localStorage marcado:', {
                    reactivated: localStorage.getItem('onboarding_reactivated'),
                    auto_show_disabled: localStorage.getItem('onboarding_auto_show_disabled'),
                    disabled: localStorage.getItem('onboarding_disabled')
                });
                
                // Fechar tooltip atual
                if (tooltip) {
                    tooltip.classList.remove('show');
                    const overlay = document.getElementById('onboarding-overlay');
                    if (overlay) overlay.classList.remove('show');
                    setTimeout(() => {
                        if (tooltip.parentNode) tooltip.remove();
                        if (overlay && overlay.parentNode) overlay.remove();
                        
                        // Navegar para próxima página
                        const nextPage = currentTooltipConfig.nextPage;
                        console.log('[Onboarding] nextPage configurado:', nextPage);
                        console.log('[Onboarding] window.location.pathname:', window.location.pathname);
                        
                        // Usar caminho relativo simples, igual ao botão original faz
                        // Se nextPage é 'seleciona-assistente.html' e estamos em campanhas/criar-campanhas.html
                        // O navegador resolve automaticamente para campanhas/seleciona-assistente.html
                        let targetPath = nextPage;
                        
                        if (window.parent && window.parent !== window) {
                            // Está em iframe
                            try {
                                const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                                if (menuFrame) {
                                    // Se começa com ../, usar caminho relativo do menu_principal
                                    if (nextPage.startsWith('../')) {
                                        menuFrame.src = nextPage.replace('../', '');
                                    } else {
                                        // Usar caminho relativo simples - o iframe resolve automaticamente
                                        // Se estamos em campanhas/criar-campanhas.html, seleciona-assistente.html vira campanhas/seleciona-assistente.html
                                        menuFrame.src = nextPage;
                                    }
                                    console.log('[Onboarding] Navegando via iframe.src para:', menuFrame.src);
                                } else {
                                    window.location.href = targetPath;
                                }
                            } catch (e) {
                                console.warn('[Onboarding] Erro ao navegar via parent:', e);
                                window.location.href = targetPath;
                            }
                        } else {
                            // Navegação direta - usar caminho relativo simples
                            window.location.href = targetPath;
                            console.log('[Onboarding] Navegando diretamente para:', targetPath);
                        }
                    }, 300);
                } else {
                    // Navegar imediatamente se tooltip não existe
                    const nextPage = currentTooltipConfig.nextPage;
                    // Usar caminho relativo simples, igual ao botão original
                    let targetPath = nextPage;
                    
                    if (window.parent && window.parent !== window) {
                        try {
                            const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                            if (menuFrame) {
                                // Se começa com ../, usar caminho relativo do menu_principal
                                if (nextPage.startsWith('../')) {
                                    menuFrame.src = nextPage.replace('../', '');
                                } else {
                                    // Usar caminho relativo simples
                                    menuFrame.src = nextPage;
                                }
                                console.log('[Onboarding] Navegando via iframe.src (fallback) para:', menuFrame.src);
                            } else {
                                window.location.href = targetPath;
                            }
                        } catch (e) {
                            window.location.href = targetPath;
                        }
                    } else {
                        window.location.href = targetPath;
                    }
                }
            });
        } else if (understoodBtn) {
            // Botão "Entendi" / "Próximo" normal
            // Verificar se tem continueToActions - se tiver, não usar este handler (já foi tratado acima)
            // IMPORTANTE: Se o botão tem next-page-direct, não adicionar listener aqui (já foi adicionado acima)
            if (understoodBtn.classList.contains('next-page-direct')) {
                console.log('[Onboarding] Botão understood também tem next-page-direct, ignorando handler padrão');
                // Já foi tratado pelo next-page-direct acima
            } else if (currentTooltipConfig && currentTooltipConfig.continueToActions) {
                // Já foi tratado pelo botão continue-actions, não fazer nada aqui
                console.log('[Onboarding] Botão tem continueToActions, ignorando handler padrão');
            } else if (currentTooltipConfig && currentTooltipConfig.openModalOnNext && currentTooltipConfig.autoClick && currentTooltipConfig.clickSelector) {
                // Se tem openModalOnNext e autoClick, clicar no botão para abrir modal e aguardar modal abrir
                understoodBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Onboarding] ========================================');
                    console.log('[Onboarding] ABRIR MODAL E AGUARDAR detectado!');
                    console.log('[Onboarding] clickSelector:', currentTooltipConfig.clickSelector);
                    console.log('[Onboarding] modalId:', currentTooltipConfig.modalId);
                    
                    // Fechar tooltip atual
                    if (tooltip) {
                        tooltip.classList.remove('show');
                        const overlay = document.getElementById('onboarding-overlay');
                        if (overlay) overlay.classList.remove('show');
                        setTimeout(() => {
                            if (tooltip.parentNode) tooltip.remove();
                            if (overlay && overlay.parentNode) overlay.remove();
                        }, 300);
                    }
                    
                    // Clicar no botão para abrir modal
                    const buttonToClick = document.querySelector(currentTooltipConfig.clickSelector);
                    if (buttonToClick) {
                        console.log('[Onboarding] Botão encontrado:', buttonToClick);
                        console.log('[Onboarding] Botão onclick:', buttonToClick.getAttribute('onclick'));
                        
                        // Tentar chamar a função diretamente se for d0_30min ou d0_3horas
                        const onclickAttr = buttonToClick.getAttribute('onclick');
                        if (onclickAttr && onclickAttr.includes('openModal')) {
                            // Extrair o parâmetro do onclick
                            const match = onclickAttr.match(/openModal\(['"]([^'"]+)['"]\)/);
                            if (match && match[1]) {
                                const followupId = match[1];
                                console.log('[Onboarding] Chamando openModal diretamente com:', followupId);
                                
                                // Verificar se a função existe no escopo global
                                if (typeof window.openModal === 'function') {
                                    window.openModal(followupId);
                                    console.log('[Onboarding] openModal chamado diretamente!');
                                } else if (typeof openModal === 'function') {
                                    openModal(followupId);
                                    console.log('[Onboarding] openModal chamado diretamente (sem window)!');
                                } else {
                                    console.warn('[Onboarding] Função openModal não encontrada, tentando click()...');
                                    buttonToClick.click();
                                }
                            } else {
                                console.warn('[Onboarding] Não foi possível extrair parâmetro do onclick, tentando click()...');
                                buttonToClick.click();
                            }
                        } else {
                            console.log('[Onboarding] Clicando no botão normalmente...');
                            buttonToClick.click();
                        }
                        
                        // Avançar índice para primeiro tooltip dentro do modal
                        this.currentTooltipIndex++;
                        while (this.currentTooltipIndex < this.tooltips.length) {
                            const nextTooltip = this.tooltips[this.currentTooltipIndex];
                            if (nextTooltip.showArrowAfter === true) {
                                this.currentTooltipIndex++;
                                continue;
                            }
                            if (nextTooltip.requiresModalOpen === true && 
                                nextTooltip.modalId === currentTooltipConfig.modalId) {
                                console.log('[Onboarding] Encontrado primeiro tooltip dentro do modal:', nextTooltip.id);
                                break;
                            }
                            this.currentTooltipIndex++;
                        }
                        
                        // Aguardar um pouco antes de verificar se o modal abriu
                        setTimeout(() => {
                            console.log('[Onboarding] Verificando se modal abriu após chamar função...');
                            const modal = document.getElementById(currentTooltipConfig.modalId);
                            if (modal && getComputedStyle(modal).display === 'block') {
                                console.log('[Onboarding] Modal já está aberto!');
                            } else {
                                console.log('[Onboarding] Modal ainda não está aberto, aguardando...');
                            }
                            // Aguardar modal abrir e mostrar tooltips
                            this.waitForModalToOpen(currentTooltipConfig.modalId);
                        }, 100);
                    } else {
                        console.warn('[Onboarding] Botão não encontrado:', currentTooltipConfig.clickSelector);
                        this.currentTooltipIndex++;
                        if (this.currentTooltipIndex < this.tooltips.length) {
                            this.isShowing = false;
                            this.showNextTooltip();
                        }
                    }
                });
            } else if (currentTooltipConfig && currentTooltipConfig.autoClick && currentTooltipConfig.clickSelector) {
                // Se tem autoClick, clicar automaticamente no elemento especificado
                understoodBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Onboarding] ========================================');
                    console.log('[Onboarding] AUTO-CLICK detectado!');
                    console.log('[Onboarding] clickSelector:', currentTooltipConfig.clickSelector);
                    console.log('[Onboarding] requiresModalOpen:', currentTooltipConfig.requiresModalOpen);
                    console.log('[Onboarding] modalId:', currentTooltipConfig.modalId);
                    
                    // Fechar tooltip atual primeiro
                    if (tooltip) {
                        tooltip.classList.remove('show');
                        const overlay = document.getElementById('onboarding-overlay');
                        if (overlay) overlay.classList.remove('show');
                        setTimeout(() => {
                            if (tooltip.parentNode) tooltip.remove();
                            if (overlay && overlay.parentNode) overlay.remove();
                            
                            // Tentar encontrar o elemento - se não encontrar, aguardar um pouco
                            let clickElement = document.querySelector(currentTooltipConfig.clickSelector);
                            if (!clickElement) {
                                console.log('[Onboarding] Elemento não encontrado imediatamente, aguardando...');
                                // Aguardar até 2 segundos para o elemento aparecer
                                let attempts = 0;
                                const maxAttempts = 20;
                                const findElement = setInterval(() => {
                                    attempts++;
                                    clickElement = document.querySelector(currentTooltipConfig.clickSelector);
                                    if (clickElement || attempts >= maxAttempts) {
                                        clearInterval(findElement);
                                        if (clickElement) {
                                            console.log('[Onboarding] Elemento encontrado após aguardar!');
                                        } else {
                                            console.warn('[Onboarding] Elemento não encontrado após aguardar:', currentTooltipConfig.clickSelector);
                                        }
                                    }
                                }, 100);
                                
                                // Aguardar um pouco mais antes de tentar clicar
                                setTimeout(() => {
                                    clickElement = document.querySelector(currentTooltipConfig.clickSelector);
                                    if (clickElement) {
                                        console.log('[Onboarding] Elemento encontrado, clicando...');
                                        clickElement.click();
                                        
                                        // Se o tooltip tem waitForDropdown, aguardar dropdown abrir
                                        if (currentTooltipConfig.waitForDropdown) {
                                            console.log('[Onboarding] Aguardando dropdown abrir:', currentTooltipConfig.waitForDropdown);
                                            let dropdownAttempts = 0;
                                            const maxDropdownAttempts = 30;
                                            const checkDropdown = setInterval(() => {
                                                dropdownAttempts++;
                                                const dropdown = document.querySelector(currentTooltipConfig.waitForDropdown);
                                                const isVisible = dropdown && (
                                                    dropdown.classList.contains('active') || 
                                                    dropdown.classList.contains('show') ||
                                                    getComputedStyle(dropdown).display !== 'none'
                                                );
                                                if (isVisible || dropdownAttempts >= maxDropdownAttempts) {
                                                    clearInterval(checkDropdown);
                                                    console.log('[Onboarding] Dropdown aberto, avançando para próximo tooltip...');
                                                    setTimeout(() => {
                                                        this.currentTooltipIndex++;
                                                        if (this.currentTooltipIndex < this.tooltips.length) {
                                                            this.isShowing = false;
                                                            this.showNextTooltip();
                                                        }
                                                    }, 300);
                                                }
                                            }, 100);
                                        } else if (currentTooltipConfig.requiresModalOpen && currentTooltipConfig.modalId) {
                                            console.log('[Onboarding] Aguardando modal abrir antes de avançar...');
                                            let modalAttempts = 0;
                                            const maxModalAttempts = 50;
                                            const checkModal = setInterval(() => {
                                                modalAttempts++;
                                                const modal = document.getElementById(currentTooltipConfig.modalId);
                                                const isVisible = modal && (
                                                    modal.classList.contains('show') || 
                                                    modal.classList.contains('active') || 
                                                    modal.style.display !== 'none' ||
                                                    getComputedStyle(modal).display !== 'none'
                                                );
                                                if (isVisible || modalAttempts >= maxModalAttempts) {
                                                    clearInterval(checkModal);
                                                    console.log('[Onboarding] Modal aberto, avançando para próximo tooltip...');
                                                    setTimeout(() => {
                                                        this.currentTooltipIndex++;
                                                        if (this.currentTooltipIndex < this.tooltips.length) {
                                                            this.isShowing = false;
                                                            this.showNextTooltip();
                                                        }
                                                    }, 500);
                                                }
                                            }, 200);
                                        } else {
                                            // Aguardar um pouco e avançar para próximo tooltip
                                            setTimeout(() => {
                                                this.currentTooltipIndex++;
                                                if (this.currentTooltipIndex < this.tooltips.length) {
                                                    this.isShowing = false;
                                                    this.showNextTooltip();
                                                }
                                            }, 500);
                                        }
                                    } else {
                                        console.warn('[Onboarding] Elemento não encontrado para auto-click, avançando mesmo assim...');
                                        this.currentTooltipIndex++;
                                        if (this.currentTooltipIndex < this.tooltips.length) {
                                            this.isShowing = false;
                                            this.showNextTooltip();
                                        }
                                    }
                                }, 500);
                            } else {
                                console.log('[Onboarding] Elemento encontrado imediatamente, clicando...');
                                clickElement.click();
                                
                                // Se o tooltip requer modal aberto, aguardar modal abrir antes de avançar
                                if (currentTooltipConfig.requiresModalOpen && currentTooltipConfig.modalId) {
                                    console.log('[Onboarding] Aguardando modal abrir antes de avançar...');
                                    let attempts = 0;
                                    const maxAttempts = 50;
                                    const checkModal = setInterval(() => {
                                        attempts++;
                                        const modal = document.getElementById(currentTooltipConfig.modalId);
                                        const isVisible = modal && (
                                            modal.classList.contains('show') || 
                                            modal.classList.contains('active') || 
                                            modal.style.display !== 'none' ||
                                            getComputedStyle(modal).display !== 'none'
                                        );
                                        if (isVisible || attempts >= maxAttempts) {
                                            clearInterval(checkModal);
                                            console.log('[Onboarding] Modal aberto, avançando para próximo tooltip...');
                                            setTimeout(() => {
                                                this.currentTooltipIndex++;
                                                if (this.currentTooltipIndex < this.tooltips.length) {
                                                    this.isShowing = false;
                                                    this.showNextTooltip();
                                                }
                                            }, 500);
                                        }
                                    }, 200);
                                } else {
                                    // Aguardar um pouco e avançar para próximo tooltip
                                    setTimeout(() => {
                                        this.currentTooltipIndex++;
                                        if (this.currentTooltipIndex < this.tooltips.length) {
                                            this.isShowing = false;
                                            this.showNextTooltip();
                                        }
                                    }, 500);
                                }
                            }
                        }, 300);
                    }
                });
            } else if (isLastTooltip) {
                // Se for o último tooltip na página de demo, verificar se tem botões "Repetir" e "Encerrar"
                const repeatBtn = tooltip.querySelector('.repeat-tutorial');
                const encerrarBtn = tooltip.querySelector('.encerrar-tutorial');
                
                if (repeatBtn && encerrarBtn) {
                    // Botão "Repetir" - reinicia o tutorial completo
                    repeatBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Onboarding] Botão "Repetir" clicado - reiniciando tutorial completo...');
                        // Limpar seção escolhida para mostrar todos os tooltips
                        localStorage.removeItem('onboarding_section');
                        // Reiniciar do início
                        this.currentTooltipIndex = 0;
                        this.tooltipHistory = [];
                        this.isShowing = false;
                        this.closeTooltip(tooltip, tooltipId, false);
                        setTimeout(() => {
                            this.showNextTooltip();
                        }, 500);
                    });
                    
                    // Botão "Encerrar" - volta ao sistema principal
                    encerrarBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[Onboarding] Botão "Encerrar" clicado - voltando ao sistema principal...');
                        this.encerrarTutorial();
                    });
                } else {
                    // Comportamento padrão (finalizar)
                    understoodBtn.addEventListener('click', finishOnboarding);
                }
            } else {
                understoodBtn.addEventListener('click', advanceTooltip);
            }
        }
        
        // Botão "Voltar"
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goToPreviousTooltip(tooltip, tooltipId);
            });
        }
        
        // Botão "Abrir Grazi" - apenas adiciona funcionalidade, não interfere nos outros
        if (openGraziBtn) {
            openGraziBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão Abrir Grazi clicado!');
                this.openGraziAndContinue(tooltip, tooltipId);
            });
        }
        
        // Botão de navegação para próxima página
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão de próxima página clicado!', {
                    classes: nextPageBtn.className,
                    hasFollowUp: nextPageBtn.classList.contains('follow-up'),
                    hasAssistentes: nextPageBtn.classList.contains('assistentes'),
                    hasCampanhas: nextPageBtn.classList.contains('campanhas'),
                    configNextPage: config && config.nextPage
                });
                
                // Verificar se tem nextPage no config (prioridade)
                if (config && config.nextPage) {
                    console.log('[Onboarding] Usando nextPage do config:', config.nextPage);
                    this.goToNextPageWithUrl(tooltip, tooltipId, config.nextPage);
                } else if (nextPageBtn.classList.contains('follow-up')) {
                    this.goToFollowUpPage(tooltip, tooltipId);
                } else if (nextPageBtn.classList.contains('assistentes')) {
                    this.goToAssistentesPage(tooltip, tooltipId);
                } else if (nextPageBtn.classList.contains('campanhas')) {
                    this.goToCampanhasPage(tooltip, tooltipId);
                } else {
                    this.goToNextPage(tooltip, tooltipId);
                }
            });
        } else {
            console.warn('[Onboarding] Botão de próxima página não encontrado!');
        }
        
        // Botão "Fechar Tutorial" no tooltip final
        const fecharTutorialBtn = tooltip.querySelector('.encerrar-tutorial');
        if (fecharTutorialBtn) {
            fecharTutorialBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão "Fechar Tutorial" clicado - voltando ao sistema principal...');
                this.encerrarTutorial();
            });
        }
        
        // Botão "Não mostrar mais"
        if (disableAllBtn) {
            disableAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Onboarding] Botão "Não mostrar mais" clicado!');
                // Marcar que não deve aparecer automaticamente nas próximas vezes
                localStorage.setItem('onboarding_auto_show_disabled', 'true');
                localStorage.setItem('onboarding_disabled', 'true');
                localStorage.removeItem('onboarding_reactivated');
                localStorage.removeItem('onboarding_wants_tour');
                
                // Marcar primeiro login como visto
                const tenantId = localStorage.getItem('tenant_id') || 'default';
                const userKey = `onboarding_first_login_${tenantId}`;
                if (!localStorage.getItem(userKey)) {
                    localStorage.setItem(userKey, 'true');
                    localStorage.setItem(`onboarding_first_login_date_${tenantId}`, new Date().toISOString());
                }
                
                // Se estiver na página de demo, redirecionar para o sistema oficial
                const currentPath = window.location.pathname;
                const parentPath = window.parent && window.parent !== window ? window.parent.location.pathname : '';
                const isDemoPage = currentPath.includes('onboarding-tutorial-demo') || 
                                  parentPath.includes('onboarding-tutorial-demo-menu');
                
                if (isDemoPage) {
                    console.log('[Onboarding] "Não mostrar mais" clicado na página de demo. Redirecionando para sistema oficial...');
                    this.finishOnboarding(tooltip, tooltipId);
                    setTimeout(() => {
                        if (window.parent && window.parent !== window) {
                            const newPath = parentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html');
                            window.parent.location.href = newPath;
                        } else {
                            const newPath = currentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html')
                                                      .replace(/onboarding-tutorial-demo.*\.html/, 'menu.html');
                            window.location.href = newPath;
                        }
                    }, 500);
                } else {
                    this.finishOnboarding(tooltip, tooltipId);
                }
            });
        } else {
            console.warn('[Onboarding] Botão "Não mostrar mais" não encontrado!');
        }

        // Fechar ao clicar no overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeTooltip();
            }
        });

        // Scroll do elemento alvo
        const scrollHandler = () => {
            this.updateTooltipPosition(tooltip, targetElement);
        };
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', scrollHandler);
    }

    /**
     * Atualiza posição do tooltip quando elemento se move
     */
    updateTooltipPosition(tooltip, element) {
        const arrowPosition = tooltip.getAttribute('data-position');
        const position = this.calculatePosition(element, arrowPosition);
        
        tooltip.style.top = position.top + 'px';
        tooltip.style.left = position.left + 'px';
        
        // Atualizar posição da seta
        let arrowOffsetStyle = '50%';
        if (position.arrowOffset !== undefined) {
            if (typeof position.arrowOffset === 'number') {
                arrowOffsetStyle = position.arrowOffset + 'px';
            } else {
                arrowOffsetStyle = position.arrowOffset;
            }
        }
        const arrow = tooltip.querySelector('.onboarding-tooltip-arrow');
        if (arrow) {
            arrow.style.setProperty('--arrow-offset', arrowOffsetStyle);
        }
    }

    /**
     * Destaca o elemento alvo
     */
    highlightTargetElement(element, config = null) {
        // Remover highlight anterior
        const previousHighlight = document.querySelector('.onboarding-target-highlight');
        if (previousHighlight) {
            previousHighlight.classList.remove('onboarding-target-highlight');
        }

        // Adicionar highlight no elemento atual
        element.classList.add('onboarding-target-highlight');
        
        // NÃO rolar se for tooltip_contatos_11 (lista de contatos)
        if (config && config.id === 'tooltip_contatos_11') {
            return;
        }
        
        // Scroll suave para o elemento se não estiver visível
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0 && 
                         rect.bottom <= window.innerHeight && 
                         rect.right <= window.innerWidth;

        if (!isVisible) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }

    /**
     * Remove highlight do elemento
     */
    removeHighlight() {
        const highlighted = document.querySelector('.onboarding-target-highlight');
        if (highlighted) {
            highlighted.classList.remove('onboarding-target-highlight');
        }
    }

    /**
     * Volta para o tooltip anterior
     */
    goToPreviousTooltip(currentTooltip, currentTooltipId) {
        console.log('[Onboarding] ========================================');
        console.log('[Onboarding] Tentando voltar para tooltip anterior...');
        console.log('[Onboarding] Índice atual:', this.currentTooltipIndex);
        console.log('[Onboarding] Histórico completo:', this.tooltipHistory);
        
        // IMPORTANTE: Limpar seta animada e spotlight se estiverem ativos
        this.removeAnimatedArrow();
        this.removeGraziSpotlight();
        this.unblockDashboardInteractions();
        
        if (this.tooltipHistory.length === 0) {
            console.log('[Onboarding] Não há tooltip anterior para voltar');
            return;
        }

        // Pegar o índice anterior do histórico (último visitado)
        const previousIndex = this.tooltipHistory[this.tooltipHistory.length - 1];
        const previousTooltipConfig = this.tooltips[previousIndex];
        const currentTooltipConfig = this.tooltips[this.currentTooltipIndex];
        
        console.log(`[Onboarding] Voltando do tooltip ${this.currentTooltipIndex + 1} para o tooltip ${previousIndex + 1}`);
        console.log('[Onboarding] Tooltip anterior requer Grazi aberta?', previousTooltipConfig?.requiresGraziOpen);
        
        // LÓGICA REVERSA: Desfazer cliques automáticos do tooltip atual
        if (currentTooltipConfig && currentTooltipConfig.autoClick && currentTooltipConfig.clickSelector) {
            console.log('[Onboarding] Desfazendo clique automático do tooltip atual...');
            const clickedElement = document.querySelector(currentTooltipConfig.clickSelector);
            
            // Se foi um clique em estratégia dentro do modal D0, desmarcar
            if (clickedElement && clickedElement.classList.contains('strategy-option')) {
                // Remover classe selected
                clickedElement.classList.remove('selected');
                // Desmarcar radio button
                const radio = clickedElement.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = false;
                }
                console.log('[Onboarding] Estratégia desmarcada:', currentTooltipConfig.clickSelector);
            }
            
            // Se o tooltip atual abriu um modal, fechar o modal
            if (currentTooltipConfig.requiresModalOpen && currentTooltipConfig.modalId) {
                console.log('[Onboarding] Fechando modal aberto pelo tooltip atual...');
                const modal = document.getElementById(currentTooltipConfig.modalId);
                if (modal) {
                    if (currentTooltipConfig.modalId === 'd0Modal' && typeof closeD0Modal === 'function') {
                        closeD0Modal();
                    } else {
                        modal.style.display = 'none';
                        document.body.style.overflow = 'auto';
                    }
                }
            }
        }
        
        // Fechar tooltip atual (se existir)
        if (currentTooltip) {
            currentTooltip.classList.remove('show');
        }
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }

        this.removeHighlight();
        this.isShowing = false; // Resetar flag

        setTimeout(() => {
            currentTooltip.remove();
            if (overlay) overlay.remove();
            
            // Remover o último índice do histórico (já que estamos voltando para ele)
            this.tooltipHistory.pop();
            
            // LÓGICA REVERSA: Desfazer cliques automáticos do tooltip anterior também
            // Mas só se o tooltip anterior NÃO requer o mesmo modal (para não fechar o modal que ainda precisamos)
            if (previousTooltipConfig && previousTooltipConfig.autoClick && previousTooltipConfig.clickSelector) {
                console.log('[Onboarding] Verificando se precisa desfazer clique automático do tooltip anterior...');
                const previousClickedElement = document.querySelector(previousTooltipConfig.clickSelector);
                
                // Se foi um clique em estratégia dentro do modal D0, desmarcar apenas se não estamos voltando para outro tooltip dentro do mesmo modal
                if (previousClickedElement && previousClickedElement.classList.contains('strategy-option')) {
                    // Verificar se o tooltip anterior também requer o mesmo modal
                    const previousAlsoRequiresModal = previousTooltipConfig.requiresModalOpen && previousTooltipConfig.modalId;
                    const currentAlsoRequiresModal = currentTooltipConfig && currentTooltipConfig.requiresModalOpen && currentTooltipConfig.modalId;
                    
                    // Se ambos requerem o mesmo modal, não desmarcar (estamos apenas mudando de estratégia dentro do modal)
                    if (!previousAlsoRequiresModal || previousTooltipConfig.modalId !== currentTooltipConfig?.modalId) {
                        // Remover classe selected
                        previousClickedElement.classList.remove('selected');
                        // Desmarcar radio button
                        const radio = previousClickedElement.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = false;
                        }
                        console.log('[Onboarding] Estratégia anterior desmarcada:', previousTooltipConfig.clickSelector);
                    } else {
                        console.log('[Onboarding] Mantendo estratégia anterior marcada (mesmo modal)');
                    }
                }
                
                // Se o tooltip anterior abriu um modal, só fechar se o tooltip anterior NÃO requer o mesmo modal
                if (previousTooltipConfig.requiresModalOpen && previousTooltipConfig.modalId) {
                    const currentAlsoRequiresModal = currentTooltipConfig && currentTooltipConfig.requiresModalOpen && currentTooltipConfig.modalId;
                    
                    // Se o tooltip atual também requer o mesmo modal, não fechar
                    if (!currentAlsoRequiresModal || previousTooltipConfig.modalId !== currentTooltipConfig?.modalId) {
                        console.log('[Onboarding] Fechando modal aberto pelo tooltip anterior...');
                        const modal = document.getElementById(previousTooltipConfig.modalId);
                        if (modal) {
                            if (previousTooltipConfig.modalId === 'd0Modal' && typeof closeD0Modal === 'function') {
                                closeD0Modal();
                            } else {
                                modal.style.display = 'none';
                                document.body.style.overflow = 'auto';
                            }
                        }
                    } else {
                        console.log('[Onboarding] Mantendo modal aberto (tooltip anterior também requer)');
                    }
                }
            }
            
            // Verificar se o tooltip anterior requer Grazi aberta
            if (previousTooltipConfig && previousTooltipConfig.requiresGraziOpen === true) {
                console.log('[Onboarding] Tooltip anterior requer Grazi aberta. Verificando...');
                const graziPopup = document.getElementById('insightsPopup');
                
                // Se Grazi não está aberta, abrir primeiro
                if (!graziPopup || !graziPopup.classList.contains('active')) {
                    console.log('[Onboarding] Grazi não está aberta. Abrindo...');
                    
                    // Tentar abrir Grazi
                    let graziOpened = false;
                    try {
                        if (typeof openInsightsPopup === 'function') {
                            openInsightsPopup();
                            graziOpened = true;
                        } else if (window.openInsightsPopup && typeof window.openInsightsPopup === 'function') {
                            window.openInsightsPopup();
                            graziOpened = true;
                        } else {
                            const graziBtn = document.querySelector('button.insights-btn');
                            if (graziBtn) {
                                graziBtn.click();
                                graziOpened = true;
                            }
                        }
                    } catch (e) {
                        console.error('[Onboarding] Erro ao abrir Grazi:', e);
                    }
                    
                    if (graziOpened) {
                        // Aguardar Grazi abrir antes de mostrar tooltip
                        let attempts = 0;
                        const maxAttempts = 50;
                        const checkGrazi = setInterval(() => {
                            attempts++;
                            const popup = document.getElementById('insightsPopup');
                            if (popup && popup.classList.contains('active')) {
                                clearInterval(checkGrazi);
                                console.log('[Onboarding] Grazi aberta! Mostrando tooltip...');
                                // Voltar para o tooltip anterior
                                this.currentTooltipIndex = previousIndex;
                                setTimeout(() => {
                                    this.showNextTooltip();
                                }, 500);
                            } else if (attempts >= maxAttempts) {
                                clearInterval(checkGrazi);
                                console.warn('[Onboarding] Timeout aguardando Grazi abrir. Continuando mesmo assim...');
                                this.currentTooltipIndex = previousIndex;
                                setTimeout(() => {
                                    this.showNextTooltip();
                                }, 500);
                            }
                        }, 200);
                        return;
                    }
                }
            }
            
            // Voltar para o tooltip anterior (Grazi já está aberta ou não requer)
            this.currentTooltipIndex = previousIndex;
            console.log('[Onboarding] Voltou para índice:', this.currentTooltipIndex);
            console.log('[Onboarding] Histórico após voltar:', this.tooltipHistory);
            
            // Se o tooltip anterior requer modal aberto, verificar se está aberto
            if (previousTooltipConfig && previousTooltipConfig.requiresModalOpen && previousTooltipConfig.modalId) {
                const modal = document.getElementById(previousTooltipConfig.modalId);
                const isModalVisible = modal && (
                    modal.classList.contains('show') || 
                    modal.classList.contains('active') || 
                    modal.style.display !== 'none' ||
                    getComputedStyle(modal).display !== 'none'
                );
                
                if (!isModalVisible) {
                    console.log('[Onboarding] Tooltip anterior requer modal aberto. Reabrindo modal...');
                    // Reabrir o modal se necessário
                    if (previousTooltipConfig.modalId === 'd0Modal') {
                        // Para modal D0, precisamos saber qual followupId usar
                        // Vamos tentar abrir com o primeiro contato por padrão
                        if (typeof openD0Modal === 'function') {
                            openD0Modal('d0_primeiro_contato');
                        } else if (typeof openModal === 'function') {
                            openModal('d0_primeiro_contato');
                        }
                    } else {
                        // Para outros modais, tentar abrir
                        const openFunctionName = 'open' + previousTooltipConfig.modalId.charAt(0).toUpperCase() + previousTooltipConfig.modalId.slice(1);
                        if (typeof window[openFunctionName] === 'function') {
                            window[openFunctionName]();
                        }
                    }
                    
                    // Aguardar modal abrir antes de mostrar tooltip
                    let attempts = 0;
                    const maxAttempts = 50;
                    const checkModal = setInterval(() => {
                        attempts++;
                        const checkModalEl = document.getElementById(previousTooltipConfig.modalId);
                        const checkVisible = checkModalEl && (
                            checkModalEl.classList.contains('show') || 
                            checkModalEl.classList.contains('active') || 
                            checkModalEl.style.display !== 'none' ||
                            getComputedStyle(checkModalEl).display !== 'none'
                        );
                        if (checkVisible || attempts >= maxAttempts) {
                            clearInterval(checkModal);
                            setTimeout(() => {
                                this.showNextTooltip();
                            }, 300);
                        }
                    }, 200);
                    return;
                }
            }
            
            setTimeout(() => this.showNextTooltip(), 100);
        }, 100);
    }

    /**
     * Vai para a página de follow-up e inicia tooltips automaticamente
     */
    goToFollowUpPage(tooltip, tooltipId) {
        console.log('[Onboarding] Navegando para próxima página (Follow-up)...');
        
        // Marcar todos os tooltips de campanhas como vistos
        const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        this.tooltips.forEach(t => {
            if (!seen.includes(t.id)) {
                seen.push(t.id);
            }
        });
        sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
        
        // Limpar tooltip e overlay
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        this.removeHighlight();
        
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        setTimeout(() => {
            if (tooltip) tooltip.remove();
            if (overlay) overlay.remove();
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
               // Marcar para iniciar tooltips automaticamente na próxima página
               localStorage.setItem('onboarding_reactivated', 'true');
               localStorage.removeItem('onboarding_auto_show_disabled');
               
               // Navegar para follow-up
               // Verificar se está em iframe (menu.html) ou página direta
               if (window.parent && window.parent !== window) {
                   // Está em iframe, chamar função do parent
                   try {
                       if (window.parent.showSection) {
                           window.parent.showSection('follow-up');
                           console.log('[Onboarding] Navegando via parent.showSection para follow-up');
                           
                           // Aguardar iframe carregar e então inicializar onboarding
                           setTimeout(() => {
                               const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                               if (menuFrame && menuFrame.contentWindow) {
                                   try {
                                       // Tentar inicializar onboarding no iframe após carregar
                                       setTimeout(() => {
                                           if (menuFrame.contentWindow.initOnboarding) {
                                               console.log('[Onboarding] Inicializando onboarding no iframe de follow-up...');
                                               menuFrame.contentWindow.initOnboarding();
                                           }
                                       }, 2000);
                                   } catch (e) {
                                       console.warn('[Onboarding] Não foi possível acessar contentWindow do iframe:', e);
                                   }
                               }
                           }, 500);
                       } else {
                           // Fallback: tentar mudar o src do iframe
                           const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                           if (menuFrame) {
                               menuFrame.src = 'follow-up/criar_follow-up.html';
                               console.log('[Onboarding] Navegando via iframe src para follow-up');
                           } else {
                               console.warn('[Onboarding] Não foi possível navegar para follow-up via parent.showSection ou iframe src.');
                               window.location.href = '../follow-up/criar_follow-up.html';
                           }
                       }
                   } catch (e) {
                       console.error('[Onboarding] Erro ao navegar via parent:', e);
                       window.location.href = '../follow-up/criar_follow-up.html';
                   }
               } else {
                   // Não está em iframe, redirecionar diretamente
                   window.location.href = '../follow-up/criar_follow-up.html';
                   console.log('[Onboarding] Redirecionando diretamente para follow-up');
               }
        }, 400);
    }

    /**
     * Vai para a página de assistentes e inicia tooltips automaticamente
     */
    goToAssistentesPage(tooltip, tooltipId) {
        console.log('[Onboarding] Navegando para próxima página (Assistentes)...');
        
        // Marcar todos os tooltips de follow-up como vistos
        const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        this.tooltips.forEach(t => {
            if (!seen.includes(t.id)) {
                seen.push(t.id);
            }
        });
        sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
        
        // Limpar tooltip e overlay
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        this.removeHighlight();
        
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        setTimeout(() => {
            if (tooltip) tooltip.remove();
            if (overlay) overlay.remove();
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
            // Marcar para iniciar tooltips automaticamente na próxima página
            localStorage.setItem('onboarding_reactivated', 'true');
            localStorage.removeItem('onboarding_auto_show_disabled');
            
            // Navegar para assistentes
            // Verificar se está em iframe (menu.html) ou página direta
            if (window.parent && window.parent !== window) {
                // Está em iframe, chamar função do parent
                try {
                    if (window.parent.showSection) {
                        window.parent.showSection('assistente');
                        console.log('[Onboarding] Navegando via parent.showSection para assistentes');
                    } else {
                        // Fallback: tentar mudar o src do iframe
                        const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                        if (menuFrame) {
                            menuFrame.src = 'assistentes/assistente.html';
                            console.log('[Onboarding] Navegando via iframe src para assistentes');
                        } else {
                            console.warn('[Onboarding] Não foi possível navegar para assistentes via parent.showSection ou iframe src.');
                            window.location.href = '../assistentes/assistente.html';
                        }
                    }
                } catch (e) {
                    console.error('[Onboarding] Erro ao navegar via parent:', e);
                    window.location.href = '../assistentes/assistente.html';
                }
            } else {
                // Não está em iframe, redirecionar diretamente
                window.location.href = '../assistentes/assistente.html';
                console.log('[Onboarding] Redirecionando diretamente para assistentes');
            }
        }, 400);
    }

    /**
     * Navega para a página de Campanhas
     */
    goToCampanhasPage(tooltip, tooltipId) {
        console.log('[Onboarding] Navegando para próxima página (Campanhas)...');
        
        // Marcar todos os tooltips do dashboard como vistos
        const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        this.tooltips.forEach(t => {
            if (!seen.includes(t.id)) {
                seen.push(t.id);
            }
        });
        sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
        
        // Limpar tooltip e overlay
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        this.removeHighlight();
        
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        setTimeout(() => {
            if (tooltip) tooltip.remove();
            if (overlay) overlay.remove();
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
            // Marcar para iniciar tooltips automaticamente na próxima página
            localStorage.setItem('onboarding_reactivated', 'true');
            localStorage.removeItem('onboarding_auto_show_disabled');
            
            // Navegar para campanhas
            // Verificar se está em iframe (menu.html) ou página direta
            if (window.parent && window.parent !== window) {
                // Está em iframe, chamar função do parent
                try {
                    if (window.parent.showSection) {
                        window.parent.showSection('campanhas');
                        console.log('[Onboarding] Navegando via parent.showSection para campanhas');
                        
                        // Aguardar iframe carregar e então inicializar onboarding
                        setTimeout(() => {
                            const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                            if (menuFrame && menuFrame.contentWindow) {
                                try {
                                    if (menuFrame.contentWindow.initOnboarding) {
                                        menuFrame.contentWindow.initOnboarding();
                                        console.log('[Onboarding] Onboarding inicializado na página de campanhas');
                                    }
                                } catch (e) {
                                    console.warn('[Onboarding] Erro ao inicializar onboarding na página de campanhas:', e);
                                }
                            }
                        }, 500);
                    } else {
                        // Fallback: tentar mudar o src do iframe
                        const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                        if (menuFrame) {
                            menuFrame.src = 'campanhas/criar-campanhas.html';
                            console.log('[Onboarding] Navegando via iframe.src para campanhas');
                            
                            // Aguardar iframe carregar
                            menuFrame.onload = () => {
                                setTimeout(() => {
                                    try {
                                        if (menuFrame.contentWindow.initOnboarding) {
                                            menuFrame.contentWindow.initOnboarding();
                                            console.log('[Onboarding] Onboarding inicializado na página de campanhas');
                                        }
                                    } catch (e) {
                                        console.warn('[Onboarding] Erro ao inicializar onboarding:', e);
                                    }
                                }, 300);
                            };
                        } else {
                            console.warn('[Onboarding] Não foi possível navegar para campanhas via parent.showSection ou iframe src.');
                            window.location.href = '../campanhas/criar-campanhas.html';
                        }
                    }
                } catch (e) {
                    console.error('[Onboarding] Erro ao navegar via parent:', e);
                    window.location.href = '../campanhas/criar-campanhas.html';
                }
            } else {
                // Está na página direta, redirecionar
                window.location.href = 'campanhas/criar-campanhas.html';
            }
        }, 400);
    }
    
    /**
     * Vai para a próxima página (campanhas) e inicia tooltips automaticamente
     */
    goToNextPage(tooltip, tooltipId, targetUrl = null) {
        const url = targetUrl || '../campanhas/criar-campanhas.html';
        console.log('[Onboarding] Navegando para próxima página:', url);
        
        // Marcar todos os tooltips do dashboard como vistos
        const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        this.tooltips.forEach(t => {
            if (!seen.includes(t.id)) {
                seen.push(t.id);
            }
        });
        sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
        
        // Limpar tooltip e overlay
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        this.removeHighlight();
        
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        setTimeout(() => {
            if (tooltip) tooltip.remove();
            if (overlay) overlay.remove();
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
            // Marcar para iniciar tooltips automaticamente na próxima página
            localStorage.setItem('onboarding_reactivated', 'true');
            localStorage.removeItem('onboarding_auto_show_disabled');
            
            // Navegar para a página de destino
            // Verificar se está em iframe (menu.html) ou página direta
            if (window.parent && window.parent !== window) {
                // Está em iframe, chamar função do parent
                try {
                    if (window.parent.showSection) {
                        // Tentar identificar a seção pelo URL
                        if (url.includes('campanhas')) {
                            window.parent.showSection('campanhas');
                        } else {
                            window.parent.showSection('campanhas'); // fallback
                        }
                        console.log('[Onboarding] Navegando via parent.showSection para:', url);
                    } else {
                        // Fallback: tentar mudar o src do iframe
                        const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                        if (menuFrame) {
                            menuFrame.src = url;
                            console.log('[Onboarding] Navegando via iframe.src para:', url);
                        }
                    }
                } catch (e) {
                    console.warn('[Onboarding] Erro ao navegar via parent:', e);
                    // Fallback: redirecionar diretamente
                    let finalUrl = url;
                    if (!url.startsWith('/') && !url.startsWith('http')) {
                        const currentPath = window.location.pathname;
                        if (currentPath.includes('onboarding-tutorial-demo')) {
                            finalUrl = url.replace(/^\.\.\//, '');
                        }
                    }
                    window.location.href = finalUrl;
                }
            } else {
                // Está na página direta, redirecionar
                // Se o URL não começa com / ou http, verificar se precisa ajustar o caminho
                let finalUrl = url;
                if (!url.startsWith('/') && !url.startsWith('http')) {
                    // Se estamos em onboarding-tutorial-demo.html, o caminho relativo deve ser ajustado
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('onboarding-tutorial-demo')) {
                        // Remover ../ se existir, pois estamos na mesma pasta
                        finalUrl = url.replace(/^\.\.\//, '');
                    }
                }
                console.log('[Onboarding] Redirecionando para:', finalUrl);
                window.location.href = finalUrl;
            }
        }, 300);
    }
    
    goToNextPageWithUrl(tooltip, tooltipId, targetUrl) {
        this.goToNextPage(tooltip, tooltipId, targetUrl);
    }

    /**
     * Finaliza o onboarding completamente
     */
    finishOnboarding(tooltip, tooltipId) {
        console.log('[Onboarding] Finalizando onboarding...');
        
        // Verificar se o último tooltip tem returnToPage configurado
        const lastTooltip = this.tooltips[this.currentTooltipIndex];
        const returnToPage = lastTooltip && lastTooltip.returnToPage;
        
        // Marcar TODOS os tooltips da página atual como vistos
        const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
        this.tooltips.forEach(t => {
            if (!seen.includes(t.id)) {
                seen.push(t.id);
            }
        });
        sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
        console.log('[Onboarding] Todos os tooltips marcados como vistos:', seen);
        
        // Se tem returnToPage, navegar para lá ao invés de desabilitar
        if (returnToPage) {
            console.log('[Onboarding] Retornando para página:', returnToPage);
            // Marcar para continuar tooltips na página de destino
            localStorage.setItem('onboarding_reactivated', 'true');
            localStorage.removeItem('onboarding_auto_show_disabled');
            
            // Se tem skipTooltipsOnReturn, marcar esses tooltips como vistos
            if (lastTooltip.skipTooltipsOnReturn && Array.isArray(lastTooltip.skipTooltipsOnReturn)) {
                console.log('[Onboarding] Marcando tooltips para pular ao retornar:', lastTooltip.skipTooltipsOnReturn);
                const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
                lastTooltip.skipTooltipsOnReturn.forEach(tooltipId => {
                    if (!seen.includes(tooltipId)) {
                        seen.push(tooltipId);
                        console.log('[Onboarding] Tooltip marcado como visto:', tooltipId);
                    }
                });
                sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
                console.log('[Onboarding] Tooltips marcados como vistos para pular:', seen);
            }
        } else {
            // Marcar que não deve aparecer automaticamente nas próximas vezes (mesma lógica do "Não mostrar mais")
            localStorage.setItem('onboarding_auto_show_disabled', 'true');
            localStorage.setItem('onboarding_disabled', 'true');
            localStorage.removeItem('onboarding_reactivated');
            
            // IMPORTANTE: Marcar primeiro login como visto quando o tutorial for concluído
            // Isso faz com que a mensagem de boas-vindas não apareça mais
            const tenantId = localStorage.getItem('tenant_id') || 'default';
            const userKey = `onboarding_first_login_${tenantId}`;
            if (!localStorage.getItem(userKey)) {
                localStorage.setItem(userKey, 'true');
                localStorage.setItem(`onboarding_first_login_date_${tenantId}`, new Date().toISOString());
                console.log('[Onboarding] Primeiro login marcado como visto após conclusão do tutorial');
            }
            
            console.log('[Onboarding] Tooltips não aparecerão mais automaticamente. Só aparecerão se o cliente clicar no botão.');
        }
        
        // Remover classes de animação
        if (tooltip) {
            tooltip.classList.remove('show');
        }

        // Remover highlight
        this.removeHighlight();

        // Remover overlay imediatamente (sem delay)
        const removeAllOverlays = () => {
            // Remover por ID
            const overlay = document.getElementById('onboarding-overlay');
            if (overlay) {
                overlay.style.pointerEvents = 'none';
                overlay.style.display = 'none';
                overlay.classList.remove('show');
                overlay.remove();
            }
            
            // Remover todos os overlays que possam existir (por classe também)
            const allOverlays = document.querySelectorAll('.onboarding-overlay');
            allOverlays.forEach(ov => {
                ov.style.pointerEvents = 'none';
                ov.style.display = 'none';
                ov.classList.remove('show');
                ov.remove();
            });
        };

        // Remover tooltip e overlay imediatamente (SEM DELAY)
        if (tooltip) {
            tooltip.style.display = 'none';
            tooltip.style.pointerEvents = 'none';
            tooltip.remove();
        }
        removeAllOverlays();
        
        // Garantir que não há bloqueio de pointer-events no body
        document.body.style.pointerEvents = '';
        document.documentElement.style.pointerEvents = '';
        
        // Se tem returnToPage, navegar para lá e continuar tooltips
        if (returnToPage) {
            setTimeout(() => {
                // Verificar se está em iframe (menu.html) ou página direta
                if (window.parent && window.parent !== window) {
                    // Está em iframe, chamar função do parent
                    try {
                        if (window.parent.showSection) {
                            // Tentar identificar a seção pelo nome do arquivo
                            if (returnToPage.includes('criar-campanhas')) {
                                window.parent.showSection('campanhas');
                            } else {
                                window.parent.showSection('campanhas');
                            }
                            console.log('[Onboarding] Navegando via parent.showSection para:', returnToPage);
                        } else {
                            // Fallback: tentar mudar o src do iframe
                            const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                            if (menuFrame) {
                                menuFrame.src = returnToPage;
                                console.log('[Onboarding] Navegando via iframe.src para:', returnToPage);
                            }
                        }
                    } catch (e) {
                        console.warn('[Onboarding] Erro ao navegar via parent:', e);
                        // Fallback: redirecionar diretamente
                        window.location.href = returnToPage;
                    }
                } else {
                    // Está na página direta, redirecionar
                    // Se o caminho não começa com / ou http, adicionar caminho relativo
                    const targetPath = returnToPage.startsWith('/') || returnToPage.startsWith('http') 
                        ? returnToPage 
                        : `campanhas/${returnToPage}`;
                    window.location.href = targetPath;
                }
            }, 300);
            return; // Não continuar com o resto da função se vai navegar
        }

        // Garantir remoção completa após um pequeno delay
        setTimeout(() => {
            // Remover todos os overlays novamente (garantia)
            removeAllOverlays();
            
            // Remover qualquer tooltip que possa ter ficado
            const remainingTooltips = document.querySelectorAll('#onboarding-tooltip, .onboarding-tooltip');
            remainingTooltips.forEach(tt => {
                tt.style.display = 'none';
                tt.remove();
            });
            
            // Remover qualquer highlight que possa ter ficado
            const highlights = document.querySelectorAll('.onboarding-target-highlight');
            highlights.forEach(h => h.classList.remove('onboarding-target-highlight'));
            
            // Garantir que o body não tenha overflow bloqueado
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
            
            // Marcar como visto nesta sessão
            const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
            if (!seen.includes(tooltipId)) {
                seen.push(tooltipId);
                sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
            }

            // Marcar todos os tooltips desta página como vistos
            this.tooltips.forEach(t => {
                if (!seen.includes(t.id)) {
                    seen.push(t.id);
                }
            });
            sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));

            // Limpar histórico
            this.tooltipHistory = [];
            this.currentTooltipIndex = this.tooltips.length; // Marcar como completo
            
            // Desativar sistema
            this.isActive = false;
            
            // Verificação final - garantir que não há overlays
            const finalCheck = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
            if (finalCheck.length > 0) {
                console.warn('[Onboarding] Ainda há overlays no DOM, removendo...', finalCheck.length);
                finalCheck.forEach(ov => {
                    ov.style.pointerEvents = 'none';
                    ov.style.display = 'none';
                    ov.style.opacity = '0';
                    ov.style.visibility = 'hidden';
                    ov.remove();
                });
            }
            
            // Verificação final de tooltips
            const finalTooltips = document.querySelectorAll('#onboarding-tooltip, .onboarding-tooltip');
            if (finalTooltips.length > 0) {
                console.warn('[Onboarding] Ainda há tooltips no DOM, removendo...', finalTooltips.length);
                finalTooltips.forEach(tt => {
                    tt.style.display = 'none';
                    tt.style.pointerEvents = 'none';
                    tt.remove();
                });
            }
            
            console.log('[Onboarding] Onboarding finalizado! Interface normal restaurada.');
            console.log('[Onboarding] Verificação final - Overlays:', document.querySelectorAll('.onboarding-overlay, #onboarding-overlay').length);
            console.log('[Onboarding] Verificação final - Tooltips:', document.querySelectorAll('#onboarding-tooltip, .onboarding-tooltip').length);
            
            // Se estiver na página de demo, redirecionar para o sistema oficial após finalizar
            const currentPath = window.location.pathname;
            const parentPath = window.parent && window.parent !== window ? window.parent.location.pathname : '';
            const isDemoPage = currentPath.includes('onboarding-tutorial-demo') || 
                              parentPath.includes('onboarding-tutorial-demo-menu');
            
            if (isDemoPage) {
                console.log('[Onboarding] Tutorial finalizado na página de demo. Redirecionando para sistema oficial...');
                setTimeout(() => {
                    if (window.parent && window.parent !== window) {
                        // Está em iframe - redirecionar o parent (menu de demo) inteiro para o menu oficial
                        const newPath = parentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html');
                        window.parent.location.href = newPath;
                    } else {
                        // Está na página direta, redirecionar para menu oficial
                        const newPath = currentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html')
                                                  .replace(/onboarding-tutorial-demo.*\.html/, 'menu.html');
                        window.location.href = newPath;
                    }
                }, 500);
            }
        }, 100);
    }

    /**
     * Encerra o tutorial e volta ao sistema principal
     */
    encerrarTutorial() {
        console.log('[Onboarding] Encerrando tutorial e voltando ao sistema principal...');
        
        // Limpar seção escolhida e flags de tour
        localStorage.removeItem('onboarding_section');
        localStorage.removeItem('onboarding_reactivated');
        localStorage.removeItem('onboarding_wants_tour');
        
        // Marcar primeiro login como visto se ainda não foi marcado
        const tenantId = localStorage.getItem('tenant_id') || 'default';
        const userKey = `onboarding_first_login_${tenantId}`;
        if (!localStorage.getItem(userKey)) {
            localStorage.setItem(userKey, 'true');
            localStorage.setItem(`onboarding_first_login_date_${tenantId}`, new Date().toISOString());
        }
        
        // Fechar tooltip atual se existir
        const currentTooltip = document.getElementById('onboarding-tooltip');
        if (currentTooltip) {
            currentTooltip.classList.remove('show');
        }
        
        // Remover overlay
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        // Restaurar scroll
        this.restoreBodyScroll();
        
        // Remover elementos após animação
        setTimeout(() => {
            if (currentTooltip && currentTooltip.parentNode) {
                currentTooltip.remove();
            }
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
            
            // Voltar para o MENU PRINCIPAL OFICIAL (não apenas o iframe)
            // Isso substitui completamente o sistema de teste pelo oficial
            if (window.parent && window.parent !== window) {
                // Está em iframe - redirecionar o parent (menu de demo) inteiro para o menu oficial
                console.log('[Onboarding] Redirecionando menu de demo para menu oficial...');
                // Substituir 'onboarding-tutorial-demo-menu.html' por 'menu.html' no pathname
                const parentPath = window.parent.location.pathname;
                const newPath = parentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html');
                window.parent.location.href = newPath;
            } else {
                // Está na página direta, voltar para menu principal oficial
                console.log('[Onboarding] Redirecionando para menu oficial...');
                const currentPath = window.location.pathname;
                const newPath = currentPath.replace('onboarding-tutorial-demo-menu.html', 'menu.html')
                                          .replace(/onboarding-tutorial-demo.*\.html/, 'menu.html');
                window.location.href = newPath;
            }
        }, 300);
    }

    /**
     * Fecha o tooltip atual e avança para o próximo
     */
    closeTooltip(tooltip, tooltipId, shouldAdvance = true) {
        // Verificar se tooltip atual tem showArrowAfter - se sim, fechar tooltip mas mostrar seta
        // O tooltip deve ser fechado visualmente, mas aguardar clique no botão
        const currentTooltipConfig = this.tooltips[this.currentTooltipIndex];
        if (currentTooltipConfig && currentTooltipConfig.showArrowAfter === true && shouldAdvance) {
            console.log('[Onboarding] Tooltip com seta animada - fechando tooltip e mostrando seta...');
            
            // Fechar tooltip visualmente (remover classe show)
            if (tooltip) {
                tooltip.classList.remove('show');
            }
            
            // Remover overlay também
            const overlay = document.getElementById('onboarding-overlay');
            if (overlay) {
                overlay.classList.remove('show');
            }
            
            // Remover highlight
            this.removeHighlight();
            
            // Remover tooltip após animação e restaurar scroll
            setTimeout(() => {
                this.restoreBodyScroll();
                if (tooltip && tooltip.parentNode) {
                    tooltip.remove();
                }
                if (overlay && overlay.parentNode) {
                    overlay.remove();
                }
            }, 300);
            
            // Determinar qual botão mostrar a seta
            let targetSelector = currentTooltipConfig.targetButtonSelector;
            if (!targetSelector) {
                // Fallback para Grazi (compatibilidade)
                targetSelector = 'button.insights-btn';
            }
            
            // Mostrar seta animada apontando para o botão (tooltip já foi fechado)
            this.showAnimatedArrow(targetSelector);
            
            // Se requer modal aberto, aguardar clique no botão PRIMEIRO (não aguardar modal abrir ainda)
            if (currentTooltipConfig.requiresModalOpen === true && currentTooltipConfig.modalId) {
                // IMPORTANTE: Aguardar clique no botão PRIMEIRO, depois aguardar modal abrir
                console.log('[Onboarding] Tooltip requer modal, aguardando clique no botão...');
                this.waitForButtonClick(targetSelector);
            } else if (this.currentPage === 'dashboard') {
                // Se for dashboard, aguardar Grazi ser aberta
                this.waitForGraziToOpen();
            } else {
                // Para campanhas sem modal, aguardar clique no botão
                this.waitForButtonClick(targetSelector);
            }
            
            // Resetar flag
            this.isShowing = false;
            
            // IMPORTANTE: Retornar aqui - tooltip foi fechado, apenas aguardando clique
            return;
        }
        
        // Resetar flag imediatamente para permitir próximo tooltip
        this.isShowing = false;
        
        if (tooltip) {
            tooltip.classList.remove('show');
        }
        
        // Remover overlay imediatamente
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            overlay.style.pointerEvents = 'none';
            overlay.style.display = 'none';
        }

        // Remover highlight
        this.removeHighlight();

        // Verificar se precisa fechar modal e continuar (Grazi ou campanhas)
        // NOTA: Esta lógica será tratada dentro do setTimeout abaixo para não quebrar o fluxo

        setTimeout(() => {
            // Restaurar scroll do body
            this.restoreBodyScroll();
            
            // Remover tooltip
            if (tooltip && tooltip.parentNode) {
                tooltip.remove();
            }
            
            // Remover overlay completamente
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
            
            // Garantir que não há overlays presos (mas não remover todos, pois o próximo tooltip precisa criar um novo)
            const remainingOverlays = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
            remainingOverlays.forEach(ov => {
                if (ov !== overlay) {
                    ov.style.pointerEvents = 'none';
                    ov.style.display = 'none';
                    ov.remove();
                }
            });
            
            // Garantir que body não está bloqueado temporariamente
            document.body.style.pointerEvents = '';
            
            // Marcar como visto nesta sessão
            if (tooltipId) {
                const seen = JSON.parse(sessionStorage.getItem('onboarding_seen') || '[]');
                if (!seen.includes(tooltipId)) {
                    seen.push(tooltipId);
                    sessionStorage.setItem('onboarding_seen', JSON.stringify(seen));
                }
            }

            // Adicionar ao histórico antes de avançar (apenas se não estiver já no histórico)
            if (shouldAdvance) {
                if (!this.tooltipHistory.includes(this.currentTooltipIndex)) {
                    this.tooltipHistory.push(this.currentTooltipIndex);
                }
                
                // NOTA: A lógica de showArrowAfter já foi tratada no início da função closeTooltip
                // Não precisa verificar novamente aqui, pois se o tooltip atual tiver showArrowAfter,
                // a função já retornou antes de chegar aqui
                
                // Verificar se precisa fechar modal e continuar (Grazi ou campanhas)
                if (currentTooltipConfig && (currentTooltipConfig.closeGraziAndContinue === true || currentTooltipConfig.closeModalAndContinue === true)) {
                    // IMPORTANTE: Adicionar tooltip atual ao histórico ANTES de fechar modal
                    // Isso permite voltar para ele depois
                    if (!this.tooltipHistory.includes(this.currentTooltipIndex)) {
                        this.tooltipHistory.push(this.currentTooltipIndex);
                        console.log('[Onboarding] Adicionado tooltip de fechar modal ao histórico:', this.currentTooltipIndex);
                    }
                    
                    // Fechar modal (Grazi ou campanhas)
                    if (currentTooltipConfig.closeGraziAndContinue === true && typeof closeInsightsPopup === 'function') {
                        closeInsightsPopup();
                    } else if (currentTooltipConfig.closeModalAndContinue === true && currentTooltipConfig.modalId) {
                        // Fechar modal (campanhas ou follow-up)
                        const modal = document.getElementById(currentTooltipConfig.modalId);
                        if (modal) {
                            // Para modal D0, usar closeD0Modal
                            if (currentTooltipConfig.modalId === 'd0Modal') {
                                if (typeof closeD0Modal === 'function') {
                                    closeD0Modal();
                                    console.log('[Onboarding] Modal D0 fechado via closeD0Modal()');
                                } else {
                                    modal.style.display = 'none';
                                    document.body.style.overflow = 'auto';
                                    console.log('[Onboarding] Modal D0 fechado via display none');
                                }
                            } else {
                                // Tentar chamar função de fechar se existir
                                const closeFunctionName = 'close' + currentTooltipConfig.modalId.charAt(0).toUpperCase() + currentTooltipConfig.modalId.slice(1);
                                if (typeof window[closeFunctionName] === 'function') {
                                    window[closeFunctionName]();
                                } else if (typeof closeCallNowModal === 'function' && currentTooltipConfig.modalId === 'callNowModal') {
                                    closeCallNowModal();
                                } else {
                                    // Fallback: esconder modal diretamente
                                    modal.style.display = 'none';
                                    modal.classList.remove('active');
                                }
                            }
                        }
                    }
                    
                    // Remover seta se existir
                    this.removeAnimatedArrow();
                    
                    // Removido autoOpenNextModal - agora fecha o modal e mostra tooltip com spotlight para clicar no botão
                    
                    // Avançar para próximo tooltip normalmente
                    // NÃO pular tooltips que têm autoClick, pois eles vão abrir o modal novamente
                    this.currentTooltipIndex++;
                    console.log('[Onboarding] Avançando para próximo tooltip após fechar modal:', this.currentTooltipIndex + 1);
                } else {
                    // Mostrar próximo tooltip normalmente
                    this.currentTooltipIndex++;
                }
                
                if (this.currentTooltipIndex < this.tooltips.length) {
                    // Verificar se não há overlays presos antes de criar novo
                    const checkOverlays = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
                    checkOverlays.forEach(ov => ov.remove());
                    
                    // Garantir que body está liberado antes de criar novo tooltip
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                    
                    // Mostrar próximo tooltip IMEDIATAMENTE (sem delay adicional)
                    console.log('[Onboarding] Avançando para próximo tooltip:', this.currentTooltipIndex + 1);
                    // Chamar diretamente sem setTimeout adicional
                    this.isShowing = false; // Resetar flag para permitir mostrar próximo
                    this.showNextTooltip();
                } else {
                    console.log('[Onboarding] Todos os tooltips foram exibidos!');
                    // Garantir limpeza final
                    const finalOverlays = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
                    finalOverlays.forEach(ov => ov.remove());
                    document.body.style.pointerEvents = '';
                    document.body.style.overflow = '';
                }
            }
        }, 50);
    }
    
    /**
     * Mostra seta animada apontando para um elemento
     */
    showAnimatedArrow(selector) {
        console.log('[Onboarding] Tentando criar seta animada para:', selector);
        const element = document.querySelector(selector);
        if (!element) {
            console.warn('[Onboarding] Elemento não encontrado para seta:', selector);
            // Tentar novamente após um delay
            setTimeout(() => {
                const retryElement = document.querySelector(selector);
                if (retryElement) {
                    this.createArrowElement(retryElement);
                } else {
                    console.error('[Onboarding] Elemento ainda não encontrado após retry:', selector);
                }
            }, 500);
            return;
        }
        
        this.createArrowElement(element);
    }
    
    /**
     * Cria o elemento da seta
     */
    createArrowElement(element) {
        // Remover seta anterior se existir
        this.removeAnimatedArrow();
        
        const rect = element.getBoundingClientRect();
        const arrowContainer = document.createElement('div');
        arrowContainer.id = 'onboarding-animated-arrow';
        arrowContainer.className = 'onboarding-animated-arrow-container';
        
        // Posicionar container mais à esquerda do elemento (apontando para a direita)
        // Deixar mais espaço para não sobrepor a Grazi
        arrowContainer.style.position = 'fixed';
        arrowContainer.style.top = (rect.top + rect.height / 2) + 'px';
        arrowContainer.style.left = (rect.left - 180) + 'px'; // Mais à esquerda
        arrowContainer.style.transform = 'translateY(-50%)';
        arrowContainer.style.zIndex = '10001';
        arrowContainer.style.display = 'flex';
        arrowContainer.style.alignItems = 'center';
        arrowContainer.style.gap = '10px';
        
        // Criar texto "Clique aqui" PRIMEIRO (antes da flecha)
        const clickText = document.createElement('div');
        clickText.className = 'onboarding-click-here-text';
        clickText.textContent = 'Clique aqui';
        
        // Criar seta DEPOIS do texto
        const arrow = document.createElement('div');
        arrow.className = 'onboarding-animated-arrow';
        arrow.innerHTML = '→';
        
        // Adicionar texto primeiro, depois a flecha
        arrowContainer.appendChild(clickText);
        arrowContainer.appendChild(arrow);
        
        document.body.appendChild(arrowContainer);
        console.log('[Onboarding] Seta animada criada ao lado com texto!', {
            top: arrowContainer.style.top,
            left: arrowContainer.style.left,
            elementRect: rect
        });
        
        // Criar overlay especial com feixe de luz (Grazi ou campanhas)
        this.createGraziSpotlight(element);
        
        // Bloquear interações com outros elementos (passar seletor do botão alvo)
        const currentTooltip = this.tooltips[this.currentTooltipIndex];
        const targetSelector = currentTooltip && currentTooltip.targetButtonSelector 
            ? currentTooltip.targetButtonSelector 
            : null;
        this.blockDashboardInteractions(targetSelector);
        
        // Atualizar posição quando scroll ou resize
        const updatePosition = () => {
            const newRect = element.getBoundingClientRect();
            arrowContainer.style.top = (newRect.top + newRect.height / 2) + 'px';
            arrowContainer.style.left = (newRect.left - 180) + 'px'; // Mais à esquerda
            // Atualizar spotlight também
            this.updateGraziSpotlight(element);
        };
        
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        // Guardar função de limpeza
        arrowContainer._cleanup = () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }
    
    /**
     * Cria efeito de feixe de luz na Grazi e escurece o resto
     */
    createGraziSpotlight(element) {
        // Remover spotlight anterior se existir
        this.removeGraziSpotlight();
        
        const rect = element.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.id = 'onboarding-grazi-spotlight';
        spotlight.className = 'onboarding-grazi-spotlight';
        
        // Criar overlay escuro
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-spotlight-overlay';
        
        // Criar área iluminada (feixe de luz)
        const lightArea = document.createElement('div');
        lightArea.className = 'onboarding-spotlight-light';
        
        spotlight.appendChild(overlay);
        spotlight.appendChild(lightArea);
        document.body.appendChild(spotlight);
        
        this.updateGraziSpotlight(element);
        console.log('[Onboarding] Spotlight criado na Grazi');
    }
    
    /**
     * Atualiza posição do spotlight
     */
    updateGraziSpotlight(element) {
        const spotlight = document.getElementById('onboarding-grazi-spotlight');
        if (!spotlight) return;
        
        const rect = element.getBoundingClientRect();
        const overlay = spotlight.querySelector('.onboarding-spotlight-overlay');
        const lightArea = spotlight.querySelector('.onboarding-spotlight-light');
        
        // Atualizar clip-path do overlay para deixar área da Grazi visível
        if (overlay) {
            const padding = 10; // Espaçamento ao redor
            const clipTop = rect.top - padding;
            const clipRight = rect.right + padding;
            const clipBottom = rect.bottom + padding;
            const clipLeft = rect.left - padding;
            
            overlay.style.clipPath = `polygon(
                0% 0%, 
                0% 100%, 
                ${clipLeft}px 100%, 
                ${clipLeft}px ${clipTop}px, 
                ${clipRight}px ${clipTop}px, 
                ${clipRight}px ${clipBottom}px, 
                ${clipLeft}px ${clipBottom}px, 
                ${clipLeft}px 100%, 
                100% 100%, 
                100% 0%
            )`;
        }
        
        // Atualizar área iluminada ao redor (não sobrepondo o botão)
        if (lightArea) {
            const padding = 15; // Espaçamento para o feixe de luz
            lightArea.style.top = (rect.top - padding) + 'px';
            lightArea.style.left = (rect.left - padding) + 'px';
            lightArea.style.width = (rect.width + padding * 2) + 'px';
            lightArea.style.height = (rect.height + padding * 2) + 'px';
            
            // Remover texto do spotlight (só teremos um "Clique aqui" na flecha)
            const existingText = lightArea.querySelector('.onboarding-spotlight-click-text');
            if (existingText) {
                existingText.remove();
            }
        }
    }
    
    /**
     * Remove spotlight
     */
    removeGraziSpotlight() {
        const spotlight = document.getElementById('onboarding-grazi-spotlight');
        if (spotlight) {
            spotlight.remove();
        }
    }
    
    /**
     * Bloqueia interações com outros elementos do dashboard
     */
    blockDashboardInteractions(targetSelector = null) {
        // Se não especificado, usar botão da Grazi (compatibilidade)
        if (!targetSelector) {
            targetSelector = 'button.insights-btn';
        }
        
        // Se Grazi está aberta, NÃO bloquear interações dentro do popup
        const graziPopup = document.getElementById('insightsPopup');
        if (graziPopup && graziPopup.classList.contains('active')) {
            console.log('[Onboarding] Grazi está aberta, não bloqueando interações dentro do popup');
            // Remover bloqueador se existir
            const existingBlocker = document.getElementById('onboarding-interaction-blocker');
            if (existingBlocker) {
                existingBlocker.remove();
            }
            return;
        }
        
        // Encontrar botão alvo
        const targetBtn = document.querySelector(targetSelector);
        if (!targetBtn) {
            console.warn('[Onboarding] Botão alvo não encontrado!', targetSelector);
            return;
        }
        
        // Garantir que o botão está acima do bloqueador e clicável
        targetBtn.style.zIndex = '10002';
        targetBtn.style.position = 'relative';
        targetBtn.style.pointerEvents = 'auto';
        
        // Criar overlay bloqueador com clip-path para criar "buraco" onde está o botão
        const blocker = document.createElement('div');
        blocker.id = 'onboarding-interaction-blocker';
        blocker.className = 'onboarding-interaction-blocker';
        document.body.appendChild(blocker);
        
        // Função para atualizar o clip-path do bloqueador (criar buraco onde está o botão)
        const updateBlockerClip = () => {
            const rect = targetBtn.getBoundingClientRect();
            const padding = 5; // Pequeno padding ao redor do botão
            
            blocker.style.clipPath = `polygon(
                0% 0%, 
                0% 100%, 
                ${rect.left - padding}px 100%, 
                ${rect.left - padding}px ${rect.top - padding}px, 
                ${rect.right + padding}px ${rect.top - padding}px, 
                ${rect.right + padding}px ${rect.bottom + padding}px, 
                ${rect.left - padding}px ${rect.bottom + padding}px, 
                ${rect.left - padding}px 100%, 
                100% 100%, 
                100% 0%
            )`;
        };
        
        // Atualizar clip-path inicialmente e quando necessário
        updateBlockerClip();
        
        // Atualizar quando scroll ou resize
        const updateHandler = () => {
            updateBlockerClip();
        };
        window.addEventListener('scroll', updateHandler, true);
        window.addEventListener('resize', updateHandler);
        
        // Guardar função de limpeza
        blocker._cleanup = () => {
            window.removeEventListener('scroll', updateHandler, true);
            window.removeEventListener('resize', updateHandler);
        };
        
        // Bloquear todos os cliques no bloqueador (mas o botão está fora devido ao clip-path)
        // IMPORTANTE: Não bloquear cliques dentro do popup da Grazi se estiver aberto
        blocker.addEventListener('click', (e) => {
            // Verificar se o clique foi dentro do popup da Grazi
            const graziPopup = document.getElementById('insightsPopup');
            if (graziPopup && graziPopup.classList.contains('active')) {
                const clickTarget = e.target;
                if (graziPopup.contains(clickTarget) || clickTarget.closest('#insightsPopup')) {
                    console.log('[Onboarding] Clique dentro da Grazi permitido');
                    return; // Permitir clique dentro da Grazi
                }
            }
            
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('[Onboarding] Interação bloqueada - clique no botão destacado primeiro!');
            return false;
        }, true);
        
        // Bloquear outros eventos também, mas permitir dentro da Grazi
        ['mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(eventType => {
            blocker.addEventListener(eventType, (e) => {
                // Verificar se o evento foi dentro do popup da Grazi
                const graziPopup = document.getElementById('insightsPopup');
                if (graziPopup && graziPopup.classList.contains('active')) {
                    const eventTarget = e.target;
                    if (graziPopup.contains(eventTarget) || eventTarget.closest('#insightsPopup')) {
                        return; // Permitir evento dentro da Grazi
                    }
                }
                
                e.preventDefault();
                e.stopPropagation();
            }, true);
        });
        
        console.log('[Onboarding] Interações bloqueadas (exceto botão alvo via clip-path):', targetSelector);
    }
    
    /**
     * Remove bloqueio de interações
     */
    unblockDashboardInteractions() {
        const blocker = document.getElementById('onboarding-interaction-blocker');
        if (blocker) {
            // Limpar event listeners se existir
            if (blocker._cleanup) {
                blocker._cleanup();
            }
            blocker.remove();
        }
        
        // Restaurar estilo do botão da Grazi
        const graziBtn = document.querySelector('button.insights-btn');
        if (graziBtn) {
            graziBtn.style.zIndex = '';
            graziBtn.style.position = '';
            graziBtn.style.pointerEvents = '';
        }
    }
    
    /**
     * Remove seta animada
     */
    removeAnimatedArrow() {
        const arrow = document.getElementById('onboarding-animated-arrow');
        if (arrow) {
            // Limpar event listeners se existir
            if (arrow._cleanup) {
                arrow._cleanup();
            }
            arrow.remove();
            console.log('[Onboarding] Seta animada removida');
        }
        // Remover spotlight e desbloquear interações também
        this.removeGraziSpotlight();
        this.unblockDashboardInteractions();
    }
    
    /**
     * Aguarda modal ser aberto (campanhas) - mesma lógica da Grazi
     * Com seta animada e spotlight (feixe de luz) como na Grazi
     */
    waitForModalToOpen(modalId) {
        console.log('[Onboarding] Aguardando modal ser aberto (mesma lógica da Grazi):', modalId);
        let attempts = 0;
        const maxAttempts = 100; // 20 segundos máximo
        
        const checkModal = setInterval(() => {
            attempts++;
            const modal = document.getElementById(modalId);
            // Verificar se modal está visível (modal usa display: block ou classe 'show')
            const isVisible = modal && (
                modal.classList.contains('show') ||
                modal.classList.contains('active') || 
                modal.style.display === 'block' ||
                modal.style.display !== 'none' ||
                getComputedStyle(modal).display === 'block' ||
                getComputedStyle(modal).display !== 'none'
            );
            
            // Debug a cada 10 tentativas
            if (attempts % 10 === 0) {
                console.log(`[Onboarding] Tentativa ${attempts}/${maxAttempts} - Modal ${modalId}:`, {
                    existe: !!modal,
                    display: modal ? modal.style.display : 'não existe',
                    computedDisplay: modal ? getComputedStyle(modal).display : 'não existe',
                    classes: modal ? Array.from(modal.classList) : 'não existe',
                    isVisible: isVisible
                });
            }
            
            if (isVisible) {
                clearInterval(checkModal);
                console.log('[Onboarding] Modal aberto! Removendo seta, spotlight e mostrando tooltips dentro dele...');
                // Remover seta e spotlight (mesma lógica da Grazi)
                this.removeAnimatedArrow();
                this.removeGraziSpotlight();
                this.unblockDashboardInteractions(); // Desbloquear interações quando modal abrir
                
                // Fechar tooltip atual se ainda estiver visível
                const currentTooltip = document.getElementById('onboarding-tooltip');
                if (currentTooltip) {
                    currentTooltip.classList.remove('show');
                    setTimeout(() => {
                        if (currentTooltip.parentNode) {
                            currentTooltip.remove();
                        }
                        // Remover overlay também
                        const overlay = document.getElementById('onboarding-overlay');
                        if (overlay && overlay.parentNode) {
                            overlay.remove();
                        }
                    }, 300);
                }
                
                // Aguardar um pouco para modal estar completamente renderizado
                setTimeout(() => {
                    // IMPORTANTE: NÃO incrementar currentTooltipIndex aqui
                    // O índice já foi ajustado quando o botão foi clicado em waitForButtonClick
                    // Apenas garantir que estamos no primeiro tooltip do modal (pular showArrowAfter)
                    console.log('[Onboarding] Modal aberto! Verificando tooltip atual. Índice:', this.currentTooltipIndex, 'ModalId:', modalId);
                    while (this.currentTooltipIndex < this.tooltips.length) {
                        const nextTooltip = this.tooltips[this.currentTooltipIndex];
                        console.log('[Onboarding] Verificando tooltip:', nextTooltip.id, 'requiresModalOpen:', nextTooltip.requiresModalOpen, 'modalId:', nextTooltip.modalId, 'showArrowAfter:', nextTooltip.showArrowAfter);
                        
                        // Pular tooltips com showArrowAfter (já foram mostrados antes do modal abrir)
                        if (nextTooltip.showArrowAfter === true) {
                            console.log('[Onboarding] Pulando tooltip com showArrowAfter:', nextTooltip.id);
                            this.currentTooltipIndex++;
                            continue;
                        }
                        // Encontrar primeiro tooltip dentro do modal que NÃO tem showArrowAfter
                        // Para follow-up, aceitar qualquer tooltip que tenha requiresModalOpen e modalId 'd0Modal'
                        if (nextTooltip.requiresModalOpen === true && 
                            (nextTooltip.modalId === modalId || 
                             (modalId === 'd0Modal' && nextTooltip.modalId === 'd0Modal'))) {
                            console.log('[Onboarding] ========================================');
                            console.log('[Onboarding] Encontrado primeiro tooltip dentro do modal:', nextTooltip.id);
                            console.log('[Onboarding] Índice final:', this.currentTooltipIndex);
                            console.log('[Onboarding] ========================================');
                            break;
                        }
                        this.currentTooltipIndex++;
                    }
                    
                    if (this.currentTooltipIndex < this.tooltips.length) {
                        this.isShowing = false; // IMPORTANTE: resetar flag antes de mostrar próximo tooltip
                        // Aguardar mais um pouco para garantir que elementos do modal estão renderizados
                        setTimeout(() => {
                            console.log('[Onboarding] ========================================');
                            console.log('[Onboarding] FORÇANDO tooltip a aparecer dentro do modal!');
                            console.log('[Onboarding] Índice atual:', this.currentTooltipIndex);
                            console.log('[Onboarding] Tooltip a ser mostrado:', this.tooltips[this.currentTooltipIndex]?.id);
                            console.log('[Onboarding] Selector:', this.tooltips[this.currentTooltipIndex]?.selector);
                            console.log('[Onboarding] ========================================');
                            
                            // Verificar se o elemento existe antes de mostrar - com múltiplas tentativas
                            const nextTooltipConfig = this.tooltips[this.currentTooltipIndex];
                            if (nextTooltipConfig) {
                                let elementCheckAttempts = 0;
                                const maxElementCheckAttempts = 50; // 10 segundos
                                const checkElement = setInterval(() => {
                                    elementCheckAttempts++;
                                    const targetElement = document.querySelector(nextTooltipConfig.selector);
                                    
                                    if (elementCheckAttempts % 5 === 0 || targetElement) {
                                        console.log(`[Onboarding] Tentativa ${elementCheckAttempts}/${maxElementCheckAttempts} - Elemento encontrado:`, targetElement ? 'SIM' : 'NÃO');
                                        if (targetElement) {
                                            console.log('[Onboarding] Elemento encontrado! Mostrando tooltip...');
                                        }
                                    }
                                    
                                    if (targetElement || elementCheckAttempts >= maxElementCheckAttempts) {
                                        clearInterval(checkElement);
                                        console.log('[Onboarding] ========================================');
                                        console.log('[Onboarding] FORÇANDO criação do tooltip!');
                                        console.log('[Onboarding] Elemento encontrado:', targetElement ? 'SIM' : 'NÃO');
                                        console.log('[Onboarding] Selector:', nextTooltipConfig.selector);
                                        console.log('[Onboarding] Tooltip ID:', nextTooltipConfig.id);
                                        console.log('[Onboarding] ========================================');
                                        
                                        // FORÇAR criação do tooltip mesmo se elemento não for encontrado
                                        // Usar body como fallback se elemento não existir
                                        const elementToUse = targetElement || document.body;
                                        console.log('[Onboarding] Usando elemento:', elementToUse.tagName, elementToUse.id || elementToUse.className);
                                        
                                        // Resetar flag e forçar criação
                                        this.isShowing = false;
                                        
                                        // Se elemento não foi encontrado, tentar criar tooltip na posição do modal
                                        if (!targetElement) {
                                            console.warn('[Onboarding] Elemento não encontrado. Listando elementos disponíveis no modal...');
                                            const modal = document.getElementById(modalId);
                                            if (modal) {
                                                const allStrategyOptions = Array.from(modal.querySelectorAll('.strategy-option')).map(el => ({
                                                    strategy: el.getAttribute('data-strategy'),
                                                    visible: getComputedStyle(el).display !== 'none',
                                                    display: getComputedStyle(el).display,
                                                    opacity: getComputedStyle(el).opacity,
                                                    classes: el.className
                                                }));
                                                console.warn('[Onboarding] Strategy options disponíveis no modal:', allStrategyOptions);
                                                
                                                // Tentar encontrar qualquer strategy-option como fallback
                                                const fallbackElement = modal.querySelector('.strategy-option');
                                                if (fallbackElement) {
                                                    console.log('[Onboarding] Usando elemento fallback:', fallbackElement);
                                                    // Atualizar o selector temporariamente para usar o elemento encontrado
                                                    const originalSelector = nextTooltipConfig.selector;
                                                    nextTooltipConfig.selector = '.strategy-option'; // Usar seletor mais genérico
                                                    setTimeout(() => {
                                                        this.showNextTooltip();
                                                    }, 100);
                                                    return;
                                                }
                                            }
                                        }
                                        
                                        // Mostrar tooltip normalmente
                                        setTimeout(() => {
                                            this.showNextTooltip();
                                        }, 100);
                                    }
                                }, 200);
                            } else {
                                this.showNextTooltip();
                            }
                        }, 1000); // Aumentado para 1000ms para garantir renderização completa
                    } else {
                        console.warn('[Onboarding] Nenhum tooltip encontrado dentro do modal');
                    }
                }, 500);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkModal);
                console.warn('[Onboarding] Timeout aguardando modal ser aberto. Continuando normalmente...');
                // Remover seta e spotlight
                this.removeAnimatedArrow();
                this.removeGraziSpotlight();
                this.unblockDashboardInteractions();
                
                // Fechar tooltip atual se ainda estiver visível
                const currentTooltip = document.getElementById('onboarding-tooltip');
                if (currentTooltip) {
                    currentTooltip.classList.remove('show');
                    setTimeout(() => {
                        if (currentTooltip.parentNode) {
                            currentTooltip.remove();
                        }
                        const overlay = document.getElementById('onboarding-overlay');
                        if (overlay && overlay.parentNode) {
                            overlay.remove();
                        }
                    }, 300);
                }
                
                // Pular tooltips do modal e continuar
                this.currentTooltipIndex++;
                while (this.currentTooltipIndex < this.tooltips.length) {
                    const nextTooltip = this.tooltips[this.currentTooltipIndex];
                    if (nextTooltip.requiresModalOpen === true && nextTooltip.modalId === modalId) {
                        this.currentTooltipIndex++;
                    } else {
                        break;
                    }
                }
                if (this.currentTooltipIndex < this.tooltips.length) {
                    this.isShowing = false;
                    this.showNextTooltip();
                }
            }
        }, 200);
    }
    
    /**
     * Aguarda modal ser fechado (campanhas)
     */
    waitForModalToClose(modalId) {
        console.log('[Onboarding] Aguardando modal ser fechado:', modalId);
        let attempts = 0;
        const maxAttempts = 150; // 30 segundos máximo
        
        const checkModal = setInterval(() => {
            attempts++;
            const modal = document.getElementById(modalId);
            // Modal usa classe 'show' - verificar se foi removida
            const isClosed = !modal || (
                !modal.classList.contains('show') && 
                !modal.classList.contains('active') && 
                modal.style.display === 'none'
            );
            if (isClosed) {
                clearInterval(checkModal);
                console.log('[Onboarding] Modal fechado! Continuando tutorial...');
                this.unblockDashboardInteractions();
                
                // Aguardar um pouco antes de continuar
                setTimeout(() => {
                    this.currentTooltipIndex++;
                    if (this.currentTooltipIndex < this.tooltips.length) {
                        this.isShowing = false;
                        this.showNextTooltip();
                    }
                }, 300);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkModal);
                console.warn('[Onboarding] Timeout aguardando modal ser fechado, continuando mesmo assim');
                this.unblockDashboardInteractions();
                // Continuar mesmo assim
                this.currentTooltipIndex++;
                if (this.currentTooltipIndex < this.tooltips.length) {
                    this.isShowing = false;
                    setTimeout(() => this.showNextTooltip(), 300);
                }
            }
        }, 200);
    }
    
    /**
     * Aguarda botão ser clicado (campanhas sem modal ou com modal)
     * Tooltip permanece visível até o botão ser clicado ou 10 segundos passarem
     * Se o tooltip requer modal aberto, após o clique aguarda o modal abrir
     */
    waitForButtonClick(selector) {
        console.log('[Onboarding] Aguardando botão ser clicado. Tooltip permanecerá visível até clique ou 10 segundos:', selector);
        const button = document.querySelector(selector);
        if (!button) {
            console.warn('[Onboarding] Botão não encontrado:', selector);
            this.removeAnimatedArrow();
            this.unblockDashboardInteractions();
            // Se botão não encontrado, avançar após 2 segundos
            setTimeout(() => {
                this.currentTooltipIndex++;
                if (this.currentTooltipIndex < this.tooltips.length) {
                    this.isShowing = false;
                    this.closeTooltip(null, null, true); // Fechar tooltip atual e avançar
                }
            }, 2000);
            return;
        }
        
        // Verificar se tooltip atual requer modal aberto
        const currentTooltipConfig = this.tooltips[this.currentTooltipIndex];
        // Para tooltips com showArrowAfter que apontam para botões que abrem modais (follow-up),
        // também considerar como requiresModal mesmo que não tenha requiresModalOpen: true
        const isFollowUpModalButton = currentTooltipConfig && 
            currentTooltipConfig.showArrowAfter === true &&
            (currentTooltipConfig.targetButtonSelector && 
             (currentTooltipConfig.targetButtonSelector.includes('openModal') || 
              currentTooltipConfig.targetButtonSelector.includes('d0_30min') ||
              currentTooltipConfig.targetButtonSelector.includes('d0_3horas')));
        const requiresModal = (currentTooltipConfig && currentTooltipConfig.requiresModalOpen === true && currentTooltipConfig.modalId) || isFollowUpModalButton;
        const hasNextPage = currentTooltipConfig && currentTooltipConfig.nextPage;
        
        // Se tem nextPage, marcar localStorage IMEDIATAMENTE (antes de qualquer clique)
        if (hasNextPage) {
            console.log('[Onboarding] Tooltip tem nextPage configurado. Marcando reativação ANTES do clique...');
            localStorage.setItem('onboarding_reactivated', 'true');
            localStorage.removeItem('onboarding_auto_show_disabled');
            localStorage.removeItem('onboarding_disabled');
        }
        
        let clicked = false;
        let timeoutId = null;
        
        // Adicionar listener temporário
        const clickHandler = (e) => {
            if (clicked) return; // Evitar múltiplos cliques
            clicked = true;
            console.log('[Onboarding] Botão clicado! Removendo seta...');
            
            // Verificar se tooltip atual tem nextPage configurado (já foi verificado acima, mas usar a variável local)
            const nextPage = hasNextPage;
            if (nextPage) {
                // Marcar para reativar onboarding na próxima página ANTES de qualquer coisa
                console.log('[Onboarding] Marcando reativação do onboarding para próxima página:', nextPage);
                localStorage.setItem('onboarding_reactivated', 'true');
                localStorage.removeItem('onboarding_auto_show_disabled');
            }
            
            // Limpar timeout se existir
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            button.removeEventListener('click', clickHandler);
            this.removeAnimatedArrow();
            this.removeGraziSpotlight();
            this.unblockDashboardInteractions();
            
            // IMPORTANTE: Se o botão tem onclick próprio e tem nextPage, permitir que o clique original aconteça
            // Não prevenir o comportamento padrão
            if (nextPage && (button.getAttribute('onclick') || button.onclick)) {
                console.log('[Onboarding] Botão tem onclick próprio, permitindo navegação nativa...');
                // Não fazer preventDefault - deixar o onclick original executar
            }
            
            // Fechar tooltip atual
            const currentTooltip = document.getElementById('onboarding-tooltip');
            if (currentTooltip) {
                // Remover classe show para animar saída
                currentTooltip.classList.remove('show');
                // Remover overlay também
                const overlay = document.getElementById('onboarding-overlay');
                if (overlay) {
                    overlay.classList.remove('show');
                }
                // Aguardar animação e então remover
                setTimeout(() => {
                    if (currentTooltip.parentNode) {
                        currentTooltip.remove();
                    }
                    if (overlay && overlay.parentNode) {
                        overlay.remove();
                    }
                    
                    // Se requer modal, aguardar modal abrir antes de avançar
                    if (requiresModal) {
                        console.log('[Onboarding] Botão clicado! Avançando índice e aguardando modal abrir...');
                        // IMPORTANTE: Avançar índice para o primeiro tooltip do modal ANTES de aguardar
                        this.currentTooltipIndex++;
                        
                        // Se for botão de follow-up (30min ou 3horas), usar modalId 'd0Modal'
                        const modalIdToWait = currentTooltipConfig.modalId || (isFollowUpModalButton ? 'd0Modal' : null);
                        
                        // Encontrar o primeiro tooltip dentro do modal (pular tooltips com showArrowAfter)
                        console.log('[Onboarding] Procurando primeiro tooltip dentro do modal. ModalId:', modalIdToWait);
                        console.log('[Onboarding] Índice atual:', this.currentTooltipIndex);
                        while (this.currentTooltipIndex < this.tooltips.length) {
                            const nextTooltip = this.tooltips[this.currentTooltipIndex];
                            console.log('[Onboarding] Verificando tooltip:', nextTooltip.id, 'requiresModalOpen:', nextTooltip.requiresModalOpen, 'modalId:', nextTooltip.modalId, 'showArrowAfter:', nextTooltip.showArrowAfter);
                            
                            // Pular tooltips com showArrowAfter (já foram mostrados antes do modal abrir)
                            if (nextTooltip.showArrowAfter === true) {
                                console.log('[Onboarding] Pulando tooltip com showArrowAfter:', nextTooltip.id);
                                this.currentTooltipIndex++;
                                continue;
                            }
                            // Encontrar primeiro tooltip dentro do modal que NÃO tem showArrowAfter
                            // Para follow-up, aceitar qualquer tooltip que tenha requiresModalOpen e modalId 'd0Modal'
                            if (nextTooltip.requiresModalOpen === true && 
                                (nextTooltip.modalId === modalIdToWait || 
                                 (modalIdToWait === 'd0Modal' && nextTooltip.modalId === 'd0Modal'))) {
                                console.log('[Onboarding] ========================================');
                                console.log('[Onboarding] Encontrado primeiro tooltip dentro do modal:', nextTooltip.id);
                                console.log('[Onboarding] Índice final:', this.currentTooltipIndex);
                                console.log('[Onboarding] ========================================');
                                break;
                            }
                            this.currentTooltipIndex++;
                        }
                        // Agora aguardar modal abrir (índice já está no lugar certo)
                        console.log('[Onboarding] Aguardando modal abrir:', modalIdToWait);
                        this.waitForModalToOpen(modalIdToWait);
                    } else {
                        // Verificar se tooltip atual tem nextPage configurado (navegação para outra página)
                        const nextPage = currentTooltipConfig && currentTooltipConfig.nextPage;
                        if (nextPage) {
                            console.log('[Onboarding] Tooltip requer navegação para:', nextPage);
                            // Marcar para reativar onboarding na próxima página
                            localStorage.setItem('onboarding_reactivated', 'true');
                            localStorage.removeItem('onboarding_auto_show_disabled');
                            
                            // IMPORTANTE: Permitir que o clique original do botão aconteça primeiro
                            // Se o botão tem onclick, ele já vai navegar, então só precisamos marcar o localStorage
                            // Se não tem onclick, navegamos nós mesmos
                            const hasOnclick = button.getAttribute('onclick') || button.onclick;
                            if (hasOnclick) {
                                console.log('[Onboarding] Botão tem onclick próprio, permitindo navegação nativa...');
                                // O botão já vai navegar, só precisamos garantir que o onboarding seja reativado
                                // Não precisamos navegar manualmente
                            } else {
                                // Navegar manualmente se o botão não tem onclick
                                setTimeout(() => {
                                    if (window.parent && window.parent !== window) {
                                        // Está em iframe
                                        try {
                                            const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                                            if (menuFrame) {
                                                menuFrame.src = `campanhas/${nextPage}`;
                                                console.log('[Onboarding] Navegando via iframe.src para:', nextPage);
                                            } else {
                                                window.location.href = nextPage;
                                            }
                                        } catch (e) {
                                            console.warn('[Onboarding] Erro ao navegar via parent:', e);
                                            window.location.href = nextPage;
                                        }
                                    } else {
                                        window.location.href = nextPage;
                                    }
                                }, 300);
                            }
                        } else {
                            // Se não requer modal e não tem nextPage, avançar imediatamente
                            this.currentTooltipIndex++;
                            if (this.currentTooltipIndex < this.tooltips.length) {
                                this.isShowing = false;
                                this.showNextTooltip();
                            }
                        }
                    }
                }, 300);
            } else {
                // Se tooltip não existe
                if (requiresModal) {
                    console.log('[Onboarding] Botão clicado! Aguardando modal abrir...');
                    this.waitForModalToOpen(currentTooltipConfig.modalId);
                    } else {
                        // Verificar se tooltip atual tem nextPage configurado (navegação para outra página)
                        const nextPage = currentTooltipConfig && currentTooltipConfig.nextPage;
                        if (nextPage) {
                            console.log('[Onboarding] Tooltip requer navegação para:', nextPage);
                            // Marcar para reativar onboarding na próxima página
                            localStorage.setItem('onboarding_reactivated', 'true');
                            localStorage.removeItem('onboarding_auto_show_disabled');
                            // Navegar para próxima página
                            setTimeout(() => {
                                if (window.parent && window.parent !== window) {
                                    // Está em iframe
                                    try {
                                        const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                                        if (menuFrame) {
                                            menuFrame.src = `campanhas/${nextPage}`;
                                            console.log('[Onboarding] Navegando via iframe.src para:', nextPage);
                                        } else {
                                            window.location.href = nextPage;
                                        }
                                    } catch (e) {
                                        console.warn('[Onboarding] Erro ao navegar via parent:', e);
                                        window.location.href = nextPage;
                                    }
                                } else {
                                    window.location.href = nextPage;
                                }
                            }, 300);
                        } else {
                            // Se não requer modal e não tem nextPage, avançar imediatamente
                            setTimeout(() => {
                                this.currentTooltipIndex++;
                                if (this.currentTooltipIndex < this.tooltips.length) {
                                    this.isShowing = false;
                                    this.showNextTooltip();
                                }
                            }, 300);
                        }
                    }
            }
        };
        
        // Adicionar listener com capture para interceptar antes do onclick original
        // Mas não prevenir o comportamento padrão se tiver nextPage
        if (hasNextPage) {
            // Se tem nextPage, usar capture mas não prevenir default
            button.addEventListener('click', clickHandler, { once: true, capture: true });
        } else {
            // Se não tem nextPage, comportamento normal
            button.addEventListener('click', clickHandler, { once: true });
        }
        
        // Timeout de 10 segundos - avançar automaticamente se não clicar
        timeoutId = setTimeout(() => {
            if (!clicked) {
                console.log('[Onboarding] Timeout de 10 segundos - avançando automaticamente');
                button.removeEventListener('click', clickHandler);
                this.removeAnimatedArrow();
                this.removeGraziSpotlight();
                this.unblockDashboardInteractions();
                
                // Verificar se tooltip atual tem nextPage configurado
                if (hasNextPage) {
                    const nextPageValue = currentTooltipConfig.nextPage;
                    console.log('[Onboarding] Timeout: Tooltip requer navegação para:', nextPageValue);
                    // Marcar para reativar onboarding na próxima página
                    localStorage.setItem('onboarding_reactivated', 'true');
                    localStorage.removeItem('onboarding_auto_show_disabled');
                    // Fechar tooltip atual
                    const currentTooltip = document.getElementById('onboarding-tooltip');
                    if (currentTooltip) {
                        currentTooltip.classList.remove('show');
                        const overlay = document.getElementById('onboarding-overlay');
                        if (overlay) overlay.classList.remove('show');
                        setTimeout(() => {
                            if (currentTooltip.parentNode) currentTooltip.remove();
                            if (overlay && overlay.parentNode) overlay.remove();
                            // Navegar para próxima página
                            if (window.parent && window.parent !== window) {
                                try {
                                    const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                                    if (menuFrame) {
                                        menuFrame.src = `campanhas/${nextPageValue}`;
                                        console.log('[Onboarding] Navegando via iframe.src para:', nextPageValue);
                                    } else {
                                        window.location.href = nextPageValue;
                                    }
                                } catch (e) {
                                    console.warn('[Onboarding] Erro ao navegar via parent:', e);
                                    window.location.href = nextPageValue;
                                }
                            } else {
                                window.location.href = nextPageValue;
                            }
                        }, 300);
                    } else {
                        // Navegar imediatamente se tooltip não existe
                        if (window.parent && window.parent !== window) {
                            try {
                                const menuFrame = window.parent.document.querySelector('iframe[name="contentFrame"]');
                                if (menuFrame) {
                                    menuFrame.src = `campanhas/${nextPageValue}`;
                                } else {
                                    window.location.href = nextPageValue;
                                }
                            } catch (e) {
                                window.location.href = nextPageValue;
                            }
                        } else {
                            window.location.href = nextPageValue;
                        }
                    }
                    return; // Não continuar com lógica normal de avançar tooltip
                }
                
                // Se requer modal, verificar se modal está aberto antes de avançar
                if (requiresModal) {
                    const modalIdToCheck = currentTooltipConfig.modalId || (isFollowUpModalButton ? 'd0Modal' : null);
                    console.log('[Onboarding] Timeout: Tooltip requer modal. Verificando se modal está aberto...', modalIdToCheck);
                    
                    if (modalIdToCheck) {
                        const modal = document.getElementById(modalIdToCheck);
                        const isModalOpen = modal && (
                            modal.classList.contains('show') ||
                            modal.classList.contains('active') || 
                            modal.style.display !== 'none' ||
                            getComputedStyle(modal).display !== 'none' ||
                            getComputedStyle(modal).display === 'block'
                        );
                        
                        if (isModalOpen) {
                            // Modal já está aberto, mostrar tooltips dentro dele
                            console.log('[Onboarding] Timeout: Modal já está aberto! Mostrando tooltips dentro dele...');
                            // Fechar tooltip atual
                            const currentTooltip = document.getElementById('onboarding-tooltip');
                            if (currentTooltip) {
                                currentTooltip.classList.remove('show');
                                const overlay = document.getElementById('onboarding-overlay');
                                if (overlay) overlay.classList.remove('show');
                                setTimeout(() => {
                                    if (currentTooltip.parentNode) currentTooltip.remove();
                                    if (overlay && overlay.parentNode) overlay.remove();
                                }, 300);
                            }
                            // Avançar para primeiro tooltip dentro do modal
                            this.currentTooltipIndex++;
                            while (this.currentTooltipIndex < this.tooltips.length) {
                                const nextTooltip = this.tooltips[this.currentTooltipIndex];
                                if (nextTooltip.showArrowAfter === true) {
                                    this.currentTooltipIndex++;
                                    continue;
                                }
                                if (nextTooltip.requiresModalOpen === true && 
                                    (nextTooltip.modalId === modalIdToCheck || 
                                     (modalIdToCheck === 'd0Modal' && nextTooltip.modalId === 'd0Modal'))) {
                                    console.log('[Onboarding] Timeout: Encontrado primeiro tooltip dentro do modal:', nextTooltip.id);
                                    break;
                                }
                                this.currentTooltipIndex++;
                            }
                            // Aguardar um pouco e mostrar tooltip
                            setTimeout(() => {
                                if (this.currentTooltipIndex < this.tooltips.length) {
                                    this.isShowing = false;
                                    this.showNextTooltip();
                                }
                            }, 500);
                            return; // Não continuar com lógica normal
                        } else {
                            // Modal não está aberto, aguardar modal abrir
                            console.log('[Onboarding] Timeout: Modal não está aberto. Aguardando modal abrir...');
                            // Fechar tooltip atual
                            const currentTooltip = document.getElementById('onboarding-tooltip');
                            if (currentTooltip) {
                                currentTooltip.classList.remove('show');
                                const overlay = document.getElementById('onboarding-overlay');
                                if (overlay) overlay.classList.remove('show');
                                setTimeout(() => {
                                    if (currentTooltip.parentNode) currentTooltip.remove();
                                    if (overlay && overlay.parentNode) overlay.remove();
                                }, 300);
                            }
                            // Avançar para primeiro tooltip dentro do modal
                            this.currentTooltipIndex++;
                            while (this.currentTooltipIndex < this.tooltips.length) {
                                const nextTooltip = this.tooltips[this.currentTooltipIndex];
                                if (nextTooltip.showArrowAfter === true) {
                                    this.currentTooltipIndex++;
                                    continue;
                                }
                                if (nextTooltip.requiresModalOpen === true && 
                                    (nextTooltip.modalId === modalIdToCheck || 
                                     (modalIdToCheck === 'd0Modal' && nextTooltip.modalId === 'd0Modal'))) {
                                    console.log('[Onboarding] Timeout: Encontrado primeiro tooltip dentro do modal:', nextTooltip.id);
                                    break;
                                }
                                this.currentTooltipIndex++;
                            }
                            this.waitForModalToOpen(modalIdToCheck);
                            return; // Não continuar com lógica normal
                        }
                    }
                }
                
                // Fechar tooltip atual e avançar (se não requer modal ou modal não encontrado)
                const currentTooltip = document.getElementById('onboarding-tooltip');
                if (currentTooltip) {
                    // Remover classe show para animar saída
                    currentTooltip.classList.remove('show');
                    // Remover overlay também
                    const overlay = document.getElementById('onboarding-overlay');
                    if (overlay) {
                        overlay.classList.remove('show');
                    }
                    // Aguardar animação e então remover e avançar
                    setTimeout(() => {
                        if (currentTooltip.parentNode) {
                            currentTooltip.remove();
                        }
                        if (overlay && overlay.parentNode) {
                            overlay.remove();
                        }
                        // Avançar para próximo tooltip
                        this.currentTooltipIndex++;
                        if (this.currentTooltipIndex < this.tooltips.length) {
                            this.isShowing = false;
                            this.showNextTooltip();
                        }
                    }, 300);
                } else {
                    // Se tooltip não existe, apenas avançar
                    this.currentTooltipIndex++;
                    if (this.currentTooltipIndex < this.tooltips.length) {
                        this.isShowing = false;
                        this.showNextTooltip();
                    }
                }
            }
        }, 10000); // 10 segundos
    }
    
    /**
     * Aguarda Grazi ser aberta e então mostra os tooltips dentro dela
     */
    waitForGraziToOpen() {
        console.log('[Onboarding] Aguardando Grazi ser aberta...');
        let attempts = 0;
        const maxAttempts = 100; // 20 segundos máximo
        
        const checkGrazi = setInterval(() => {
            attempts++;
            const graziPopup = document.getElementById('insightsPopup');
            if (graziPopup && graziPopup.classList.contains('active')) {
                clearInterval(checkGrazi);
                console.log('[Onboarding] Grazi aberta! Removendo seta, bloqueador e mostrando tooltips dentro dela...');
                // IMPORTANTE: Remover bloqueador de interações para permitir cliques dentro da Grazi
                this.unblockDashboardInteractions();
                this.removeAnimatedArrow();
                
                // Aguardar um pouco para Grazi estar completamente renderizada
                setTimeout(() => {
                    // Avançar para primeiro tooltip dentro da Grazi
                    this.currentTooltipIndex++;
                    // Garantir que estamos no primeiro tooltip da Grazi
                    while (this.currentTooltipIndex < this.tooltips.length) {
                        const nextTooltip = this.tooltips[this.currentTooltipIndex];
                        if (nextTooltip.requiresGraziOpen === true) {
                            break;
                        }
                        this.currentTooltipIndex++;
                    }
                    
                    if (this.currentTooltipIndex < this.tooltips.length) {
                        this.isShowing = false;
                        // Aguardar mais um pouco para garantir que elementos da Grazi estão renderizados
                        setTimeout(() => {
                            this.showNextTooltip();
                        }, 800);
                    }
                }, 500);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkGrazi);
                console.warn('[Onboarding] Timeout aguardando Grazi abrir. Continuando normalmente...');
                this.removeAnimatedArrow();
                // Pular tooltips da Grazi e continuar
                this.currentTooltipIndex++;
                while (this.currentTooltipIndex < this.tooltips.length) {
                    const nextTooltip = this.tooltips[this.currentTooltipIndex];
                    if (nextTooltip.requiresGraziOpen === true) {
                        this.currentTooltipIndex++;
                    } else {
                        break;
                    }
                }
                if (this.currentTooltipIndex < this.tooltips.length) {
                    this.isShowing = false;
                    this.showNextTooltip();
                }
            }
        }, 200);
    }
    
    /**
     * Reativa os tooltips
     */
    static reactivate() {
        localStorage.setItem('onboarding_reactivated', 'true');
        localStorage.removeItem('onboarding_disabled');
        sessionStorage.removeItem('onboarding_seen');
        location.reload();
    }

    /**
     * Verifica se tooltips estão ativos
     * NÃO MEXER NO BANCO DE DADOS
     */
    static isActive() {
        // Modo teste sempre retorna true (exceto se desativado manualmente)
        if (MODO_TESTE) {
            const disabled = localStorage.getItem('onboarding_disabled');
            return disabled !== 'true';
        }
        
        // Modo produção: verificação normal
        const disabled = localStorage.getItem('onboarding_disabled');
        if (disabled === 'true') return false;

        const tenantId = localStorage.getItem('tenant_id');
        if (!tenantId) return false;

        const userKey = `onboarding_first_login_${tenantId}`;
        const firstLogin = localStorage.getItem(userKey);
        const reactivated = localStorage.getItem('onboarding_reactivated');
        
        return !firstLogin || reactivated === 'true';
    }
}

// Instância global
window.OnboardingTooltip = OnboardingTooltip;

