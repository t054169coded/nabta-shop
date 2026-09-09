# Database

Supabase project **`nabta-shop`** · ref `ilrkquztapeqmjtdcmxf` · region `ap-south-1`
(Mumbai, the closest available region to Kuwait) · free tier, $0/month.

```
API URL          https://ilrkquztapeqmjtdcmxf.supabase.co
Publishable key  sb_publishable_5HY85KAGqjomEwVlbU3LNw_GfnkkBbk
```

That key is meant to be public and belongs in the browser. What actually keeps
data private is Row Level Security, which is enabled on **all ten tables** —
the key alone gets you the plant catalogue and nothing else.

The `service_role` key is a different matter: it bypasses RLS entirely. Never
put it in this repo or in any page the browser loads.

---

## What the site needs to store

Everything currently in `localStorage` is per-browser, so it vanishes on a
different device and can never be seen by the shop. These tables replace it.

| localStorage key today | Table | Why it belongs in a database |
|---|---|---|
| — (`data/products.json`) | `products`, `product_pot_sizes`, `product_care_tips` | Prices and stock can change without a redeploy |
| `nabta.user` | `profiles` + `auth.users` | A real account, on any device |
| `nabta.cart` | `cart_items` | A basket started on a phone finishes on a laptop |
| `nabta.wishlist` | `wishlist_items` | Saved plants survive a cleared browser |
| — (checkout was a toast) | `orders`, `order_items` | The shop needs to know what was actually sold |
| `nabta.plants` | `owned_plants` | The watering schedule is the reason to have an account |
| `doneTasks[]` | `care_log` | "I watered it" has to outlive the browser |
| `nabta.theme`, `nabta.lang` | `profiles.theme`, `profiles.preferred_language` | Preferences follow the person |
| `nabta.orders` | `orders` + `order_items` | Right now an order exists only in the buyer's browser — you cannot see it |

---

## Tables

**Catalogue** — public read, nobody writes from the browser.

- `products` — one row per plant. `price numeric(8,3)` because the dinar is
  quoted to three decimals; floats would drift. `light` and `difficulty` are
  enums, so a typo is rejected by the database rather than silently filtered.
- `product_pot_sizes` — the `potSizes[]` array. `price_delta` shifts the price.
- `product_care_tips` — the `care[]` / `careAr[]` arrays, one row per tip with
  an explicit `position` so order is data, not luck.

**Accounts**

- `profiles` — full name, country, language, theme. **Email and password live
  in `auth.users`, managed by Supabase Auth. No table here ever sees a
  password.** A profile row is created automatically by the
  `on_auth_user_created` trigger, from the sign-up metadata.

**Shopping**

- `cart_items` — unique on `(user_id, product_id, pot_label)`, so adding the
  same plant twice increments rather than duplicating. A composite foreign key
  onto `product_pot_sizes` means an invalid pot size cannot be saved at all.
- `wishlist_items` — primary key is `(user_id, product_id)`.
- `orders` — totals, delivery fee, `ship_country`, status, a friendly
  `order_no` to quote to a customer, and everything `checkout.html` collects:
  `payment_method` (an enum, so `'bitcoin'` is rejected by the database),
  `recipient_name`, `phone`, and the Kuwaiti address parts `governorate`,
  `area`, `block`, `street`, `building`, `floor_flat`, `notes`. There is no
  postcode column because Kuwaiti addresses do not have one.
  Two check constraints earn their keep: `orders_phone_digits` rejects a phone
  with punctuation, and `orders_kuwait_address_complete` refuses a Kuwait
  order that is missing any of the five address parts.
  **No card details are stored, here or anywhere.**
- `order_items` — **copies the name and unit price at purchase.** Reprice a
  plant later and old receipts still say what was actually paid. This is the
  one piece of deliberate duplication in the schema.

**Care calendar**

- `owned_plants` — `bought_on` is the anchor the whole schedule counts from,
  exactly as `js/calendar.js` does today. `product_id` is `on delete restrict`:
  discontinuing a plant must not delete the record of someone owning one — take
  it off sale with `in_stock = false` instead. `watering_days_override` lets an
  owner adapt the shop's advice to their own room.
- `care_log` — only *completions* are stored, one row per task done. Due dates
  stay computed, which is exactly what lets the Kuwait-summer rule change the
  spacing without rewriting any rows.
- `my_plants` — a view joining a plant to its product and effective intervals,
  so the calendar page needs one query. `security_invoker = on`, so RLS still
  applies through it.

---

## Access rules, and how they were checked

Every table has RLS on. The catalogue is readable by anyone; everything else is
scoped to `auth.uid()`. Orders are insert-and-read only for the customer —
changing a status is the shop's business, not the buyer's.

Verified by inserting a fake user with a cart, an order and a tracked plant,
then reading as three different callers (all 18 checks passed, then rolled back):

| Caller | Catalogue | Someone else's cart / orders / plants / profile |
|---|---|---|
| anonymous visitor | 6 rows | 0 rows |
| a different signed-in user | 6 rows | 0 rows |
| the owner | 6 rows | their own rows only |

`supabase db lint` equivalent (`get_advisors`) reports **no security findings**.
The one it did catch is worth knowing about: a `SECURITY DEFINER` function in
the `public` schema is also published as a REST endpoint, so
`handle_new_user()` had `EXECUTE` revoked from `anon` and `authenticated`.
Triggers still fire — they run as the table owner, not as the API caller.

---

## Files

- `seed.sql` — the six plants, generated from `data/products.json`. Re-runnable:
  conflicts update in place, so it is safe to apply again after editing the JSON.

The schema itself was applied as migrations and lives in the project. To pull it
into this repo as files:

```bash
supabase link --project-ref ilrkquztapeqmjtdcmxf && supabase db pull
```

---

## Why the tables are still empty

The catalogue is loaded: **6 products, 18 pot sizes, 24 care tips.** Everything
else is empty on purpose, and cannot fill up yet.

Every row in `cart_items`, `orders`, `owned_plants` and `profiles` is keyed to
a row in `auth.users`, and RLS ties it to `auth.uid()`. So there is nothing to
store until somebody signs up — and signing up means the site talking to
Supabase Auth, which it does not do yet. The order placed in the browser lives
in that browser's `localStorage`; it has no user to belong to.

The schema was checked against a real order rather than assumed. Inserting the
exact order the site produced (NB-1042: an olive tree in a 36 cm pot and two
pothos, 53.000 KWD, KNET on delivery, delivered to Block 12, Salmiya) was
accepted, produced the right line total from the stored unit prices, and linked
three `owned_plants` rows. Four bad orders were rejected as they should be:

| Attempt | Result |
|---|---|
| Kuwait order with no governorate | rejected |
| phone written `+965 5512-3456` | rejected |
| payment method `'bitcoin'` | rejected |
| cart holding a pot size not sold | rejected |

All of it rolled back, so the database still holds only the catalogue.

## The site is connected

`js/supabase.js` does the wiring. localStorage stays the synchronous working
copy the pages read; that file pulls on load and pushes on every `write()`.
See the main [README](../README.md) for why it is built that way.

Verified from the browser rather than assumed:

| Check | Result |
|---|---|
| Catalogue served from this database | a price changed to `9.999` here appeared on the page while `products.json` still said `7.5` |
| `products.json` fetched at all | no — the database answered first |
| Falls back when the database is unreachable | 6 products, pots and care tips still load from the bundled copies |
| Anonymous read of `cart_items` / `orders` / `owned_plants` / `profiles` | 0 rows |
| Bad credentials at the auth endpoint | `invalid_credentials`, surfaced inline on the form |
| Console errors on a clean load | none |

Still empty until somebody signs up, because every row in those tables is
keyed to an `auth.users` id — see below.

Two things the schema deliberately does *not* invent, because the UI does not
collect them: a delivery address (only country is asked for) and any payment
record. Both would be needed before this took real money.
