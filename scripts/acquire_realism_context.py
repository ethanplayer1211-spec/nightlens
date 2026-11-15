"""Acquire explicitly licensed context references/materials; default verifies cached bytes.

This does not remove skies, synthesize photographs, or calibrate a panorama.
Use --refresh for outbound HTTPS. The texture/photo license stays separate from app code.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'data/realism-context-sources.json'
PUBLIC = ROOT / 'public/data/realism'
UA = 'NightLens scientific visualization prototype; attributed public asset acquisition'
ASSETS = [
    {
        'id': 'square-floor-diffuse', 'filename': 'square-floor-diffuse-1k.jpg',
        'downloadUrl': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/square_floor/square_floor_diff_1k.jpg',
        'sourceUrl': 'https://polyhaven.com/a/square_floor',
        'author': 'Rob Tuytel / Poly Haven', 'license': 'CC0 1.0',
        'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'providerMd5': '6a0612931ceb2f91d95c3efe179ed8bf',
        'kind': 'material-diffuse', 'physicalWidthMeters': 2,
        'limits': 'Generic measured material texture, not evidence that the named city or KL Tower uses this exact paving.',
    },
    {
        'id': 'square-floor-normal-gl', 'filename': 'square-floor-normal-gl-1k.jpg',
        'downloadUrl': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/square_floor/square_floor_nor_gl_1k.jpg',
        'sourceUrl': 'https://polyhaven.com/a/square_floor',
        'author': 'Rob Tuytel / Poly Haven', 'license': 'CC0 1.0',
        'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'providerMd5': 'a35229ec48321b67911e30297ad6f3ba',
        'kind': 'material-normal-opengl', 'physicalWidthMeters': 2,
        'limits': 'Generic surface microstructure, not a site survey. OpenGL tangent-space normal convention.',
    },
    {
        'id': 'square-floor-roughness', 'filename': 'square-floor-roughness-1k.jpg',
        'downloadUrl': 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/square_floor/square_floor_rough_1k.jpg',
        'sourceUrl': 'https://polyhaven.com/a/square_floor',
        'author': 'Rob Tuytel / Poly Haven', 'license': 'CC0 1.0',
        'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'providerMd5': '40918410c9a5821c6c25bbbfb97387ce',
        'kind': 'material-roughness', 'physicalWidthMeters': 2,
        'limits': 'Generic roughness field; not a measured named-station material or wetness state.',
    },
    {
        'id': 'kl-tower-petronas-night-reference', 'filename': 'kl-tower-petronas-night-reference.jpg',
        'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Petronas_Twin_Towers._View_from_KL_Tower._2019-11-30_20-50-32_%28panorama%29.jpg/3840px-Petronas_Twin_Towers._View_from_KL_Tower._2019-11-30_20-50-32_%28panorama%29.jpg',
        'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Petronas_Twin_Towers._View_from_KL_Tower._2019-11-30_20-50-32_(panorama).jpg',
        'author': 'Maxim Shesterikov (Shesmax)', 'license': 'CC BY-SA 4.0',
        'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/',
        'kind': 'historical-photo-reference', 'capturedAt': '2019-11-30T20:50:32',
        'originalDimensions': [8654, 3840], 'downloadDimensions': [3840, 1704],
        'changes': 'Wikimedia server-provided 3840-pixel thumbnail of original photograph; no local image edits.',
        'projection': 'Stitched perspective panoramic photograph; not a certified equirectangular 360-degree landscape.',
        'cameraPoseStatus': 'Uncalibrated. Description says view from KL Tower, but metadata geotag 3.158,101.712 lies at Petronas, not at KL Tower. It cannot certify the eye coordinates, north/horizon, deck level or angular mapping.',
        'limits': 'Historic reference only. Its photographed sky/lighting/weather do not represent a current sky, a controlled dimming scenario or the exact current city. Do not silently register it as measured surroundings.',
    },
    {'id': 'sydney-harbour-reference', 'filename': 'sydney-harbour-reference.jpg', 'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/View_from_Mrs_Macquaries_Point%2C_Sydney_%28483336%29_%289442907794%29.jpg/3840px-View_from_Mrs_Macquaries_Point%2C_Sydney_%28483336%29_%289442907794%29.jpg', 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:View_from_Mrs_Macquaries_Point,_Sydney_(483336)_(9442907794).jpg', 'author': 'Robert Linsdell', 'license': 'CC BY 2.0', 'licenseUrl': 'https://creativecommons.org/licenses/by/2.0/', 'kind': 'historical-photo-reference', 'capturedAt': '2012-11-25', 'sourceCameraCoordinates': [-33.859443, 151.221857], 'projection': 'Stitched partial panorama, not certified equirectangular 360.', 'cameraPoseStatus': 'Source location is approximately 3 m from the selected Sydney station;  north/horizon/FOV are not certified.', 'changes': 'Wikimedia server-provided 3840-pixel thumbnail; no local image edits.', 'limits': 'Historic geographic/material reference only; original sky, illumination and weather are fixed photographic content, not the calculated selected-time sky.'},
    {'id': 'london-primrose-reference', 'filename': 'london-primrose-reference.jpg', 'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Primrose_Hill_Panorama%2C_London_-_April_2011.jpg/3840px-Primrose_Hill_Panorama%2C_London_-_April_2011.jpg', 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Primrose_Hill_Panorama,_London_-_April_2011.jpg', 'author': 'DAVID ILIFF', 'license': 'CC BY-SA 3.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/3.0/', 'kind': 'historical-photo-reference', 'capturedAt': '2011-04-09', 'sourceCameraCoordinates': [51.539616, -0.160683], 'projection': 'Stitched partial panorama, not certified equirectangular 360.', 'cameraPoseStatus': 'Source camera coordinates are near the selected summit station;  no certified north/horizon/FOV registration.', 'changes': 'Wikimedia server-provided 3840-pixel thumbnail; no local image edits.', 'limits': 'Historic geographic/material reference only; original sky, illumination and weather are fixed photographic content, not the calculated selected-time sky.'},
    {'id': 'seoul-namsan-reference', 'filename': 'seoul-namsan-reference.jpg', 'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Seoul_from_Namsan_3.jpg/3840px-Seoul_from_Namsan_3.jpg', 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Seoul_from_Namsan_3.jpg', 'author': 'kallerna', 'license': 'CC BY-SA 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/', 'kind': 'historical-photo-reference', 'capturedAt': '2022-12-04', 'sourceCameraCoordinates': None, 'projection': 'Stitched partial north-facing panorama, not a calibrated 360-degree panorama.', 'cameraPoseStatus': 'Description verifies north-facing view from Namsan, but exact outdoor eye position and north/horizon registration are not established.', 'changes': 'Wikimedia server-provided 3840-pixel thumbnail; no local image edits.', 'limits': 'Historic geographic/material reference only; original sky, illumination and weather are fixed photographic content, not the calculated selected-time sky.'},
    {'id': 'new-york-pier1-reference', 'filename': 'new-york-pier1-reference.jpg', 'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Brooklyn_Bridge-Manhattan_Skyline.jpg/3840px-Brooklyn_Bridge-Manhattan_Skyline.jpg', 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Brooklyn_Bridge-Manhattan_Skyline.jpg', 'author': "Aaron D'Angelo", 'license': 'CC BY-SA 4.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/', 'kind': 'historical-photo-reference', 'capturedAt': '2017-07-12', 'sourceCameraCoordinates': None, 'projection': 'Stitched partial panorama, not a calibrated 360-degree panorama.', 'cameraPoseStatus': 'Commons categorizes this image at Pier 1, but camera coordinate / eye height/north/horizon/FOV are not supplied.', 'changes': 'Wikimedia server-provided 3840-pixel thumbnail; no local image edits.', 'limits': 'Historic geographic/material reference only; original sky, illumination and weather are fixed photographic content, not the calculated selected-time sky.'},
    {'id': 'atacama-valley-reference', 'filename': 'atacama-valley-reference.jpg', 'downloadUrl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/360%C2%B0_Panorama_Valle_de_la_Luna_Atacama_Chile.jpg/3840px-360%C2%B0_Panorama_Valle_de_la_Luna_Atacama_Chile.jpg', 'sourceUrl': 'https://commons.wikimedia.org/wiki/File:360%C2%B0_Panorama_Valle_de_la_Luna_Atacama_Chile.jpg', 'author': 'Uwe Behm (Uwebart)', 'license': 'CC BY-SA 3.0', 'licenseUrl': 'https://creativecommons.org/licenses/by-sa/3.0/', 'kind': 'historical-photo-reference', 'capturedAt': '2012-03-15', 'sourceCameraCoordinates': None, 'projection': 'Author-described 360-degree horizontal panoramic strip; not full 180-degree vertical coverage.', 'cameraPoseStatus': 'No source camera coordinates or north/horizon registration. Valle de la Luna is not proof of capture at Mirador de Kari.', 'changes': 'Wikimedia server-provided 3840-pixel thumbnail; no local image edits.', 'limits': 'Historic geographic/material reference only; original sky, illumination and weather are fixed photographic content, not the calculated selected-time sky.'}
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--materials-only', action='store_true')
    parser.add_argument('--ids', nargs='*', help='Explicit asset ids; otherwise refresh all or verify the acquired manifest')
    args = parser.parse_args()
    previous = json.loads(META.read_text(encoding='utf-8')) if META.exists() else {}
    records = {item['id']: item for item in previous.get('assets', [])}
    selected = set(args.ids) if args.ids is not None else None
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for asset in ASSETS:
        if selected is not None and asset['id'] not in selected:
            continue
        if not args.refresh and selected is None and asset['id'] not in records:
            continue
        if args.materials_only and asset['kind'] == 'historical-photo-reference':
            continue
        target = PUBLIC / asset['filename']
        if args.refresh:
            with urlopen(Request(asset['downloadUrl'], headers={'User-Agent': UA}), timeout=60) as response:
                blob = response.read(25_000_001)
            if len(blob) > 25_000_000 or not blob.startswith(b'\xff\xd8'):
                raise ValueError(f"Unexpected or oversized JPEG for {asset['id']}")
            target.write_bytes(blob)
            retrieved = datetime.now(timezone.utc).isoformat()
        else:
            blob = target.read_bytes()
            retrieved = records[asset['id']]['retrievedAt']
            if hashlib.sha256(blob).hexdigest() != records[asset['id']]['sha256']:
                raise ValueError(f"Cached SHA-256 mismatch for {asset['id']}")
        if asset.get('providerMd5') and hashlib.md5(blob).hexdigest() != asset['providerMd5']:
            raise ValueError(f"Provider MD5 mismatch for {asset['id']}")
        records[asset['id']] = {**asset, 'publicFile': target.relative_to(ROOT).as_posix(), 'retrievedAt': retrieved, 'sha256': hashlib.sha256(blob).hexdigest(), 'bytes': len(blob)}
        if args.refresh:
            META.write_text(json.dumps({**previous, 'schemaVersion': 1, 'assets': list(records.values()), 'policy': 'Original downloaded bytes retained. Photos are uncalibrated historical references, not registered 360-degree scenes; materials are generic illustrative finishes.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'id': asset['id'], 'bytes': len(blob), 'sha256': records[asset['id']]['sha256']}), flush=True)
    if args.refresh:
        META.write_text(json.dumps({**previous, 'schemaVersion': 1, 'assets': list(records.values()), 'policy': 'Original downloaded bytes retained. Photos are uncalibrated historical references, not registered 360-degree scenes; materials are generic illustrative finishes.'}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
