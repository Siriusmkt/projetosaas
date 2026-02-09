/**
 * Inicialização do Sistema de Onboarding
 * Este arquivo deve ser incluído em todas as páginas
 */

(function() {
    'use strict';

    // Função auxiliar melhorada para encontrar elementos
    function findElementBySelector(selector) {
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

        // Tentar seletores CSS diretos
        let element = document.querySelector(cleanSelector);
        if (element) return element;

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

        // Tentar por ID parcial
        const idMatch = selector.match(/#([a-z0-9-]+)/);
        if (idMatch) {
            const idName = idMatch[1];
            element = document.querySelector(`[id*="${idName}"]`);
            if (element) return element;
        }

        return null;
    }

    // Substituir findElement na configuração
    function prepareTooltips() {
        return ONBOARDING_TOOLTIPS.map(tooltip => {
            return {
                ...tooltip,
                findElement: function() {
                    return findElementBySelector(this.selector);
                }
            };
        });
    }

    // Função auxiliar para anexar event listener ao botão
    function attachButtonListener(btn) {
        btn.addEventListener('click', () => {
            console.log('[Onboarding] ========================================');
            console.log('[Onboarding] Botão de tutorial clicado!');
            console.log('[Onboarding] Limpando todas as flags de desativação...');
            
            // Limpar todas as desativações e histórico para reativar tooltips
            localStorage.removeItem('onboarding_disabled');
            localStorage.removeItem('onboarding_auto_show_disabled');
            localStorage.setItem('onboarding_reactivated', 'true');
            sessionStorage.removeItem('onboarding_seen');
            
            console.log('[Onboarding] Flags limpas!');
            console.log('[Onboarding] onboarding_disabled:', localStorage.getItem('onboarding_disabled'));
            console.log('[Onboarding] onboarding_reactivated:', localStorage.getItem('onboarding_reactivated'));
            console.log('[Onboarding] ========================================');
            
            // Limpar qualquer overlay que possa estar preso
            const overlays = document.querySelectorAll('.onboarding-overlay, #onboarding-overlay');
            overlays.forEach(ov => {
                ov.style.display = 'none';
                ov.style.pointerEvents = 'none';
                ov.remove();
            });
            
            // Limpar tooltips existentes
            const tooltips = document.querySelectorAll('#onboarding-tooltip, .onboarding-tooltip');
            tooltips.forEach(tt => {
                tt.style.display = 'none';
                tt.remove();
            });
            
            // Remover highlights
            const highlights = document.querySelectorAll('.onboarding-target-highlight');
            highlights.forEach(h => h.classList.remove('onboarding-target-highlight'));
            
            // Garantir que body não está bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
            
            // Reiniciar tooltips sem recarregar página
            setTimeout(() => {
                if (window.currentOnboarding) {
                    window.currentOnboarding.clearAllTimeouts();
                    window.currentOnboarding.isShowing = false;
                    window.currentOnboarding.isInitializing = false;
                }
                
                if (typeof ONBOARDING_TOOLTIPS !== 'undefined' && typeof OnboardingTooltip !== 'undefined') {
                    const tooltips = prepareTooltips();
                    const onboarding = new OnboardingTooltip();
                    onboarding.init(tooltips);
                    window.currentOnboarding = onboarding;
                } else {
                    console.log('[Onboarding] Scripts ainda não carregaram, aguardando...');
                    setTimeout(() => {
                        if (typeof ONBOARDING_TOOLTIPS !== 'undefined' && typeof OnboardingTooltip !== 'undefined') {
                            if (window.currentOnboarding) {
                                window.currentOnboarding.clearAllTimeouts();
                                window.currentOnboarding.isShowing = false;
                                window.currentOnboarding.isInitializing = false;
                            }
                            const tooltips = prepareTooltips();
                            const onboarding = new OnboardingTooltip();
                            onboarding.init(tooltips);
                            window.currentOnboarding = onboarding;
                        }
                    }, 1000);
                }
            }, 300);
        });
        btn.setAttribute('data-listener-added', 'true');
    }
    
    // Função auxiliar para garantir estilos do botão
    function ensureButtonStyles(btn) {
        btn.style.cssText = `
            position: fixed !important;
            bottom: 8rem !important;
            right: 2rem !important;
            width: 56px !important;
            height: 56px !important;
            background: linear-gradient(135deg, #a594ff 0%, #8b7aff 100%) !important;
            border: 1px solid rgba(165, 148, 255, 0.5) !important;
            border-radius: 50% !important;
            color: white !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 20px rgba(165, 148, 255, 0.4) !important;
            z-index: 99999999 !important;
            opacity: 1 !important;
            transform: scale(1) !important;
            visibility: visible !important;
            pointer-events: auto !important;
            padding: 0 !important;
            margin: 0 !important;
        `;
        
        // Forçar novamente após um pequeno delay
        setTimeout(() => {
            btn.style.zIndex = '99999999';
            btn.style.position = 'fixed';
            btn.style.display = 'flex';
            btn.style.visibility = 'visible';
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }, 100);
    }

    // Criar botão de reativação (sempre visível - aparece imediatamente)
    function createReactivateButton() {
        // Verificar se já existe
        let btn = document.getElementById('onboarding-reactivate-btn');
        if (btn) {
            // Se já existe, garantir que tem o event listener e estilos
            console.log('[Onboarding] Botão já existe no HTML, garantindo funcionalidade...');
            if (!btn.hasAttribute('data-listener-added')) {
                attachButtonListener(btn);
            }
            ensureButtonStyles(btn);
            return;
        }

        const newBtn = document.createElement('button');
        newBtn.id = 'onboarding-reactivate-btn';
        newBtn.className = 'onboarding-reactivate-btn';
        newBtn.setAttribute('aria-label', 'Ver tutoriais');
        newBtn.title = 'Ver Tutoriais';
        
        // Ícone de lâmpada de ideia SVG do arquivo fornecido
        newBtn.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                    <g>
                        <g>
                            <path d="M22.746,31.173h-5.538c-0.505,0-0.912-0.41-0.912-0.912V29.62c0.006-0.551-0.021-0.938-0.079-1.154
                                c-0.311-1.139-1.134-2.094-1.931-3.02c-0.263-0.303-0.511-0.592-0.739-0.883c-1.147-1.459-1.757-3.207-1.757-5.061
                                c0-4.526,3.684-8.207,8.21-8.207c4.525,0,8.208,3.681,8.208,8.207c0,1.855-0.607,3.605-1.757,5.063
                                c-0.201,0.258-0.433,0.528-0.675,0.813c-0.816,0.96-1.727,2.031-2.041,3.162c-0.055,0.202-0.082,0.565-0.078,1.073v0.646
                                C23.657,30.763,23.25,31.173,22.746,31.173L22.746,31.173z M18.122,29.347h3.712c0.01-0.71,0.079-1.06,0.142-1.288
                                c0.423-1.523,1.471-2.76,2.396-3.846c0.243-0.286,0.456-0.536,0.645-0.774c0.893-1.136,1.366-2.495,1.366-3.936
                                c0-3.52-2.862-6.384-6.382-6.384s-6.384,2.864-6.384,6.384c0,1.438,0.472,2.798,1.366,3.934c0.211,0.27,0.442,0.535,0.687,0.818
                                c0.843,0.979,1.888,2.192,2.31,3.733C18.042,28.229,18.114,28.596,18.122,29.347L18.122,29.347z" fill="currentColor"/>
                        </g>
                        <g>
                            <path d="M22.746,33.588h-5.538c-0.505,0-0.912-0.409-0.912-0.914c0-0.504,0.407-0.911,0.912-0.911h5.538
                                c0.504,0,0.911,0.407,0.911,0.911C23.657,33.179,23.25,33.588,22.746,33.588L22.746,33.588z" fill="currentColor"/>
                        </g>
                        <g>
                            <path d="M21.362,36h-2.769c-0.505,0-0.914-0.409-0.914-0.912c0-0.504,0.409-0.914,0.914-0.914h2.769
                                c0.502,0,0.912,0.41,0.912,0.914C22.274,35.591,21.864,36,21.362,36L21.362,36z" fill="currentColor"/>
                        </g>
                    </g>
                </g>
            </svg>
        `;
        
        // Event listener será anexado imediatamente, mas funcionalidade pode aguardar
        attachButtonListener(newBtn);
        
        // Garantir estilos
        ensureButtonStyles(newBtn);
        
        // Adicionar botão ao body imediatamente
        document.body.appendChild(newBtn);
        
        console.log('[Onboarding] Botão de reativação criado e adicionado ao DOM!');
        
        // Verificar se botão está realmente no DOM
        const checkBtn = document.getElementById('onboarding-reactivate-btn');
        if (checkBtn) {
            console.log('[Onboarding] ✅ Botão confirmado no DOM!');
            console.log('[Onboarding] Botão parent:', checkBtn.parentElement);
        } else {
            console.error('[Onboarding] ❌ ERRO: Botão não encontrado no DOM após criação!');
        }
    }

    // Inicializar sistema
    function initOnboarding() {
        console.log('[Onboarding] ========================================');
        console.log('[Onboarding] Iniciando sistema de tooltips...');
        console.log('[Onboarding] URL atual:', window.location.href);
        console.log('[Onboarding] Pathname:', window.location.pathname);
        
        // Aguardar configuração carregar
        if (typeof ONBOARDING_TOOLTIPS === 'undefined') {
            console.error('[Onboarding] ERRO: Configuração de tooltips não encontrada!');
            console.error('[Onboarding] ONBOARDING_TOOLTIPS está definido?', typeof ONBOARDING_TOOLTIPS);
            return;
        }

        console.log('[Onboarding] Configuração encontrada:', ONBOARDING_TOOLTIPS.length, 'tooltips');

        // Preparar tooltips
        const tooltips = prepareTooltips();
        console.log('[Onboarding] Tooltips preparados:', tooltips.length);
        
        if (tooltips.length === 0) {
            console.warn('[Onboarding] AVISO: Nenhum tooltip foi preparado para esta página!');
            console.warn('[Onboarding] Verifique se há tooltips configurados para a página atual.');
        }
        
        // Criar instância
        const onboarding = new OnboardingTooltip();
        console.log('[Onboarding] Instância criada. Página atual:', onboarding.currentPage);
        console.log('[Onboarding] Tooltips ativos?', onboarding.isActive);
        console.log('[Onboarding] MODO_TESTE:', typeof MODO_TESTE !== 'undefined' ? MODO_TESTE : 'não definido');
        
        // Salvar instância globalmente
        window.currentOnboarding = onboarding;
        
        // Inicializar com tooltips preparados
        onboarding.init(tooltips);
        console.log('[Onboarding] Sistema inicializado!');
        console.log('[Onboarding] ========================================');

        // Botão de reativação já foi criado imediatamente no início do script
        // Não precisa criar novamente aqui
    }

    // Verificar se estamos em uma página de teste do tour
    const isTestPage = () => {
        const path = window.location.pathname;
        const href = window.location.href;
        return path.includes('onboarding-tutorial-demo') || 
               href.includes('onboarding-tutorial-demo') ||
               (window.parent && window.parent !== window && 
                (window.parent.location.pathname.includes('onboarding-tutorial-demo-menu') ||
                 window.parent.location.href.includes('onboarding-tutorial-demo-menu')));
    };

    // Criar botão imediatamente (antes de tudo carregar)
    // Isso garante que o botão apareça na página desde o início
    // Funciona tanto em páginas diretas quanto em iframes
    // MAS NÃO nas páginas de teste do tour
    const tryCreateButton = () => {
        // NÃO criar botão em páginas de teste
        if (isTestPage()) {
            console.log('[Onboarding] Página de teste detectada - botão de tutorial NÃO será criado');
            return false;
        }
        
        if (document.body) {
            createReactivateButton();
            return true;
        }
        return false;
    };
    
    // Tentar criar imediatamente
    if (!tryCreateButton()) {
        // Se body ainda não existe, aguardar DOMContentLoaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (!tryCreateButton()) {
                    // Fallback: tentar após um pequeno delay
                    setTimeout(tryCreateButton, 100);
                }
            });
        } else {
            // Se já carregou mas body não existe ainda, tentar após delay
            setTimeout(() => {
                if (!tryCreateButton()) {
                    setTimeout(tryCreateButton, 200);
                }
            }, 50);
        }
    }

    // Limpar flags de desativação se onboarding foi reativado
    const reactivated = localStorage.getItem('onboarding_reactivated');
    if (reactivated === 'true') {
        console.log('[Onboarding] Onboarding foi reativado - limpando flags de desativação...');
        localStorage.removeItem('onboarding_disabled');
        localStorage.removeItem('onboarding_auto_show_disabled');
        console.log('[Onboarding] Flags limpas!');
    }
    
    // Inicializar o mais rápido possível para tooltips aparecerem imediatamente
    // Não depende de eventos de carregamento - funciona sempre
    console.log('[Onboarding] Script onboarding-init.js carregado!');
    console.log('[Onboarding] Botão de tutorial criado imediatamente!');
    console.log('[Onboarding] Inicializando sistema imediatamente...');
    console.log('[Onboarding] onboarding_disabled:', localStorage.getItem('onboarding_disabled'));
    console.log('[Onboarding] onboarding_reactivated:', localStorage.getItem('onboarding_reactivated'));
    
    // Expor globalmente ANTES do setTimeout para garantir disponibilidade
    window.initOnboarding = initOnboarding;
    console.log('[Onboarding] initOnboarding exposto globalmente como window.initOnboarding');
    
    // Tentar inicializar imediatamente se tudo estiver pronto
    const tryInit = () => {
        if (typeof ONBOARDING_TOOLTIPS !== 'undefined' && typeof OnboardingTooltip !== 'undefined') {
            console.log('[Onboarding] ========================================');
            console.log('[Onboarding] Inicializando imediatamente...');
            console.log('[Onboarding] initOnboarding disponível?', typeof initOnboarding);
            console.log('[Onboarding] window.initOnboarding disponível?', typeof window.initOnboarding);
            console.log('[Onboarding] ONBOARDING_TOOLTIPS disponível?', typeof ONBOARDING_TOOLTIPS);
            console.log('[Onboarding] OnboardingTooltip disponível?', typeof OnboardingTooltip);
            
            if (typeof initOnboarding === 'function') {
                try {
                    console.log('[Onboarding] Chamando initOnboarding() agora...');
                    initOnboarding();
                    console.log('[Onboarding] initOnboarding() chamado com sucesso!');
                } catch (e) {
                    console.error('[Onboarding] ERRO ao chamar initOnboarding():', e);
                    console.error('[Onboarding] Stack trace:', e.stack);
                }
            } else {
                console.error('[Onboarding] ERRO: initOnboarding não é uma função!');
                console.error('[Onboarding] Tipo de initOnboarding:', typeof initOnboarding);
            }
            console.log('[Onboarding] ========================================');
            return true;
        }
        return false;
    };
    
    // Tentar imediatamente
    if (!tryInit()) {
        // Se não funcionou, tentar após 100ms
        setTimeout(() => {
            if (!tryInit()) {
                // Se ainda não funcionou, tentar após 500ms (fallback)
                setTimeout(() => {
                    tryInit();
                }, 500);
            }
        }, 100);
    }
})();

