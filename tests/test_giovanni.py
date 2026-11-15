import hashlib
import json
import sys
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from analyze_giovanni import parse_export,analyze_calendar
from analyze_data import annualize,analyze

def test_original_giovanni_export_reproduces_every_analysis_window():
    raw=(ROOT/'data/raw/giovanni-modis-penang-2001-2024.csv').read_bytes()
    data=json.loads((ROOT/'public/data/penang-modis.json').read_text(encoding='utf-8'))
    metadata,observations=parse_export(raw)
    assert metadata['Data Bounding Box']=='100.5,5.5,100.5,5.5'
    assert hashlib.sha256(raw).hexdigest()==data['sha256']
    assert (ROOT/'public/data/giovanni-modis-penang-2001-2024.csv').read_bytes()==raw
    assert len(observations)==288
    assert observations==data['observations']
    annual=annualize(observations)
    assert annual==data['annual']
    assert sum(point['value'] is not None for point in annual)==23
    for key,result in data['windows'].items():
        start,end=map(int,key.split('-'))
        assert analyze_calendar(annual,start,end)==result
    result=data['windows']['2001-2024']
    assert result['slopePerYear']==pytest.approx(-0.0015545635220527597)
    assert result['ci95PerYear'][0]<0<result['ci95PerYear'][1]
    assert result['pValue']>0.05

def test_wrong_region_cannot_be_silently_labeled_penang():
    raw=(ROOT/'data/raw/giovanni-modis-penang-2001-2024.csv').read_bytes()
    with pytest.raises(ValueError): parse_export(raw.replace(b'100,5,101,6',b'-180,-90,180,90'))

def test_calendar_hac_agrees_with_statsmodels_for_a_complete_record():
    annual=[{'year':2001+i,'value':v} for i,v in enumerate([.3,.4,.32,.45,.39,.51,.42,.46,.6,.49])]
    regular=analyze(annual,2001,2010);calendar=analyze_calendar(annual,2001,2010)
    assert calendar['ci95PerYear']==pytest.approx(regular['ci95PerYear'])
    assert calendar['pValue']==pytest.approx(regular['pValue'])
    annual[6]['value']=None
    calendar=analyze_calendar(annual,2001,2010)
    assert calendar['ci95PerYear']!=analyze(annual,2001,2010)['ci95PerYear']
