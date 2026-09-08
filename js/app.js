/* app.js — everything shared by all three pages:
   product data, the cart, the wishlist, toasts, theme, language and the header. */

/* ------------------------------------------------------------------ constants */

const FREE_DELIVERY_OVER = 20;
const DELIVERY_KW = 2.5;
const DELIVERY_GCC = 6;
const GCC = ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Oman'];

const KEY = {
  cart: 'nabta.cart',
  wish: 'nabta.wishlist',
  plants: 'nabta.plants',
  user: 'nabta.user',
  theme: 'nabta.theme'
};

/* ------------------------------------------------------------ tiny storage helpers */

/** Read JSON from localStorage, returning `fallback` if it is missing or corrupt. */
function read (key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write (key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private browsing, or storage full — the page still works, just forgets. */
  }
}

/* ------------------------------------------------------------------- money */

/** Kuwaiti dinar is quoted to three decimal places. */
const money = n => `${Number(n).toFixed(3)} ${t('currency')}`;

/* -------------------------------------------------------------- product data */

let productCache = null;

/**
 * Load the catalogue. data/products.json is the single source of truth and is
 * fetched normally when the site is served over http. The file:// protocol
 * blocks fetch(), so when the page has simply been double-clicked we fall
 * back to data/products.js, which holds a mirror of the same data.
 */
async function loadProducts () {
  if (productCache) return productCache;
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error(res.status);
    productCache = await res.json();
  } catch {
    productCache = typeof NABTA_PRODUCTS === 'undefined' ? [] : NABTA_PRODUCTS;
  }
  return productCache;
}

/** Localised product name, honouring the current language. */
const pName = p => (getLang() === 'ar' ? p.nameAr : p.name);
const pDesc = p => (getLang() === 'ar' ? p.descriptionAr : p.description);
const pCare = p => (getLang() === 'ar' ? p.careAr : p.care);

/** Price for a chosen pot size. */
function priceFor (product, potLabel) {
  const pot = product.potSizes.find(s => s.label === potLabel) ?? product.potSizes[0];
  return product.price + pot.delta;
}

/* ------------------------------------------------------------------- toasts */

let toastHost = null;

/** Non-blocking message in the corner. Never use alert(). */
function toast (message, kind = 'ok') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.textContent = message;
  toastHost.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => {
    el.classList.remove('is-in');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 3200);
}

/* -------------------------------------------------------------------- cart */

class Cart {
  constructor () {
    this.items = read(KEY.cart, []);
  }

  save () {
    write(KEY.cart, this.items);
    document.dispatchEvent(new CustomEvent('cartchange'));
  }

  get count () {
    return this.items.reduce((n, i) => n + i.qty, 0);
  }

  add (productId, pot, qty = 1) {
    const found = this.items.find(i => i.id === productId && i.pot === pot);
    if (found) found.qty += qty;
    else this.items.push({ id: productId, pot, qty });
    this.save();
  }

  setQty (productId, pot, qty) {
    const i = this.items.findIndex(x => x.id === productId && x.pot === pot);
    if (i === -1) return;
    if (qty <= 0) this.items.splice(i, 1);
    else this.items[i].qty = qty;
    this.save();
  }

  remove (productId, pot) {
    this.items = this.items.filter(i => !(i.id === productId && i.pot === pot));
    this.save();
  }

  clear () {
    this.items = [];
    this.save();
  }

  /** Subtotal, delivery and total, using the signed-in user's country. */
  totals (products) {
    const subtotal = this.items.reduce((sum, i) => {
      const p = products.find(x => x.id === i.id);
      return p ? sum + priceFor(p, i.pot) * i.qty : sum;
    }, 0);

    const country = getUser()?.country ?? 'Kuwait';
    let delivery;
    if (country === 'Kuwait') delivery = subtotal >= FREE_DELIVERY_OVER || subtotal === 0 ? 0 : DELIVERY_KW;
    else if (GCC.includes(country)) delivery = subtotal === 0 ? 0 : DELIVERY_GCC;
    else delivery = subtotal === 0 ? 0 : DELIVERY_GCC;

    return { subtotal, delivery, total: subtotal + delivery, country };
  }
}

const cart = new Cart();

/* ------------------------------------------------------------------ wishlist */

const wishlist = {
  get ids () { return read(KEY.wish, []); },
  has (id) { return this.ids.includes(id); },
  toggle (id) {
    const ids = this.ids;
    const i = ids.indexOf(id);
    if (i === -1) ids.push(id); else ids.splice(i, 1);
    write(KEY.wish, ids);
    document.dispatchEvent(new CustomEvent('wishchange'));
    return i === -1;
  }
};

/* --------------------------------------------------- owned plants (the calendar) */

/** Every tracked plant: { uid, id, pot, boughtOn: 'YYYY-MM-DD', lastWatered } */
const owned = {
  get all () { return read(KEY.plants, []); },

  add (productId, boughtOn, pot = null) {
    const list = this.all;
    list.push({
      uid: `${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      id: productId,
      pot,
      boughtOn,
      lastWatered: null,
      doneTasks: []
    });
    write(KEY.plants, list);
    document.dispatchEvent(new CustomEvent('plantschange'));
  },

  remove (uid) {
    write(KEY.plants, this.all.filter(p => p.uid !== uid));
    document.dispatchEvent(new CustomEvent('plantschange'));
  },

  update (uid, patch) {
    const list = this.all.map(p => (p.uid === uid ? { ...p, ...patch } : p));
    write(KEY.plants, list);
    document.dispatchEvent(new CustomEvent('plantschange'));
  }
};

/* --------------------------------------------------------------------- user */

const getUser = () => read(KEY.user, null);
const setUser = u => { write(KEY.user, u); document.dispatchEvent(new CustomEvent('userchange')); };
const signOut = () => { localStorage.removeItem(KEY.user); document.dispatchEvent(new CustomEvent('userchange')); };

/* -------------------------------------------------------------------- theme */

function applyTheme (theme = read(KEY.theme, null)) {
  const chosen = theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = chosen;
  write(KEY.theme, chosen);
}

/* ------------------------------------------------------------------- header */

/** Wire up the shared header: theme, language, cart drawer, account state. */
function initChrome () {
  applyTheme();
  applyLanguage();

  /* Sticky header condenses once the page has scrolled. */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.querySelector('[data-action="theme"]')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  document.querySelector('[data-action="lang"]')?.addEventListener('click', () => {
    applyLanguage(getLang() === 'ar' ? 'en' : 'ar');
  });

  /* Cart drawer, if this page has one. */
  const drawer = document.querySelector('.drawer');
  if (drawer) {
    const open = () => {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      drawer.querySelector('.drawer__close')?.focus();
    };
    const close = () => {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    };
    document.querySelector('[data-action="cart"]')?.addEventListener('click', open);
    drawer.querySelector('.drawer__close')?.addEventListener('click', close);
    drawer.querySelector('.drawer__scrim')?.addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('cart:open', open);
    document.addEventListener('cart:close', close);
  }

  const refresh = () => {
    const badge = document.querySelector('[data-cart-count]');
    if (badge) {
      badge.textContent = cart.count;
      badge.hidden = cart.count === 0;
    }
    const wb = document.querySelector('[data-wish-count]');
    if (wb) {
      wb.textContent = wishlist.ids.length;
      wb.hidden = wishlist.ids.length === 0;
    }
    const acct = document.querySelector('[data-account]');
    const user = getUser();
    if (acct) {
      acct.textContent = user ? user.name.split(' ')[0] : t('nav.signin');
      acct.setAttribute('href', user ? 'calendar.html' : 'login.html');
    }
  };

  document.addEventListener('cartchange', refresh);
  document.addEventListener('wishchange', refresh);
  document.addEventListener('userchange', refresh);
  document.addEventListener('languagechange', refresh);
  refresh();

  revealOnScroll();
}

/** Fade sections in as they enter the viewport. */
function revealOnScroll (selector = '[data-reveal]') {
  const nodes = document.querySelectorAll(selector);
  if (!nodes.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(n => n.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  nodes.forEach(n => io.observe(n));
}

/* ----------------------------------------------------------------- utilities */

/** Wait `ms` after the last call before running — used by the search box. */
function debounce (fn, ms = 250) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}

/** 'YYYY-MM-DD' for a Date, in local time (not UTC — that shifts the day). */
function isoDate (d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const parseDate = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Whole days from `a` to `b`. Both are copied first so callers keep their dates. */
function daysBetween (a, b) {
  const noon = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
  return Math.round((noon(b) - noon(a)) / 86400000);
}
