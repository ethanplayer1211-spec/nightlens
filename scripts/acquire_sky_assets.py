"""Reacquire the attributed Gaia map, refusing silently changed source bytes."""
from pathlib import Path
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
metadata = json.loads((ROOT / "data/sky-assets.json").read_text(encoding="utf-8"))
request = urllib.request.Request(metadata["download_url"], headers={"User-Agent": "NightLens educational sky explorer"})
with urllib.request.urlopen(request, timeout=60) as response:
    payload = response.read()
if hashlib.sha256(payload).hexdigest() != metadata["sha256"]:
    raise RuntimeError("Source bytes changed: inspect the image, projection and licensing before updating the pinned metadata")
target = ROOT / metadata["file"]
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(payload)
print(f"Verified {target.name}: {len(payload)} bytes, SHA-256 matches data/sky-assets.json")
