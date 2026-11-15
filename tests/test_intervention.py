import hashlib
import itertools
import json
import math
import sys
from pathlib import Path

import numpy as np
import pytest
import statsmodels.api as sm
from scipy import stats

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from analyze_intervention import build_output, exact_permutation, fit_ols, fitted_contrast

SOURCE_BYTES = (ROOT / "data/raw/tucson-2019-table6.json").read_bytes()
SOURCE = json.loads(SOURCE_BYTES)
OBSERVATIONS = SOURCE["observations"]
X = np.array([item["powerMW"] for item in OBSERVATIONS])


@pytest.mark.parametrize("key", ["correctedSum", "rawSum"])
def test_regression_and_covariance_match_independent_scipy_and_statsmodels(key):
    y = np.array([item[key] for item in OBSERVATIONS])
    result = fit_ols(X, y)
    scipy_fit = stats.linregress(X, y)
    statsmodels_fit = sm.OLS(y, sm.add_constant(X)).fit()
    assert result["n"] == 6 and result["df"] == 4
    assert result["slopePerMW"] == pytest.approx(scipy_fit.slope, rel=1e-12)
    assert result["intercept"] == pytest.approx(scipy_fit.intercept, rel=1e-12)
    assert result["pValue"] == pytest.approx(scipy_fit.pvalue, rel=1e-10)
    assert result["rSquared"] == pytest.approx(scipy_fit.rvalue**2, rel=1e-12)
    assert np.allclose(result["coefficientCovariance"], statsmodels_fit.cov_params(), rtol=1e-10)
    assert result["slopeCI95PerMW"] == pytest.approx(statsmodels_fit.conf_int()[1], rel=1e-10)


def test_conditional_fitted_contrast_uses_shared_covariance_and_fixed_baseline():
    y = [item["correctedSum"] for item in OBSERVATIONS]
    fit = fit_ols(X, y)
    result = fitted_contrast(fit, 1.38, 0.70, (0.67, 1.38))
    independent = sm.OLS(y, sm.add_constant(X)).fit()
    difference = independent.t_test([0, -0.68])
    assert result["change"] == pytest.approx(float(np.asarray(difference.effect).item()))
    assert result["changeCI95"] == pytest.approx(difference.conf_int()[0])
    assert result["percentChange"] == pytest.approx(result["change"] / result["fittedBefore"] * 100)
    assert result["percentChangeCI95"] == pytest.approx(np.array(result["changeCI95"]) / result["fittedBefore"] * 100)
    # The interval is for a fitted mean difference; new-night variance is not added.
    assert result["changeCI95"][1] < 0
    with pytest.raises(ValueError):
        fitted_contrast(fit, 1.38, 0, (0.67, 1.38))


def test_exact_permutation_matches_independent_exhaustive_rank_count_and_symmetry():
    y = np.array([item["correctedSum"] for item in OBSERVATIONS])
    result = exact_permutation(X, y)
    # For fixed X and permuted Y, slope and Pearson r have the same ordering.
    reference = abs(stats.linregress(X, y).slope)
    extreme = sum(abs(stats.linregress(X, pair).slope) >= reference - 1e-9 for pair in itertools.permutations(y))
    assert result["permutations"] == math.factorial(6) == 720
    assert result["extremePermutations"] == extreme == 2
    assert result["pValue"] == extreme / 720
    assert exact_permutation(X, -y)["pValue"] == result["pValue"]
    assert exact_permutation(X[::-1], y[::-1])["pValue"] == result["pValue"]


def test_nonsignificant_and_constant_response_do_not_generate_fake_evidence_or_nan():
    x = np.arange(6, dtype=float)
    result = exact_permutation(x, [0, 1, 0, 1, 0, 1])
    assert result["pValue"] > 0.05
    constant = fit_ols(x, np.ones(6))
    assert constant["slopePerMW"] == 0
    assert constant["pValue"] == 1
    assert constant["rSquared"] is None
    assert exact_permutation(x, np.ones(6))["pValue"] == 1
    zero = fit_ols(x, np.zeros(6))
    contrast = fitted_contrast(zero, 1.38, 0.7, (0, 5))
    assert contrast["percentChange"] is None and contrast["percentChangeCI95"] is None
    json.dumps({"constant": constant, "zeroContrast": contrast}, allow_nan=False)


@pytest.mark.parametrize("x,y", [([1, 1, 1], [1, 2, 3]), ([1, 2], [1, 2]), ([1, 2, 3], [1, float("nan"), 2]), ([1, 2, 3], [1, 2, float("inf")])])
def test_invalid_or_unidentifiable_fit_is_rejected(x, y):
    with pytest.raises(ValueError):
        fit_ols(x, y)


def test_checked_in_artifact_reproduces_hash_fits_diagnostics_and_rounded_rows():
    output = build_output(SOURCE, SOURCE_BYTES)
    cached = json.loads((ROOT / "public/data/tucson-intervention.json").read_text(encoding="utf-8"))
    assert output == cached
    assert cached["provenance"]["sourceSha256"] == hashlib.sha256(SOURCE_BYTES).hexdigest()
    assert cached["observations"] == OBSERVATIONS
    assert [item["powerMW"] for item in cached["observations"]] == [0.70, 0.68, 0.67, 1.38, 1.06, 1.00]
    assert cached["publishedFindings"]["groundSkyChanges"]["sites"][0]["changePercent"] == -5.4
    for key, field in [("corrected", "correctedSum"), ("raw", "rawSum")]:
        fit = cached["analysis"][key]
        for i, influence in enumerate(fit["leaveOneOut"]):
            values = [item[field] for j, item in enumerate(OBSERVATIONS) if j != i]
            assert influence["slopePerMW"] == pytest.approx(stats.linregress(np.delete(X, i), values).slope)
        assert len(fit["fitMeanBand"]) == 25
        for point in fit["fitMeanBand"]:
            assert point["ci95"][0] <= point["fitted"] <= point["ci95"][1]
    reference = stats.theilslopes([item["correctedSum"] for item in OBSERVATIONS], X, alpha=0.95, method="separate")
    assert cached["analysis"]["corrected"]["theilSen"]["slopePerMW"] == pytest.approx(reference.slope)
    # Scientific outputs must be JSON-safe rather than relying on nonstandard NaN.
    json.dumps(cached, allow_nan=False)


def test_duplicate_or_missing_source_night_is_rejected():
    duplicate = {**SOURCE, "observations": [*OBSERVATIONS[:-1], OBSERVATIONS[0]]}
    with pytest.raises(ValueError):
        build_output(duplicate, SOURCE_BYTES)
    with pytest.raises(ValueError):
        build_output({**SOURCE, "observations": OBSERVATIONS[:-1]}, SOURCE_BYTES)
