"""Bounded cached OSM building context. No inferred positions, heights or geometry.

Default acquires KL only. --verify uses source bytes/hashes without network/writes.
Public source/derived geometry remains ODbL 1.0, separate from app licensing.
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
META = ROOT / "data/context-sources.json"
STATIONS = {
    "kl-sky-deck": (3.15293,101.70386),
    "penang-esplanade": (5.4215763,100.3423921),
    "seoul-namsan": (37.5519388,126.9885103),
    "sydney-macquaries": (-33.8594584,151.221884),
    "london-primrose": (51.5395287,-.1606936),
    "new-york-pier1": (40.7019951,-73.9974077),
    "atacama-kari": (-22.9169811,-68.2545001),
}
ENDPOINTS = ("https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter")
MAX_RAW = 12_000_000
MAX_TOTAL_PUBLIC = 20 * 1024 * 1024
MAX_REQUESTS = 15
requests_this_run = 0

def now(): return datetime.now(timezone.utc).isoformat()
def digest(data): return hashlib.sha256(data).hexdigest()
def read_meta(): return json.loads(META.read_text(encoding="utf-8")) if META.exists() else {"sources":[],"failures":[]}
def save_meta(meta): META.write_text(json.dumps(meta,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def query_for(site):
    lat,lon=STATIONS[site]
    if site!='kl-sky-deck':
        return ('[out:json][timeout:25];('
            f'way["building"](around:900,{lat},{lon});'
            f'way["building"]["height"](around:4200,{lat},{lon})(if:number(t["height"])>=20);'
            f'way["building"]["building:levels"](around:4200,{lat},{lon})(if:number(t["building:levels"])>=7);'
            f'way["building:part"]["height"](around:3200,{lat},{lon})(if:number(t["height"])>=20);'
            ');out tags geom;')
    return ('[out:json][timeout:25];('
        f'way["building"](around:1800,{lat},{lon});'
        f'way["building"]["height"](around:4200,{lat},{lon});'
        f'way["building"]["building:levels"](around:4200,{lat},{lon});'
        f'way["building:part"]["height"](around:3200,{lat},{lon});'
        ');out tags geom;')

def fetch(url):
    global requests_this_run
    if requests_this_run >= MAX_REQUESTS: raise RuntimeError("Bounded request budget exhausted")
    requests_this_run += 1
    req=urllib.request.Request(url,headers={"User-Agent":"NightLens educational astronomy project; attributed, bounded public OSM building context", "Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=35) as r: payload=r.read(MAX_RAW+1)
    if len(payload)>MAX_RAW: raise RuntimeError("Bounded source size exceeded")
    raw=json.loads(payload)
    if not isinstance(raw.get("elements"),list) or raw.get("remark"): raise RuntimeError("Incomplete source response: "+str(raw.get("remark")))
    return payload,raw

def normalize(raw):
    nodes={e['id']:e for e in raw['elements'] if e.get('type')=='node'}
    result=[]
    for e in raw['elements']:
        tags=e.get('tags',{})
        if e.get('type')!='way' or not (tags.get('building') or tags.get('building:part')): continue
        geom=e.get('geometry')
        if not geom and e.get('nodes'):
            if not all(n in nodes for n in e['nodes']): continue
            geom=[{'lat':nodes[n]['lat'],'lon':nodes[n]['lon']} for n in e['nodes']]
        if not geom or len(geom)<4: continue
        if any(not isinstance(p.get(k),(int,float)) or not math.isfinite(p[k]) for p in geom for k in ('lat','lon')): continue
        # Preserve genuinely closed source building rings; never invent missing joins.
        if geom[0]!=geom[-1]: continue
        result.append({'type':'way','id':e['id'],'tags':tags,'geometry':geom})
    return result

def unavailable(site,meta,status,reason,verify=False):
    source={'status':status,'reason':reason,'method':'No substitute building positions, geometry or heights are generated. Existing named-viewpoint map and terrain remain separate assets.'}
    text=json.dumps({'id':site,'elements':[],'source':source},ensure_ascii=False,separators=(',',':'))+'\n'
    target=ROOT/f'public/data/context-{site}.json'
    if verify:
        if target.read_text(encoding='utf-8')!=text: raise ValueError('Empty context status asset does not reproduce')
    else:
        target.write_text(text,encoding='utf-8',newline='\n')
        meta['sources']=[s for s in meta['sources'] if s['id']!=site]+[{'id':site,'status':status,'reason':reason,'rawBatches':[],'elements':0,'publicFile':target.relative_to(ROOT).as_posix(),'bytes':len(text.encode('utf-8'))}]
        save_meta(meta)
    return {'id':site,'status':status,'elements':0,'bytes':len(text.encode('utf-8'))}

def acquire(site,meta,verify=False):
    previous=next((s for s in meta['sources'] if s['id']==site),None)
    if site=='atacama-kari': return unavailable(site,meta,'not-applicable','Terrain-led desert lookout; no additional city-building acquisition was requested.',verify)
    if previous and previous.get('status') in ('unavailable','not-applicable'):
        return unavailable(site,meta,previous['status'],previous['reason'],verify)
    if previous:
        batches=previous['rawBatches']
    elif verify: raise ValueError('No cached context for '+site)
    else:
        batches=[];query=query_for(site)
        for endpoint in ENDPOINTS:
            url=endpoint+'?'+urllib.parse.urlencode({'data':query})
            try:
                payload,raw=fetch(url)
                path=ROOT/f'data/raw/context-{site}-overpass.json';path.write_bytes(payload)
                batches=[{'sourceUrl':url,'query':query,'retrievedAt':now(),'rawFile':path.relative_to(ROOT).as_posix(),'sha256':digest(payload),'bytes':len(payload),'format':'Overpass tags geom'}]
                break
            except (OSError,ValueError,RuntimeError) as e:
                meta['failures'].append({'id':site,'url':url,'failedAt':now(),'error':str(e)});save_meta(meta)
        if not batches:
            if site!='kl-sky-deck': raise RuntimeError('No bounded context source available for '+site)
            # Explicit adjoining patches around KL's original 1.3 km square cache.
            # At most eight API requests, using small bounding boxes rather than a city dump.
            for index,(west,south,east,north) in enumerate([
                (101.6898,3.1494,101.7018,3.1614),
                (101.7018,3.1374,101.7138,3.1494),
                (101.7138,3.1494,101.7258,3.1614),
                (101.7018,3.1614,101.7138,3.1734),
                (101.6898,3.1374,101.7018,3.1494),
                (101.7138,3.1374,101.7258,3.1494),
                (101.6898,3.1614,101.7018,3.1734),
                (101.7138,3.1614,101.7258,3.1734),
            ]):
                bbox=[west,south,east,north];url='https://api.openstreetmap.org/api/0.6/map.json?bbox='+','.join(f'{v:.7f}' for v in bbox)
                path=ROOT/f'data/raw/context-{site}-tile{index}.json'
                try:
                    payload,raw=fetch(url);path.write_bytes(payload)
                    batches.append({'sourceUrl':url,'boundingBox':bbox,'retrievedAt':now(),'rawFile':path.relative_to(ROOT).as_posix(),'sha256':digest(payload),'bytes':len(payload),'format':'OSM API nodes and ways'})
                except (OSError,ValueError,RuntimeError) as e:
                    meta['failures'].append({'id':site,'url':url,'failedAt':now(),'error':str(e)});save_meta(meta)
                time.sleep(.7)
            if not batches: raise RuntimeError('All bounded KL context sources failed')
    merged={}
    for batch in batches:
        payload=(ROOT/batch['rawFile']).read_bytes()
        if digest(payload)!=batch['sha256']: raise ValueError('Raw hash mismatch')
        for e in normalize(json.loads(payload)): merged[e['id']]=e
    elements=sorted(merged.values(),key=lambda e:e['id'])
    source={'provider':'OpenStreetMap contributors','license':'ODbL 1.0','licenseUrl':'https://opendatacommons.org/licenses/odbl/1-0/','attribution':'© OpenStreetMap contributors','attributionUrl':'https://www.openstreetmap.org/copyright','rawBatches':batches,'method':'Selected actual closed building and building-part ways from bounded source queries; source tags/IDs and resolved geometry preserved. Duplicate source IDs merged. Missing ways, holes, relation parts, heights or city coverage are not invented. Exact batch query/bounding box defines coverage, not a promise of complete skyline.'}
    output={'id':site,'elements':elements,'source':source}
    text=json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n';target=ROOT/f'public/data/context-{site}.json'
    if verify:
        if target.read_text(encoding='utf-8')!=text: raise ValueError('Derived context does not reproduce')
    else:
        other=sum(p.stat().st_size for p in (ROOT/'public/data').glob('context-*.json') if p!=target)
        if other+len(text.encode('utf-8'))>MAX_TOTAL_PUBLIC: raise ValueError('Total context public asset limit exceeded')
        target.write_text(text,encoding='utf-8',newline='\n')
        record={'id':site,'rawBatches':batches,'elements':len(elements),'publicFile':target.relative_to(ROOT).as_posix(),'bytes':len(text.encode('utf-8')),'heightTagged':sum('height' in e['tags'] for e in elements),'levelsTagged':sum('building:levels' in e['tags'] for e in elements),'parts':sum('building:part' in e['tags'] for e in elements)}
        meta['sources']=[s for s in meta['sources'] if s['id']!=site]+[record];save_meta(meta)
    return {'id':site,'elements':len(elements),'bytes':len(text.encode('utf-8')),'batches':len(batches)}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('sites',nargs='*');parser.add_argument('--verify',action='store_true');args=parser.parse_args()
    if any(s not in STATIONS for s in args.sites): parser.error('Unknown site')
    meta=read_meta()
    for site in args.sites or (list(STATIONS) if args.verify else ['kl-sky-deck']):
        try: print(json.dumps(acquire(site,meta,args.verify)),flush=True)
        except (OSError,ValueError,RuntimeError) as e:
            print(json.dumps({'id':site,'error':str(e)}),flush=True)
            if args.verify: raise
            unavailable(site,meta,'unavailable',str(e)+'. Source failures are recorded in data/context-sources.json.')
if __name__=='__main__': main()
