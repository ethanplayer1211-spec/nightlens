"""Acquire original Google Fonts Latin WOFF2 faces and family OFL texts.

Default is an offline SHA-256/header verification. --refresh fetches current
official CSS2 descriptors, original font files and upstream family license files.
No local font subsetting, conversion, renaming of font-internal names, or editing.
"""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import struct
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
META = ROOT / 'data/font-assets.json'
CSS_URL = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400..600&family=DM+Mono:wght@400;500&display=swap'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
FAMILIES = {'Instrument Serif': 'instrumentserif', 'DM Sans': 'dmsans', 'DM Mono': 'dmmono'}


def read(url: str) -> bytes:
    with urlopen(Request(url, headers={'User-Agent': UA}), timeout=30) as response:
        blob = response.read(500_001)
    if len(blob) > 500_000:
        raise ValueError('Unexpectedly large font or license response')
    return blob


def digest(blob: bytes) -> str:
    return hashlib.sha256(blob).hexdigest()


def check_font(blob: bytes) -> None:
    if blob[:4] != b'wOF2' or len(blob) < 48 or struct.unpack_from('>I', blob, 8)[0] != len(blob):
        raise ValueError('Font is not a complete original WOFF2 file')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if not args.refresh:
        data = json.loads(META.read_text(encoding='utf-8'))
        for face in data['faces']:
            blob = (ROOT / face['publicFile']).read_bytes()
            check_font(blob)
            if digest(blob) != face['sha256']:
                raise ValueError('Cached font hash mismatch: '+face['publicFile'])
        for license in data['licenses']:
            if digest((ROOT / license['publicFile']).read_bytes()) != license['sha256']:
                raise ValueError('Cached license hash mismatch')
        print(f"Verified {len(data['faces'])} original WOFF2 fonts and {len(data['licenses'])} OFL files")
        return
    css = read(CSS_URL).decode('utf-8')
    faces = []
    for subset, body in re.findall(r'/\*\s*([^*]+?)\s*\*/\s*@font-face\s*\{([^}]+)\}', css):
        if subset.strip() != 'latin':
            continue
        family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
        style = re.search(r'font-style:\s*([^;]+)', body).group(1).strip()
        weight = re.search(r'font-weight:\s*([^;]+)', body).group(1).strip()
        url = re.search(r'url\(([^)]+)\)', body).group(1)
        unicode_range = re.search(r'unicode-range:\s*([^;]+)', body).group(1).strip()
        slug = family.lower().replace(' ', '-')
        filename = f"{slug}-latin-{weight.replace(' ', '-')}-{style}.woff2"
        faces.append({'family': family, 'style': style, 'weight': weight, 'subset': 'latin', 'unicodeRange': unicode_range, 'downloadUrl': url, 'publicFile': 'public/fonts/'+filename, 'cssPath': '/fonts/'+filename, 'license': 'SIL Open Font License 1.1', 'licenseFile': 'public/fonts/OFL-'+slug+'.txt', 'changes': 'None; original provider-supplied Latin WOFF2 bytes. No local subsetting or conversion.'})
    expected = {('Instrument Serif','normal','400'), ('Instrument Serif','italic','400'), ('DM Sans','normal','400 600'), ('DM Mono','normal','400'), ('DM Mono','normal','500')}
    if {(f['family'],f['style'],f['weight']) for f in faces} != expected:
        raise ValueError('Official CSS did not return the exact requested descriptors')
    licenses = [{'family': family, 'sourceUrl': f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/OFL.txt', 'publicFile': 'public/fonts/OFL-'+family.lower().replace(' ','-')+'.txt'} for family,folder in FAMILIES.items()]
    jobs = [(face,face['downloadUrl'],True) for face in faces]+[(lic,lic['sourceUrl'],False) for lic in licenses]
    def acquire(job):
        record,url,is_font = job
        blob = read(url)
        if is_font:
            check_font(blob)
        elif b'SIL OPEN FONT LICENSE Version 1.1' not in blob:
            raise ValueError('Upstream family license is not the expected OFL text')
        target = ROOT / record['publicFile']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(blob)
        record.update({'bytes':len(blob),'sha256':digest(blob),'retrievedAt':datetime.now(timezone.utc).isoformat()})
        return record
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(acquire,jobs))
    metadata = {'schemaVersion':1,'cssSourceUrl':CSS_URL,'cssUserAgent':UA,'cssResponse':css,'faces':faces,'licenses':licenses,'policy':'Original Google Fonts Latin WOFF2 subset files and original upstream OFL texts. No font binaries modified. Font licensing remains separate from application MIT license.'}
    META.write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for face in faces:
        print(json.dumps({key:face[key] for key in ['family','style','weight','cssPath','bytes']}))


if __name__ == '__main__':
    main()
