#!/usr/bin/env python3
"""Bundle all five pages into one self-contained HTML file.

    python3 tools/bundle.py [out.html]

The multi-page site stays the real project; this is for hosts that serve a
single file. Each page's <main> becomes a hash-routed view (#/shop, #/login,
#/cal, #/checkout, #/confirm), the stylesheet is inlined, and the page scripts
are wrapped in IIFEs so their top-level names cannot collide — shop.js,
calendar.js and checkout.js all declare PRODUCTS, and auth.js and checkout.js
both declare setError.

checkout.js and confirmation.js share one IIFE, because confirmation.js calls
paymentLabel() and formatAddress() from checkout.js.

Changing route reloads the page. That looks lazy for a single-page app, but it
is deliberate: every view then initialises exactly as it does in the real
multi-page site, reading fresh cart and order state instead of showing a stale
summary. Everything is inline, so the reload costs no network.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "nabta-single.html"

read = lambda p: (ROOT / p).read_text(encoding="utf-8")

# page file -> (view id, route)
VIEWS = [
    ("index.html",        "view-shop",    "#/shop"),
    ("login.html",        "view-login",   "#/login"),
    ("calendar.html",     "view-cal",     "#/cal"),
    ("checkout.html",     "view-checkout", "#/checkout"),
    ("confirmation.html", "view-confirm", "#/confirm"),
]

# Shared globals, loaded once, in dependency order.
SHARED = ["js/i18n.js", "data/products.js", "js/plants.js", "js/app.js"]

# Each entry becomes one IIFE. Grouped entries share a scope.
PAGE_SCRIPTS = [
    ["js/shop.js"],
    ["js/auth.js"],
    ["js/calendar.js"],
    ["js/checkout.js", "js/confirmation.js"],
]


def between(text: str, start: str, end: str) -> str:
    """The slice from `start` up to and including `end`."""
    i = text.index(start)
    j = text.index(end, i) + len(end)
    return text[i:j]


def route_links(html: str) -> str:
    """Point every cross-page link at a hash route instead of a .html file."""
    for old, new in [
        ('href="index.html#products"', 'href="#/shop"'),
        ('href="index.html"', 'href="#/shop"'),
        ('href="calendar.html"', 'href="#/cal"'),
        ('href="login.html"', 'href="#/login"'),
        ('href="checkout.html"', 'href="#/checkout"'),
        ('href="confirmation.html"', 'href="#/confirm"'),
    ]:
        html = html.replace(old, new)
    return html


def route_js(js: str) -> str:
    """Same for the redirects and links built inside the JavaScript."""
    replacements = [
        ("location.href = 'calendar.html';", "location.hash = '#/cal';"),
        ("location.href = 'checkout.html';", "location.hash = '#/checkout';"),
        # The confirmation view falls back to the newest order when no id is
        # given, which is exactly the one just placed.
        ("location.href = `confirmation.html?order=${encodeURIComponent(order.id)}`;",
         "location.hash = '#/confirm';"),
        ('href="index.html#products"', 'href="#/shop"'),
        ("user ? 'calendar.html' : 'login.html'", "user ? '#/cal' : '#/login'"),
    ]
    for old, new in replacements:
        js = js.replace(old, new)
    return js


index_html = read("index.html")
header = route_links(between(index_html, '<header class="site-header">', "</header>"))
footer = between(index_html, '<footer class="site-footer">', "</footer>")

# The cart drawer sits between its own comment and the script block.
drawer = index_html[
    index_html.index("<!-- ------------------------------------------------------- cart drawer -->"):
    index_html.index("<!-- Plain scripts")
].strip()

# Each page's <main> becomes one view. Only the shop starts visible.
views = []
for page, view_id, _route in VIEWS:
    html = read(page)
    opening = html[html.index("<main"):html.index(">", html.index("<main")) + 1]
    classes = ""
    if 'class="' in opening:
        classes = opening.split('class="')[1].split('"')[0] + " "
    hidden = "" if view_id == "view-shop" else " hidden"
    new_open = f'<main class="{classes}view" id="{view_id}"{hidden}>'
    views.append(route_links(between(html, opening, "</main>").replace(opening, new_open, 1)))

shared_js = "\n".join(f"/* ---- {p} ---- */\n{route_js(read(p))}" for p in SHARED)

pages_js = ""
for group in PAGE_SCRIPTS:
    body = "\n".join(f"/* ---- {p} ---- */\n{route_js(read(p))}" for p in group)
    pages_js += f"(function () {{\n{body}\n}})();\n"

# initChrome wires the shared header. Every page script calls it, so make the
# later calls no-ops rather than stacking duplicate listeners.
once = """
/* ---- run the shared header setup only once ---- */
(function () {
  const original = initChrome;
  let done = false;
  initChrome = function () {
    if (done) return;
    done = true;
    original();
  };
})();
"""

routes_js = ",\n    ".join(f"'{route}': '{view}'" for _p, view, route in VIEWS)

router = f"""
/* ---- hash router: one page, five views ----
   Plain anchors like #products still scroll normally; only #/… switches view.
   A route change reloads, so each view initialises against current state. */
(function () {{
  const ROUTES = {{
    {routes_js}
  }};

  function show () {{
    if (!location.hash.startsWith('#/')) return;
    const active = ROUTES[location.hash] || '{VIEWS[0][1]}';
    Object.values(ROUTES).forEach(id => {{
      const el = document.getElementById(id);
      if (el) el.hidden = id !== active;
    }});
    document.querySelectorAll('.nav a').forEach(a => {{
      if (a.getAttribute('href') === location.hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }});
    window.scrollTo(0, 0);
  }}

  let current = location.hash;
  addEventListener('hashchange', () => {{
    if (location.hash.startsWith('#/') && location.hash !== current) location.reload();
    else show();
  }});

  document.addEventListener('DOMContentLoaded', () => {{
    if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/shop');
    current = location.hash;
    show();
  }});
}})();
"""

page = f"""<title>Nabta Indoor Plants</title>
<meta name="description" content="Indoor plants for the home, Kuwait. Hover a plant to see how tall it grows.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Inter:wght@400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet">

<style>
{read('css/styles.css')}
</style>

{header}

{"".join(chr(10) + v + chr(10) for v in views)}
{footer}

{drawer}

<script>
{shared_js}
{once}
{pages_js}
{router}
</script>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page, encoding="utf-8")
print(f"{OUT}  ({len(page.encode()) / 1024:.0f} KB, {len(VIEWS)} views)")
