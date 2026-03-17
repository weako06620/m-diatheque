/**
 * app.js — Point d'entrée de l'application
 * Médiathèque de Cipières
 */

'use strict';

const AppState = { searchQuery: '', activeGenre: '', adminTab: 'new-loan' };

document.addEventListener('DOMContentLoaded', () => {
  DB.init();
  Router.register('catalogue', () => renderCatalogue({ query: AppState.searchQuery, genre: AppState.activeGenre }));
  Router.register('emprunts',  () => renderEmprunts());
  Router.register('stats',     () => renderStats());
  window._onViewRendered = onViewRendered;
  Router.init();
  initAdminButton();
  initGlobalEvents();
});

function initAdminButton() {
  const btn = document.getElementById('btn-admin');
  updateAdminButtonIcon(btn);
  btn.addEventListener('click', () => AUTH.isAdmin() ? openAdminModal() : openLoginModal());
}

function updateAdminButtonIcon(btn) {
  if (!btn) return;
  if (AUTH.isAdmin()) {
    btn.classList.add('is-admin-active');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 8 0v2"/><path d="M18 14l1.5 1.5L22 13"/></svg>`;
    btn.title = "Panneau d'administration";
  } else {
    btn.classList.remove('is-admin-active');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
    btn.title = 'Connexion administrateur';
  }
}

function initGlobalEvents() {
  document.getElementById('app-nav').addEventListener('click', e => {
    const item = e.target.closest('.nav-item');
    if (item && item.dataset.view) {
      if (item.dataset.view !== 'catalogue') { AppState.searchQuery = ''; AppState.activeGenre = ''; }
      Router.navigate(item.dataset.view);
    }
  });

  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.addEventListener('click', handleGlobalClick);

  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button' && e.target.dataset.action) {
      e.preventDefault(); e.target.click();
    }
    if (e.key === 'Escape') closeModal();
  });
}

function handleGlobalClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  switch (target.dataset.action) {
    case 'open-book':    openBookModal(parseInt(target.dataset.id, 10)); break;
    case 'close-modal':  closeModal(); break;
    case 'open-add-loan': openAddLoanModal(parseInt(target.dataset.bookId, 10)); break;
    case 'return-book':  handleReturnBook(parseInt(target.dataset.loanId, 10)); break;
  }
}

function onViewRendered(viewId) {
  if (viewId === 'catalogue') bindCatalogueEvents();
}

function bindCatalogueEvents() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
    searchInput.addEventListener('input', e => { AppState.searchQuery = e.target.value; Router.refresh(); });
  }
  const clearBtn = document.getElementById('btn-search-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => { AppState.searchQuery = ''; Router.refresh(); });
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => { AppState.activeGenre = pill.dataset.genre; Router.refresh(); });
  });
}

/* ── Modaux ─────────────────────────────────────────────── */

function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = html;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  overlay.innerHTML = '';
  document.body.style.overflow = '';
}

function openBookModal(bookId)   { openModal(renderBookModal(bookId)); }
function openLoginModal()        { openModal(renderLoginModal()); bindLoginModalEvents(); }
function openAdminModal(tab = AppState.adminTab) { AppState.adminTab = tab; openModal(renderAdminModal(tab)); bindAdminModalEvents(); }
function openAddLoanModal(bookId){ openModal(renderAddLoanModal(bookId)); bindAddLoanModalEvents(); }

/* ── Login ──────────────────────────────────────────────── */

function bindLoginModalEvents() {
  const btn   = document.getElementById('btn-login-submit');
  const input = document.getElementById('input-password');
  const err   = document.getElementById('login-error');
  if (!btn || !input) return;
  const attempt = () => {
    if (AUTH.login(input.value.trim())) {
      closeModal();
      updateAdminButtonIcon(document.getElementById('btn-admin'));
      showToast('✓ Connecté en mode administrateur', 'success');
      openAdminModal();
    } else {
      err.style.display = 'block';
      input.value = '';
      input.focus();
    }
  };
  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
  setTimeout(() => input.focus(), 200);
}

/* ── Admin ──────────────────────────────────────────────── */

function bindAdminModalEvents() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.adminTab;
      AppState.adminTab = id;
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      ['new-loan','returns','new-book'].forEach(t => {
        const p = document.getElementById(`tab-${t}`);
        if (p) p.style.display = t === id ? '' : 'none';
      });
    });
  });

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AUTH.logout(); closeModal();
      updateAdminButtonIcon(document.getElementById('btn-admin'));
      Router.refresh(); showToast('Déconnecté');
    });
  }

  const submitLoanBtn = document.getElementById('btn-submit-loan');
  if (submitLoanBtn) {
    submitLoanBtn.addEventListener('click', () => {
      const bookId   = parseInt(document.getElementById('select-book').value, 10);
      const borrower = document.getElementById('input-borrower').value.trim();
      const dueDate  = document.getElementById('input-due-date').value;
      if (!bookId || !borrower || !dueDate) { showToast('⚠ Veuillez remplir tous les champs'); return; }
      DB.addLoan({ bookId, borrower, borrowedDate: new Date().toISOString().split('T')[0], dueDate });
      closeModal(); Router.refresh(); showToast('✓ Emprunt enregistré', 'success');
    });
  }

  const submitBookBtn = document.getElementById('btn-submit-book');
  if (submitBookBtn) {
    submitBookBtn.addEventListener('click', () => {
      const title  = document.getElementById('nb-title').value.trim();
      const author = document.getElementById('nb-author').value.trim();
      if (!title || !author) { showToast("⚠ Le titre et l'auteur sont obligatoires"); return; }
      DB.saveBook({
        title, author,
        genre:       document.getElementById('nb-genre').value,
        year:        parseInt(document.getElementById('nb-year').value, 10)  || new Date().getFullYear(),
        pages:       parseInt(document.getElementById('nb-pages').value, 10) || 0,
        description: document.getElementById('nb-description').value.trim(),
        featured:    false,
      });
      closeModal(); Router.navigate('catalogue'); showToast('✓ Livre ajouté au catalogue', 'success');
    });
  }
}

/* ── Add loan modal ─────────────────────────────────────── */

function bindAddLoanModalEvents() {
  const btn = document.getElementById('btn-submit-add-loan');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const bookId   = parseInt(btn.dataset.bookId, 10);
    const borrower = document.getElementById('al-borrower').value.trim();
    const dueDate  = document.getElementById('al-due-date').value;
    if (!borrower || !dueDate) { showToast('⚠ Veuillez remplir tous les champs'); return; }
    DB.addLoan({ bookId, borrower, borrowedDate: new Date().toISOString().split('T')[0], dueDate });
    closeModal(); Router.refresh(); showToast('✓ Emprunt enregistré', 'success');
  });
  setTimeout(() => { const i = document.getElementById('al-borrower'); if (i) i.focus(); }, 200);
}

function handleReturnBook(loanId) {
  DB.returnBook(loanId); closeModal(); Router.refresh(); showToast('✓ Retour enregistré', 'success');
}

/* ── Toasts ─────────────────────────────────────────────── */

let _toastTimeout = null;

function showToast(message, type = 'default', duration = 2500) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  clearTimeout(_toastTimeout);
  const toast = document.createElement('div');
  toast.className = `toast${type === 'success' ? ' toast-success' : ''}`;
  toast.textContent = message;
  (document.getElementById('app') || document.body).appendChild(toast);
  _toastTimeout = setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
