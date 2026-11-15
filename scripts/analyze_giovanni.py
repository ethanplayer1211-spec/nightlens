"""Parse the untouched owner-authorized Giovanni CSV; reproduce the complete trend cache offline."""
import csv
import hashlib
import io
import json
from pathlib import Path
import numpy as np
import statsmodels.api as sm
from scipy.stats import t
from analyze_data import annualize, analyze

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/giovanni-modis-penang-2001-2024.csv'

def analyze_calendar(annual, start, end):
    """Lag one means one calendar year; never bridge an excluded year in the HAC meat."""
    result=analyze(annual,start,end)
    if result['n']<8: return result
    valid=[p for p in annual if start<=p['year']<=end and p['value'] is not None]
    years=np.array([p['year'] for p in valid])
    design=sm.add_constant(years-start)
    fit=sm.OLS(np.array([p['value'] for p in valid]),design).fit()
    score=design*fit.resid[:,None]
    meat=score.T@score
    for i in range(1,len(valid)):
        if years[i]-years[i-1]==1:
            pair=np.outer(score[i],score[i-1])
            meat+=.5*(pair+pair.T)
    bread=np.linalg.inv(design.T@design)
    covariance=bread@meat@bread*len(valid)/(len(valid)-2)
    error=float(np.sqrt(max(0,covariance[1,1])))
    slope=result['slopePerYear'];critical=float(t.ppf(.975,len(valid)-2))
    result['ci95PerYear']=[slope-critical*error,slope+critical*error]
    result['pValue']=float(2*t.sf(abs(slope/error),len(valid)-2)) if error else (0.0 if slope else 1.0)
    result['method']='OLS; Newey–West HAC, calendar-year lag 1 (no gap bridging), Bartlett weights, n/(n−2) correction, Student-t inference'
    return result

def parse_export(raw: bytes):
    rows = list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
    header_index = next(i for i, row in enumerate(rows) if row and row[0] == 'time')
    metadata = {row[0].rstrip(':'): row[1].strip() for row in rows[:header_index] if len(row) == 2}
    if metadata['User Bounding Box'] != '100,5,101,6' or metadata['Data Bounding Box'] != '100.5,5.5,100.5,5.5':
        raise ValueError('Unexpected extraction bounds')
    if metadata['User Start Date'] != '2001-01-01T00:00:00Z' or metadata['User End Date'] != '2024-12-31T23:59:59Z':
        raise ValueError('Unexpected extraction interval')
    if 'MOD08_M3_6_1_AOD_550_Dark_Target_Deep_Blue_Combined_Mean_Mean' not in rows[header_index][1]:
        raise ValueError('Unexpected MODIS science variable')
    observations = []
    for row in rows[header_index+1:]:
        if not row: continue
        date, value = row[0], float(row[1])
        observations.append({'year': int(date[:4]), 'month': int(date[5:7]), 'value': value if value >= 0 else None})
    if len(observations) != 288:
        raise ValueError('Expected 288 monthly timestamps')
    return metadata, observations

def main():
    raw = RAW.read_bytes()
    meta, observations = parse_export(raw)
    annual = annualize(observations)
    years = [point['year'] for point in annual]
    data = {
        'region': {'id': 'penang', 'name': 'Penang, Malaysia', 'latitude': 5.4141, 'longitude': 100.3354, 'utcOffset': 8, 'elevation': 10},
        'variable': 'Combined Dark Target + Deep Blue aerosol optical depth at 550 nm',
        'parameter': 'MOD08_M3.061.AOD550', 'units': 'dimensionless',
        'provider': 'NASA GES DISC · MODIS Terra MOD08_M3 v6.1 via Giovanni',
        'sourceKind': 'Satellite retrieval · monthly Level 3 composite',
        'spatialResolution': '1° source grid · requested 100–101° E, 5–6° N · actual grid centre 100.5° E, 5.5° N',
        'sourceUrl': meta['URL to Reproduce Results'],
        'documentationUrl': 'https://earth.gsfc.nasa.gov/climate/data/deep-blue/data',
        'retrievedAt': '2026-11-15', 'sha256': hashlib.sha256(raw).hexdigest(),
        'sourceHeader': {'sources': ['MOD08_M3.061'], 'exportMetadata': meta},
        'observations': observations, 'annual': annual,
        'windows': {f'{start}-{end}': analyze_calendar(annual,start,end) for start in years for end in years if start < end},
        'processing': {
            'aggregation': 'Day-weighted annual mean of 12 complete monthly Level-3 composite values; incomplete years excluded.',
            'scaling': 'Use exported physical values as returned; no second application of MODIS integer scale factor.',
            'quality': 'Fill −9999 and negative values excluded. Export supplies no monthly retrieval-count or pixel QA columns. Clear-sky sampling, clouds and retrieval uncertainty remain limitations.',
            'uncertainty': 'OLS with calendar-year Newey–West HAC lag 1, Bartlett weights, n/(n−2) correction and Student-t inference. October 2022 is fill, excluding 2022; HAC pairs only adjacent calendar years and does not bridge this gap. Residual-lag diagnostic is consecutive retained observations. Not measurement error, causal evidence, night-only data, current air quality, lighting or naked-eye visibility. Selectable windows are exploratory, with no multiplicity adjustment. This product differs from POWER/CERES SYN1deg; do not splice or treat their differences as temporal changes.'
        }
    }
    target = ROOT / 'public/data/penang-modis.json'
    target.write_text(json.dumps(data,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf-8')
    (ROOT/'public/data/giovanni-modis-penang-2001-2024.csv').write_bytes(raw)
    print(json.dumps({'sha256':data['sha256'],'analysis':data['windows']['2001-2024']},indent=2))

if __name__ == '__main__': main()
