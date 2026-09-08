#!/usr/bin/env python3
"""Bundle the three pages into one self-contained HTML file.

    python3 tools/bundle.py [out.html]

The multi-page site stays the real project; this is for hosts that serve a
single file. The three <main> elements become hash-routed views (#/shop,
#/login, #/cal), the stylesheet is inlined, and the page scripts are each
wrapped in an IIFE so their top-level names cannot collide.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "nabta-single.html"

read = lambda p: (ROOT / p).read_text(encoding="utf-8")


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
    ]:
        html = html.replace(old, new)
    return html


def route_js(js: str) -> str:
    """Same for the redirects and links built inside the JavaScript."""
    for old, new in [
        ("location.href = 'calendar.html';", "location.hash = '#/cal';"),
        ('href="index.html#products"', 'href="#/shop"'),
        ("user ? 'calendar.html' : 'login.html'", "user ? '#/cal' : '#/login'"),
    ]:
        js = js.replace(old, new)
    return js


index_html = read("index.html")
login_html = read("login.html")
cal_html = read("calendar.html")

header = route_links(between(index_html, '<header class="site-header">', "</header>"))
footer = between(index_html, '<footer class="site-footer">', "</footer>")

# The cart drawer sits between its own comment and the script block.
drawer = index_html[
    index_html.index("<!-- ------------------------------------------------------- cart drawer -->"):
    index_html.index("<!-- Plain scripts")
].strip()

# Each page's <main> becomes one view. Only the shop starts visible.
views = [
    between(index_html, "<main>", "</main>")
    .replace("<main>", '<main class="view" id="view-shop">', 1),

    between(login_html, '<main class="auth-page">', "</main>")
    .replace('<main class="auth-page">', '<main class="auth-page view" id="view-login" hidden>', 1),

    between(cal_html, '<main class="wrap cal-page">', "</main>")
    .replace('<main class="wrap cal-page">', '<main class="wrap cal-page view" id="view-cal" hidden>', 1),
]
views = [route_links(v) for v in views]

# Shared scripts keep their globals; page scripts are isolated so that, for
# example, shop.js and calendar.js can both declare PRODUCTS.
shared = ["js/i18n.js", "data/products.js", "js/plants.js", "js/app.js"]
pages = ["js/shop.js", "js/auth.js", "js/calendar.js"]

shared_js = "\n".join(f"/* ---- {p} ---- */\n{route_js(read(p))}" for p in shared)
pages_js = "\n".join(
    f"/* ---- {p} ---- */\n(function () {{\n{route_js(read(p))}\n}})();" for p in pages
)

# initChrome wires the shared header. All three page scripts call it, so make
# the second and third calls no-ops rather than stacking duplicate listeners.
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

router = """
/* ---- hash router: one page, three views ----
   Plain anchors like #products still scroll normally; only #/… switches view. */
(function () {
  const ROUTES = { '#/shop': 'view-shop', '#/login': 'view-login', '#/cal': 'view-cal' };

  function show () {
    if (!location.hash.startsWith('#/')) return;
    const active = ROUTES[location.hash] || 'view-shop';
    Object.values(ROUTES).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = id !== active;
    });
    document.querySelectorAll('.nav a').forEach(a => {
      if (a.getAttribute('href') === location.hash) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  }

  addEventListener('hashchange', show);
  document.addEventListener('DOMContentLoaded', () => {
    if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/shop');
    show();
  });
})();
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

{views[0]}

{views[1]}

{views[2]}

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
print(f"{OUT}  ({len(page.encode()) / 1024:.0f} KB)")
