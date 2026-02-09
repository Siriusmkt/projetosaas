(() => {
  if (window.__graziWidgetLoaded) return;
  window.__graziWidgetLoaded = true;

  const WIDGET_ID = 'grazi-widget-floating';
  const PANEL_ID = 'grazi-widget-panel';

  const ensureStyles = () => {
    if (document.getElementById('grazi-widget-style')) return;
    const style = document.createElement('style');
    style.id = 'grazi-widget-style';
    style.textContent = `
      #${WIDGET_ID} {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #A594FF, #667EEA);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
        z-index: 9999;
      }
      #${PANEL_ID} {
        position: fixed;
        right: 24px;
        bottom: 92px;
        width: 320px;
        max-height: 420px;
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid rgba(165, 148, 255, 0.35);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: 'Raleway', sans-serif;
      }
      #${PANEL_ID}.open { display: flex; }
      #${PANEL_ID} .header {
        padding: 12px 16px;
        background: #f7f2ff;
        border-bottom: 1px solid rgba(165, 148, 255, 0.2);
        font-weight: 700;
        color: #2f1f64;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #${PANEL_ID} .body {
        padding: 12px 16px;
        color: #5b4a8a;
        font-size: 0.9rem;
        overflow: auto;
      }
      #${PANEL_ID} .close {
        cursor: pointer;
        font-size: 1.1rem;
      }
    `;
    document.head.appendChild(style);
  };

  const createWidget = () => {
    ensureStyles();
    if (document.getElementById(WIDGET_ID)) return;

    const button = document.createElement('div');
    button.id = WIDGET_ID;
    button.textContent = 'G';

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="header">
        Grazi
        <span class="close" aria-label="Fechar">×</span>
      </div>
      <div class="body">
        Olá! Se precisar de ajuda, fale comigo 😊
      </div>
    `;

    button.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    panel.querySelector('.close')?.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    document.body.appendChild(panel);
    document.body.appendChild(button);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget, { once: true });
  } else {
    createWidget();
  }
})();
