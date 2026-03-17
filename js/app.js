/**
 * app.js — Point d'entrée de l'application
 * ──────────────────────────────────────────
 * Médiathèque de Cipières
 *
 * Responsabilités :
 *  - Initialisation (données, routeur, événements)
 *  - Gestion de tous les événements utilisateur (délégation)
 *  - Ouverture / fermeture des modaux
 *  - Logique de recherche & filtres
 *  - Actions admin (connexion, ajout prêt, retour, ajout livre)
 *  - Système de toasts (notifications)
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════════
   ÉTAT DE L'APPLICATION
   Variables d'état global, privées à ce module.
═══════════════════════════════════════════════════════════════════════ */

const AppState = {
  searchQuery:   '',    // Terme de recherche actif
  activeGenre:   '',    // Filtre genre actif
  adminTab:      'new-loan', // Onglet admin actif
};

/* ══════════════════════════════════════════════════════════════════════
   INITIALISATION
═══════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Données
  DB.init();

  // 2. Enregistrement des vues dans le routeur
  Router.register('catalogue', (params) => renderCatalogue({
    query: AppState.searchQuery,
    genre: AppState.activeGenre,
    ...params,
  }));
  Router.register('emprunts', () => renderEmprunts());
  Router.register('stats',    () => renderStats());

  // 3. Callback post-rendu (événements spécifiques aux vues)
  window._onViewRendered = onViewRendered;

  // 4. Routeur (navigue vers la vue initiale)
  Router.init();

  // 5. Bouton admin dans l'en-tête
  initAdminButton();

  // 6. Événements globaux (délégation sur document)
  initGlobalEvents();
});

/* ══════════════════════════════════════════════════════════════════════
   BOUTON ADMIN EN-TÊTE
═══════════════════════════════════════════════════════════════════════ */

function initAdminButton() {
  const btn = document.getElementById('btn-admin');
  updateAdminButtonIcon(btn);
  btn.addEventListener('click', () => {
    if (AUTH.isAdmin()) {
      openAdminModal();
    } else {
      openLoginModal();
    }
  });
}

/** Met à jour l'icône du bouton selon l'état admin. */
function updateAdminButtonIcon(btn) {
  if (!btn) return;
  if (AUTH.isAdmin()) {
    btn.classList.add('is-admin-active');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a4 4 0 0 1 8 0v2"/>
        <path d="M18 14l1.5 1.5L22 13"/>
      </svg>`;
    btn.title = 'Panneau d\'administration';
  } else {
    btn.classList.remove('is-admin-active');
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>`;
    btn.title = 'Connexion administrateur';
  }
}

/* ══════════════════════════════════════════════════════════════════════
   GESTION GLOBALE DES ÉVÉNEMENTS (délégation)
   Un seul listener sur document pour tous les clics.
═══════════════════════════════════════════════════════════════════════ */

function initGlobalEvents() {
  // ── Navigation basse ────────────────────────────────────
  document.getElementById('app-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (item && item.dataset.view) {
      // Réinitialise la recherche si on quitte le catalogue
      if (item.dataset.view !== 'catalogue') {
        AppState.searchQuery = '';
        AppState.activeGenre = '';
      }
      Router.navigate(item.dataset.view);
    }
  });

  // ── Clic sur l'overlay modal (ferme le modal) ───────────
  document.getElementById('modal-overlay').addEventListener('click', e => {
    // Ferme si le clic est sur l'overlay lui-même (et non le sheet)
    if (e.target === document.getElementById('modal-overlay')) {
      closeModal();
    }
  });

  // ── Délégation globale sur document ─────────────────────
  document.addEventListener('click', handleGlobalClick);

  // ── Support clavier (Enter/Espace sur éléments role=button) ─
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = e.target;
      if (el.getAttribute('role') === 'button' && el.dataset.action) {
        e.preventDefault();
        el.click();
      }
    }
    // Touche Escape pour fermer le modal
    if (e.key === 'Escape') closeModal();
  });
}

/**
 * Gestionnaire principal de clics par délégation.
 * Lit l'attribut data-action de l'élément cliqué ou de son ancêtre.
 */
function handleGlobalClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {

    case 'open-book': {
      const bookId = parseInt(target.dataset.id, 10);
      openBookModal(bookId);
      break;
    }

    case 'close-modal': {
      closeModal();
      break;
    }

    case 'open-add-loan': {
      const bookId = parseInt(target.dataset.bookId, 10);
      openAddLoanModal(bookId);
      break;
    }

    case 'return-book': {
      const loanId = parseInt(target.dataset.loanId, 10);
      handleReturnBook(loanId);
      break;
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════
   CALLBACK POST-RENDU
   Attachement des événements spécifiques aux vues
   après que le HTML a été injecté dans le DOM.
═══════════════════════════════════════════════════════════════════════ */

function onViewRendered(viewId) {
  if (viewId === 'catalogue') bindCatalogueEvents();
}

/** Attache les événements de recherche et de filtres. */
function bindCatalogueEvents() {
  // Recherche
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
    searchInput.addEventListener('input', e => {
      AppState.searchQuery = e.target.value;
      Router.refresh();
    });
  }

  // Bouton effacer recherche
  const clearBtn = document.getElementById('btn-search-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      AppState.searchQuery = '';
      Router.refresh();
    });
  }

  // Filtres par genre
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      AppState.activeGenre = pill.dataset.genre;
      Router.refresh();
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════
   GESTION DES MODAUX
═══════════════════════════════════════════════════════════════════════ */

/** Injecte du HTML dans l'overlay et l'affiche. */
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = html;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/** Ferme et vide l'overlay modal. */
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  overlay.innerHTML = '';
  document.body.style.overflow = '';
}

/** Ouvre le modal de détail d'un livre. */
function openBookModal(bookId) {
  openModal(renderBookModal(bookId));
}

/** Ouvre le modal de connexion admin. */
function openLoginModal() {
  openModal(renderLoginModal());
  bindLoginModalEvents();
}

/** Ouvre le panneau admin. */
function openAdminModal(tab = AppState.adminTab) {
  AppState.adminTab = tab;
  openModal(renderAdminModal(tab));
  bindAdminModalEvents();
}

/** Ouvre le modal d'ajout de prêt pour un livre précis. */
function openAddLoanModal(bookId) {
  openModal(renderAddLoanModal(bookId));
  bindAddLoanModalEvents();
}

/* ══════════════════════════════════════════════════════════════════════
   ÉVÉNEMENTS — MODAL DE CONNEXION
═══════════════════════════════════════════════════════════════════════ */

function bindLoginModalEvents() {
  const submitBtn = document.getElementById('btn-login-submit');
  const input     = document.getElementById('input-password');
  const errorDiv  = document.getElementById('login-error');

  if (!submitBtn || !input) return;

  const attempt = () => {
    const password = input.value.trim();
    if (AUTH.login(password)) {
      closeModal();
      updateAdminButtonIcon(document.getElementById('btn-admin'));
      showToast('✓ Connecté en mode administrateur', 'success');
      openAdminModal();
    } else {
      errorDiv.style.display = 'block';
      input.value = '';
      input.focus();
      // Légère vibration sur mobile
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
    }
  };

  submitBtn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') attempt();
  });

  // Focus auto sur le champ
  setTimeout(() => input.focus(), 200);
}

/* ══════════════════════════════════════════════════════════════════════
   ÉVÉNEMENTS — PANNEAU ADMIN
═══════════════════════════════════════════════════════════════════════ */

function bindAdminModalEvents() {

  // ── Onglets ────────────────────────────────────────────
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.adminTab;
      AppState.adminTab = tabId;

      // Mise à jour des onglets actifs
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Affichage des panneaux
      ['new-loan', 'returns', 'new-book'].forEach(id => {
        const panel = document.getElementById(`tab-${id}`);
        if (panel) panel.style.display = id === tabId ? '' : 'none';
      });
    });
  });

  // ── Déconnexion ────────────────────────────────────────
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AUTH.logout();
      closeModal();
      updateAdminButtonIcon(document.getElementById('btn-admin'));
      Router.refresh();
      showToast('Déconnecté');
    });
  }

  // ── Soumettre un nouveau prêt (depuis le panneau admin) ─
  const submitLoanBtn = document.getElementById('btn-submit-loan');
  if (submitLoanBtn) {
    submitLoanBtn.addEventListener('click', () => {
      const bookId   = parseInt(document.getElementById('select-book').value, 10);
      const borrower = document.getElementById('input-borrower').value.trim();
      const dueDate  = document.getElementById('input-due-date').value;

      if (!bookId || !borrower || !dueDate) {
        showToast('⚠ Veuillez remplir tous les champs');
        return;
      }

      DB.addLoan({
        bookId,
        borrower,
        borrowedDate: new Date().toISOString().split('T')[0],
        dueDate,
      });

      closeModal();
      Router.refresh();
      showToast('✓ Emprunt enregistré', 'success');
    });
  }

  // ── Soumettre un nouveau livre ─────────────────────────
  const submitBookBtn = document.getElementById('btn-submit-book');
  if (submitBookBtn) {
    submitBookBtn.addEventListener('click', () => {
      const title       = document.getElementById('nb-title').value.trim();
      const author      = document.getElementById('nb-author').value.trim();
      const genre       = document.getElementById('nb-genre').value;
      const year        = parseInt(document.getElementById('nb-year').value, 10);
      const pages       = parseInt(document.getElementById('nb-pages').value, 10);
      const description = document.getElementById('nb-description').value.trim();

      if (!title || !author) {
        showToast('⚠ Le titre et l\'auteur sont obligatoires');
        return;
      }

      DB.saveBook({ title, author, genre, year: year || new Date().getFullYear(), pages: pages || 0, description, featured: false });

      closeModal();
      Router.navigate('catalogue');
      showToast('✓ Livre ajouté au catalogue', 'success');
    });
  }

  // ── Retours de livres (dans le panneau admin) ───────────
  // Géré par la délégation globale (data-action="return-book")
}

/* ══════════════════════════════════════════════════════════════════════
   ÉVÉNEMENTS — MODAL AJOUT PRÊT (via fiche livre)
═══════════════════════════════════════════════════════════════════════ */

function bindAddLoanModalEvents() {
  const submitBtn = document.getElementById('btn-submit-add-loan');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', () => {
    const bookId   = parseInt(submitBtn.dataset.bookId, 10);
    const borrower = document.getElementById('al-borrower').value.trim();
    const dueDate  = document.getElementById('al-due-date').value;

    if (!borrower || !dueDate) {
      showToast('⚠ Veuillez remplir tous les champs');
      return;
    }

    DB.addLoan({
      bookId,
      borrower,
      borrowedDate: new Date().toISOString().split('T')[0],
      dueDate,
    });

    closeModal();
    Router.refresh();
    showToast('✓ Emprunt enregistré', 'success');
  });

  // Focus auto
  setTimeout(() => {
    const input = document.getElementById('al-borrower');
    if (input) input.focus();
  }, 200);
}

/* ══════════════════════════════════════════════════════════════════════
   ACTION — RETOUR DE LIVRE
═══════════════════════════════════════════════════════════════════════ */

function handleReturnBook(loanId) {
  DB.returnBook(loanId);
  closeModal();
  Router.refresh();
  showToast('✓ Retour enregistré', 'success');
}

/* ══════════════════════════════════════════════════════════════════════
   TOASTS — Notifications légères
═══════════════════════════════════════════════════════════════════════ */

let _toastTimeout = null;

/**
 * Affiche une notification toast en bas de l'écran.
 * @param {string} message
 * @param {'default'|'success'} [type='default']
 * @param {number} [duration=2500]
 */
function showToast(message, type = 'default', duration = 2500) {
  // Supprime un toast existant
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  clearTimeout(_toastTimeout);

  const toast = document.createElement('div');
  toast.className = `toast${type === 'success' ? ' toast-success' : ''}`;
  toast.textContent = message;

  // Contraindre le toast dans la max-width de l'app
  const app = document.getElementById('app');
  (app || document.body).appendChild(toast);

  _toastTimeout = setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
