"""Download bounded, attributed OSM building ways for NightLens preset horizons.

Run without arguments for Penang, or pass preset ids: penang seoul tucson.
Existing raw snapshots are reused unless --refresh is explicitly supplied.
This acquires map geometry, not photographs or surveyed building elevations.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PLACES = {
    "penang": (5.4141, 100.3354),
    "seoul": (37.5665, 126.978),
    "tucson": (32.2226, -110.9747),
}
RADIUS = 450
ENDPOINT = "https://overpass-api.de/api/interpreter"


def acquire(place_id: str, refresh: bool = False) -> dict:
    latitude, longitude = PLACES[place_id]
    query = f'[out:json][timeout:25];way["building"](around:{RADIUS},{latitude},{longitude});out tags geom;'
    url = ENDPOINT + "?" + urllib.parse.urlencode({"data": query})
    raw_path = ROOT / "data" / "raw" / f"osm-{place_id}.json"
    if raw_path.exists() and not refresh:
        payload = raw_path.read_bytes()
        retrieved_at = datetime.fromtimestamp(raw_path.stat().st_mtime, timezone.utc).isoformat()
        metadata_path = ROOT / "data" / "osm-sources.json"
        if metadata_path.exists():
            saved = json.loads(metadata_path.read_text(encoding="utf-8"))
            previous = next((item for item in saved.get("sources", []) if item["id"] == place_id), None)
            if previous and previous.get("rawSha256") == hashlib.sha256(payload).hexdigest():
                retrieved_at = previous["retrievedAt"]
    else:
        request = urllib.request.Request(url, headers={"User-Agent": "NightLens educational sky explorer; attributed OpenStreetMap building footprints"})
        with urllib.request.urlopen(request, timeout=40) as response:
            payload = response.read(10_000_001)
        if len(payload) > 10_000_000:
            raise ValueError("Footprint response exceeded the bounded 10 MB download")
        retrieved_at = datetime.now(timezone.utc).isoformat()
    raw = json.loads(payload)
    if not isinstance(raw.get("elements"), list) or raw.get("remark"):
        raise ValueError(f"Incomplete or invalid Overpass response: {raw.get('remark', '')}")
    elements = []
    for element in raw["elements"]:
        geometry = element.get("geometry", [])
        if element.get("type") == "way" and element.get("tags", {}).get("building") and len(geometry) >= 4:
            elements.append({key: element[key] for key in ("type", "id", "tags", "geometry")})
    source = {
        "provider": "OpenStreetMap contributors via Overpass API",
        "sourceUrl": url,
        "query": query,
        "retrievedAt": retrieved_at,
        "osmTimestamp": raw.get("osm3s", {}).get("timestamp_osm_base"),
        "rawFile": f"data/raw/osm-{place_id}.json",
        "rawSha256": hashlib.sha256(payload).hexdigest(),
        "license": "ODbL 1.0",
        "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
        "attribution": "© OpenStreetMap contributors",
        "attributionUrl": "https://www.openstreetmap.org/copyright",
        "changes": "Selected building ways; retained source id, tags and geometry; compact JSON encoding. Relation multipolygons and terrain are not included. Heights are map tags where available; renderer assumptions must be labeled separately.",
    }
    output = {
        "id": place_id,
        "observer": {"latitude": latitude, "longitude": longitude},
        "radiusMeters": RADIUS,
        "source": source,
        "elements": elements,
    }
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    if refresh or not raw_path.exists():
        raw_path.write_bytes(payload)
    output_path = ROOT / "public" / "data" / f"horizon-{place_id}.json"
    output_path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return {
        **source,
        "id": place_id,
        "observer": output["observer"],
        "radiusMeters": RADIUS,
        "outputFile": str(output_path.relative_to(ROOT)).replace("\\", "/"),
        "rawBytes": len(payload),
        "buildingWays": len(elements),
        "waysWithHeightTag": sum("height" in element["tags"] for element in elements),
        "waysWithLevelsTag": sum("building:levels" in element["tags"] for element in elements),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("places", nargs="*", choices=sorted(PLACES))
    parser.add_argument("--refresh", action="store_true")
    args = parser.parse_args()
    metadata_path = ROOT / "data" / "osm-sources.json"
    previous = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {"sources": []}
    sources = {source["id"]: source for source in previous["sources"]}
    failed = False
    for place_id in args.places or ["penang"]:
        try:
            result = acquire(place_id, args.refresh)
        except (OSError, ValueError) as error:
            failed = True
            record = {"id": place_id, "attemptedAt": datetime.now(timezone.utc).isoformat(), "error": str(error), "dataCached": False}
            previous.setdefault("failedAcquisitions", []).append(record)
            metadata_path.write_text(json.dumps(previous, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print(json.dumps(record))
            continue
        sources[place_id] = result
        print(json.dumps({key: result[key] for key in ("id", "buildingWays", "waysWithHeightTag", "waysWithLevelsTag", "rawBytes", "rawSha256")}))
        previous["sources"] = list(sources.values())
        metadata_path.write_text(json.dumps(previous, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
