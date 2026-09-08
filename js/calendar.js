/* calendar.js — the watering calendar.
   Every schedule is counted forward from the day the plant was bought.
   In the Kuwait summer (June–August) the gap between waterings is shortened
   automatically, because plants dry out much faster in that heat. */

const SUMMER_MONTHS = [5, 6, 7];        // June, July, August (0-indexed)
const SUMMER_FACTOR = 0.7;              // 30% shorter intervals
const HORIZON_DAYS = 120;               // how far ahead we generate tasks
const TYPES = ['water', 'rotate', 'fertilise'];

let PRODUCTS = [];
let cursor = new Date();                // which month the grid is showing

document.addEventListener('DOMContentLoaded', async () => {
  initChrome();
  PRODUCTS = await loadProducts();
  fillPlantPicker();
  document.querySelector('#buy-date').value = isoDate(new Date());
  document.querySelector('#buy-date').max = isoDate(new Date());

  wireControls();
  renderAll();

  document.addEventListener('plantschange', renderAll);
  document.addEventListener('languagechange', renderAll);
});

/* ------------------------------------------------------------------ schedule */

/** The watering gap for a given date, shortened in the Kuwait summer. */
function wateringGap (product, date) {
  const base = product.wateringDays;
  return SUMMER_MONTHS.includes(date.getMonth())
    ? Math.max(3, Math.round(base * SUMMER_FACTOR))
    : base;
}

/** Has this exact task already been ticked off? */
const isDone = (plant, type, iso) =>
  (plant.doneTasks ?? []).includes(`${type}|${iso}`);

/**
 * Every task for one owned plant between two dates.
 * Watering restarts from the last time it was actually watered; rotating and
 * feeding are counted from the purchase date.
 */
function tasksFor (plant, from, to) {
  const product = PRODUCTS.find(p => p.id === plant.id);
  if (!product) return [];
  const out = [];

  const bought = parseDate(plant.boughtOn);
  const waterBase = plant.lastWatered ? parseDate(plant.lastWatered) : bought;

  /* Watering — the gap is re-evaluated at every step so a schedule that runs
     into June automatically tightens up. */
  let d = new Date(waterBase);
  for (let i = 0; i < 500; i++) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + wateringGap(product, d));
    if (d > to) break;
    if (d >= from) out.push(makeTask(plant, product, d, 'water'));
  }

  /* Rotating and feeding are simple fixed intervals from purchase day. */
  for (const [type, every] of [['rotate', product.rotateDays], ['fertilise', product.fertilizeDays]]) {
    let e = new Date(bought);
    for (let i = 0; i < 500; i++) {
      e = new Date(e.getFullYear(), e.getMonth(), e.getDate() + every);
      if (e > to) break;
      if (e >= from) out.push(makeTask(plant, product, e, type));
    }
  }
  return out;
}

function makeTask (plant, product, date, type) {
  const iso = isoDate(date);
  return { plant, product, date, iso, type, done: isDone(plant, type, iso) };
}

/** All tasks for every owned plant in a window. */
function allTasks (from, to) {
  return owned.all
    .flatMap(p => tasksFor(p, from, to))
    .sort((a, b) => a.date - b.date);
}

/* -------------------------------------------------------------------- render */

function renderAll () {
  renderPlants();
  renderMonth();
  renderUpcoming();
  const hello = document.querySelector('#cal-hello');
  const user = getUser();
  hello.textContent = user ? t('login.welcome', { name: user.name }) : '';
  hello.hidden = !user;
}

/* ---- my plants ---- */

function renderPlants () {
  const host = document.querySelector('#my-plants');
  const list = owned.all;

  if (!list.length) {
    host.innerHTML = `<div class="empty">
        <p>${t('cal.none')}</p><p class="muted">${t('cal.noneHint')}</p>
      </div>`;
    return;
  }

  const today = new Date();
  host.innerHTML = list.map(plant => {
    const product = PRODUCTS.find(p => p.id === plant.id);
    if (!product) return '';
    const days = daysBetween(parseDate(plant.boughtOn), today);
    const next = tasksFor(plant, today, addDays(today, HORIZON_DAYS))
      .filter(x => x.type === 'water')[0];
    const until = next ? daysBetween(today, next.date) : null;

    return `
      <article class="owned">
        <div class="owned__dot" style="--c:var(--ev-water)"></div>
        <div class="owned__main">
          <h3>${pName(product)}</h3>
          <p class="muted">${t('cal.owned', { d: days })}${plant.pot ? ` · ${t('cal.potLabel', { p: plant.pot })}` : ''}</p>
        </div>
        <div class="owned__next">
          ${next ? `<span class="owned__in ${until <= 0 ? 'is-due' : ''}">${
            until <= 0 ? t('cal.today') : until === 1 ? t('cal.tomorrow') : `+${until}d`
          }</span>` : ''}
          <button class="link" data-untrack="${plant.uid}">${t('cal.remove')}</button>
        </div>
      </article>`;
  }).join('');

  host.querySelectorAll('[data-untrack]').forEach(b => {
    b.addEventListener('click', () => {
      owned.remove(b.dataset.untrack);
      toast(t('cal.stopped'));
    });
  });
}

/* ---- the month grid ---- */

function renderMonth () {
  document.querySelector('#month-label').textContent =
    `${t(`month.${cursor.getMonth()}`)} ${cursor.getFullYear()}`;

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const lead = first.getDay();                       // grid starts on Sunday
  const todayIso = isoDate(new Date());

  const tasks = allTasks(first, new Date(cursor.getFullYear(), cursor.getMonth(), daysInMonth));
  const byDay = tasks.reduce((map, task) => {
    (map[task.iso] ??= []).push(task);
    return map;
  }, {});

  let cells = '';
  for (let i = 0; i < lead; i++) cells += '<div class="cell cell--pad"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    const iso = isoDate(date);
    const list = byDay[iso] ?? [];
    const summer = SUMMER_MONTHS.includes(date.getMonth());

    const dots = TYPES
      .filter(type => list.some(x => x.type === type))
      .map(type => {
        const n = list.filter(x => x.type === type).length;
        const allDone = list.filter(x => x.type === type).every(x => x.done);
        return `<span class="dot dot--${type} ${allDone ? 'is-done' : ''}"
                      title="${t(`cal.${type}`)} ×${n}"></span>`;
      }).join('');

    cells += `
      <div class="cell ${iso === todayIso ? 'is-today' : ''} ${summer ? 'is-summer' : ''}"
           ${list.length ? `tabindex="0" aria-label="${d}: ${list.length} tasks"` : ''}>
        <span class="cell__n">${d}</span>
        <div class="cell__dots">${dots}</div>
      </div>`;
  }

  document.querySelector('#grid').innerHTML = cells;
  document.querySelector('#dows').innerHTML =
    Array.from({ length: 7 }, (_, i) => `<span>${t(`day.${i}`)}</span>`).join('');
}

/* ---- next seven days ---- */

function renderUpcoming () {
  const host = document.querySelector('#upcoming');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* Look back a fortnight too, so overdue tasks cannot quietly disappear. */
  const tasks = allTasks(addDays(today, -14), addDays(today, 7))
    .filter(x => !x.done);

  if (!tasks.length) {
    host.innerHTML = `<p class="muted">${t('cal.nextNone')}</p>`;
    return;
  }

  host.innerHTML = tasks.map(task => {
    const diff = daysBetween(today, task.date);
    const when = diff < 0 ? t('cal.overdue')
      : diff === 0 ? t('cal.today')
        : diff === 1 ? t('cal.tomorrow')
          : `${t(`day.${task.date.getDay()}`)} ${task.date.getDate()}`;
    return `
      <li class="task ${diff < 0 ? 'is-overdue' : ''}">
        <span class="dot dot--${task.type}" aria-hidden="true"></span>
        <div class="task__main">
          <p class="task__name">${t(`cal.${task.type}`)} — ${pName(task.product)}</p>
          <p class="task__when">${when}</p>
        </div>
        <button class="btn btn--sm btn--ghost"
                data-done="${task.plant.uid}|${task.type}|${task.iso}">${t('cal.done')}</button>
      </li>`;
  }).join('');

  host.querySelectorAll('[data-done]').forEach(b => {
    b.addEventListener('click', () => {
      const [uid, type, iso] = b.dataset.done.split('|');
      const plant = owned.all.find(p => p.uid === uid);
      if (!plant) return;
      const doneTasks = [...(plant.doneTasks ?? []), `${type}|${iso}`];
      /* Watering resets the clock — the next one is counted from today. */
      owned.update(uid, type === 'water'
        ? { doneTasks, lastWatered: isoDate(new Date()) }
        : { doneTasks });
      toast(type === 'water' ? t('cal.watered') : t('cal.done'));
    });
  });
}

/* ------------------------------------------------------------------ controls */

function fillPlantPicker () {
  document.querySelector('#pick-plant').innerHTML =
    PRODUCTS.map(p => `<option value="${p.id}">${pName(p)}</option>`).join('');
}

function wireControls () {
  document.querySelector('[data-action="prev"]').addEventListener('click', () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    renderMonth();
  });
  document.querySelector('[data-action="next"]').addEventListener('click', () => {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    renderMonth();
  });

  document.querySelector('#add-form').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.querySelector('#pick-plant').value;
    const date = document.querySelector('#buy-date').value || isoDate(new Date());
    owned.add(id, date);
    toast(t('cal.tracking'));
  });

  document.querySelector('[data-action="export"]').addEventListener('click', exportIcs);
}

/* ------------------------------------------------------------- .ics download */

/** Build a calendar file in JavaScript and hand it to the browser. */
function exportIcs () {
  const today = new Date();
  const tasks = allTasks(today, addDays(today, 90));
  if (!tasks.length) { toast(t('cal.nextNone')); return; }

  const stamp = d => isoDate(d).replaceAll('-', '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nabta//Care Calendar//EN', 'CALSCALE:GREGORIAN'
  ];

  tasks.forEach((task, i) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:nabta-${task.plant.uid}-${task.type}-${task.iso}-${i}`,
      `DTSTAMP:${stamp(today)}T090000Z`,
      `DTSTART;VALUE=DATE:${stamp(task.date)}`,
      `SUMMARY:${t(`cal.${task.type}`)} — ${pName(task.product)}`,
      `DESCRIPTION:Nabta care schedule. Bought ${task.plant.boughtOn}.`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nabta-care-schedule.ics';
  a.click();
  URL.revokeObjectURL(url);
  toast(t('cal.exported'));
}

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
