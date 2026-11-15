"""Reconstruct complete OSM water multipolygons and clip real shoreline geometry.

Needs Shapely 2.1.2. Cached by default; --verify reproduces without network/writes.
No missing way/node is bridged, and open/invalid source loops fail explicitly.
"""
from __future__ import annotations
import argparse
from collections import defaultdict
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import urllib.request

from shapely.geometry import Polygon, box, MultiPolygon
from shapely.ops import unary_union
import shapely

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "data/viewpoint-water-sources.json"
SITES = {
    "sydney-macquaries": {"raw": "port-jackson", "relation": 15522136, "latitude": -33.8594584, "longitude": 151.221884},
    "new-york-pier1": {"raw": "east-river", "relation": 2389633, "latitude": 40.7019951, "longitude": -73.9974077},
}

UNAVAILABLE = {
    'penang-esplanade': 'No complete regional water mask was acquired. A 4 km window includes both Penang Island and the Butterworth mainland; complementing the island alone would invent water over real mainland. Partial coastline or DEM values are not used to infer sea.'
}


def closed_rings(raw: dict, relation_id: int, role: str) -> list[list[dict]]:
    lookup = {(e["type"], e["id"]): e for e in raw["elements"]}
    relation = lookup[("relation", relation_id)]
    members = [m for m in relation["members"] if m.get("role", "outer") == role]
    if any(m["type"] != "way" for m in members):
        raise ValueError("Nested/non-way boundary member needs a separate verified resolver")
    segments = []
    for member in members:
        way = lookup.get(("way", member["ref"]))
        if not way or len(way.get("nodes", [])) < 2:
            raise ValueError("Incomplete source way member")
        if any(("node", ref) not in lookup for ref in way["nodes"]):
            raise ValueError("Incomplete source node coordinates")
        segments.append(way["nodes"])
    adjacency = defaultdict(list)
    for i, segment in enumerate(segments):
        adjacency[segment[0]].append(i)
        adjacency[segment[-1]].append(i)
    if any(len(links) != 2 for links in adjacency.values()):
        raise ValueError("Boundary endpoints are open/ambiguous; no synthetic joins allowed")
    unused = set(range(len(segments)))
    rings = []
    while unused:
        index = min(unused)
        unused.remove(index)
        chain = list(segments[index])
        while chain[0] != chain[-1]:
            candidates = [i for i in adjacency[chain[-1]] if i in unused]
            if len(candidates) != 1:
                raise ValueError("Could not close a source boundary solely by matching node IDs")
            index = candidates[0]
            unused.remove(index)
            next_segment = segments[index]
            if next_segment[0] != chain[-1]:
                next_segment = list(reversed(next_segment))
            chain.extend(next_segment[1:])
        if len(set(chain)) < 3:
            raise ValueError("Degenerate closed source ring")
        rings.append([{"lat": lookup[("node", ref)]["lat"], "lon": lookup[("node", ref)]["lon"]} for ref in chain])
    return rings


def produce(site_id: str, refresh: bool = False, verify: bool = False) -> dict:
    if site_id in UNAVAILABLE:
        output={'id':site_id,'polygons':[],'source':{'status':'unavailable','reason':UNAVAILABLE[site_id]}}
        target=ROOT/f'public/data/viewpoint-water-{site_id}.json'
        text=json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n'
        if verify:
            if target.read_text(encoding='utf-8') != text:
                raise ValueError('Explicit unavailable-water artifact does not reproduce')
        else:
            target.write_text(text,encoding='utf-8')
        return {'id':site_id,'polygons':0,'status':'unavailable'}
    site = SITES[site_id]
    raw_path = ROOT / f"data/raw/viewpoint-water-{site['raw']}.json"
    url = f"https://api.openstreetmap.org/api/0.6/relation/{site['relation']}/full.json"
    metadata = json.loads(META.read_text(encoding="utf-8")) if META.exists() else {"sources": [], "failures": []}
    previous = next((s for s in metadata["sources"] if s["id"] == site_id), None)
    if verify and (refresh or not raw_path.exists()):
        raise ValueError("Offline verification requires a cached full relation")
    if refresh or not raw_path.exists():
        request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "NightLens educational astronomy water polygons"})
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = response.read(30_000_001)
        if len(payload) > 30_000_000:
            raise ValueError("Full relation exceeds the bounded 30 MB source size")
        json.loads(payload)
        raw_path.write_bytes(payload)
    else:
        payload = raw_path.read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    if previous and not refresh and previous["rawSha256"] != digest:
        raise ValueError("Cached full relation differs from recorded source hash")
    raw = json.loads(payload)
    outer = closed_rings(raw, site["relation"], "outer")
    inner = closed_rings(raw, site["relation"], "inner")
    lat0, lon0 = site["latitude"], site["longitude"]
    factor_x = 111320 * math.cos(lat0 * math.pi / 180)
    def project(ring):
        return [((p["lon"]-lon0)*factor_x, (p["lat"]-lat0)*111320) for p in ring]
    def polygons(rings):
        output = []
        for ring in rings:
            polygon = Polygon(project(ring))
            if not polygon.is_valid or polygon.is_empty:
                raise ValueError("Source polygon invalid; no unrecorded geometry repair is allowed")
            output.append(polygon)
        return output
    water = unary_union(polygons(outer))
    if inner:
        land = unary_union(polygons(inner))
        if not water.covers(land):
            raise ValueError("Inner source boundaries extend outside their outer water area")
        water = water.difference(land)
    clipped = water.intersection(box(-4000, -4000, 4000, 4000))
    if clipped.is_empty or not clipped.is_valid:
        raise ValueError("No valid water geometry intersects this named station window")
    if isinstance(clipped, Polygon):
        pieces = [clipped]
    elif isinstance(clipped, MultiPolygon):
        pieces = list(clipped.geoms)
    else:
        raise ValueError("Unexpected clipped geometry type")
    def unproject(coords):
        return [{"lat": y/111320+lat0, "lon": x/factor_x+lon0} for x,y in coords]
    output_polygons = [{"outer": unproject(p.exterior.coords), "holes": [unproject(r.coords) for r in p.interiors]} for p in pieces]
    relation = next(e for e in raw["elements"] if e["type"] == "relation" and e["id"] == site["relation"])
    source = {
        "provider": "OpenStreetMap contributors via official OSM API 0.6",
        "sourceUrl": url, "relationId": site["relation"], "relationName": relation.get("tags", {}).get("name", "East River water"),
        "retrievedAt": previous["retrievedAt"] if previous else datetime.fromtimestamp(raw_path.stat().st_mtime,timezone.utc).isoformat(),
        "rawFile": str(raw_path.relative_to(ROOT)).replace("\\", "/"), "rawSha256": digest,
        "license": "ODbL 1.0", "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
        "attribution": "© OpenStreetMap contributors", "attributionUrl": "https://www.openstreetmap.org/copyright",
        "method": "Fetched complete relation and all way/node members. Joined only matching endpoint node IDs into genuinely closed outer/inner loops; open, ambiguous or invalid loops fail. Projected to a local equirectangular east/north metre frame, unioned source outers, subtracted source inner islands, and intersected with the ±4000 m station rectangle using Shapely. No simplification, inferred joins or shoreline invention. Rectangle edges are clipping boundaries, not measured coastline.",
        "projection": {"originLatitude": lat0, "originLongitude": lon0, "eastMetresPerLongitudeDegree": factor_x, "northMetresPerLatitudeDegree": 111320},
        "clipBoundsMeters": [-4000,-4000,4000,4000], "shapelyVersion": shapely.__version__,
        "outerSourceRings": len(outer), "innerSourceRings": len(inner),
        "limits": "Source-map completeness/accuracy is not certified. Water level, tides and photographs are not supplied. Coverage ends at the explicit clipping rectangle; it is not a global ocean mask.",
    }
    output = {"id": site_id, "polygons": output_polygons, "source": source}
    target = ROOT / f"public/data/viewpoint-water-{site_id}.json"
    text = json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n"
    if verify:
        if target.read_text(encoding="utf-8") != text:
            raise ValueError("Clipped public water geometry does not reproduce exactly")
    else:
        target.write_text(text, encoding="utf-8")
        record = {**source, "id": site_id, "outputFile": str(target.relative_to(ROOT)).replace("\\", "/"), "bytes": target.stat().st_size, "polygons": len(output_polygons), "holes": sum(len(p["holes"]) for p in output_polygons), "areaSquareMeters": clipped.area}
        metadata["sources"] = [s for s in metadata["sources"] if s["id"] != site_id] + [record]
        META.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"id": site_id, "polygons": len(output_polygons), "holes": sum(len(p["holes"]) for p in output_polygons), "vertices": sum(len(p["outer"])+sum(len(h) for h in p["holes"]) for p in output_polygons), "bytes": len(text.encode("utf-8"))}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sites", nargs="*", choices=[*SITES,*UNAVAILABLE])
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    for site in args.sites or [*SITES,*UNAVAILABLE]:
        print(json.dumps(produce(site,args.refresh,args.verify)),flush=True)


if __name__ == "__main__":
    main()
