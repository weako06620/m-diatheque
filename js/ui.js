/**
 * ui.js — Fonctions de rendu de l'interface
 * Médiathèque de Cipières
 */

'use strict';

/* ══ VUES PRINCIPALES ══════════════════════════════════════════════════ */

function renderCatalogue({ query = '', genre = '' } = {}) {
  const allBooks      = DB.getBooks();
  const featuredBooks = allBooks.filter(b => b.featured);
  const genres        = getAllGenres();

  let filtered = allBooks;
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)
    );
  }
  if (genre) filtered = filtered.filter(b => b.genre === genre);

  const showFeatured = !query.trim() && !genre;

  return `<div>
    <div class="search-wrapper">
      <div class="search-box">
        <span class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input id="search-input" class="search-input" type="search"
          placeholder="Rechercher un titre, un auteur…"
          value="${escapeHtml(query)}" autocomplete="off" spellcheck="false">
        ${query ? '<button class="search-clear" id="btn-search-clear" aria-label="Effacer">×</button>' : ''}
      </div>
    </div>

    <div class="filters-scroll" role="group" aria-label="Filtrer par genre">
      <button class="filter-pill ${!genre ? 'active' : ''}" data-genre="">Tout</button>
      ${genres.map(g => `<button class="filter-pill ${genre === g ? 'active' : ''}" data-genre="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join('')}
    </div>

    ${showFeatured ? renderFeaturedSection(featuredBooks) : ''}

    <div class="catalogue-section">
      <div class="section-header">
        <h2 class="section-title">${query || genre ? 'Résultats' : 'Tous les livres'}</h2>
        <span class="section-count">${filtered.length} livre${filtered.length > 1 ? 's' : ''}</span>
      </div>
      ${filtered.length > 0
        ? `<div class="books-grid">${filtered.map(renderBookCard).join('')}</div>`
        : `<div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">Aucun résultat</h3>
            <p class="empty-state-text">Essayez un autre terme ou retirez les filtres.</p>
          </div>`
      }
    </div>
  </div>`;
}

function renderEmprunts() {
  const activeLoans  = DB.getActiveLoans();
  const overdueLoans = activeLoans.filter(l => daysUntil(l.dueDate) < 0);
  const onTimeLoans  = activeLoans.filter(l => daysUntil(l.dueDate) >= 0);

  return `<div>
    <div class="view-section">
      <div class="section-header">
        <h2 class="section-title">Emprunts en cours</h2>
        <span class="section-count">${activeLoans.length} actif${activeLoans.length > 1 ? 's' : ''}</span>
      </div>
    </div>

    ${activeLoans.length === 0 ? `<div class="empty-state">
      <div class="empty-state-icon">📭</div>
      <h3 class="empty-state-title">Aucun emprunt</h3>
      <p class="empty-state-text">Tous les livres sont disponibles.</p>
    </div>` : ''}

    ${overdueLoans.length > 0 ? `
      <div class="loans-list" style="padding-bottom:0">
        <div style="padding:0 var(--side-padding) var(--space-2)">
          <span class="badge badge-overdue" style="font-size:var(--text-xs)">⚠️ En retard · ${overdueLoans.length}</span>
        </div>
        ${overdueLoans.map(l => renderLoanCard(l, true)).join('')}
      </div>` : ''}

    ${onTimeLoans.length > 0 ? `
      <div class="loans-list" style="padding-top:var(--space-4)">
        ${overdueLoans.length > 0 ? `<div style="padding:0 var(--side-padding) var(--space-2)"><span style="font-size:var(--text-xs);font-weight:600;color:var(--color-text-muted);letter-spacing:.06em;text-transform:uppercase">Dans les délais · ${onTimeLoans.length}</span></div>` : ''}
        ${onTimeLoans.map(l => renderLoanCard(l, false)).join('')}
      </div>` : ''}
  </div>`;
}

function renderStats() {
  const stats       = DB.getStats();
  const maxTopBooks = stats.topBooks.length > 0 ? stats.topBooks[0].count : 1;
  const maxGenre    = stats.topGenres.length > 0 ? stats.topGenres[0][1] : 1;

  return `<div>
    <div class="view-section" style="padding-bottom:0">
      <h2 class="section-title">Statistiques</h2>
    </div>

    <div class="stats-grid">
      <div class="stat-tile"><div class="stat-tile-label">Total livres</div><div class="stat-tile-value">${stats.totalBooks}</div></div>
      <div class="stat-tile accent"><div class="stat-tile-label">Disponibles</div><div class="stat-tile-value">${stats.availableBooks}</div></div>
      <div class="stat-tile amber"><div class="stat-tile-label">En prêt</div><div class="stat-tile-value">${stats.activeLoans}</div></div>
      <div class="stat-tile ${stats.overdueLoans > 0 ? 'danger' : ''}"><div class="stat-tile-label">En retard</div><div class="stat-tile-value">${stats.overdueLoans}</div></div>
    </div>

    <div class="charts-row">
      ${stats.topBooks.length > 0 ? `
        <div class="chart-section">
          <h3 class="chart-title">Livres les plus empruntés</h3>
          <div class="chart-bar-list">
            ${stats.topBooks.map(({ book, count }) => `
              <div class="chart-bar-item">
                <div class="chart-bar-label"><span>${escapeHtml(book.title)}</span><span class="chart-bar-count">${count} emprunt${count > 1 ? 's' : ''}</span></div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(count/maxTopBooks)*100}%"></div></div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      ${stats.topGenres.length > 0 ? `
        <div class="chart-section">
          <h3 class="chart-title">Emprunts par genre</h3>
          <div class="chart-bar-list">
            ${stats.topGenres.map(([g, count]) => `
              <div class="chart-bar-item">
                <div class="chart-bar-label"><span>${escapeHtml(g)}</span><span class="chart-bar-count">${count}</span></div>
                <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(count/maxGenre)*100}%;background:linear-gradient(90deg,${GENRE_GRADIENTS[g]?.[0]||'#40916C'},${GENRE_GRADIENTS[g]?.[1]||'#2D6A4F'})"></div></div>
              </div>`).join('')}
          </div>
        </div>` : ''}
    </div>

    <div style="padding:var(--space-4) var(--side-padding);color:var(--color-text-faint);font-size:var(--text-xs);text-align:center">
      Total historique : ${stats.totalLoans} emprunt${stats.totalLoans > 1 ? 's' : ''}
    </div>
  </div>`;
}

/* ══ COMPOSANTS ════════════════════════════════════════════════════════ */

function renderFeaturedSection(books) {
  if (!books.length) return '';
  return `<section class="featured-section" aria-label="Coups de cœur">
    <div class="featured-label">
      <h2 class="featured-label-text">Coups de cœur</h2>
      <span class="featured-label-star">★</span>
    </div>
    <div class="featured-scroll">${books.map(renderFeaturedCard).join('')}</div>
  </section>`;
}

function renderFeaturedCard(book) {
  const isAvail = DB.isBookAvailable(book.id);
  return `<div class="card-featured" data-action="open-book" data-id="${book.id}" role="button" tabindex="0" aria-label="${escapeHtml(book.title)}">
    <div class="book-cover" style="background:${getGenreGradient(book.genre)}">
      <span class="book-cover-title">${escapeHtml(book.title)}</span>
      <span class="book-cover-author">${escapeHtml(book.author)}</span>
    </div>
    <div class="card-featured-meta">
      <span class="badge ${isAvail ? 'badge-available' : 'badge-borrowed'}">${isAvail ? '● Disponible' : '● En prêt'}</span>
    </div>
  </div>`;
}

function renderBookCard(book) {
  const isAvail = DB.isBookAvailable(book.id);
  return `<div class="card-book" data-action="open-book" data-id="${book.id}" role="button" tabindex="0" aria-label="${escapeHtml(book.title)}">
    <div class="book-cover" style="background:${getGenreGradient(book.genre)}">
      <span class="book-cover-title">${escapeHtml(book.title)}</span>
      <span class="book-cover-author">${escapeHtml(book.author)}</span>
    </div>
    <div class="card-book-footer">
      <span class="card-book-genre">${escapeHtml(book.genre)}</span>
      <span class="badge ${isAvail ? 'badge-available' : 'badge-borrowed'}">${isAvail ? '✓' : '○'}</span>
    </div>
  </div>`;
}

function renderLoanCard(loan, isOverdue) {
  const book = DB.getBook(loan.bookId);
  if (!book) return '';
  const remaining = daysUntil(loan.dueDate);
  const elapsed   = daysSince(loan.borrowedDate);
  const initials  = getInitials(loan.borrower);
  const dueLbl    = isOverdue
    ? `<span class="loan-date-item overdue-text">⚠️ En retard de ${Math.abs(remaining)} jour${Math.abs(remaining)>1?'s':''}</span>`
    : `<span class="loan-date-item">Retour avant le <strong>${formatDate(loan.dueDate)}</strong> · dans ${remaining} j.</span>`;

  const adminActions = AUTH.isAdmin() ? `
    <div class="loan-actions">
      <button class="btn btn-secondary" style="font-size:var(--text-xs);padding:var(--space-2) var(--space-4)"
        data-action="return-book" data-loan-id="${loan.id}">✓ Marquer retourné</button>
    </div>` : '';

  return `<div class="card-loan ${isOverdue ? 'is-overdue' : ''}">
    <div class="loan-cover-mini" style="background:${getGenreGradient(book.genre)}"></div>
    <div class="loan-body">
      <div class="loan-book-title">${escapeHtml(book.title)}</div>
      <div class="loan-book-author">${escapeHtml(book.author)}</div>
      <div class="loan-borrower">
        <div class="borrower-avatar">${initials}</div>
        <span class="borrower-name">${escapeHtml(loan.borrower)}</span>
      </div>
      <div class="loan-dates">
        <span class="loan-date-item">Emprunté le <strong>${formatDate(loan.borrowedDate)}</strong> · il y a ${elapsed} j.</span>
        ${dueLbl}
      </div>
      ${adminActions}
    </div>
  </div>`;
}

/* ══ MODAUX ════════════════════════════════════════════════════════════ */

function renderBookModal(bookId) {
  const book = DB.getBook(bookId);
  if (!book) return '';
  const loan      = DB.getLoanForBook(bookId);
  const isAvail   = !loan;
  const remaining = loan ? daysUntil(loan.dueDate) : null;
  const isOverdue = loan && remaining < 0;

  const statusBlock = isAvail
    ? `<div class="modal-loan-status">
        <div class="loan-status-label">Statut</div>
        <span class="badge badge-available" style="font-size:var(--text-sm);padding:var(--space-2) var(--space-3)">✓ Disponible à l'emprunt</span>
      </div>`
    : `<div class="modal-loan-status">
        <div class="loan-status-label">Actuellement emprunté</div>
        <div class="loan-status-detail">
          <div class="loan-status-avatar">${getInitials(loan.borrower)}</div>
          <div class="loan-status-info">
            <p>${escapeHtml(loan.borrower)}</p>
            <span>Depuis le ${formatDate(loan.borrowedDate)}</span>
          </div>
          <span class="badge ${isOverdue?'badge-overdue':'badge-borrowed'}" style="margin-left:auto">
            ${isOverdue?`⚠️ +${Math.abs(remaining)}j`:`${remaining}j`}
          </span>
        </div>
      </div>`;

  const adminActions = AUTH.isAdmin()
    ? isAvail
      ? `<button class="btn btn-primary btn-full" data-action="open-add-loan" data-book-id="${book.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Enregistrer un emprunt
        </button>`
      : `<button class="btn btn-secondary btn-full" data-action="return-book" data-loan-id="${loan.id}">✓ Marquer comme retourné</button>`
    : '';

  return `<div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-body" style="padding-top:0">
      <div class="modal-book-hero">
        <div class="modal-cover" style="background:${getGenreGradient(book.genre)}">
          <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.18) 0%,transparent 60%);z-index:3"></div>
        </div>
        <div class="modal-book-info">
          <h2 class="modal-book-title">${escapeHtml(book.title)}</h2>
          <p class="modal-book-author">${escapeHtml(book.author)}</p>
          <div class="modal-book-meta">
            <span class="meta-chip">${escapeHtml(book.genre)}</span>
            <span class="meta-chip">${book.year}</span>
            <span class="meta-chip">${book.pages} p.</span>
          </div>
          <span class="badge ${isAvail?'badge-available':isOverdue?'badge-overdue':'badge-borrowed'}">
            ${isAvail?'● Disponible':isOverdue?'● En retard':'● En prêt'}
          </span>
        </div>
      </div>
      <p class="modal-description">${escapeHtml(book.description)}</p>
      ${statusBlock}
      ${adminActions}
      <button class="btn btn-ghost btn-full" data-action="close-modal" style="margin-top:var(--space-3)">Fermer</button>
    </div>
  </div>`;
}

function renderLoginModal() {
  return `<div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-body">
      <div class="login-section">
        <div class="login-lock-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 class="login-title">Espace administrateur</h2>
        <p class="login-subtitle">Entrez le mot de passe pour accéder à l'administration.</p>
      </div>
      <div id="login-error" class="login-error" style="display:none">Mot de passe incorrect.</div>
      <div class="form-group">
        <label class="form-label" for="input-password">Mot de passe</label>
        <input id="input-password" class="form-input" type="password" placeholder="••••••••" autocomplete="current-password">
        <p class="form-hint">Démo : <code>cipieres</code></p>
      </div>
      <div class="btn-group">
        <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
        <button class="btn btn-primary" id="btn-login-submit">Se connecter</button>
      </div>
    </div>
  </div>`;
}

function renderAdminModal(activeTab = 'new-loan') {
  const availableBooks = DB.getBooks().filter(b => DB.isBookAvailable(b.id));
  const activeLoans    = DB.getActiveLoans();
  const today          = new Date().toISOString().split('T')[0];
  const defaultDue     = new Date(); defaultDue.setDate(defaultDue.getDate() + 30);
  const defaultDueStr  = defaultDue.toISOString().split('T')[0];

  return `<div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <h2 class="modal-title">Administration</h2>
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body" style="padding-top:0">
      <div class="admin-tabs">
        <button class="admin-tab ${activeTab==='new-loan'?'active':''}" data-admin-tab="new-loan">Nouveau prêt</button>
        <button class="admin-tab ${activeTab==='returns'?'active':''}"  data-admin-tab="returns">Retours</button>
        <button class="admin-tab ${activeTab==='new-book'?'active':''}" data-admin-tab="new-book">Ajouter livre</button>
      </div>

      <div id="tab-new-loan" ${activeTab!=='new-loan'?'style="display:none"':''}>
        ${availableBooks.length === 0
          ? `<div class="empty-state" style="padding:var(--space-8) 0"><div class="empty-state-icon">📚</div><h3 class="empty-state-title">Aucun livre disponible</h3></div>`
          : `<div class="form-group">
              <label class="form-label" for="select-book">Livre</label>
              <select id="select-book" class="form-select">
                <option value="">— Choisir un livre —</option>
                ${availableBooks.map(b => `<option value="${b.id}">${escapeHtml(b.title)} · ${escapeHtml(b.author)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="input-borrower">Nom de l'emprunteur</label>
              <input id="input-borrower" class="form-input" type="text" placeholder="Prénom Nom" autocomplete="name">
            </div>
            <div class="form-group">
              <label class="form-label" for="input-due-date">Date de retour prévue</label>
              <input id="input-due-date" class="form-input" type="date" value="${defaultDueStr}" min="${today}">
            </div>
            <button class="btn btn-primary btn-full" id="btn-submit-loan">Enregistrer l'emprunt</button>`}
      </div>

      <div id="tab-returns" ${activeTab!=='returns'?'style="display:none"':''}>
        ${activeLoans.length === 0
          ? `<div class="empty-state" style="padding:var(--space-8) 0"><div class="empty-state-icon">📭</div><h3 class="empty-state-title">Aucun emprunt actif</h3></div>`
          : activeLoans.map(loan => {
              const book = DB.getBook(loan.bookId); if (!book) return '';
              return `<div class="return-loan-card">
                <div class="borrower-avatar">${getInitials(loan.borrower)}</div>
                <div class="return-loan-info">
                  <div class="return-loan-title">${escapeHtml(book.title)}</div>
                  <div class="return-loan-borrower">${escapeHtml(loan.borrower)} · depuis ${daysSince(loan.borrowedDate)}j</div>
                </div>
                <button class="btn btn-secondary" style="font-size:var(--text-xs);padding:var(--space-2) var(--space-3);flex-shrink:0"
                  data-action="return-book" data-loan-id="${loan.id}">✓ Rendu</button>
              </div>`;
            }).join('')}
      </div>

      <div id="tab-new-book" ${activeTab!=='new-book'?'style="display:none"':''}>
        <div class="form-group"><label class="form-label" for="nb-title">Titre</label><input id="nb-title" class="form-input" type="text" placeholder="Titre du livre"></div>
        <div class="form-group"><label class="form-label" for="nb-author">Auteur</label><input id="nb-author" class="form-input" type="text" placeholder="Prénom Nom"></div>
        <div class="form-group"><label class="form-label" for="nb-genre">Genre</label>
          <select id="nb-genre" class="form-select">
            ${['Classique','Roman','Policier','Science-fiction','Jeunesse','Histoire','BD','Biographie','Fantasy','Poésie'].map(g=>`<option value="${g}">${g}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
          <div class="form-group"><label class="form-label" for="nb-year">Année</label><input id="nb-year" class="form-input" type="number" placeholder="${new Date().getFullYear()}"></div>
          <div class="form-group"><label class="form-label" for="nb-pages">Pages</label><input id="nb-pages" class="form-input" type="number" placeholder="300"></div>
        </div>
        <div class="form-group"><label class="form-label" for="nb-description">Description</label><textarea id="nb-description" class="form-textarea" placeholder="Résumé du livre…"></textarea></div>
        <button class="btn btn-primary btn-full" id="btn-submit-book">Ajouter le livre</button>
      </div>

      <div style="margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--color-border-soft);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:var(--text-xs);color:var(--color-text-faint)">Connecté en tant qu'administrateur</span>
        <button class="btn btn-ghost" id="btn-logout" style="font-size:var(--text-sm);color:var(--color-danger)">Déconnexion</button>
      </div>
    </div>
  </div>`;
}

function renderAddLoanModal(bookId) {
  const book = DB.getBook(bookId); if (!book) return '';
  const today      = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(); defaultDue.setDate(defaultDue.getDate() + 30);
  return `<div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-header">
      <h2 class="modal-title">Nouvel emprunt</h2>
      <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button>
    </div>
    <div class="modal-body" style="padding-top:0">
      <div style="display:flex;align-items:center;gap:var(--space-3);background:var(--color-bg);padding:var(--space-3);border-radius:var(--radius-md);margin-bottom:var(--space-5)">
        <div style="width:40px;height:56px;border-radius:var(--radius-sm);background:${getGenreGradient(book.genre)};flex-shrink:0"></div>
        <div>
          <div style="font-family:var(--font-display);font-weight:600;font-size:var(--text-base)">${escapeHtml(book.title)}</div>
          <div style="font-size:var(--text-sm);color:var(--color-text-muted)">${escapeHtml(book.author)}</div>
        </div>
      </div>
      <div class="form-group"><label class="form-label" for="al-borrower">Nom de l'emprunteur</label><input id="al-borrower" class="form-input" type="text" placeholder="Prénom Nom" autocomplete="name"></div>
      <div class="form-group"><label class="form-label" for="al-due-date">Date de retour prévue</label><input id="al-due-date" class="form-input" type="date" value="${defaultDue.toISOString().split('T')[0]}" min="${today}"></div>
      <div class="btn-group">
        <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
        <button class="btn btn-primary" id="btn-submit-add-loan" data-book-id="${book.id}">Confirmer</button>
      </div>
    </div>
  </div>`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
