/* auth.js — the sign-in page.
   DEMO ONLY. Nothing leaves the browser, nothing is encrypted, and no real
   password should ever be typed here. Real authentication has to happen on a
   server; this page exists to show form validation and country-aware delivery. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const COUNTRIES = [
  'Kuwait', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Oman',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada',
  'Cape Verde', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia',
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Pakistan', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia', 'Rwanda', 'Samoa',
  'San Marino', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
  'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago',
  'Tunisia', 'Türkiye', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe'
];

document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  drawAside();
  fillCountries();
  wireTabs();
  wireForm();
  showSignedInState();
  document.addEventListener('languagechange', () => { validateAll(true); showSignedInState(); });
});

/* The plant standing beside the form uses the same studio as the shop. */
async function drawAside () {
  const products = await loadProducts();
  const p = products.find(x => x.id === 'bird-of-paradise') ?? products[0];
  if (!p) return;
  document.querySelector('#auth-aside')
    .insertAdjacentHTML('afterbegin', `<div class="stage is-grown">${buildStage(p, 'aside')}</div>`);
}

/* --------------------------------------------------------------- the country list */

function fillCountries () {
  const list = document.querySelector('#country-list');
  list.innerHTML = COUNTRIES.map(c => `<option value="${c}"></option>`).join('');
}

/* ------------------------------------------------------------------- tabs */

function wireTabs () {
  const tabs = document.querySelectorAll('[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.tab;
      tabs.forEach(x => {
        const on = x === tab;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-selected', String(on));
      });
      document.querySelector('.auth').dataset.mode = mode;
      document.querySelector('#submit').textContent =
        mode === 'up' ? t('login.submitUp') : t('login.submitIn');
      clearErrors();
    });
  });
}

/* ---------------------------------------------------------------- validation */

const fields = () => ({
  name: document.querySelector('#name'),
  email: document.querySelector('#email'),
  country: document.querySelector('#country'),
  password: document.querySelector('#password')
});

function setError (input, message) {
  const wrap = input.closest('.field');
  const msg = wrap.querySelector('.field__error');
  const bad = Boolean(message);
  wrap.classList.toggle('is-invalid', bad);
  input.setAttribute('aria-invalid', String(bad));
  msg.textContent = message ?? '';
  return !bad;
}

function clearErrors () {
  document.querySelectorAll('.field').forEach(f => {
    f.classList.remove('is-invalid');
    f.querySelector('.field__error').textContent = '';
  });
}

const isSignUp = () => document.querySelector('.auth').dataset.mode === 'up';

function validateName (f) {
  if (!isSignUp()) return setError(f.name, null);
  return setError(f.name, f.name.value.trim().length < 2 ? t('login.err.name') : null);
}
const validateEmail = f => setError(f.email, EMAIL_RE.test(f.email.value.trim()) ? null : t('login.err.email'));
const validateCountry = f => setError(f.country, COUNTRIES.includes(f.country.value.trim()) ? null : t('login.err.country'));
const validatePassword = f => setError(f.password, f.password.value.length >= 8 ? null : t('login.err.password'));

function validateAll (silent = false) {
  const f = fields();
  const results = [validateName(f), validateEmail(f), validateCountry(f), validatePassword(f)];
  if (silent) clearErrorsIfEmpty(f);
  return results.every(Boolean);
}

/** Do not shout at fields the visitor has not touched yet. */
function clearErrorsIfEmpty (f) {
  Object.values(f).forEach(input => {
    if (!input.value) setError(input, null);
  });
}

/* -------------------------------------------------------------------- form */

function wireForm () {
  const f = fields();
  const form = document.querySelector('#auth-form');

  /* Validate on blur, then keep validating as they fix it. */
  f.name.addEventListener('blur', () => validateName(f));
  f.email.addEventListener('blur', () => validateEmail(f));
  f.country.addEventListener('blur', () => validateCountry(f));
  f.password.addEventListener('blur', () => validatePassword(f));
  f.email.addEventListener('input', () => { if (f.email.closest('.field').classList.contains('is-invalid')) validateEmail(f); });

  /* Country drives the delivery note. */
  f.country.addEventListener('input', () => {
    const c = f.country.value.trim();
    const note = document.querySelector('#ship-note');
    if (c === 'Kuwait') note.textContent = t('login.ship.kw');
    else if (GCC.includes(c)) note.textContent = t('login.ship.gcc');
    else if (COUNTRIES.includes(c)) note.textContent = t('login.ship.no');
    else note.textContent = '';
    note.hidden = !note.textContent;
    if (COUNTRIES.includes(c)) validateCountry(f);
  });

  /* Show / hide the password. */
  const eye = document.querySelector('#toggle-pw');
  eye.addEventListener('click', () => {
    const hidden = f.password.type === 'password';
    f.password.type = hidden ? 'text' : 'password';
    eye.setAttribute('aria-label', hidden ? t('login.hide') : t('login.show'));
    eye.classList.toggle('is-on', hidden);
  });

  /* Strength meter. */
  f.password.addEventListener('input', () => {
    const score = strength(f.password.value);
    const meter = document.querySelector('#pw-meter');
    meter.dataset.score = score;
    document.querySelector('#pw-label').textContent = f.password.value
      ? t(`login.strength.${['weak', 'weak', 'fair', 'strong'][score]}`)
      : '';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateAll()) {
      form.querySelector('.is-invalid input')?.focus();
      return;
    }
    const name = isSignUp() ? f.name.value.trim() : (f.email.value.split('@')[0] || 'Friend');
    setUser({
      name,
      email: f.email.value.trim(),
      country: f.country.value.trim(),
      remember: document.querySelector('#remember').checked
    });
    toast(t('login.welcome', { name }));
    setTimeout(() => { location.href = 'calendar.html'; }, 800);
  });
}

/** 0–3, from length plus variety of character classes. */
function strength (pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^\w\s]/.test(pw)) s++;
  return Math.min(3, Math.max(1, s - 1));
}

/* ------------------------------------------------------- already signed in? */

function showSignedInState () {
  const user = getUser();
  const box = document.querySelector('#signed-in');
  if (!user) { box.hidden = true; return; }
  box.hidden = false;
  box.querySelector('p').textContent = t('login.welcome', { name: user.name });
  box.querySelector('button').textContent = t('login.signout');
  box.querySelector('button').onclick = () => {
    signOut();
    applyLanguage();
    showSignedInState();
  };
}
