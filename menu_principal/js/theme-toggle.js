// Sistema de Tema Global para o SaaS
(function() {
  'use strict';

  // Inicializar tema ao carregar
  function initTheme() {
    const stored = localStorage.getItem('saas-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Toggle tema
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newValue = !isDark;
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('saas-theme', newValue ? 'dark' : 'light');
    
    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('theme-change', { 
      detail: { isDark: newValue } 
    }));
    
    // Atualizar ícone do botão se existir
    updateThemeButton(newValue);
  }

  // Atualizar ícone do botão de tema
  function updateThemeButton(isDark) {
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach(btn => {
      const sunIcon = btn.querySelector('.theme-sun');
      const moonIcon = btn.querySelector('.theme-moon');
      
      if (isDark) {
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
      } else {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
      }
    });
  }

  // Criar botão de tema se não existir
  function createThemeButton() {
    // Verificar se já existe
    if (document.querySelector('[data-theme-toggle]')) {
      return;
    }

    // Procurar sidebar ou lugar apropriado
    const sidebar = document.querySelector('.sidebar, [class*="sidebar"], nav');
    if (!sidebar) return;

    const isDark = document.documentElement.classList.contains('dark');
    
    const button = document.createElement('button');
    button.setAttribute('data-theme-toggle', '');
    button.className = 'theme-toggle-btn';
    button.innerHTML = `
      <svg class="theme-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: ${isDark ? 'block' : 'none'};">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="theme-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: ${isDark ? 'none' : 'block'};">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    
    button.addEventListener('click', toggleTheme);
    
    // Inserir no final da sidebar ou em um container específico
    const container = sidebar.querySelector('.nav-menu, nav, [class*="nav"]') || sidebar;
    const themeContainer = document.createElement('div');
    themeContainer.className = 'theme-toggle-container';
    themeContainer.style.cssText = 'padding: 1rem; border-top: 1px solid rgba(165,148,255,0.15); display: flex; align-items: center; justify-content: center;';
    themeContainer.appendChild(button);
    
    container.appendChild(themeContainer);
  }

  // Estilos para o botão
  function addThemeStyles() {
    if (document.getElementById('theme-toggle-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'theme-toggle-styles';
    style.textContent = `
      .theme-toggle-btn {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(165, 148, 255, 0.1);
        border: 1px solid rgba(165, 148, 255, 0.2);
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .theme-toggle-btn:hover {
        background: rgba(165, 148, 255, 0.2);
        border-color: rgba(165, 148, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(165, 148, 255, 0.3);
      }
      
      .theme-toggle-btn svg {
        width: 20px;
        height: 20px;
      }
      
      .dark .theme-toggle-btn {
        background: rgba(165, 148, 255, 0.15);
        border-color: rgba(165, 148, 255, 0.3);
      }
      
      .dark .theme-toggle-btn:hover {
        background: rgba(165, 148, 255, 0.25);
      }
    `;
    document.head.appendChild(style);
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initTheme();
      addThemeStyles();
      createThemeButton();
    });
  } else {
    initTheme();
    addThemeStyles();
    createThemeButton();
  }

  // Escutar mudanças de tema de outras partes
  window.addEventListener('theme-change', function(e) {
    const isDark = e.detail.isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateThemeButton(isDark);
  });

  // Exportar função para uso global
  window.toggleTheme = toggleTheme;
  window.initTheme = initTheme;
})();
