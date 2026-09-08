#!/usr/bin/env python3
"""Regenerate data/products.js from data/products.json."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = (root / 'data' / 'products.json').read_text().rstrip()
header = '''/* products.js — an exact mirror of data/products.json.
   data/products.json is the source of truth; the page fetches it normally.
   It only exists so the site still works when index.html is opened by
   double-clicking, because the file:// protocol blocks fetch().
   Regenerate after editing the JSON:
     python3 tools/mirror.py
*/

var NABTA_PRODUCTS = '''
(root / 'data' / 'products.js').write_text(header + src + ';\n')
print('data/products.js regenerated')
