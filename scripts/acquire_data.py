"""Fetch real NASA POWER records and a licensed HYG bright-star subset.

Run from the project root. Raw responses are retained with SHA-256 checksums.
No NASA credentials, synthetic observations, or runtime network calls are needed.
"""
from __future__ import annotations

import csv
import gzip
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PUBLIC = ROOT / "public" / "data"
REGIONS = [
    {"id": "penang", "name": "Penang, Malaysia", "latitude": 5.4141, "longitude": 100.3354, "utcOffset": 8, "elevation": 10},
    {"id": "seoul", "name": "Seoul, South Korea", "latitude": 37.5665, "longitude": 126.9780, "utcOffset": 9, "elevation": 38},
]


def download(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "NightLens/0.1 (NASA Space Apps scientific data proof)"})
    with urlopen(request, timeout=90) as response:
        if response.status != 200:
            raise ValueError(f"Download returned {response.status}")
        return response.read()


def save_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def fetch_power() -> None:
    for region in REGIONS:
        url = (
            "https://power.larc.nasa.gov/api/temporal/monthly/point"
            f"?parameters=AOD_55&community=RE&longitude={region['longitude']}"
            f"&latitude={region['latitude']}&start=2001&end=2024&format=JSON"
        )
        raw = download(url)
        data = json.loads(raw)
        parameter = data["properties"]["parameter"]["AOD_55"]
        if data["parameters"]["AOD_55"]["units"] != "dimensionless":
            raise ValueError("Unexpected AOD units; inspect the source before continuing")
        if data["header"]["sources"] != ["SYN1DEG"]:
            raise ValueError("Unexpected NASA data source")
        path = RAW / f"power-{region['id']}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        fill = data["header"]["fill_value"]
        # POWER month 13 is an annual aggregate. Never treat it as a 13th month.
        observations = [
            {"year": int(key[:4]), "month": int(key[4:]), "value": None if value == fill else value}
            for key, value in sorted(parameter.items())
            if 1 <= int(key[4:]) <= 12
        ]
        save_json(PUBLIC / f"{region['id']}.json", {
            "region": region,
            "variable": "Aerosol optical depth at 0.55 µm",
            "parameter": "AOD_55",
            "units": "dimensionless",
            "provider": "NASA POWER / CERES SYN1deg",
            "sourceKind": "Satellite-derived, model-assimilated environmental record",
            "spatialResolution": "1° latitude × 1° longitude source grid cell",
            "sourceUrl": url,
            "documentationUrl": "https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "sourceHeader": data["header"],
            "fillValue": fill,
            "observations": observations,
        })
        print(f"NASA POWER {region['id']}: {len(observations)} authentic monthly records")


def fetch_stars() -> None:
    # Archived, versioned HYG release; no random decorative stars.
    url = "https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v38.csv.gz"
    raw = download(url)
    source_path = RAW / "hyg_v38.csv.gz"
    source_path.parent.mkdir(parents=True, exist_ok=True)
    source_path.write_bytes(raw)
    stars = []
    for row in csv.DictReader(io.StringIO(gzip.decompress(raw).decode("utf-8"))):
        if row["id"] == "0" or not row.get("mag") or float(row["mag"]) > 5.8:
            continue
        stars.append({
            "id": int(row["id"]), "hip": int(row["hip"]) if row["hip"] else None,
            "name": row["proper"], "ra": float(row["ra"]), "dec": float(row["dec"]),
            "magnitude": float(row["mag"]), "constellation": row["con"],
            "colorIndex": float(row["ci"]) if row["ci"] else None,
        })
    save_json(PUBLIC / "stars.json", {
        "source": "HYG database v3.8 by David Nash / Astronexus",
        "url": url,
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "sha256": hashlib.sha256(raw).hexdigest(),
        "epoch": "J2000",
        "selection": "Catalog V magnitude ≤ 5.8; Sun excluded. This is a rendering subset, not a visibility prediction.",
        "stars": stars,
    })
    print(f"HYG: {len(stars)} catalog stars")


if __name__ == "__main__":
    fetch_power()
    fetch_stars()
