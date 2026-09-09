/* confirmation.js — renders one placed order.
   Reads the order id from the query string, so the page can be reloaded or
   bookmarked and still show the right receipt. */

document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  render();
  document.addEventListener('languagechange', render);
});

function render () {
  const id = new URLSearchParams(location.search).get('order');
  const order = id ? orders.find(id) : orders.all[0] ?? null;

  document.querySelector('#cf-missing').hidden = Boolean(order);
  document.querySelector('#cf-body').hidden = !order;
  if (!order) return;

  const lang = getLang();

  document.querySelector('#cf-title').textContent =
    t('cf.title', { no: `NB-${order.orderNo}` });
  document.querySelector('#cf-sub').textContent = t('cf.subtitle');

  document.querySelector('#cf-lines').innerHTML = order.items.map(item => `
    <div class="co-line">
      <div class="co-line__main">
        <p class="co-line__name">${lang === 'ar' ? item.nameAr : item.name}</p>
        <p class="co-line__meta">${t('card.potSize')}: ${item.pot} · ×${item.qty}</p>
      </div>
      <p class="co-line__price">${money(item.unitPrice * item.qty)}</p>
    </div>`).join('');

  document.querySelector('#cf-sub-amt').textContent = money(order.subtotal);
  document.querySelector('#cf-ship').textContent =
    order.delivery === 0 ? t('cart.free') : money(order.delivery);
  document.querySelector('#cf-total').textContent = money(order.total);

  const a = order.address;
  document.querySelector('#cf-name-l').textContent = t('co.name');
  document.querySelector('#cf-name').textContent = a.name;
  document.querySelector('#cf-phone').textContent = `+965 ${a.phone}`;
  document.querySelector('#cf-address').textContent = formatAddress(a);

  const notes = document.querySelector('#cf-notes');
  notes.textContent = a.notes ? `“${a.notes}”` : '';
  notes.hidden = !a.notes;

  document.querySelector('#cf-pay').textContent = paymentLabel(order.paymentMethod);
  document.querySelector('#cf-eta').textContent =
    order.country === 'Kuwait' ? t('cf.etaKw') : t('cf.etaGcc');

  /* Date in the reader's own language, without pulling in a date library. */
  const placed = new Date(order.placedAt);
  document.querySelector('#cf-when').textContent =
    `${placed.getDate()} ${t(`month.${placed.getMonth()}`)} ${placed.getFullYear()}`;
}
