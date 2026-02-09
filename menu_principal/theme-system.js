// Sistema de Tema Global - Padrão: Dark (tema escuro)
// Usa a mesma lógica do Flow Editor

(function() {
    'use strict';

    // Aplica um tema específico (light/dark)
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        const root = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');

        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        if (themeToggle) {
            // .active = modo escuro ligado (botão para a direita)
            themeToggle.classList.toggle('active', isDark);
        }

        localStorage.setItem('saas-theme', isDark ? 'dark' : 'light');
    }

    // Inicializar tema ao carregar
    function initTheme() {
        let theme = localStorage.getItem('saas-theme');

        // Se não tiver tema salvo, começa sempre em light (pedido do SaaS)
        if (!theme) {
            theme = 'light';
        }

        applyTheme(theme);
    }

    // Função para alternar tema
    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
        window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark: newTheme === 'dark' } }));
    }

    // Inicializar tema ao carregar
    initTheme();

    // Sincronizar tema quando mudar em outra aba/janela
    window.addEventListener('storage', (e) => {
        if (e.key === 'saas-theme') {
            initTheme();
        }
    });

    // Expor função globalmente
    window.toggleTheme = toggleTheme;
    window.initTheme = initTheme;
})();
