"""Bounded, attributed OpenStreetMap geometry snapshots for named viewing stations.

Cached by default. Use --refresh deliberately to reacquire source bytes. This is
map geometry, not photography, surveyed terrain or a complete digital twin.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ENDPOINTS = ("https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter")
STATIONS = {
    "kl-sky-deck": {"name": "KL Tower Sky Deck", "latitude": 3.1529, "longitude": 101.7032, "radius": 2500},
    "penang-esplanade": {"name": "George Town Esplanade", "latitude": 5.42145, "longitude": 100.34235, "radius": 1600},
    "seoul-namsan": {"name": "Namsan Palgakjeong plaza", "latitude": 37.5514, "longitude": 126.9883, "radius": 2200},
    "sydney-macquaries": {"name": "Mrs Macquarie's Chair", "latitude": -33.85935, "longitude": 151.22230, "radius": 2600},
    "london-primrose": {"name": "Primrose Hill summit", "latitude": 51.5395, "longitude": -0.1606, "radius": 2200},
    "new-york-pier1": {"name": "Brooklyn Bridge Park Pier 1", "latitude": 40.7021, "longitude": -73.9969, "radius": 2800},
    "atacama-kari": {"name": "Mirador de Kari virtual viewpoint", "latitude": -22.917238, "longitude": -68.253990, "radius": 2200},
}
METADATA = ROOT / "data/viewpoint-map-sources.json"
MAX_BYTES = 20_000_000


def query_for(station: dict) -> str:
    lat, lon, radius = station["latitude"], station["longitude"], station["radius"]
    buildings = min(radius, 2200)
    roads = min(radius, 1800)
    names = "Menara Kuala Lumpur|Menara KL|Petronas" if station["name"] == "KL Tower Sky Deck" else ".*"
    named = f'nwr["name"~"{names}",i]["tourism"](around:{radius},{lat},{lon});'
    return (
        '[out:json][timeout:35];('
        f'way["building"](around:{buildings},{lat},{lon});'
        f'way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|pedestrian"](around:{roads},{lat},{lon});'
        f'way["natural"~"water|wood"](around:{radius},{lat},{lon});'
        f'way["leisure"="park"](around:{radius},{lat},{lon});'
        f'way["landuse"~"forest|grass"](around:{radius},{lat},{lon});'
        + named + ');out tags geom center;'
    )


def load_metadata() -> dict:
    return json.loads(METADATA.read_text(encoding="utf-8")) if METADATA.exists() else {"sources": [], "failedAcquisitions": []}


def persist_metadata(metadata: dict) -> None:
    METADATA.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def distance_m(element: dict, latitude: float, longitude: float) -> float:
    points = element.get("geometry") or [element.get("center") or element]
    return min((math.hypot((p["lon"] - longitude) * 111320 * math.cos(latitude * math.pi / 180), (p["lat"] - latitude) * 111320) for p in points if "lat" in p and "lon" in p), default=1e12)


def compact_elements(raw: dict, station: dict) -> list[dict]:
    ways = [e for e in raw["elements"] if e.get("type") == "way" and len(e.get("geometry", [])) >= 2]
    building_ways = [e for e in ways if e.get("tags", {}).get("building") or e.get("tags", {}).get("building:part")]
    nearby = sorted(building_ways, key=lambda e: distance_m(e, station["latitude"], station["longitude"]))[:650]
    towers = [e for e in building_ways if e.get("tags", {}).get("height") or e.get("tags", {}).get("building:levels") or e.get("tags", {}).get("name") or e.get("tags", {}).get("building:part")]
    selected = {e["id"]: e for e in nearby + towers}
    for element in ways:
        tags = element.get("tags", {})
        if tags.get("highway") or tags.get("natural") or tags.get("leisure") or tags.get("landuse"):
            selected[element["id"]] = element
    output=[{key:e[key] for key in ('type','id','tags','geometry') if key in e} for e in selected.values()]
    for e in raw['elements']:
        tags=e.get('tags',{})
        if e.get('type')=='node' and (tags.get('natural')=='tree' or tags.get('amenity')=='bench' or tags.get('highway')=='street_lamp' or tags.get('tourism')=='viewpoint' or tags.get('historic') in ('monument','memorial') or tags.get('man_made')=='tower' or tags.get('barrier')=='bollard'):
            output.append({key:e[key] for key in ('type','id','lat','lon','tags') if key in e})
    return output


def acquire(station_id: str, refresh: bool = False, osm_api: bool = False, verify: bool = False) -> dict:
    station = STATIONS[station_id]
    query = query_for(station)
    if station_id=='kl-sky-deck':
        # A shifted, explicit geographic patch includes both KL Tower and Petronas.
        bbox=[101.7018,3.1494,101.7138,3.1614]
    else:
        span=.007 if station_id in ('penang-esplanade','seoul-namsan') else .006
        bbox=[station['longitude']-span,station['latitude']-span,station['longitude']+span,station['latitude']+span]
    if osm_api:
        query = 'bbox=' + ','.join(f'{v:.7f}' for v in bbox)
    metadata = load_metadata()
    previous = next((item for item in metadata["sources"] if item["id"] == station_id), None)
    raw_path = ROOT / f"data/raw/viewpoint-{station_id}.json"
    if verify and (refresh or not raw_path.exists()):
        raise ValueError("Offline verification needs an existing cached source and cannot refresh")
    if raw_path.exists() and not refresh:
        payload = raw_path.read_bytes()
        if not previous or hashlib.sha256(payload).hexdigest() != previous["rawSha256"]:
            raise ValueError("Cached source has no matching provenance/hash; inspect before reuse")
        source_url, retrieved_at = previous["sourceUrl"], previous["retrievedAt"]
        osm_api = previous.get('format','').startswith('OSM API')
        query = previous['query']
        bbox = previous.get('boundingBox') or bbox
    else:
        failures = []
        endpoints = ('https://api.openstreetmap.org/api/0.6/map.json',) if osm_api else ENDPOINTS
        for endpoint in endpoints:
            source_url = endpoint + '?' + (query if osm_api else urllib.parse.urlencode({'data':query}))
            request = urllib.request.Request(source_url, headers={"User-Agent": "NightLens educational astronomy project; attributed OSM named-viewpoint geometry", "Accept":"application/json"})
            try:
                with urllib.request.urlopen(request, timeout=45) as response:
                    payload = response.read(MAX_BYTES + 1)
                if len(payload) > MAX_BYTES:
                    raise ValueError("Source response exceeded bounded 20 MB limit")
                raw = json.loads(payload)
                if not isinstance(raw.get("elements"), list) or raw.get("remark"):
                    raise ValueError("Incomplete Overpass response: " + str(raw.get("remark", "")))
                break
            except (OSError, ValueError) as error:
                failures.append({"endpoint": endpoint, "sourceUrl":source_url, "attemptedAt": datetime.now(timezone.utc).isoformat(), "error": str(error) + (": " + error.read(2000).decode("utf-8",errors="replace") if isinstance(error, urllib.error.HTTPError) else "")})
        else:
            metadata["failedAcquisitions"].append({"id": station_id, "attempts": failures, "dataCached": False})
            persist_metadata(metadata)
            raise RuntimeError(f"{station_id}: bounded providers unavailable")
        retrieved_at = datetime.now(timezone.utc).isoformat()
        if failures:
            metadata["failedAcquisitions"].append({"id": station_id, "attempts": failures, "dataCached": True})
    raw = json.loads(payload)
    if osm_api:
        nodes={e['id']:{'lat':e['lat'],'lon':e['lon']} for e in raw['elements'] if e.get('type')=='node'}
        reconstructed=[]
        for e in raw['elements']:
            if e.get('type')=='way' and e.get('nodes'):
                if all(ref in nodes for ref in e['nodes']):
                    e={**e,'geometry':[nodes[ref] for ref in e['nodes']]}
            reconstructed.append(e)
        normalized={**raw,'elements':reconstructed}
    else:
        normalized=raw
    elements = compact_elements(normalized, station)
    source = {
        "provider": "OpenStreetMap contributors via OSM API 0.6" if osm_api else "OpenStreetMap contributors via Overpass API",
        "format": "OSM API JSON node references resolved to returned coordinates" if osm_api else "Overpass geometry JSON",
        "boundingBox": bbox if osm_api else None,
        "queryCenter": {"latitude":(bbox[1]+bbox[3])/2,"longitude":(bbox[0]+bbox[2])/2} if osm_api else {"latitude":station["latitude"],"longitude":station["longitude"]},
        "selectionReference": {"latitude":station["latitude"],"longitude":station["longitude"]},
        "coverage": "Exact boundingBox is authoritative; station reference and map query center may differ. No complete distant skyline or terrain is claimed." if osm_api else "Queried circular source vicinity; no complete distant skyline or terrain is claimed.",
        "sourceUrl": source_url,
        "query": query,
        "retrievedAt": retrieved_at,
        "osmTimestamp": raw.get("osm3s", {}).get("timestamp_osm_base"),
        "rawFile": f"data/raw/viewpoint-{station_id}.json",
        "rawSha256": hashlib.sha256(payload).hexdigest(),
        "license": "ODbL 1.0",
        "licenseUrl": "https://opendatacommons.org/licenses/odbl/1-0/",
        "attribution": "© OpenStreetMap contributors",
        "attributionUrl": "https://www.openstreetmap.org/copyright",
        "changes": "Selected up to 650 nearest building ways plus all building parts and buildings carrying height/levels/name tags, and roads/water/wood/parks/grass ways. Selected ground furniture/viewpoint/tree/tower nodes retain their source coordinates and tags, without editing metadata. Source IDs, tags and geometry preserved; OSM API way node references resolve to returned original node coordinates. Bounding-box coverage may be partial; included relation membership is retained but missing outer members are not invented. Relation multipolygons and terrain not reconstructed. Unmapped architectural details and missing heights must not be described as exact.",
    }
    relevant_relations=[{key:e[key] for key in ('type','id','tags','members') if key in e} for e in raw['elements'] if e.get('type')=='relation' and (e.get('tags',{}).get('natural') in ('water','wood') or e.get('tags',{}).get('leisure')=='park' or e.get('tags',{}).get('landuse') in ('forest','grass'))]
    relation_way_ids={m['ref'] for r in relevant_relations for m in r.get('members',[]) if m.get('type')=='way'}
    already={e['id'] for e in elements}
    for e in normalized['elements']:
        if e.get('type')=='way' and e.get('id') in relation_way_ids and e['id'] not in already and e.get('geometry'):
            elements.append({key:e[key] for key in ('type','id','tags','geometry') if key in e})
    diagnostic = [{key: element[key] for key in ("type", "id", "lat", "lon", "center", "tags") if key in element} for element in raw["elements"] if element.get("tags", {}).get("tourism") and element.get("tags", {}).get("name")]
    output = {"id": station_id, "name": station["name"], "observer": source["queryCenter"], "requestedViewpointApproximation": {"latitude":station["latitude"],"longitude":station["longitude"]}, "radiusMeters": round(min((bbox[3]-bbox[1])*.5*111320,(bbox[2]-bbox[0])*.5*111320*math.cos(station["latitude"]*math.pi/180))) if osm_api else station["radius"], "source": source, "elements": elements, "namedMapFeatures": diagnostic, "relations":relevant_relations}
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    if not verify and (refresh or not raw_path.exists()):
        raw_path.write_bytes(payload)
    target = ROOT / f"public/data/viewpoint-{station_id}.json"
    text=json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n'
    if verify:
        if target.read_text(encoding='utf-8') != text:
            raise ValueError('Public asset does not exactly reproduce from its source and provenance')
    else:
        target.write_text(text,encoding='utf-8')
    buildings = [e for e in elements if e.get("tags", {}).get("building")]
    result = {**source, "id": station_id, "observer": output["observer"], "radiusMeters": output["radiusMeters"], "outputFile": str(target.relative_to(ROOT)).replace("\\", "/"), "rawBytes": len(payload), "compactBytes": target.stat().st_size, "sourceElements": len(raw["elements"]), "elements": len(elements), "buildingWays": len(buildings), "buildingParts":sum(bool(e.get("tags",{}).get("building:part")) for e in elements), "heightTaggedBuildings": sum("height" in e.get("tags", {}) for e in buildings), "levelsTaggedBuildings": sum("building:levels" in e.get("tags", {}) for e in buildings)}
    result['heightTaggedParts']=sum(bool(e.get('tags',{}).get('building:part')) and 'height' in e.get('tags',{}) for e in elements)
    result['levelsTaggedParts']=sum(bool(e.get('tags',{}).get('building:part')) and 'building:levels' in e.get('tags',{}) for e in elements)
    result['selectedNodes']=sum(e.get('type')=='node' for e in elements)
    metadata["sources"] = [item for item in metadata["sources"] if item["id"] != station_id] + [result]
    if not verify:
        persist_metadata(metadata)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stations", nargs="*", choices=list(STATIONS))
    parser.add_argument("--refresh", action="store_true")
    parser.add_argument("--osm-api", action="store_true", help="One bounded OSM API JSON bounding-box request instead of Overpass")
    parser.add_argument("--verify", action="store_true", help="Verify cached sources and exact public reproduction without network or writes")
    args = parser.parse_args()
    failed = False
    for station_id in args.stations or ["kl-sky-deck"]:
        try:
            result = acquire(station_id, args.refresh, args.osm_api, args.verify)
            print(json.dumps({key: result[key] for key in ("id", "sourceElements", "buildingWays", "heightTaggedBuildings", "levelsTaggedBuildings", "rawBytes", "compactBytes")}), flush=True)
        except (OSError, RuntimeError, ValueError) as error:
            failed = True
            print(str(error), flush=True)
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
