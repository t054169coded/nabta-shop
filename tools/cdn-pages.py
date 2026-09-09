#!/usr/bin/env python3
"""Rewrite the three pages to load CSS and JS from jsDelivr instead of locally.

    python3 tools/cdn-pages.py            # pin to the current commit
    python3 tools/cdn-pages.py main       # track the main branch instead

Writes dist/vercel/. This exists because the site's assets (166 KB) are too
large to push through a chat-based deploy tool in one go, so the pages are
deployed on their own and the heavy files are served from the public repo via
jsDelivr. Pinning to a commit SHA keeps the deployed site immutable.

For a fully self-contained deployment where Vercel serves everything, use
tools/deploy.py instead.
"""

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "vercel"
REPO = "t054169coded/nabta-shop"

PAGES = ["index.html", "login.html", "calendar.html"]
ASSETS = [
    "css/styles.css", "js/i18n.js", "data/products.js", "js/plants.js",
    "js/app.js", "js/shop.js", "js/auth.js", "js/calendar.js",
]


def main() -> None:
    ref = sys.argv[1] if len(sys.argv) > 1 else \
        subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT).decode().strip()
    cdn = f"https://cdn.jsdelivr.net/gh/{REPO}@{ref}"

    OUT.mkdir(parents=True, exist_ok=True)
    for page in PAGES:
        html = (ROOT / page).read_text(encoding="utf-8")
        for asset in ASSETS:
            html = html.replace(f'href="{asset}"', f'href="{cdn}/{asset}"')
            html = html.replace(f'src="{asset}"', f'src="{cdn}/{asset}"')
        (OUT / page).write_text(html, encoding="utf-8")

    # app.js fetches this at runtime; Vercel proxies it to the CDN so the
    # request succeeds without shipping the file itself.
    (OUT / "vercel.json").write_text(
        '{\n  "rewrites": [\n    {\n'
        '      "source": "/data/products.json",\n'
        f'      "destination": "{cdn}/data/products.json"\n'
        '    }\n  ]\n}\n', encoding="utf-8")

    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(f"{OUT}  ({len(PAGES) + 1} files, {total / 1024:.0f} KB)")
    print(f"pinned to {ref}")


if __name__ == "__main__":
    main()
