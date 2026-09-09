/* supabase.js — the account and the database.
 *
 * HOW THIS FITS THE REST OF THE SITE
 * The pages read cart, plants and orders synchronously (`cart.items`,
 * `owned.all`). Supabase is async, so rather than rewrite every call site,
 * localStorage stays the working copy the UI reads and this file keeps it in
 * step with the database:
 *
 *   sign in / page load  ->  pull()  overwrites localStorage, then the UI
 *                            re-renders from the change events app.js fires
 *   any write()          ->  schedulePush() sends that key up, debounced
 *
 * So the site still works with no network and still works opened straight off
 * the disk — it just forgets between devices, exactly as it did before.
 *
 * The key below is the *publishable* key. It is meant to be in the browser.
 * Row Level Security is what protects the data: with this key and no session
 * you can read the plant catalogue and nothing else. The service_role key
 * must never appear here.
 */

const SUPABASE_URL = 'https://ilrkquztapeqmjtdcmxf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5HY85KAGqjomEwVlbU3LNw_GfnkkBbk';

let sb = null;              // the client, or null when unavailable
let currentSession = null;
let applyingRemote = false; // guards against a pull triggering a push

/** True when we have a usable client. False on file://, or if the CDN failed. */
const remoteAvailable = () => Boolean(sb);

/** True when somebody is signed in, so per-user tables are reachable. */
const signedIn = () => Boolean(currentSession?.user);

const remoteUserId = () => currentSession?.user?.id ?? null;

/**
 * Build the client. Returns null when it cannot work, which is not an error:
 * the file:// protocol has an opaque origin that the API rejects, and the
 * library itself comes from a CDN that may be blocked.
 */
function initRemote () {
  if (sb) return sb;
  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') return null;
  if (!location.protocol.startsWith('http')) return null;
  try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  } catch {
    sb = null;
  }
  return sb;
}

/* ------------------------------------------------------------------ catalogue */

/**
 * The catalogue from the database, reshaped into exactly the objects
 * data/products.json produces — so shop.js, plants.js and the rest need no
 * knowledge of where the data came from.
 */
async function remoteProducts () {
  if (!remoteAvailable()) return null;
  const { data, error } = await sb
    .from('products')
    .select(`id, sort_order, name, name_ar, latin_name, price, art_key, photo_path,
             has_photo, height_now_cm, height_mature_cm, grow_years, grow_years_ar,
             light, difficulty, pet_safe, in_stock, watering_days, rotate_days,
             fertilize_days, description, description_ar,
             product_pot_sizes (label, price_delta, sort_order),
             product_care_tips (position, tip, tip_ar)`)
    .order('sort_order');

  if (error || !data?.length) return null;

  return data.map(row => ({
    id: row.id,
    index: String(row.sort_order).padStart(2, '0'),
    name: row.name,
    nameAr: row.name_ar,
    latinName: row.latin_name,
    price: Number(row.price),
    art: row.art_key,
    photo: row.photo_path,
    hasPhoto: row.has_photo,
    heightNow: row.height_now_cm,
    heightMature: row.height_mature_cm,
    growYears: row.grow_years,
    growYearsAr: row.grow_years_ar,
    light: row.light,
    difficulty: row.difficulty,
    petSafe: row.pet_safe,
    inStock: row.in_stock,
    wateringDays: row.watering_days,
    rotateDays: row.rotate_days,
    fertilizeDays: row.fertilize_days,
    description: row.description,
    descriptionAr: row.description_ar,
    potSizes: [...row.product_pot_sizes]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ label: s.label, delta: Number(s.price_delta) })),
    care: [...row.product_care_tips].sort((a, b) => a.position - b.position).map(t => t.tip),
    careAr: [...row.product_care_tips].sort((a, b) => a.position - b.position).map(t => t.tip_ar)
  }));
}

/* ----------------------------------------------------------------------- auth */

/** Email and password go straight to Supabase Auth. No table here sees them. */
async function remoteSignUp ({ name, email, country, password, language }) {
  if (!remoteAvailable()) return { ok: false, reason: 'offline' };
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    // The on_auth_user_created trigger reads these to build the profile row.
    options: { data: { full_name: name, country, preferred_language: language } }
  });
  if (error) return { ok: false, reason: 'error', message: error.message };
  // No session means the project requires email confirmation first.
  if (!data.session) return { ok: true, needsConfirmation: true };
  currentSession = data.session;
  return { ok: true, session: data.session };
}

async function remoteSignIn ({ email, password }) {
  if (!remoteAvailable()) return { ok: false, reason: 'offline' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, reason: 'error', message: error.message };
  currentSession = data.session;
  return { ok: true, session: data.session };
}

async function remoteSignOut () {
  if (!remoteAvailable()) return;
  await sb.auth.signOut();
  currentSession = null;
}

/* -------------------------------------------------------------------- profile */

async function pullProfile () {
  if (!signedIn()) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', remoteUserId()).maybeSingle();
  return data ?? null;
}

async function pushProfile () {
  if (!signedIn()) return;
  const user = read('nabta.user', null);
  await sb.from('profiles').update({
    full_name: user?.name ?? null,
    country: user?.country ?? null,
    preferred_language: getLang(),
    theme: read('nabta.theme', 'system') ?? 'system'
  }).eq('id', remoteUserId());
}

/* ----------------------------------------------------------- cart + wishlist */

async function pullCart () {
  const { data } = await sb.from('cart_items')
    .select('product_id, pot_label, qty').order('added_at');
  return (data ?? []).map(r => ({ id: r.product_id, pot: r.pot_label, qty: r.qty }));
}

/* Small carts, so replacing the rows wholesale is simpler and safer than
   working out a diff — and it can never drift from what the browser shows. */
async function pushCart () {
  if (!signedIn()) return;
  const items = read('nabta.cart', []);
  await sb.from('cart_items').delete().eq('user_id', remoteUserId());
  if (!items.length) return;
  await sb.from('cart_items').insert(items.map(i => ({
    user_id: remoteUserId(), product_id: i.id, pot_label: i.pot, qty: i.qty
  })));
}

async function pullWishlist () {
  const { data } = await sb.from('wishlist_items').select('product_id').order('added_at');
  return (data ?? []).map(r => r.product_id);
}

async function pushWishlist () {
  if (!signedIn()) return;
  const ids = read('nabta.wishlist', []);
  await sb.from('wishlist_items').delete().eq('user_id', remoteUserId());
  if (!ids.length) return;
  await sb.from('wishlist_items').insert(
    ids.map(id => ({ user_id: remoteUserId(), product_id: id })));
}

/* --------------------------------------------------- owned plants + care log */

async function pullPlants () {
  const { data } = await sb.from('owned_plants')
    .select('id, product_id, pot_label, bought_on, last_watered, care_log (task, due_on)')
    .order('created_at');
  return (data ?? []).map(r => ({
    uid: r.id,
    id: r.product_id,
    pot: r.pot_label,
    boughtOn: r.bought_on,
    lastWatered: r.last_watered,
    doneTasks: (r.care_log ?? []).map(c => `${c.task}|${c.due_on}`)
  }));
}

/* Replaced wholesale for the same reason as the cart. care_log rows hang off
   owned_plants with on delete cascade, so they go and come back together. */
async function pushPlants () {
  if (!signedIn()) return;
  const plants = read('nabta.plants', []);
  await sb.from('owned_plants').delete().eq('user_id', remoteUserId());
  if (!plants.length) return;

  const { data: inserted } = await sb.from('owned_plants').insert(plants.map(p => ({
    user_id: remoteUserId(),
    product_id: p.id,
    pot_label: p.pot ?? null,
    bought_on: p.boughtOn,
    last_watered: p.lastWatered ?? null
  }))).select('id');

  if (!inserted) return;
  const log = [];
  plants.forEach((p, i) => {
    (p.doneTasks ?? []).forEach(entry => {
      const [task, dueOn] = entry.split('|');
      if (task && dueOn && inserted[i]) {
        log.push({ owned_plant_id: inserted[i].id, task, due_on: dueOn });
      }
    });
  });
  if (log.length) await sb.from('care_log').insert(log);
}

/* -------------------------------------------------------------------- orders */

async function pullOrders () {
  const { data } = await sb.from('orders')
    .select(`id, order_no, placed_at, status, ship_country, subtotal, delivery_fee, total,
             payment_method, recipient_name, phone, governorate, area, block, street,
             building, floor_flat, notes,
             order_items (product_id, product_name, pot_label, qty, unit_price)`)
    .order('placed_at', { ascending: false });

  return (data ?? []).map(o => ({
    id: o.id,
    remoteId: o.id,
    orderNo: o.order_no,
    placedAt: o.placed_at,
    status: o.status,
    subtotal: Number(o.subtotal),
    delivery: Number(o.delivery_fee),
    total: Number(o.total),
    country: o.ship_country,
    paymentMethod: o.payment_method,
    address: {
      name: o.recipient_name, phone: o.phone, governorate: o.governorate,
      area: o.area, block: o.block, street: o.street, building: o.building,
      floor: o.floor_flat ?? '', notes: o.notes ?? ''
    },
    items: (o.order_items ?? []).map(i => ({
      id: i.product_id, name: i.product_name, nameAr: i.product_name,
      pot: i.pot_label, qty: i.qty, unitPrice: Number(i.unit_price)
    }))
  }));
}

/** Orders are append-only: push the ones that have never been sent. */
async function pushOrders () {
  if (!signedIn()) return;
  const orders = read('nabta.orders', []);
  const pending = orders.filter(o => !o.remoteId);
  if (!pending.length) return;

  for (const order of pending) {
    const a = order.address ?? {};
    const { data, error } = await sb.from('orders').insert({
      user_id: remoteUserId(),
      ship_country: order.country ?? 'Kuwait',
      subtotal: order.subtotal,
      delivery_fee: order.delivery,
      total: order.total,
      payment_method: order.paymentMethod ?? 'cash_on_delivery',
      recipient_name: a.name ?? '',
      phone: a.phone ?? '',
      governorate: a.governorate ?? null,
      area: a.area ?? null,
      block: a.block ?? null,
      street: a.street ?? null,
      building: a.building ?? null,
      floor_flat: a.floor || null,
      notes: a.notes || null
    }).select('id, order_no').single();

    if (error || !data) continue;

    await sb.from('order_items').insert((order.items ?? []).map(i => ({
      order_id: data.id,
      product_id: i.id,
      product_name: i.name,
      pot_label: i.pot,
      qty: i.qty,
      unit_price: i.unitPrice
    })));

    order.remoteId = data.id;
    order.orderNo = data.order_no;   // the database owns the real number
  }

  applyingRemote = true;
  write('nabta.orders', orders);
  applyingRemote = false;
}

/* ---------------------------------------------------------------- pull / push */

/** Overwrite the local copy from the database. Server wins. */
async function pullAll () {
  if (!signedIn()) return false;
  try {
    const [profile, cart, wish, plants, orderList] = await Promise.all([
      pullProfile(), pullCart(), pullWishlist(), pullPlants(), pullOrders()
    ]);

    applyingRemote = true;
    if (profile) {
      write('nabta.user', {
        name: profile.full_name ?? currentSession.user.email.split('@')[0],
        email: currentSession.user.email,
        country: profile.country ?? 'Kuwait',
        remember: true
      });
      if (profile.theme && profile.theme !== 'system') write('nabta.theme', profile.theme);
      if (profile.preferred_language) localStorage.setItem('nabta.lang', profile.preferred_language);
    }
    write('nabta.cart', cart);
    write('nabta.wishlist', wish);
    write('nabta.plants', plants);
    write('nabta.orders', orderList);
    applyingRemote = false;

    /* Tell every page to re-render from the freshly pulled state. */
    ['cartchange', 'wishchange', 'plantschange', 'userchange', 'orderschange']
      .forEach(e => document.dispatchEvent(new CustomEvent(e)));
    return true;
  } catch {
    applyingRemote = false;
    return false;
  }
}

/** Send whatever is local up to the database. Used right after signing in, so
    a basket built as a guest joins the account instead of being discarded. */
async function pushAll () {
  if (!signedIn()) return;
  await pushProfile();
  await pushCart();
  await pushWishlist();
  await pushPlants();
  await pushOrders();
}

const PUSHERS = {
  'nabta.cart': pushCart,
  'nabta.wishlist': pushWishlist,
  'nabta.plants': pushPlants,
  'nabta.orders': pushOrders,
  'nabta.user': pushProfile,
  'nabta.theme': pushProfile,
  'nabta.lang': pushProfile
};

const pending = new Set();
let pushTimer = null;

/** Called by write() in app.js for every stored key. Debounced, because the
    cart drawer's +/- buttons can fire several writes in a second. */
function schedulePush (key) {
  if (applyingRemote || !signedIn() || !PUSHERS[key]) return;
  pending.add(key);
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const keys = [...pending];
    pending.clear();
    for (const k of keys) {
      try { await PUSHERS[k](); } catch { /* stay usable offline */ }
    }
  }, 700);
}

/* -------------------------------------------------------------------- startup */

/** Restore any existing session, then pull. Called from initChrome(). */
async function restoreSession () {
  if (!initRemote()) return false;
  try {
    const { data } = await sb.auth.getSession();
    currentSession = data.session ?? null;
  } catch {
    currentSession = null;
  }

  sb.auth.onAuthStateChange((_event, session) => {
    currentSession = session ?? null;
    document.dispatchEvent(new CustomEvent('userchange'));
  });

  if (!signedIn()) return false;
  await pullAll();
  return true;
}
