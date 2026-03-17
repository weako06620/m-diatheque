/**
 * router.js — Routeur par hash
 * ─────────────────────────────
 * Médiathèque de Cipières
 *
 * Gère la navigation entre les vues de l'application
 * via l'ancre URL (#catalogue, #emprunts, #stats).
 * Utilise le registre de vues défini dans ui.js.
 */

'use strict';

const Router = {

  /** Vue active (id de la vue courante) */
  currentView: null,

  /** Registre des vues { id → renderFn } — alimenté par app.js */
  _views: {},

  /**
   * Enregistre une vue.
   * @param {string}   id       - Identifiant de la vue (ex: 'catalogue')
   * @param {Function} renderFn - Fonction de rendu appelée lors de la navigation
   */
  register(id, renderFn) {
    this._views[id] = renderFn;
  },

  /**
   * Navigue vers une vue.
   * @param {string} id - Identifiant de la vue cible
   * @param {Object} [params={}] - Paramètres optionnels transmis à la vue
   */
  navigate(id, params = {}) {
    // Vérification que la vue existe
    if (!this._views[id]) {
      console.warn(`[Router] Vue inconnue : "${id}"`);
      return;
    }

    this.currentView = id;

    // Mise à jour de l'URL (sans recharger la page)
    window.location.hash = id;

    // Rendu de la vue
    this._render(id, params);

    // Mise à jour de la navigation basse
    this._updateNav(id);
  },

  /**
   * Recharge la vue active (après une modification de données).
   * @param {Object} [params={}]
   */
  refresh(params = {}) {
    if (this.currentView) {
      this._render(this.currentView, params);
    }
  },

  /**
   * Exécute la fonction de rendu et injecte le résultat dans #app-main.
   * @private
   */
  _render(id, params) {
    const main     = document.getElementById('app-main');
    const renderFn = this._views[id];

    try {
      main.innerHTML = renderFn(params);
    } catch (err) {
      // Affiche l'erreur directement dans l'interface pour faciliter le debug
      console.error('[Router] Erreur de rendu :', err);
      main.innerHTML = `
        <div style="padding:2rem;font-family:monospace;color:#C0392B;background:#FDEDED;margin:1rem;border-radius:12px;border:1px solid #C0392B;">
          <strong>⚠ Erreur de rendu — ${id}</strong><br><br>
          ${err.message}<br><br>
          <small>Ouvre la console (F12) pour plus de détails.</small>
        </div>`;
      return;
    }

    const content = main.firstElementChild;
    if (content) content.classList.add('view-enter');
    main.scrollTop = 0;

    if (typeof window._onViewRendered === 'function') {
      window._onViewRendered(id, params);
    }
  },

  /**
   * Met à jour l'état actif des boutons de navigation.
   * @private
   */
  _updateNav(activeId) {
    const items = document.querySelectorAll('#app-nav .nav-item');
    items.forEach(item => {
      item.classList.toggle('active', item.dataset.view === activeId);
    });
  },

  /**
   * Initialise le routeur : écoute les changements de hash
   * et navigue vers la vue initiale.
   */
  init() {
    // Navigation via le bouton retour du navigateur
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash && this._views[hash] && hash !== this.currentView) {
        this.navigate(hash);
      }
    });

    // Vue initiale (depuis le hash ou 'catalogue' par défaut)
    const initialView = window.location.hash.slice(1) || 'catalogue';
    const target      = this._views[initialView] ? initialView : 'catalogue';
    this.navigate(target);
  },
};
