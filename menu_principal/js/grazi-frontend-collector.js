(() => {
  if (window.__graziCollectorLoaded) return;
  window.__graziCollectorLoaded = true;

  const safeText = (value) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

  const collectPageContext = () => {
    const title = safeText(document.title);
    const h1 = safeText(document.querySelector('h1')?.textContent || '');
    const h2 = safeText(document.querySelector('h2')?.textContent || '');
    const meta = Array.from(document.querySelectorAll('meta[name="description"]'))
      .map((m) => safeText(m.getAttribute('content') || ''))
      .filter(Boolean);

    return {
      url: location.href,
      path: location.pathname,
      title,
      h1,
      h2,
      meta,
      timestamp: new Date().toISOString(),
    };
  };

  const persist = (payload) => {
    try {
      localStorage.setItem('grazi_page_context', JSON.stringify(payload));
    } catch (_) {
      // Sem armazenamento disponível
    }
  };

  const run = () => {
    const payload = collectPageContext();
    persist(payload);
    if (window.GRAZI_COLLECTOR_DEBUG) {
      console.log('[Grazi Collector] Contexto capturado:', payload);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
