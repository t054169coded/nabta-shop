/* checkout.js — delivery details, payment method, and placing the order.
   No card number is ever asked for or stored. The two selectable payment
   methods are both paid at the door, which is why they work without a payment
   provider; the online option is shown but disabled on purpose. */

/* Kuwait's six governorates. An address here is governorate → area → block →
   street → building, which is why the form asks for those and not a postcode. */
const GOVERNORATES = [
  { value: 'Al Asimah',         en: 'Al Asimah (Capital)', ar: 'العاصمة' },
  { value: 'Hawalli',           en: 'Hawalli',             ar: 'حولي' },
  { value: 'Farwaniya',         en: 'Farwaniya',           ar: 'الفروانية' },
  { value: 'Mubarak Al-Kabeer', en: 'Mubarak Al-Kabeer',   ar: 'مبارك الكبير' },
  { value: 'Ahmadi',            en: 'Ahmadi',              ar: 'الأحمدي' },
  { value: 'Jahra',             en: 'Jahra',               ar: 'الجهراء' }
];

/* Kuwaiti mobile numbers: 8 digits beginning 5, 6 or 9. */
const PHONE_RE = /^[569]\d{7}$/;

const PAY_LABELS = {
  cash_on_delivery: 'co.payCash',
  knet_on_delivery: 'co.payKnet'
};

let PRODUCTS = [];

document.addEventListener('DOMContentLoaded', async () => {
  /* The confirmation page loads this file only for paymentLabel() and
     formatAddress(), so bail out before touching the checkout form or
     wiring the header a second time. */
  if (!document.querySelector('#checkout-form')) return;

  initChrome();
  PRODUCTS = await loadProducts();

  fillGovernorates();
  prefillFromProfile();

  if (!cart.items.length) {
    document.querySelector('#co-empty').hidden = false;
    return;
  }
  document.querySelector('#co-grid').hidden = false;

  renderSummary();
  wireValidation();
  wireSubmit();

  document.addEventListener('languagechange', () => {
    fillGovernorates();
    renderSummary();
  });
});

/* ------------------------------------------------------------------ summary */

function renderSummary () {
  const { subtotal, delivery, total } = cart.totals(PRODUCTS);

  document.querySelector('#co-lines').innerHTML = cart.items.map(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="co-line">
        <div class="co-line__main">
          <p class="co-line__name">${pName(p)}</p>
          <p class="co-line__meta">${t('card.potSize')}: ${item.pot} · ×${item.qty}</p>
        </div>
        <p class="co-line__price">${money(priceFor(p, item.pot) * item.qty)}</p>
      </div>`;
  }).join('');

  const away = Math.max(0, 20 - subtotal);
  document.querySelector('#co-progress').innerHTML = away > 0
    ? `<div class="bar"><i style="inline-size:${Math.min(100, (subtotal / 20) * 100)}%"></i></div>
       <p class="muted co-away">${t('cart.away', { n: away.toFixed(3) })}</p>`
    : `<p class="ok co-away">${t('cart.freeMsg')}</p>`;

  document.querySelector('#co-sub').textContent = money(subtotal);
  document.querySelector('#co-ship').textContent = delivery === 0 ? t('cart.free') : money(delivery);
  document.querySelector('#co-total').textContent = money(total);
}

/* -------------------------------------------------------------------- form */

function fillGovernorates () {
  const lang = getLang();
  const select = document.querySelector('#co-gov');
  const chosen = select.value;
  select.innerHTML = `<option value="">${t('co.govPick')}</option>` +
    GOVERNORATES.map(g => `<option value="${g.value}">${lang === 'ar' ? g.ar : g.en}</option>`).join('');
  select.value = chosen;
}

/** Save the shopper re-typing what the sign-in page already knows. */
function prefillFromProfile () {
  const user = getUser();
  if (user?.name) document.querySelector('#co-name').value = user.name;
}

const FIELDS = [
  ['#co-name',     v => v.trim().length >= 2,        'co.err.name'],
  ['#co-phone',    v => PHONE_RE.test(v.trim()),     'co.err.phone'],
  ['#co-gov',      v => v !== '',                    'co.err.gov'],
  ['#co-area',     v => v.trim() !== '',             'co.err.area'],
  ['#co-block',    v => v.trim() !== '',             'co.err.block'],
  ['#co-street',   v => v.trim() !== '',             'co.err.street'],
  ['#co-building', v => v.trim() !== '',             'co.err.building']
];

function setError (input, message) {
  const wrap = input.closest('.field');
  wrap.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  wrap.querySelector('.field__error').textContent = message ?? '';
  return !message;
}

function checkField ([selector, isValid, errorKey]) {
  const input = document.querySelector(selector);
  return setError(input, isValid(input.value) ? null : t(errorKey));
}

function wireValidation () {
  FIELDS.forEach(field => {
    const input = document.querySelector(field[0]);
    /* Complain on blur, then keep re-checking while they fix it. */
    input.addEventListener('blur', () => { if (input.value !== '') checkField(field); });
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('is-invalid')) checkField(field);
    });
  });

  /* Phone box takes digits only, so a pasted +965 or spaces do not fail silently. */
  const phone = document.querySelector('#co-phone');
  phone.addEventListener('input', () => {
    phone.value = phone.value.replace(/\D/g, '').slice(0, 8);
  });

  document.querySelector('#pay-options').addEventListener('change', () => {
    document.querySelector('#pay-error').textContent = '';
  });
}

/* ------------------------------------------------------------ place the order */

function wireSubmit () {
  document.querySelector('#checkout-form').addEventListener('submit', e => {
    e.preventDefault();

    const ok = FIELDS.map(checkField).every(Boolean);
    const pay = document.querySelector('input[name="pay"]:checked');
    if (!pay) document.querySelector('#pay-error').textContent = t('co.err.pay');
    if (!ok || !pay) {
      document.querySelector('.field.is-invalid input, .field.is-invalid select')?.focus();
      return;
    }

    const { subtotal, delivery, total, country } = cart.totals(PRODUCTS);
    const val = id => document.querySelector(id).value.trim();

    /* Name and unit price are copied in here, not looked up later, so the
       receipt still reads true if the shop reprices a plant tomorrow. */
    const items = cart.items.map(item => {
      const p = PRODUCTS.find(x => x.id === item.id);
      return {
        id: item.id,
        name: p ? p.name : item.id,
        nameAr: p ? p.nameAr : item.id,
        pot: item.pot,
        qty: item.qty,
        unitPrice: p ? priceFor(p, item.pot) : 0
      };
    });

    const order = orders.place({
      items,
      subtotal,
      delivery,
      total,
      country,
      paymentMethod: pay.value,
      address: {
        name: val('#co-name'),
        phone: val('#co-phone'),
        governorate: val('#co-gov'),
        area: val('#co-area'),
        block: val('#co-block'),
        street: val('#co-street'),
        building: val('#co-building'),
        floor: val('#co-floor'),
        notes: val('#co-notes')
      }
    });

    /* The whole point of the calendar: the schedule starts on purchase day. */
    const today = isoDate(new Date());
    items.forEach(item => {
      for (let i = 0; i < item.qty; i++) owned.add(item.id, today, item.pot, order.id);
    });

    cart.clear();
    location.href = `confirmation.html?order=${encodeURIComponent(order.id)}`;
  });
}

/** Shared with the confirmation page. */
function paymentLabel (method) {
  return PAY_LABELS[method] ? t(PAY_LABELS[method]) : method;
}

/** Shared with the confirmation page: one readable line from the address parts. */
function formatAddress (a) {
  const lang = getLang();
  const gov = GOVERNORATES.find(g => g.value === a.governorate);
  const govName = gov ? (lang === 'ar' ? gov.ar : gov.en) : a.governorate;
  return [
    a.area,
    a.block && `${t('co.abbrBlock')} ${a.block}`,
    a.street && `${t('co.abbrStreet')} ${a.street}`,
    a.building && `${t('co.abbrBldg')} ${a.building}`,
    a.floor
  ].filter(Boolean).join(', ') + ` — ${govName}`;
}
