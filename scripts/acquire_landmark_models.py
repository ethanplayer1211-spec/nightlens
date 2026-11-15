"""Verify or reacquire the two attributed landmark models from Ai2's public archive.

No Sketchfab viewer extraction or authenticated download endpoint is used.
Individual CC BY 4.0 licenses are retained separately from the Objaverse database license.
No model geometry, image, or texture is edited by this script.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'data/landmark-model-sources.json'
UA = 'NightLens scientific visualization prototype; attributed public model acquisition'


def glb_info(blob: bytes) -> dict:
    magic, version, size = struct.unpack_from('<4sII', blob)
    if magic != b'glTF' or version != 2 or size != len(blob):
        raise ValueError('Invalid GLB header')
    chunk_size, chunk_type = struct.unpack_from('<II', blob, 12)
    if chunk_type != 0x4E4F534A:
        raise ValueError('GLB first chunk is not JSON')
    return json.loads(blob[20:20+chunk_size])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    metadata = json.loads(META.read_text(encoding='utf-8'))
    for model in metadata['acquiredModels']:
        target = ROOT / (model.get('publicFile') or model['rawFile'])
        if args.refresh:
            with urlopen(Request(model['downloadUrl'], headers={'User-Agent': UA}), timeout=60) as response:
                blob = response.read(15_000_001)
            if len(blob) > 15_000_000:
                raise ValueError('Model exceeds the bounded 15 MB acquisition limit')
        else:
            blob = target.read_bytes()
        if hashlib.sha256(blob).hexdigest() != model['sha256']:
            raise ValueError(f"Pinned SHA-256 changed for {model['id']}; inspect source and rights before updating")
        gltf = glb_info(blob)
        extras = gltf.get('asset', {}).get('extras', {})
        if model['sketchfabUid'] not in extras.get('source', '') or 'CC-BY-4.0' not in extras.get('license', ''):
            raise ValueError('GLB provenance does not match the verified source UID/license')
        archive = ROOT / model['rawFile']
        if args.refresh:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(blob)
            archive.write_bytes(blob)
        elif archive.read_bytes() != blob:
            raise ValueError('Public model is not the preserved original archive binary')
        print(json.dumps({'id': model['id'], 'bytes': len(blob), 'meshes': len(gltf.get('meshes', [])), 'materials': len(gltf.get('materials', [])), 'images': len(gltf.get('images', [])), 'sha256': model['sha256']}), flush=True)


if __name__ == '__main__':
    main()
