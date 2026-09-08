#!/usr/bin/env python3
"""Deploy this folder to Vercel.

Usage:
    export VERCEL_TOKEN=xxxxxxxx
    python3 tools/deploy.py              # deploy to production
    python3 tools/deploy.py --preview    # deploy to a preview URL instead

Get a token at https://vercel.com/account/tokens (scope: your personal account).
The token is read from the environment and never written to disk by this script.

Uses only the standard library, so it needs nothing installed but Python 3.
"""

import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.vercel.com"
PROJECT = "nabta-shop"
ROOT = Path(__file__).resolve().parent.parent

# Everything the deployed site needs. Repo-only files are skipped.
SKIP_DIRS = {".git", ".vercel", "node_modules", "tools", "__pycache__"}
SKIP_NAMES = {".DS_Store", ".gitignore"}


def token() -> str:
    t = os.environ.get("VERCEL_TOKEN", "").strip()
    if not t:
        sys.exit(
            "VERCEL_TOKEN is not set.\n"
            "  1. Create a token at https://vercel.com/account/tokens\n"
            "  2. export VERCEL_TOKEN=your_token_here\n"
            "  3. python3 tools/deploy.py"
        )
    return t


def request(method: str, path: str, tok: str, body=None, raw: bytes | None = None,
            extra_headers: dict | None = None):
    """One JSON (or raw-body) call against the Vercel API."""
    headers = {"Authorization": f"Bearer {tok}"}
    data = raw
    if raw is None and body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if raw is not None:
        headers["Content-Length"] = str(len(raw))
    headers.update(extra_headers or {})

    req = urllib.request.Request(API + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read() or b"{}")
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        sys.exit(f"\nVercel API error {e.code} on {method} {path}:\n{detail}\n")


def collect() -> list[tuple[str, bytes]]:
    """Every file to deploy, as (posix path relative to the root, bytes)."""
    out = []
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(ROOT)
        if set(rel.parts) & SKIP_DIRS or rel.name in SKIP_NAMES:
            continue
        out.append((rel.as_posix(), p.read_bytes()))
    return out


def main() -> None:
    target = "preview" if "--preview" in sys.argv else "production"
    tok = token()
    files = collect()
    if not files:
        sys.exit("Nothing to deploy — no files found.")

    total = sum(len(b) for _, b in files)
    print(f"Deploying {len(files)} files ({total / 1024:.0f} KB) to {target}\n")

    # 1. Upload each file, addressed by the SHA-1 of its contents.
    manifest = []
    for name, blob in files:
        sha = hashlib.sha1(blob).hexdigest()
        request("POST", "/v2/files", tok, raw=blob,
                extra_headers={"x-vercel-digest": sha})
        manifest.append({"file": name, "sha": sha, "size": len(blob)})
        print(f"  uploaded  {name}")

    # 2. Create the deployment from those uploads. No build step — it is static.
    print("\nCreating deployment…")
    dep = request("POST", "/v13/deployments", tok, body={
        "name": PROJECT,
        "files": manifest,
        "target": target,
        "projectSettings": {
            "framework": None,
            "buildCommand": None,
            "installCommand": None,
            "outputDirectory": None,
        },
    })

    dep_id = dep.get("id")
    url = dep.get("url")
    print(f"  id  {dep_id}\n  url https://{url}")

    # 3. Wait for it to go live.
    print("\nWaiting for it to be ready", end="", flush=True)
    for _ in range(60):
        time.sleep(2)
        state = request("GET", f"/v13/deployments/{dep_id}", tok).get("readyState")
        if state in ("READY", "ERROR", "CANCELED"):
            print(f"\n\nStatus: {state}")
            break
        print(".", end="", flush=True)
    else:
        print("\n\nStill building — check the Vercel dashboard.")
        return

    aliases = [a for a in (dep.get("alias") or []) if a]
    print("\nLive at:")
    print(f"  https://{url}")
    for a in aliases:
        print(f"  https://{a}")
    if target == "production":
        print(f"  https://{PROJECT}-zahraa10.vercel.app   (production alias)")


if __name__ == "__main__":
    main()
