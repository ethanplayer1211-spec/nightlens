"""Cache rate-limited NASA/USGS SRTM v3 samples via Open Topo Data.

Cached responses are reused by default. --refresh explicitly contacts the service.
--far selects separate 21x21 grids at 2 km spacing, covering +/-20 km.
This is a coarse historical surface model, not surveyed bare-earth city geometry.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ENDPOINT = "https://api.opentopodata.org/v1/srtm90m"
METADATA = ROOT / "data/viewpoint-terrain-sources.json"
PLACES = {
    "kl-sky-deck": (3.1529, 101.7038, 21, 400),
    "penang-esplanade": (5.42145, 100.34235, 17, 500),
    "seoul-namsan": (37.5514, 126.9883, 17, 500),
    "sydney-macquaries": (-33.85935, 151.22230, 17, 500),
    "london-primrose": (51.5395, -0.1606, 17, 500),
    "new-york-pier1": (40.7021, -73.9969, 17, 500),
    "atacama-kari": (-22.917238, -68.253990, 17, 500),
}
SOURCE = {
    "provider": "Open Topo Data public API, serving NASA/USGS SRTM",
    "dataset": "SRTMGL3 V003",
    "apiDataset": "srtm90m",
    "version": "3 (as documented by Open Topo Data)",
    "nativeResolution": "3 arc-seconds, approximately 90 m at the equator",
    "horizontalDatum": "WGS84 / EPSG:4326",
    "verticalDatum": "EGM96 geoid",
    "units": "metres",
    "acquisitionEpoch": "11–22 February 2000; version 3 includes void filling from other elevation sources",
    "interpolation": "Open Topo Data bilinear interpolation; integer source raster may round interpolated values",
    "url": "https://www.opentopodata.org/datasets/srtm/",
    "apiDocumentation": "https://www.opentopodata.org/api/",
    "providerSourceTileManifest": "https://www.opentopodata.org/datasets/srtm90m_urls.txt",
    "usagePolicy": "https://www.opentopodata.org/",
    "productDocumentation": "https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf",
    "nasaSource": "https://www.jpl.nasa.gov/missions/shuttle-radar-topography-mission-srtm/",
    "usgsSource": "https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm",
    "license": "Open scientific elevation data; NASA/USGS attribution retained. See product/provider documentation for source terms. No application-code license is asserted over these data. Open Topo Data service/software is separately operated.",
    "limitations": [
        "Not a surveyed bare-earth digital terrain model: radar returns can include vegetation and buildings.",
        "Historical surface observations and void-filled source data do not describe present-day construction.",
        "The NightLens sampling grid is coarser than native raster postings and is only contextual terrain.",
        "No per-sample uncertainty or original quality/void-fill flags are returned by this API.",
        "Null values are retained as missing coverage/NODATA, not replaced by invented terrain.",
        "Do not derive precise eye/platform heights or building foundation elevations from a roof-contaminated sample.",
    ],
}
LAST_CALL = 0.0


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_metadata() -> dict:
    if METADATA.exists():
        return json.loads(METADATA.read_text(encoding="utf-8"))
    return {"source": SOURCE, "batches": [], "scenes": [], "failures": []}


def save_metadata(metadata: dict) -> None:
    METADATA.parent.mkdir(parents=True, exist_ok=True)
    METADATA.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def points_for(latitude: float, longitude: float, size: int, spacing: int) -> list[tuple[float, float]]:
    middle = size // 2
    return [
        (round(latitude + (row-middle)*spacing/111320, 7),
         round(longitude + (column-middle)*spacing/(111320*math.cos(math.radians(latitude))), 7))
        for row in range(size) for column in range(size)
    ]


def get_batch(place_id: str, batch: int, points: list[tuple[float, float]], refresh: bool, metadata: dict, far: bool = False) -> tuple[list[float | None], dict]:
    global LAST_CALL
    prefix = "terrain-far" if far else "terrain"
    raw = ROOT / "data/raw" / f"{prefix}-{place_id}-{batch:02}.json"
    locations = "|".join(f"{lat:.7f},{lon:.7f}" for lat, lon in points)
    url = ENDPOINT + "?" + urllib.parse.urlencode({"locations": locations, "interpolation": "bilinear", "nodata_value": "null"})
    existing = next((item for item in metadata["batches"] if item["rawFile"] == raw.relative_to(ROOT).as_posix()), None)
    if raw.exists() and not refresh:
        payload = raw.read_bytes()
        retrieved_at = existing["retrievedAt"] if existing and existing.get("sha256") == hashlib.sha256(payload).hexdigest() else datetime.fromtimestamp(raw.stat().st_mtime, timezone.utc).isoformat()
    else:
        time.sleep(max(0.0, 1.1-(time.monotonic()-LAST_CALL)))
        LAST_CALL = time.monotonic()
        request = urllib.request.Request(url, headers={"User-Agent": "NightLens educational terrain acquisition; public SRTM samples", "Accept": "application/json"})
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read(256_001)
        if len(payload) > 256_000:
            raise ValueError("Unexpected oversized terrain response")
        retrieved_at = utc_now()
    response = json.loads(payload)
    if response.get("status") != "OK" or len(response.get("results", [])) != len(points):
        raise ValueError(f"Terrain provider failed: {response.get('error', response.get('status'))}")
    values = []
    for result, (lat, lon) in zip(response["results"], points):
        if result.get("dataset") != "srtm90m":
            raise ValueError("Provider returned a different elevation dataset")
        actual = result.get("location", {})
        if abs(actual.get("lat", 999)-lat)>1e-6 or abs(actual.get("lng", 999)-lon)>1e-6:
            raise ValueError("Terrain result order/location mismatch")
        elevation = result.get("elevation")
        if elevation is not None and (not isinstance(elevation, (int, float)) or not math.isfinite(elevation) or not -500 <= elevation <= 9000):
            raise ValueError("Invalid terrain sample")
        values.append(elevation)
    raw.parent.mkdir(parents=True, exist_ok=True)
    raw.write_bytes(payload)
    record = {"placeId": place_id, "batch": batch, "pointCount": len(points), "requestUrl": url, "rawFile": raw.relative_to(ROOT).as_posix(), "retrievedAt": retrieved_at, "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload)}
    if far:
        record["coverageRole"] = "far"
    metadata["batches"] = [item for item in metadata["batches"] if item["rawFile"] != record["rawFile"]] + [record]
    save_metadata(metadata)
    return values, record


def acquire(place_id: str, refresh: bool, metadata: dict, far: bool = False) -> dict:
    latitude, longitude, size, spacing = PLACES[place_id]
    if far:
        size, spacing = 21, 2000
    points = points_for(latitude, longitude, size, spacing)
    samples: list[float | None] = []
    batches = []
    for index, start in enumerate(range(0, len(points), 100)):
        values, record = get_batch(place_id, index, points[start:start+100], refresh, metadata, far)
        samples.extend(values)
        batches.append(record)
        print(f"{place_id}: batch {index+1}/{math.ceil(len(points)/100)} cached", flush=True)
    output = {
        "id": place_id,
        "center": {"latitude": latitude, "longitude": longitude},
        "spacingMeters": spacing,
        "size": size,
        "orientation": "rows south to north, columns west to east; center index is floor(size/2)",
        "heights": [samples[row*size:(row+1)*size] for row in range(size)],
        "source": {**SOURCE, "rawBatches": [{key: value for key, value in record.items() if key != "requestUrl"} for record in batches]},
        "sampledAt": max(record["retrievedAt"] for record in batches),
    }
    if far:
        output["coverageRole"] = "far"
    prefix = "terrain-far" if far else "terrain"
    target = ROOT / "public/data" / f"{prefix}-{place_id}.json"
    target.write_text(json.dumps(output, separators=(",", ":"), ensure_ascii=False, allow_nan=False)+"\n", encoding="utf-8")
    summary = {"id": place_id, "publicFile": target.relative_to(ROOT).as_posix(), "size": size, "spacingMeters": spacing, "finiteSamples": sum(v is not None for v in samples), "missingSamples": sum(v is None for v in samples), "centerElevationMeters": output["heights"][size//2][size//2], "sampledAt": output["sampledAt"]}
    collection = "farScenes" if far else "scenes"
    if far:
        summary["coverageRole"] = "far"
    metadata[collection] = [item for item in metadata.get(collection, []) if item["id"] != place_id] + [summary]
    save_metadata(metadata)
    print(json.dumps(summary), flush=True)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("places", nargs="*", metavar="PLACE", help="One or more known viewpoint ids; default is all seven")
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--far", action="store_true", help="Acquire separate 21x21 contextual grids at 2000 m spacing")
    arguments = parser.parse_args()
    if any(place not in PLACES for place in arguments.places):
        parser.error("Unknown viewpoint; choose from " + ", ".join(PLACES))
    metadata = read_metadata()
    metadata["source"] = SOURCE
    for place_id in arguments.places or PLACES:
        try:
            acquire(place_id, arguments.refresh, metadata, arguments.far)
        except Exception as error:
            failure = {"id": place_id, "failedAt": utc_now(), "error": str(error), "note": "No substitute terrain is generated; partial raw batches may remain for reproducible resumption."}
            if arguments.far:
                failure["coverageRole"] = "far"
            metadata["failures"].append(failure)
            save_metadata(metadata)
            print(json.dumps(failure), flush=True)
            # A provider outage is not a reason to hammer the remaining locations.
            break


if __name__ == "__main__":
    main()
