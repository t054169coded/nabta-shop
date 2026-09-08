/* shop.js — builds one full-width section per plant, runs the grow interaction,
   and drives the filter bar and the cart drawer. */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

let PRODUCTS = [];
const state = { q: '', light: 'any', size: 'any', care: 'any', pet: false, max: 40, sort: 'featured' };

/* ------------------------------------------------------------------ start-up */

document.addEventListener('DOMContentLoaded', async () => {
  initChrome();
  const list = document.querySelector('#products');
  if (!list) return;

  showSkeletons(list, 3);
  PRODUCTS = await loadProducts();

  readStateFromUrl();
  syncControls();
  renderHero();
  renderProducts(list);
  wireFilters(list);
  applyFilters(list);

  document.addEventListener('cartchange', renderDrawer);
  document.addEventListener('languagechange', () => {
    renderHero();
    renderProducts(list);
    applyFilters(list);
    renderDrawer();
  });
  renderDrawer();
  wireCheckout();
});

function showSkeletons (host, n) {
  host.innerHTML = Array.from({ length: n }, () => `
    <div class="product product--skeleton">
      <div class="sk sk--stage"></div>
      <div class="product__info">
        <div class="sk sk--line" style="width:38%"></div>
        <div class="sk sk--line" style="width:70%;height:2.2rem"></div>
        <div class="sk sk--line" style="width:90%"></div>
        <div class="sk sk--line" style="width:80%"></div>
      </div>
    </div>`).join('');
}

/* --------------------------------------------------------------- hero demo */

/* The hero shows the interaction once by itself, so nobody has to guess that
   the plants are hoverable. After that it behaves like any other stage. */
function renderHero () {
  const host = document.querySelector('#hero-stage');
  if (!host) return;
  const p = PRODUCTS.find(x => x.id === 'monstera-deliciosa') ?? PRODUCTS[0];

  host.innerHTML = `
    <div class="stage" tabindex="0" role="button" aria-label="${pName(p)} — ${t('card.hint')}">
      ${buildStage(p, 'hero')}
      <p class="stage__hint"><span>${t('hero.hint')}</span></p>
    </div>`;

  const stage = host.querySelector('.stage');
  let pinned = false;
  stage.addEventListener('mouseenter', () => stage.classList.add('is-grown'));
  stage.addEventListener('mouseleave', () => { if (!pinned) stage.classList.remove('is-grown'); });
  stage.addEventListener('focus', () => stage.classList.add('is-grown'));
  stage.addEventListener('blur', () => { if (!pinned) stage.classList.remove('is-grown'); });
  stage.addEventListener('click', () => {
    pinned = !pinned;
    stage.classList.toggle('is-grown', pinned);
  });

  if (!REDUCED.matches) {
    setTimeout(() => stage.classList.add('is-grown'), 1100);
    setTimeout(() => { if (!pinned && !stage.matches(':hover')) stage.classList.remove('is-grown'); }, 4200);
  }
}

/* ------------------------------------------------------------ render products */

function renderProducts (host) {
  host.innerHTML = PRODUCTS.map(sectionHTML).join('');
  PRODUCTS.forEach(p => wireProduct(host.querySelector(`[data-id="${p.id}"]`), p));
  revealOnScroll('[data-reveal]');
}

function sectionHTML (p) {
  const badges = [
    `<span class="badge badge--light">${t(`badge.light.${p.light}`)}</span>`,
    `<span class="badge badge--care badge--${p.difficulty}">${t(`badge.care.${p.difficulty}`)}</span>`,
    `<span class="badge">${t('badge.water', { d: p.wateringDays })}</span>`,
    `<span class="badge ${p.petSafe ? 'badge--pet' : 'badge--nopet'}">${p.petSafe ? t('badge.petSafe') : t('badge.petUnsafe')}</span>`
  ].join('');

  const pots = p.potSizes.map((s, i) => `
    <label class="pot">
      <input type="radio" name="pot-${p.id}" value="${s.label}" ${i === 0 ? 'checked' : ''}>
      <span>${s.label}</span>
    </label>`).join('');

  const care = pCare(p).map(c => `<li>${c}</li>`).join('');
  const years = t('card.growTime', { y: p.growYears });

  return `
<article class="product" data-id="${p.id}" data-reveal>

  <div class="product__visual">
    <div class="stage" data-stage tabindex="0" role="button"
         aria-pressed="false" aria-label="${pName(p)} — ${t('card.hint')}">
      ${buildStage(p, p.id)}
      <img class="stage__photo" data-photo alt="" hidden>
      <div class="stage__hud">
        <div class="hud-chip">
          <span>${t('card.today')}</span>
          <b>${p.heightNow} cm</b>
        </div>
        <div class="hud-chip hud-chip--grown" data-grown-chip>
          <span>${t('card.grown')}</span>
          <b data-height>${p.heightNow} cm</b>
        </div>
      </div>
      <p class="stage__scale">${t('card.scale')}</p>
      <p class="stage__hint" data-hint>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M6 3v11m0 0 3-3m-3 3-3-3" stroke="currentColor" stroke-width="2"
                fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="16" cy="14" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        <span data-hint-text>${t('card.hint')}</span>
      </p>
    </div>

    <div class="visual-actions">
      <button class="btn btn--ghost btn--sm" data-action="grow">${t('card.grow')}</button>
      <button class="btn btn--ghost btn--sm" data-action="photo" hidden>${t('card.photo')}</button>
    </div>
  </div>

  <div class="product__info">
    <p class="product__index">${p.index} <span aria-hidden="true">·</span> <i>${p.latinName}</i></p>
    <h2 class="product__name">${pName(p)}</h2>
    <p class="product__price" data-price>${money(p.price)}</p>
    <div class="badges">${badges}</div>
    <p class="product__body">${pDesc(p)}</p>

    <div class="growth">
      <div class="growth__row">
        <div class="growth__cell">
          <span>${t('card.today')}</span>
          <strong>${p.heightNow} cm</strong>
        </div>
        <svg class="growth__arrow" viewBox="0 0 40 12" aria-hidden="true">
          <path d="M0 6h32m0 0-6-5m6 5-6 5" stroke="currentColor" stroke-width="1.5"
                fill="none" stroke-linecap="round"/>
        </svg>
        <div class="growth__cell growth__cell--big">
          <span>${t('card.grown')}</span>
          <strong>${p.heightMature} cm</strong>
        </div>
      </div>
      <p class="growth__years">${years}</p>
    </div>

    <fieldset class="pots">
      <legend>${t('card.potSize')}</legend>
      ${pots}
    </fieldset>

    <div class="product__buy">
      <button class="btn btn--primary" data-action="add">${t('card.add')}</button>
      <button class="btn btn--icon" data-action="wish"
              aria-label="${t('card.wish')}" aria-pressed="${wishlist.has(p.id)}">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 20s-7-4.6-7-9.4A4 4 0 0 1 12 7a4 4 0 0 1 7 3.6C19 15.4 12 20 12 20Z"
                stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <details class="care">
      <summary>${t('card.careTitle')}</summary>
      <ul>${care}</ul>
    </details>
  </div>
</article>`;
}

/* ------------------------------------------------- the grow interaction ✨ */

function wireProduct (root, p) {
  if (!root) return;
  const stage = root.querySelector('[data-stage]');
  const heightEl = root.querySelector('[data-height]');
  const hintText = root.querySelector('[data-hint-text]');
  const growBtn = root.querySelector('[data-action="grow"]');
  const photoBtn = root.querySelector('[data-action="photo"]');
  const photo = root.querySelector('[data-photo]');
  const priceEl = root.querySelector('[data-price]');

  let pinned = false;
  let rafId = null;

  /** Count the height readout from one value to another. */
  function countTo (to) {
    cancelAnimationFrame(rafId);
    const from = parseInt(heightEl.textContent, 10) || p.heightNow;
    if (REDUCED.matches) { heightEl.textContent = `${to} cm`; return; }
    const t0 = performance.now();
    const dur = 900;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      heightEl.textContent = `${Math.round(from + (to - from) * eased)} cm`;
      if (k < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function grow () {
    stage.classList.add('is-grown');
    countTo(p.heightMature);
    growBtn.textContent = t('card.shrink');
  }

  function shrink () {
    stage.classList.remove('is-grown');
    countTo(p.heightNow);
    growBtn.textContent = t('card.grow');
  }

  /* Hover on a laptop is the main way in. */
  stage.addEventListener('mouseenter', () => { if (!pinned) grow(); });
  stage.addEventListener('mouseleave', () => { if (!pinned) shrink(); });

  /* Keyboard focus does exactly what hover does. */
  stage.addEventListener('focus', () => { if (!pinned) grow(); });
  stage.addEventListener('blur', () => { if (!pinned) shrink(); });

  /* Tap / click pins the grown state so it stays open on a touchscreen. */
  const togglePin = () => {
    pinned = !pinned;
    stage.classList.toggle('is-pinned', pinned);
    stage.setAttribute('aria-pressed', String(pinned));
    if (pinned) { grow(); hintText.textContent = t('card.pinned'); }
    else { shrink(); hintText.textContent = t('card.hint'); }
  };

  stage.addEventListener('click', togglePin);
  stage.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin(); }
  });
  growBtn.addEventListener('click', e => { e.stopPropagation(); togglePin(); });

  /* The photo swap only appears for products whose record says a real
     photograph has been added to images/ — see the README. */
  if (p.hasPhoto) {
    photoBtn.hidden = false;
    photo.src = p.photo;
  }

  photoBtn.addEventListener('click', () => {
    const showing = !photo.hidden;
    photo.hidden = showing;
    photo.alt = showing ? '' : `${pName(p)} photographed in a bright room`;
    photoBtn.textContent = showing ? t('card.photo') : t('card.illustration');
    photoBtn.setAttribute('aria-pressed', String(!showing));
  });

  /* Pot size changes the price. */
  root.querySelectorAll(`input[name="pot-${p.id}"]`).forEach(radio => {
    radio.addEventListener('change', () => {
      priceEl.textContent = money(priceFor(p, radio.value));
    });
  });

  root.querySelector('[data-action="add"]').addEventListener('click', () => {
    const pot = root.querySelector(`input[name="pot-${p.id}"]:checked`).value;
    cart.add(p.id, pot);
    toast(`${pName(p)} — ${t('cart.added')}`);
  });

  const wishBtn = root.querySelector('[data-action="wish"]');
  wishBtn.addEventListener('click', () => {
    const on = wishlist.toggle(p.id);
    wishBtn.setAttribute('aria-pressed', String(on));
    if (on) toast(t('cart.wished'));
  });
}

/* ------------------------------------------------------------------- filters */

function wireFilters (list) {
  const bar = document.querySelector('.filters');
  if (!bar) return;

  const q = bar.querySelector('#f-search');
  q.addEventListener('input', debounce(() => {
    state.q = q.value.trim().toLowerCase();
    applyFilters(list);
  }, 250));

  bar.querySelector('#f-light').addEventListener('change', e => { state.light = e.target.value; applyFilters(list); });
  bar.querySelector('#f-size').addEventListener('change', e => { state.size = e.target.value; applyFilters(list); });
  bar.querySelector('#f-care').addEventListener('change', e => { state.care = e.target.value; applyFilters(list); });
  bar.querySelector('#f-pet').addEventListener('change', e => { state.pet = e.target.checked; applyFilters(list); });
  bar.querySelector('#f-sort').addEventListener('change', e => { state.sort = e.target.value; applyFilters(list); });

  const price = bar.querySelector('#f-price');
  const priceOut = bar.querySelector('#f-price-out');
  price.addEventListener('input', () => {
    state.max = Number(price.value);
    priceOut.textContent = money(state.max);
    applyFilters(list);
  });

  document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    Object.assign(state, { q: '', light: 'any', size: 'any', care: 'any', pet: false, max: 40, sort: 'featured' });
    syncControls();
    applyFilters(list);
  });

  /* Removable chips above the grid. */
  document.querySelector('#chips').addEventListener('click', e => {
    const key = e.target.closest('[data-chip]')?.dataset.chip;
    if (!key) return;
    if (key === 'q') state.q = '';
    else if (key === 'pet') state.pet = false;
    else if (key === 'max') state.max = 40;
    else state[key] = 'any';
    syncControls();
    applyFilters(list);
  });
}

function syncControls () {
  const bar = document.querySelector('.filters');
  if (!bar) return;
  bar.querySelector('#f-search').value = state.q;
  bar.querySelector('#f-light').value = state.light;
  bar.querySelector('#f-size').value = state.size;
  bar.querySelector('#f-care').value = state.care;
  bar.querySelector('#f-pet').checked = state.pet;
  bar.querySelector('#f-sort').value = state.sort;
  bar.querySelector('#f-price').value = state.max;
  bar.querySelector('#f-price-out').textContent = money(state.max);
}

function matches (p) {
  const hay = `${p.name} ${p.nameAr} ${p.latinName}`.toLowerCase();
  if (state.q && !hay.includes(state.q)) return false;
  if (state.light !== 'any' && p.light !== state.light) return false;
  if (state.care !== 'any' && p.difficulty !== state.care) return false;
  if (state.pet && !p.petSafe) return false;
  if (p.price > state.max) return false;
  if (state.size === 's' && p.heightMature >= 100) return false;
  if (state.size === 'm' && (p.heightMature < 100 || p.heightMature > 200)) return false;
  if (state.size === 'l' && p.heightMature <= 200) return false;
  return true;
}

const SORTERS = {
  featured: (a, b) => a.index.localeCompare(b.index),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  name: (a, b) => pName(a).localeCompare(pName(b)),
  height: (a, b) => b.heightMature - a.heightMature
};

function applyFilters (list) {
  const kept = PRODUCTS.filter(matches).sort(SORTERS[state.sort]);
  const keptIds = new Set(kept.map(p => p.id));

  /* Reorder the sections in place, then hide the ones that no longer match. */
  kept.forEach(p => list.append(list.querySelector(`[data-id="${p.id}"]`)));
  list.querySelectorAll('.product').forEach(el => {
    el.hidden = !keptIds.has(el.dataset.id);
  });

  document.querySelector('#count').textContent =
    t('filters.showing', { n: kept.length, total: PRODUCTS.length });
  document.querySelector('#empty').hidden = kept.length > 0;

  renderChips();
  writeStateToUrl();
}

function renderChips () {
  const host = document.querySelector('#chips');
  const chips = [];
  const chip = (key, label) =>
    `<button class="chip" data-chip="${key}">${label}
       <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
         <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.8"/>
       </svg></button>`;

  if (state.q) chips.push(chip('q', `“${state.q}”`));
  if (state.light !== 'any') chips.push(chip('light', t(`filters.light${cap(state.light)}`)));
  if (state.size !== 'any') chips.push(chip('size', t(`filters.size${state.size.toUpperCase()}`)));
  if (state.care !== 'any') chips.push(chip('care', t(`badge.care.${state.care}`)));
  if (state.pet) chips.push(chip('pet', t('filters.petSafe')));
  if (state.max < 40) chips.push(chip('max', `≤ ${money(state.max)}`));

  host.innerHTML = chips.join('');
  host.hidden = chips.length === 0;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* Filter state lives in the URL so a filtered view can be shared or reloaded. */
function writeStateToUrl () {
  const u = new URLSearchParams();
  if (state.q) u.set('q', state.q);
  if (state.light !== 'any') u.set('light', state.light);
  if (state.size !== 'any') u.set('size', state.size);
  if (state.care !== 'any') u.set('care', state.care);
  if (state.pet) u.set('pet', '1');
  if (state.max < 40) u.set('max', state.max);
  if (state.sort !== 'featured') u.set('sort', state.sort);
  const qs = u.toString();
  history.replaceState(null, '', qs ? `?${qs}${location.hash}` : location.pathname + location.hash);
}

function readStateFromUrl () {
  const u = new URLSearchParams(location.search);
  state.q = (u.get('q') ?? '').toLowerCase();
  state.light = u.get('light') ?? 'any';
  state.size = u.get('size') ?? 'any';
  state.care = u.get('care') ?? 'any';
  state.pet = u.get('pet') === '1';
  state.max = Number(u.get('max') ?? 40);
  state.sort = u.get('sort') ?? 'featured';
}

/* --------------------------------------------------------------- cart drawer */

function renderDrawer () {
  const body = document.querySelector('#cart-body');
  if (!body || !PRODUCTS.length) return;
  const { subtotal, delivery, total } = cart.totals(PRODUCTS);

  if (!cart.items.length) {
    body.innerHTML = `
      <div class="drawer__empty">
        <p>${t('cart.empty')}</p>
        <a class="btn btn--ghost" href="index.html#products">${t('cart.emptyCta')}</a>
      </div>`;
    document.querySelector('#cart-foot').hidden = true;
    return;
  }

  body.innerHTML = cart.items.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="line" data-line="${p.id}|${item.pot}">
        <div class="line__thumb" aria-hidden="true">${miniLeaf(p)}</div>
        <div class="line__main">
          <p class="line__name">${pName(p)}</p>
          <p class="line__meta">${t('card.potSize')}: ${item.pot}</p>
          <div class="qty">
            <button data-q="-1" aria-label="−">−</button>
            <span>${item.qty}</span>
            <button data-q="1" aria-label="+">+</button>
          </div>
        </div>
        <div class="line__end">
          <p class="line__price">${money(priceFor(p, item.pot) * item.qty)}</p>
          <button class="line__remove" data-remove>${t('cart.remove')}</button>
        </div>
      </div>`;
  }).join('');

  const foot = document.querySelector('#cart-foot');
  foot.hidden = false;
  const away = Math.max(0, 20 - subtotal);
  foot.querySelector('#cart-progress').innerHTML = away > 0
    ? `<div class="bar"><i style="inline-size:${Math.min(100, (subtotal / 20) * 100)}%"></i></div>
       <p>${t('cart.away', { n: away.toFixed(3) })}</p>`
    : `<p class="ok">${t('cart.freeMsg')}</p>`;
  foot.querySelector('#cart-sub').textContent = money(subtotal);
  foot.querySelector('#cart-ship').textContent = delivery === 0 ? t('cart.free') : money(delivery);
  foot.querySelector('#cart-total').textContent = money(total);

  body.querySelectorAll('.line').forEach(line => {
    const [id, pot] = line.dataset.line.split('|');
    const item = cart.items.find(i => i.id === id && i.pot === pot);
    line.querySelectorAll('[data-q]').forEach(b => {
      b.addEventListener('click', () => cart.setQty(id, pot, item.qty + Number(b.dataset.q)));
    });
    line.querySelector('[data-remove]').addEventListener('click', () => {
      cart.remove(id, pot);
      toast(t('cart.removed'));
    });
  });
}

/** Small decorative leaf for cart rows, tinted per plant. */
function miniLeaf (p) {
  const tint = p.art === 'rubberPlant' ? 'var(--pink-1)' : p.art === 'oliveTree' ? 'var(--olive-1)' : 'var(--leaf-1)';
  return `<svg viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="20" fill="var(--sand-2)"/>
    <path d="M20 33 C 8 26 8 12 20 7 C 32 12 32 26 20 33 Z" fill="${tint}"/>
    <path d="M20 33 L20 10" stroke="var(--card)" stroke-width="1.4" opacity=".6"/>
  </svg>`;
}

/* Placing an order is what starts each plant's watering schedule. */
function wireCheckout () {
  document.querySelector('[data-action="checkout"]')?.addEventListener('click', () => {
    if (!cart.items.length) return;
    const today = isoDate(new Date());
    cart.items.forEach(item => {
      for (let i = 0; i < item.qty; i++) owned.add(item.id, today, item.pot);
    });
    cart.clear();
    document.dispatchEvent(new Event('cart:close'));
    toast(t('cart.ordered'));
    setTimeout(() => { location.href = 'calendar.html'; }, 900);
  });
}
