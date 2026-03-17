/**
 * data.js — Couche de données
 * Médiathèque de Cipières
 */

'use strict';

const DB_KEYS = {
  BOOKS: 'mc_books_v1',
  LOANS: 'mc_loans_v1',
};

const INITIAL_BOOKS = [
  { id: 1,  title: 'Le Petit Prince',                  author: 'Antoine de Saint-Exupéry', genre: 'Classique',       year: 1943, pages: 96,   featured: true,  description: "Un aviateur tombe en panne dans le Sahara et rencontre un mystérieux petit prince venu d'une autre planète. Un conte poétique et philosophique, l'un des livres les plus lus au monde." },
  { id: 2,  title: "L'Étranger",                       author: 'Albert Camus',              genre: 'Classique',       year: 1942, pages: 185,  featured: true,  description: "Meursault, employé de bureau à Alger, vit dans une indifférence totale jusqu'au jour où il commet un meurtre absurde. Chef-d'œuvre de la littérature de l'absurde." },
  { id: 3,  title: 'Les Aventures de Sherlock Holmes',  author: 'Arthur Conan Doyle',        genre: 'Policier',        year: 1892, pages: 307,  featured: true,  description: "Les enquêtes du célèbre détective au chapeau melon, accompagné de son fidèle compagnon le Dr Watson. Douze nouvelles policières devenues des classiques intemporels." },
  { id: 4,  title: 'Dune',                              author: 'Frank Herbert',              genre: 'Science-fiction', year: 1965, pages: 688,  featured: true,  description: "Sur la planète désertique Arrakis, Paul Atréides affronte son destin au milieu de complots politiques et de pouvoirs mystiques. Le roman de SF le plus vendu de tous les temps." },
  { id: 5,  title: "Harry Potter à l'école des sorciers", author: 'J.K. Rowling',            genre: 'Jeunesse',        year: 1997, pages: 308,  featured: true,  description: "Un jeune garçon ordinaire découvre le jour de ses onze ans qu'il est un sorcier et qu'il est attendu à l'école Poudlard. Le début d'une saga fantastique mondiale." },
  { id: 6,  title: 'Les Misérables',                   author: 'Victor Hugo',                genre: 'Classique',       year: 1862, pages: 1664, featured: false, description: "Le destin de Jean Valjean, ancien bagnard, dans la France du XIXe siècle. Une fresque sociale et humaniste qui mêle amour, justice et rédemption." },
  { id: 7,  title: '1984',                              author: 'George Orwell',              genre: 'Science-fiction', year: 1949, pages: 328,  featured: false, description: "Dans un futur totalitaire, Winston Smith tente de résister à l'omnipotent Big Brother et au Parti. Un roman d'anticipation sombre et visionnaire." },
  { id: 8,  title: 'Astérix le Gaulois',               author: 'Goscinny & Uderzo',          genre: 'BD',              year: 1961, pages: 48,   featured: false, description: "Un petit village gaulois résiste encore et toujours à l'envahisseur romain, grâce à la potion magique du druide Panoramix. Le début d'une série culte." },
  { id: 9,  title: 'Le Nom de la Rose',                author: 'Umberto Eco',                genre: 'Policier',        year: 1980, pages: 502,  featured: false, description: "Un moine franciscain mène une enquête dans une abbaye médiévale mystérieuse où des moines meurent les uns après les autres. Un chef-d'œuvre du roman policier historique." },
  { id: 10, title: 'Sapiens',                           author: 'Yuval Noah Harari',          genre: 'Histoire',        year: 2011, pages: 512,  featured: false, description: "Une brève histoire de l'humanité, depuis les premiers humains jusqu'à nos jours. Un voyage fascinant à travers les grandes révolutions qui ont façonné notre espèce." },
  { id: 11, title: 'Tintin au Tibet',                  author: 'Hergé',                      genre: 'BD',              year: 1960, pages: 62,   featured: false, description: "Tintin part à la recherche de son ami Tchang, disparu dans un accident d'avion dans les montagnes tibétaines. Un album considéré comme le chef-d'œuvre d'Hergé." },
  { id: 12, title: 'Les Fourmis',                      author: 'Bernard Werber',              genre: 'Science-fiction', year: 1991, pages: 350,  featured: false, description: "Dans le sous-sol d'un immeuble parisien, deux civilisations — humaine et fourmilière — sont sur le point d'entrer en contact. Un roman visionnaire et fascinant." },
  { id: 13, title: 'Montaillou, village occitan',      author: 'Emmanuel Le Roy Ladurie',    genre: 'Histoire',        year: 1975, pages: 642,  featured: false, description: "La vie quotidienne d'un village cathare au début du XIVe siècle, reconstituée grâce aux registres de l'Inquisition de Jacques Fournier. Un monument de l'histoire médiévale." },
  { id: 14, title: 'Germinal',                         author: 'Émile Zola',                 genre: 'Classique',       year: 1885, pages: 591,  featured: false, description: "La vie des mineurs du Nord de la France et leur lutte pour de meilleures conditions de travail. Le roman social le plus puissant du naturalisme français." },
  { id: 15, title: 'Da Vinci Code',                    author: 'Dan Brown',                  genre: 'Policier',        year: 2003, pages: 574,  featured: false, description: "Un professeur d'iconologie et une cryptologue tentent de dénouer un mystère vieux de deux mille ans, mêlant art, religion et conspirations secrètes." },
  { id: 16, title: 'Le Seigneur des Anneaux',          author: 'J.R.R. Tolkien',             genre: 'Fantasy',         year: 1954, pages: 1178, featured: false, description: "La quête du hobbit Frodon Sacquet pour détruire l'Anneau Unique dans les feux de la Montagne du Destin. La pierre angulaire de la fantasy moderne." },
  { id: 17, title: 'Steve Jobs',                       author: 'Walter Isaacson',             genre: 'Biographie',      year: 2011, pages: 630,  featured: false, description: "La biographie autorisée du cofondateur d'Apple, basée sur plus de quarante entretiens exclusifs. Le portrait d'un génie créatif et d'un manager controversé." },
  { id: 18, title: "L'Alchimiste",                     author: 'Paulo Coelho',               genre: 'Roman',           year: 1988, pages: 192,  featured: false, description: "Santiago, un jeune berger andalou, part en quête de son trésor personnel en traversant le désert du Sahara et en suivant les signes du destin." },
  { id: 19, title: 'Voyage au bout de la nuit',        author: 'Louis-Ferdinand Céline',     genre: 'Classique',       year: 1932, pages: 508,  featured: false, description: "Ferdinand Bardamu parcourt le monde dans ce roman sombre et révolutionnaire qui a bouleversé la littérature française." },
  { id: 20, title: 'Les Fleurs du Mal',                author: 'Charles Baudelaire',          genre: 'Poésie',          year: 1857, pages: 320,  featured: false, description: "Recueil de poèmes où Baudelaire explore la beauté dans la dépravation, le mal et la mort. L'œuvre fondatrice de la poésie moderne française." },
];

function relativeDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

const INITIAL_LOANS = [
  { id: 1,  bookId: 2,  borrower: 'Marie Dupont',       borrowedDate: relativeDate(-20), dueDate: relativeDate(10),  returned: false },
  { id: 2,  bookId: 5,  borrower: 'Jean-Pierre Martin',  borrowedDate: relativeDate(-35), dueDate: relativeDate(-5),  returned: false },
  { id: 3,  bookId: 9,  borrower: 'Sophie Leroy',        borrowedDate: relativeDate(-10), dueDate: relativeDate(20),  returned: false },
  { id: 4,  bookId: 15, borrower: 'François Girard',     borrowedDate: relativeDate(-5),  dueDate: relativeDate(25),  returned: false },
  { id: 5,  bookId: 3,  borrower: 'Clara Roux',          borrowedDate: relativeDate(-8),  dueDate: relativeDate(22),  returned: false },
  { id: 6,  bookId: 12, borrower: 'Antoine Blanc',       borrowedDate: relativeDate(-3),  dueDate: relativeDate(27),  returned: false },
  { id: 7,  bookId: 7,  borrower: 'Nathalie Morel',      borrowedDate: relativeDate(-15), dueDate: relativeDate(-3),  returned: false },
  { id: 8,  bookId: 16, borrower: 'Lucas Durand',        borrowedDate: relativeDate(-25), dueDate: relativeDate(5),   returned: false },
  { id: 9,  bookId: 1,  borrower: 'Isabelle Bernard',    borrowedDate: relativeDate(-60), dueDate: relativeDate(-30), returned: true  },
  { id: 10, bookId: 6,  borrower: 'Thomas Petit',        borrowedDate: relativeDate(-45), dueDate: relativeDate(-15), returned: true  },
];

const DB = {
  init() {
    if (!localStorage.getItem(DB_KEYS.BOOKS)) localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    if (!localStorage.getItem(DB_KEYS.LOANS))  localStorage.setItem(DB_KEYS.LOANS,  JSON.stringify(INITIAL_LOANS));
  },
  reset() {
    localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    localStorage.setItem(DB_KEYS.LOANS,  JSON.stringify(INITIAL_LOANS));
  },
  getBooks()    { return JSON.parse(localStorage.getItem(DB_KEYS.BOOKS)) || []; },
  getBook(id)   { return this.getBooks().find(b => b.id === id) || null; },
  saveBook(book) {
    const books = this.getBooks();
    const idx   = books.findIndex(b => b.id === book.id);
    if (idx >= 0) books[idx] = book; else books.push({ ...book, id: Date.now() });
    localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
  },
  getLoans()        { return JSON.parse(localStorage.getItem(DB_KEYS.LOANS)) || []; },
  getActiveLoans()  { return this.getLoans().filter(l => !l.returned); },
  getLoanForBook(bookId) { return this.getActiveLoans().find(l => l.bookId === bookId) || null; },
  addLoan(loan) {
    const loans = this.getLoans();
    loans.push({ ...loan, id: Date.now(), returned: false });
    localStorage.setItem(DB_KEYS.LOANS, JSON.stringify(loans));
  },
  returnBook(loanId) {
    const loans = this.getLoans();
    const loan  = loans.find(l => l.id === loanId);
    if (loan) loan.returned = true;
    localStorage.setItem(DB_KEYS.LOANS, JSON.stringify(loans));
  },
  isBookAvailable(bookId) { return !this.getLoanForBook(bookId); },
  getStats() {
    const books        = this.getBooks();
    const loans        = this.getLoans();
    const activeLoans  = loans.filter(l => !l.returned);
    const overdueLoans = activeLoans.filter(l => new Date(l.dueDate) < new Date());
    const loanCounts   = {};
    loans.forEach(l => { loanCounts[l.bookId] = (loanCounts[l.bookId] || 0) + 1; });
    const topBooks = Object.entries(loanCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([bookId, count]) => ({ book: this.getBook(+bookId), count }))
      .filter(e => e.book !== null);
    const genreCounts = {};
    loans.forEach(l => { const b = this.getBook(l.bookId); if (b) genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1; });
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { totalBooks: books.length, totalLoans: loans.length, activeLoans: activeLoans.length, overdueLoans: overdueLoans.length, availableBooks: books.length - activeLoans.length, topBooks, topGenres };
  },
};

const AUTH = {
  _password: 'cipieres',
  _isAdmin:  false,
  login(p)   { this._isAdmin = p === this._password; return this._isAdmin; },
  isAdmin()  { return this._isAdmin; },
  logout()   { this._isAdmin = false; },
};

const GENRE_GRADIENTS = {
  'Classique':       ['#D4A843', '#8B5E1A'],
  'Roman':           ['#5AAFA0', '#1E6B5F'],
  'Policier':        ['#5A6275', '#1E2535'],
  'Science-fiction': ['#7B6FE8', '#3A2E9C'],
  'Jeunesse':        ['#F0954A', '#A3500F'],
  'Histoire':        ['#C46B42', '#7A3318'],
  'BD':              ['#E05C6B', '#8C1A28'],
  'Biographie':      ['#4DB87A', '#1B6840'],
  'Fantasy':         ['#9B7CE8', '#4E2B9C'],
  'Poésie':          ['#D46D9B', '#8C2859'],
};

function getGenreGradient(genre) {
  const c = GENRE_GRADIENTS[genre] || ['#A0A0A8', '#4A4A55'];
  return `linear-gradient(145deg, ${c[0]} 0%, ${c[1]} 100%)`;
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function daysSince(d) { return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000)); }
function daysUntil(d) { return Math.floor((new Date(d).getTime() - Date.now()) / 86400000); }
function getInitials(n) { return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }
function getAllGenres() { return [...new Set(DB.getBooks().map(b => b.genre))].sort(); }
