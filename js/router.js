/**
 * router.js — Routeur par hash
 * Médiathèque de Cipières
 */

'use strict';

const Router = {
  currentView: null,
  _views: {},

  register(id, renderFn) { this._views[id] = renderFn; },

  navigate(id, params = {}) {
    if (!this._views[id]) { console.warn('[Router] Vue inconnue :', id); return; }
    this.currentView = id;
    window.location.hash = id;
    this._render(id, params);
    this._updateNav(id);
  },

  refresh(params = {}) { if (this.currentView) this._render(this.currentView, params); },

  _render(id, params) {
    const main    = document.getElementById('app-main');
    const renderFn = this._views[id];
    try {
      main.innerHTML = renderFn(params);
    } catch (err) {
      console.error('[Router] Erreur rendu :', err);
      main.innerHTML = `<div style="padding:2rem;color:#C0392B;background:#FDEDED;margin:1rem;border-radius:12px;border:1px solid #C0392B;font-family:monospace"><strong>⚠ Erreur — ${id}</strong><br><br>${err.message}</div>`;
      return;
    }
    const content = main.firstElementChild;
    if (content) content.classList.add('view-enter');
    main.scrollTop = 0;
    if (typeof window._onViewRendered === 'function') window._onViewRendered(id, params);
  },

  _updateNav(activeId) {
    document.querySelectorAll('#app-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === activeId);
    });
  },

  init() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash && this._views[hash] && hash !== this.currentView) this.navigate(hash);
    });
    const initial = window.location.hash.slice(1) || 'catalogue';
    this.navigate(this._views[initial] ? initial : 'catalogue');
  },
};
