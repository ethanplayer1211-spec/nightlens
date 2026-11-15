"""Verify the pinned, unmodified NASA SVS lunar map; --download reacquires it."""
from pathlib import Path
import argparse
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Fetch the pinned official JPEG; changed source bytes are rejected")
    args = parser.parse_args()
    metadata = json.loads((ROOT / "data/moon-assets.json").read_text(encoding="utf-8"))
    target = ROOT / metadata["file"]
    if args.download:
        request = urllib.request.Request(metadata["download_url"], headers={"User-Agent": "NightLens educational astronomical visualization"})
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read(2_000_001)
        if len(payload) > 2_000_000:
            raise RuntimeError("Unexpectedly large lunar texture; review the source before updating metadata")
    else:
        payload = target.read_bytes()
    if hashlib.sha256(payload).hexdigest() != metadata["sha256"] or len(payload) != metadata["bytes"]:
        raise RuntimeError("Lunar source bytes changed; inspect the source, dimensions and rights before updating the pinned metadata")
    if not payload.startswith(b"\xff\xd8"):
        raise RuntimeError("The pinned lunar asset is not a JPEG")
    if args.download:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    print(f"Verified {target.name}: {len(payload):,} bytes; original NASA SVS SHA-256 matches")


if __name__ == "__main__":
    main()
