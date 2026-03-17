/**
 * ui.js — Fonctions de rendu de l'interface
 * ────────────────────────────────────────────
 * Médiathèque de Cipières
 *
 * Toutes les fonctions sont PURES : elles retournent du HTML.
 * Aucune manipulation directe du DOM ici.
 *
 * Table des matières :
 *   1. Helper couverture (image Open Library + fallback gradient)
 *   2. Vues principales (catalogue, emprunts, stats)
 *   3. Composants réutilisables (cartes featured, grille, emprunts)
 *   4. Modaux (détail livre, login, admin, ajout prêt)
 *   5. Utilitaire escapeHtml
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════════
   1. HELPER COUVERTURE
   Génère le HTML interne d'un .book-cover :
   - Si isbn : <img> Open Library en arrière-plan + texte superposé
   - Sinon   : texte seul sur gradient CSS
   L'attribut onerror sur l'img déclenche JS inline minimal.
═══════════════════════════════════════════════════════════════════════ */

/**
 * @param {Object} book
 * @param {'M'|'L'} size - Taille de l'image Open Library
 * @returns {string} HTML (contenu interne du .book-cover)
 */
function coverContent(book, size = 'M') {
  // Sécurité : COVER_API peut être absent si l'ancien data.js est en cache
  let imgTag = '';
  if (book.isbn && typeof COVER_API !== 'undefined') {
    try {
      imgTag = `<img
         class="cover-img"
         src="${COVER_API.url(book.isbn, size)}"
         alt="Couverture de ${escapeHtml(book.title)}"
         loading="lazy"
         onerror="this.remove()"
         onload="this.classList.add('loaded')"
       >`;
    } catch (e) { imgTag = ''; }
  }

  return `
    ${imgTag}
    <span class="book-cover-title">${escapeHtml(book.title)}</span>
    <span class="book-cover-author">${escapeHtml(book.author)}</span>
  `;
}

/* ══════════════════════════════════════════════════════════════════════
   2. VUES PRINCIPALES
═══════════════════════════════════════════════════════════════════════ */

function renderCatalogue({ query = '', genre = '' } = {}) {
  const allBooks      = DB.getBooks();
  const featuredBooks = allBooks.filter(b => b.featured);
  const genres        = getAllGenres();

  let filteredBooks = allBooks;
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    filteredBooks = filteredBooks.filter(b =>
      b.title.toLowerCase().includes(q)  ||
      b.author.toLowerCase().includes(q) ||
      b.genre.toLowerCase().includes(q)  ||
      (b.cote && b.cote.toLowerCase().includes(q))
    );
  }
  if (genre) {
    filteredBooks = filteredBooks.filter(b => b.genre === genre);
  }

  const showFeatured = !query.trim() && !genre;

  return `
    <div>
      <div class="search-wrapper">
        <div class="search-box">
          <span class="search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input id="search-input" class="search-input" type="search"
            placeholder="Titre, auteur, cote…"
            value="${escapeHtml(query)}" autocomplete="off" spellcheck="false">
          ${query ? '<button class="search-clear" id="btn-search-clear" aria-label="Effacer">×</button>' : ''}
        </div>
      </div>

      <div class="filters-scroll" role="group" aria-label="Filtrer par genre">
        <button class="filter-pill ${!genre ? 'active' : ''}" data-genre="">Tout</button>
        ${genres.map(g => `
          <button class="filter-pill ${genre === g ? 'active' : ''}" data-genre="${escapeHtml(g)}">
            ${escapeHtml(g)}
          </button>
        `).join('')}
      </div>

      ${showFeatured ? renderFeaturedSection(featuredBooks) : ''}

      <div class="catalogue-section">
        <div class="section-header">
          <h2 class="section-title">
            ${query || genre ? 'Résultats' : 'Tous les livres'}
          </h2>
          <span class="section-count">${filteredBooks.length} livre${filteredBooks.length > 1 ? 's' : ''}</span>
        </div>
        ${filteredBooks.length > 0
          ? `<div class="books-grid">${filteredBooks.map(renderBookCard).join('')}</div>`
          : `<div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <h3 class="empty-state-title">Aucun résultat</h3>
              <p class="empty-state-text">Essayez un autre terme ou retirez les filtres.</p>
            </div>`
        }
      </div>
    </div>
  `;
}

function renderEmprunts() {
  const activeLoans  = DB.getActiveLoans();
  const overdueLoans = activeLoans.filter(l => daysUntil(l.dueDate) < 0);
  const onTimeLoans  = activeLoans.filter(l => daysUntil(l.dueDate) >= 0);

  return `
    <div>
      <div class="view-section">
        <div class="section-header">
          <h2 class="section-title">Emprunts en cours</h2>
          <span class="section-count">${activeLoans.length} actif${activeLoans.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      ${activeLoans.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <h3 class="empty-state-title">Aucun emprunt</h3>
            <p class="empty-state-text">Tous les livres sont disponibles.</p>
          </div>`
        : ''
      }

      ${overdueLoans.length > 0 ? `
        <div class="loans-list" style="padding-bottom: 0">
          <div style="padding: 0 var(--side-padding) var(--space-2)">
            <span class="badge badge-overdue" style="font-size: var(--text-xs)">
              ⚠️ En retard · ${overdueLoans.length}
            </span>
          </div>
          ${overdueLoans.map(loan => renderLoanCard(loan, true)).join('')}
        </div>
      ` : ''}

      ${onTimeLoans.length > 0 ? `
        <div class="loans-list" style="padding-top: var(--space-4)">
          ${overdueLoans.length > 0 ? `
            <div style="padding: 0 var(--side-padding) var(--space-2)">
              <span style="font-size: var(--text-xs); font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
                Dans les délais · ${onTimeLoans.length}
              </span>
            </div>
          ` : ''}
          ${onTimeLoans.map(loan => renderLoanCard(loan, false)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderStats() {
  const stats        = DB.getStats();
  const maxTopBooks  = stats.topBooks.length > 0 ? stats.topBooks[0].count : 1;
  const maxGenre     = stats.topGenres.length > 0 ? stats.topGenres[0][1] : 1;

  return `
    <div>
      <div class="view-section" style="padding-bottom: 0">
        <h2 class="section-title">Statistiques</h2>
      </div>

      <div class="stats-grid">
        <div class="stat-tile">
          <div class="stat-tile-label">Total livres</div>
          <div class="stat-tile-value">${stats.totalBooks}</div>
        </div>
        <div class="stat-tile accent">
          <div class="stat-tile-label">Disponibles</div>
          <div class="stat-tile-value">${stats.availableBooks}</div>
        </div>
        <div class="stat-tile amber">
          <div class="stat-tile-label">En prêt</div>
          <div class="stat-tile-value">${stats.activeLoans}</div>
        </div>
        <div class="stat-tile ${stats.overdueLoans > 0 ? 'danger' : ''}">
          <div class="stat-tile-label">En retard</div>
          <div class="stat-tile-value">${stats.overdueLoans}</div>
        </div>
      </div>

      <div class="charts-row">
        ${stats.topBooks.length > 0 ? `
          <div class="chart-section">
            <h3 class="chart-title">Livres les plus empruntés</h3>
            <div class="chart-bar-list">
              ${stats.topBooks.map(({ book, count }) => `
                <div class="chart-bar-item">
                  <div class="chart-bar-label">
                    <span>${escapeHtml(book.title)}</span>
                    <span class="chart-bar-count">${count} emprunt${count > 1 ? 's' : ''}</span>
                  </div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${(count / maxTopBooks) * 100}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${stats.topGenres.length > 0 ? `
          <div class="chart-section">
            <h3 class="chart-title">Emprunts par genre</h3>
            <div class="chart-bar-list">
              ${stats.topGenres.map(([genreName, count]) => `
                <div class="chart-bar-item">
                  <div class="chart-bar-label">
                    <span>${escapeHtml(genreName)}</span>
                    <span class="chart-bar-count">${count}</span>
                  </div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${(count / maxGenre) * 100}%;background:linear-gradient(90deg,${GENRE_GRADIENTS[genreName]?.[0]||'#40916C'},${GENRE_GRADIENTS[genreName]?.[1]||'#2D6A4F'})"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div style="padding: var(--space-4) var(--side-padding); color: var(--color-text-faint); font-size: var(--text-xs); text-align: center;">
        Total historique : ${stats.totalLoans} emprunt${stats.totalLoans > 1 ? 's' : ''}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════════
   3. COMPOSANTS RÉUTILISABLES
═══════════════════════════════════════════════════════════════════════ */

function renderFeaturedSection(books) {
  if (!books.length) return '';
  return `
    <section class="featured-section" aria-label="Coups de cœur">
      <div class="featured-label">
        <h2 class="featured-label-text">Coups de cœur</h2>
        <span class="featured-label-star">★</span>
      </div>
      <div class="featured-scroll">
        ${books.map(renderFeaturedCard).join('')}
      </div>
    </section>
  `;
}

function renderFeaturedCard(book) {
  const isAvailable = DB.isBookAvailable(book.id);
  return `
    <div class="card-featured" data-action="open-book" data-id="${book.id}" role="button" tabindex="0" aria-label="${escapeHtml(book.title)}">
      <div class="book-cover" style="background:${getGenreGradient(book.genre)}">
        ${coverContent(book, 'M')}
      </div>
      <div class="card-featured-meta">
        <span class="badge ${isAvailable ? 'badge-available' : 'badge-borrowed'}">
          ${isAvailable ? '● Disponible' : '● En prêt'}
        </span>
        ${book.cote ? `<span class="cote-badge cote-badge-sm">${escapeHtml(book.cote)}</span>` : ''}
      </div>
    </div>
  `;
}

function renderBookCard(book) {
  const isAvailable = DB.isBookAvailable(book.id);
  return `
    <div class="card-book" data-action="open-book" data-id="${book.id}" role="button" tabindex="0" aria-label="${escapeHtml(book.title)}">
      <div class="book-cover" style="background:${getGenreGradient(book.genre)}">
        ${coverContent(book, 'M')}
      </div>
      <div class="card-book-footer">
        <span class="card-book-genre">${escapeHtml(book.genre)}</span>
        <span class="badge ${isAvailable ? 'badge-available' : 'badge-borrowed'}">
          ${isAvailable ? '✓' : '○'}
        </span>
      </div>
      ${book.cote ? `
        <div style="padding: 0 var(--space-3) var(--space-2)">
          <span class="cote-badge cote-badge-sm">${escapeHtml(book.cote)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

function renderLoanCard(loan, isOverdue) {
  const book = DB.getBook(loan.bookId);
  if (!book) return '';

  const remaining = daysUntil(loan.dueDate);
  const elapsed   = daysSince(loan.borrowedDate);
  const initials  = getInitials(loan.borrower);

  let dueDateLabel;
  if (isOverdue) {
    dueDateLabel = `<span class="loan-date-item overdue-text">⚠️ En retard de ${Math.abs(remaining)} jour${Math.abs(remaining) > 1 ? 's' : ''}</span>`;
  } else {
    dueDateLabel = `<span class="loan-date-item">Retour avant le <strong>${formatDate(loan.dueDate)}</strong> · dans ${remaining} j.</span>`;
  }

  const adminActions = AUTH.isAdmin() ? `
    <div class="loan-actions">
      <button class="btn btn-secondary" style="font-size:var(--text-xs);padding:var(--space-2) var(--space-4);"
        data-action="return-book" data-loan-id="${loan.id}">
        ✓ Marquer retourné
      </button>
    </div>
  ` : '';

  return `
    <div class="card-loan ${isOverdue ? 'is-overdue' : ''}">
      <div class="loan-cover-mini" style="background:${getGenreGradient(book.genre)}">
        ${book.isbn
          ? `<img src="${COVER_API.url(book.isbn,'S')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;z-index:0;border-radius:inherit;" loading="lazy" onerror="this.remove()">`
          : ''
        }
      </div>
      <div class="loan-body">
        <div class="loan-book-title">${escapeHtml(book.title)}</div>
        <div class="loan-book-author">${escapeHtml(book.author)}</div>
        ${book.cote ? `<div style="margin-bottom:6px"><span class="cote-badge cote-badge-sm">${escapeHtml(book.cote)}</span></div>` : ''}
        <div class="loan-borrower">
          <div class="borrower-avatar">${initials}</div>
          <span class="borrower-name">${escapeHtml(loan.borrower)}</span>
        </div>
        <div class="loan-dates">
          <span class="loan-date-item">Emprunté le <strong>${formatDate(loan.borrowedDate)}</strong> · il y a ${elapsed} j.</span>
          ${dueDateLabel}
        </div>
        ${adminActions}
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════════
   4. MODAUX
═══════════════════════════════════════════════════════════════════════ */

function renderBookModal(bookId) {
  const book  = DB.getBook(bookId);
  if (!book) return '';

  const loan        = DB.getLoanForBook(bookId);
  const isAvailable = !loan;
  const remaining   = loan ? daysUntil(loan.dueDate) : null;
  const isOverdue   = loan && remaining < 0;

  // ── Bloc statut emprunt ──────────────────────────────────
  let statusBlock;
  if (isAvailable) {
    statusBlock = `
      <div class="modal-loan-status">
        <div class="loan-status-label">Statut</div>
        <span class="badge badge-available" style="font-size:var(--text-sm);padding:var(--space-2) var(--space-3);">
          ✓ Disponible à l'emprunt
        </span>
      </div>
    `;
  } else {
    statusBlock = `
      <div class="modal-loan-status">
        <div class="loan-status-label">Actuellement emprunté</div>
        <div class="loan-status-detail">
          <div class="loan-status-avatar">${getInitials(loan.borrower)}</div>
          <div class="loan-status-info">
            <p>${escapeHtml(loan.borrower)}</p>
            <span>Depuis le ${formatDate(loan.borrowedDate)}</span>
          </div>
          <span class="badge ${isOverdue ? 'badge-overdue' : 'badge-borrowed'}" style="margin-left:auto">
            ${isOverdue ? `⚠️ +${Math.abs(remaining)}j` : `${remaining}j`}
          </span>
        </div>
      </div>
    `;
  }

  // ── Bloc cote médiathèque ────────────────────────────────
  const coteBlock = `
    <div class="modal-cote-block ${book.cote ? '' : 'empty'}">
      <span class="modal-cote-label">Cote</span>
      <span class="modal-cote-value">
        ${book.cote
          ? escapeHtml(book.cote)
          : 'Non attribuée'
        }
      </span>
      ${book.isbn ? `<span style="margin-left:auto;font-size:var(--text-xs);color:rgba(255,255,255,0.5);font-family:monospace;">ISBN ${escapeHtml(book.isbn)}</span>` : ''}
    </div>
  `;

  // ── Actions admin ────────────────────────────────────────
  let adminActions = '';
  if (AUTH.isAdmin()) {
    if (isAvailable) {
      adminActions = `
        <button class="btn btn-primary btn-full" data-action="open-add-loan" data-book-id="${book.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Enregistrer un emprunt
        </button>
        <button class="btn btn-ghost btn-full" data-action="open-edit-book" data-book-id="${book.id}" style="margin-top:var(--space-2)">
          ✎ Modifier la cote / l'ISBN
        </button>
      `;
    } else {
      adminActions = `
        <button class="btn btn-secondary btn-full" data-action="return-book" data-loan-id="${loan.id}">
          ✓ Marquer comme retourné
        </button>
        <button class="btn btn-ghost btn-full" data-action="open-edit-book" data-book-id="${book.id}" style="margin-top:var(--space-2)">
          ✎ Modifier la cote / l'ISBN
        </button>
      `;
    }
  }

  return `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-body" style="padding-top:0">

        <div class="modal-book-hero">
          <div class="modal-cover" style="background:${getGenreGradient(book.genre)}">
            ${book.isbn ? `<img src="${COVER_API.url(book.isbn,'L')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;z-index:0;border-radius:inherit;" loading="lazy" onerror="this.remove()">` : ''}
            <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 60%);z-index:3;"></div>
          </div>
          <div class="modal-book-info">
            <h2 class="modal-book-title">${escapeHtml(book.title)}</h2>
            <p class="modal-book-author">${escapeHtml(book.author)}</p>
            <div class="modal-book-meta">
              <span class="meta-chip">${escapeHtml(book.genre)}</span>
              <span class="meta-chip">${book.year}</span>
              <span class="meta-chip">${book.pages} p.</span>
            </div>
            <span class="badge ${isAvailable ? 'badge-available' : (isOverdue ? 'badge-overdue' : 'badge-borrowed')}">
              ${isAvailable ? '● Disponible' : (isOverdue ? '● En retard' : '● En prêt')}
            </span>
          </div>
        </div>

        ${coteBlock}

        <p class="modal-description">${escapeHtml(book.description)}</p>

        ${statusBlock}

        ${adminActions}

        <button class="btn btn-ghost btn-full" data-action="close-modal" style="margin-top:var(--space-3)">
          Fermer
        </button>
      </div>
    </div>
  `;
}

function renderLoginModal() {
  return `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-body">
        <div class="login-section">
          <div class="login-lock-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
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
    </div>
  `;
}

function renderAdminModal(activeTab = 'new-loan') {
  const availableBooks = DB.getBooks().filter(b => DB.isBookAvailable(b.id));
  const activeLoans    = DB.getActiveLoans();
  const today          = new Date().toISOString().split('T')[0];
  const defaultDue     = new Date();
  defaultDue.setDate(defaultDue.getDate() + 30);
  const defaultDueStr  = defaultDue.toISOString().split('T')[0];

  return `
    <div class="modal-sheet">
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

        <!-- ── Nouveau prêt ── -->
        <div id="tab-new-loan" ${activeTab!=='new-loan'?'style="display:none"':''}>
          ${availableBooks.length === 0
            ? `<div class="empty-state" style="padding:var(--space-8) 0">
                <div class="empty-state-icon">📚</div>
                <h3 class="empty-state-title">Aucun livre disponible</h3>
              </div>`
            : `<div class="form-group">
                <label class="form-label" for="select-book">Livre</label>
                <select id="select-book" class="form-select">
                  <option value="">— Choisir un livre —</option>
                  ${availableBooks.map(b =>
                    `<option value="${b.id}">${escapeHtml(b.title)}${b.cote?' ['+escapeHtml(b.cote)+']':''}</option>`
                  ).join('')}
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
              <button class="btn btn-primary btn-full" id="btn-submit-loan">Enregistrer l'emprunt</button>`
          }
        </div>

        <!-- ── Retours ── -->
        <div id="tab-returns" ${activeTab!=='returns'?'style="display:none"':''}>
          ${activeLoans.length === 0
            ? `<div class="empty-state" style="padding:var(--space-8) 0">
                <div class="empty-state-icon">📭</div>
                <h3 class="empty-state-title">Aucun emprunt actif</h3>
              </div>`
            : activeLoans.map(loan => {
                const book = DB.getBook(loan.bookId);
                if (!book) return '';
                return `
                  <div class="return-loan-card">
                    <div class="borrower-avatar">${getInitials(loan.borrower)}</div>
                    <div class="return-loan-info">
                      <div class="return-loan-title">${escapeHtml(book.title)}</div>
                      <div class="return-loan-borrower">${escapeHtml(loan.borrower)} · depuis ${daysSince(loan.borrowedDate)}j</div>
                    </div>
                    <button class="btn btn-secondary" style="font-size:var(--text-xs);padding:var(--space-2) var(--space-3);flex-shrink:0;"
                      data-action="return-book" data-loan-id="${loan.id}">✓ Rendu</button>
                  </div>
                `;
              }).join('')
          }
        </div>

        <!-- ── Ajouter un livre ── -->
        <div id="tab-new-book" ${activeTab!=='new-book'?'style="display:none"':''}>

          <div class="form-group">
            <label class="form-label" for="nb-title">Titre <span style="color:var(--color-danger)">*</span></label>
            <input id="nb-title" class="form-input" type="text" placeholder="Titre du livre">
          </div>
          <div class="form-group">
            <label class="form-label" for="nb-author">Auteur <span style="color:var(--color-danger)">*</span></label>
            <input id="nb-author" class="form-input" type="text" placeholder="Prénom Nom">
          </div>
          <div class="form-group">
            <label class="form-label" for="nb-genre">Genre</label>
            <select id="nb-genre" class="form-select">
              ${['Classique','Roman','Policier','Science-fiction','Jeunesse','Histoire','BD','Biographie','Fantasy','Poésie'].map(g=>
                `<option value="${g}">${g}</option>`
              ).join('')}
            </select>
          </div>

          <!-- ISBN -->
          <div class="form-group">
            <label class="form-label" for="nb-isbn">
              ISBN-13
              <span style="font-weight:400;color:var(--color-text-muted);margin-left:4px">(pour la couverture automatique)</span>
            </label>
            <input id="nb-isbn" class="form-input" type="text"
              placeholder="ex : 9782070612758"
              maxlength="17"
              pattern="[0-9\\-]+"
              inputmode="numeric">
            <p class="form-hint">
              📷 La couverture sera chargée automatiquement depuis Open Library si l'ISBN est renseigné.
              <a href="https://www.isbn-international.org/fr" target="_blank" style="color:var(--color-accent)">Trouver un ISBN →</a>
            </p>
          </div>

          <!-- Cote médiathèque -->
          <div class="form-group">
            <label class="form-label" for="nb-cote">
              Cote médiathèque
              <span style="font-weight:400;color:var(--color-text-muted);margin-left:4px">(étiquette physique)</span>
            </label>
            <input id="nb-cote" class="form-input" type="text"
              placeholder="ex : ROM/SAI · POL/ECO · CIP-0042"
              style="font-family:'Courier New',monospace;letter-spacing:0.05em">
            <p class="form-hint">
              Le code apposé sur l'étiquette du livre par la médiathèque. Peut être renseigné plus tard.
            </p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
            <div class="form-group">
              <label class="form-label" for="nb-year">Année</label>
              <input id="nb-year" class="form-input" type="number" placeholder="${new Date().getFullYear()}" min="1000" max="${new Date().getFullYear()}">
            </div>
            <div class="form-group">
              <label class="form-label" for="nb-pages">Pages</label>
              <input id="nb-pages" class="form-input" type="number" placeholder="300" min="1">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="nb-description">Description</label>
            <textarea id="nb-description" class="form-textarea" placeholder="Résumé du livre…"></textarea>
          </div>

          <button class="btn btn-primary btn-full" id="btn-submit-book">Ajouter le livre</button>
        </div>

        <!-- Déconnexion -->
        <div style="margin-top:var(--space-6);padding-top:var(--space-4);border-top:1px solid var(--color-border-soft);display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:var(--text-xs);color:var(--color-text-faint)">Connecté en tant qu'administrateur</span>
          <button class="btn btn-ghost" id="btn-logout" style="font-size:var(--text-sm);color:var(--color-danger)">Déconnexion</button>
        </div>
      </div>
    </div>
  `;
}

/* ── Modal édition cote / ISBN ──────────────────────────── */

function renderEditBookModal(bookId) {
  const book = DB.getBook(bookId);
  if (!book) return '';

  return `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Modifier le livre</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button>
      </div>
      <div class="modal-body" style="padding-top:0">

        <!-- Mini aperçu du livre -->
        <div style="display:flex;align-items:center;gap:var(--space-3);background:var(--color-bg);padding:var(--space-3);border-radius:var(--radius-md);margin-bottom:var(--space-5);">
          <div style="width:44px;height:62px;border-radius:var(--radius-sm);background:${getGenreGradient(book.genre)};flex-shrink:0;overflow:hidden;position:relative;">
            ${book.isbn?`<img src="${COVER_API.url(book.isbn,'S')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;" loading="lazy" onerror="this.remove()">`:''} 
          </div>
          <div>
            <div style="font-family:var(--font-display);font-weight:600;font-size:var(--text-base)">${escapeHtml(book.title)}</div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted)">${escapeHtml(book.author)}</div>
          </div>
        </div>

        <!-- ISBN -->
        <div class="form-group">
          <label class="form-label" for="edit-isbn">
            ISBN-13
            <span style="font-weight:400;color:var(--color-text-muted);margin-left:4px">(couverture automatique)</span>
          </label>
          <input id="edit-isbn" class="form-input" type="text"
            value="${escapeHtml(book.isbn || '')}"
            placeholder="9782070612758"
            maxlength="17"
            inputmode="numeric">
          <p class="form-hint">
            📷 Saisissez l'ISBN-13 (sans tirets) pour charger la couverture depuis Open Library.
          </p>
        </div>

        <!-- Cote médiathèque -->
        <div class="form-group">
          <label class="form-label" for="edit-cote">
            Cote médiathèque
          </label>
          <input id="edit-cote" class="form-input" type="text"
            value="${escapeHtml(book.cote || '')}"
            placeholder="ex : ROM/SAI · CIP-0042"
            style="font-family:'Courier New',monospace;letter-spacing:0.05em">
          <p class="form-hint">
            Code de l'étiquette apposée sur le livre par la médiathèque.
          </p>
        </div>

        <div class="btn-group">
          <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
          <button class="btn btn-primary" id="btn-submit-edit-book" data-book-id="${book.id}">Enregistrer</button>
        </div>
      </div>
    </div>
  `;
}

/* ── Modal ajout prêt depuis fiche livre ─────────────────── */

function renderAddLoanModal(bookId) {
  const book = DB.getBook(bookId);
  if (!book) return '';

  const today      = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 30);
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  return `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Nouvel emprunt</h2>
        <button class="modal-close" data-action="close-modal" aria-label="Fermer">×</button>
      </div>
      <div class="modal-body" style="padding-top:0">

        <div style="display:flex;align-items:center;gap:var(--space-3);background:var(--color-bg);padding:var(--space-3);border-radius:var(--radius-md);margin-bottom:var(--space-5);">
          <div style="width:40px;height:56px;border-radius:var(--radius-sm);background:${getGenreGradient(book.genre)};flex-shrink:0;overflow:hidden;position:relative;">
            ${book.isbn?`<img src="${COVER_API.url(book.isbn,'S')}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;" loading="lazy" onerror="this.remove()">`:''} 
          </div>
          <div>
            <div style="font-family:var(--font-display);font-weight:600;font-size:var(--text-base)">${escapeHtml(book.title)}</div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted)">${escapeHtml(book.author)}</div>
            ${book.cote?`<span class="cote-badge cote-badge-sm" style="margin-top:4px">${escapeHtml(book.cote)}</span>`:''}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="al-borrower">Nom de l'emprunteur</label>
          <input id="al-borrower" class="form-input" type="text" placeholder="Prénom Nom" autocomplete="name">
        </div>
        <div class="form-group">
          <label class="form-label" for="al-due-date">Date de retour prévue</label>
          <input id="al-due-date" class="form-input" type="date" value="${defaultDueStr}" min="${today}">
        </div>

        <div class="btn-group">
          <button class="btn btn-ghost" data-action="close-modal">Annuler</button>
          <button class="btn btn-primary" id="btn-submit-add-loan" data-book-id="${book.id}">Confirmer</button>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════════════════════════════
   5. UTILITAIRE — Sécurisation HTML (XSS)
═══════════════════════════════════════════════════════════════════════ */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
