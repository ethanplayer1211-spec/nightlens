import calendar
import hashlib
import json
import math
import sys
from pathlib import Path

import pytest
from scipy.stats import linregress

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from analyze_data import annualize, analyze


def test_weighted_complete_annual_aggregation():
    months = [{"year": 2024, "month": m, "value": float(m)} for m in range(1, 13)]
    expected = sum(m * calendar.monthrange(2024, m)[1] for m in range(1, 13)) / 366
    assert annualize(months)[0]['value'] == pytest.approx(expected)


@pytest.mark.parametrize('invalid', [None, -999, float('nan'), float('inf')])
def test_missing_invalid_month_suppresses_entire_year(invalid):
    months = [{"year": 2024, "month": m, "value": invalid if m == 6 else 0.4} for m in range(1, 13)]
    assert annualize(months)[0]['value'] is None
    assert annualize(months)[0]['validMonths'] == 11


def test_invalid_timestamps_and_duplicate_months_are_errors():
    with pytest.raises(ValueError): annualize([{'year': 2024, 'month': 13, 'value': 0.4}])
    with pytest.raises(ValueError): annualize([{'year': 2024, 'month': 1, 'value': 0.4}] * 2)


def test_regression_matches_independent_scipy_estimate():
    values = [1.0, 1.2, 1.1, 1.5, 1.7, 1.6, 1.9, 2.3, 2.1, 2.5]
    annual = [{'year': 2001 + i, 'value': v} for i, v in enumerate(values)]
    result = analyze(annual, 2001, 2010)
    check = linregress(range(10), values)
    assert result['slopePerYear'] == pytest.approx(check.slope)
    assert result['ci95PerYear'][0] < check.slope < result['ci95PerYear'][1]
    assert result['pValue'] < 0.05
    assert result['percentChange'] == pytest.approx(150)


def test_short_record_missing_endpoints_and_zero_denominator():
    result = analyze([{'year': 2020, 'value': 0}, {'year': 2021, 'value': 1}], 2020, 2021)
    assert result['percentChange'] is None
    assert result['pValue'] is None
    assert result['status'] == 'insufficient'
    missing = analyze([{'year': 2020, 'value': None}, {'year': 2021, 'value': 1}, {'year': 2022, 'value': 2}], 2020, 2022)
    assert missing['absoluteChange'] is None
    assert missing['missingYears'] == 1
    with pytest.raises(ValueError): analyze([], 2021, 2020)


@pytest.mark.parametrize('region', ['penang', 'seoul'])
def test_checked_in_analysis_reproduces_from_raw_nasa_response(region):
    raw_bytes = (ROOT / f'data/raw/power-{region}.json').read_bytes()
    raw = json.loads(raw_bytes)
    data = json.loads((ROOT / f'public/data/{region}.json').read_text(encoding='utf-8'))
    assert hashlib.sha256(raw_bytes).hexdigest() == data['sha256']
    observations = [{'year': int(k[:4]), 'month': int(k[4:]), 'value': None if v == raw['header']['fill_value'] else v} for k, v in sorted(raw['properties']['parameter']['AOD_55'].items()) if 1 <= int(k[4:]) <= 12]
    annual = annualize(observations)
    assert annual == data['annual']
    for key, cached in data['windows'].items():
        start, end = map(int, key.split('-'))
        actual = analyze(annual, start, end)
        assert actual == cached
        assert all(p['value'] is None or math.isfinite(p['value']) for p in annual)
