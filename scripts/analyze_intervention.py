"""Offline exploratory reanalysis of six published Tucson VIIRS observations.

No satellite imagery is downloaded and no arbitrary city is calibrated by this
pipeline. The source is an attributed factual table transcription, not raw NASA
Black Marble data. Re-running the script produces identical JSON bytes.
"""
from __future__ import annotations

import hashlib
import itertools
import json
import math
from pathlib import Path

import numpy as np
from scipy import stats

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "data/raw/tucson-2019-table6.json"
OUTPUT_PATH = ROOT / "public/data/tucson-intervention.json"


def validated_arrays(x_values, y_values) -> tuple[np.ndarray, np.ndarray]:
    x = np.asarray(x_values, dtype=float)
    y = np.asarray(y_values, dtype=float)
    if x.ndim != 1 or y.ndim != 1 or len(x) != len(y) or len(x) < 3:
        raise ValueError("At least three paired one-dimensional observations are required")
    if not np.isfinite(x).all() or not np.isfinite(y).all():
        raise ValueError("All observations must be finite")
    if float(np.ptp(x)) == 0:
        raise ValueError("The predictor must vary")
    return x, y


def fit_ols(x_values, y_values) -> dict:
    """Intercept OLS with classical residual variance; not HAC/causal inference."""
    x, y = validated_arrays(x_values, y_values)
    n = len(x)
    df = n - 2
    dx, dy = x - x.mean(), y - y.mean()
    sxx, syy = float(dx @ dx), float(dy @ dy)
    slope = float(dx @ dy / sxx) if syy else 0.0
    intercept = float(y.mean() - slope * x.mean())
    residual = y - (intercept + slope * x)
    if not syy:
        residual = np.zeros_like(y)
    sse = float(residual @ residual)
    variance = sse / df
    covariance = variance * np.array([
        [1 / n + float(x.mean()) ** 2 / sxx, -float(x.mean()) / sxx],
        [-float(x.mean()) / sxx, 1 / sxx],
    ])
    se_slope = math.sqrt(float(covariance[1, 1]))
    critical = float(stats.t.ppf(0.975, df))
    p_value = float(2 * stats.t.sf(abs(slope / se_slope), df)) if se_slope else (1.0 if slope == 0 else 0.0)
    return {
        "n": n, "df": df,
        "slopePerMW": slope, "intercept": intercept,
        "coefficientOrder": ["intercept", "slopePerMW"],
        "coefficientCovariance": covariance.tolist(),
        "slopeStandardErrorPerMW": se_slope,
        "slopeCI95PerMW": [slope - critical * se_slope, slope + critical * se_slope],
        "pValue": p_value,
        "rSquared": max(0.0, min(1.0, 1 - sse / syy)) if syy else None,
        "residualStdError": math.sqrt(variance),
        "method": "OLS with intercept; classical residual variance; two-sided Student-t slope test and pointwise 95% t intervals, n−2 residual degrees of freedom",
    }


def exact_permutation(x_values, y_values) -> dict:
    """Enumerate all response-label permutations, including the observed order."""
    x, y = validated_arrays(x_values, y_values)
    if len(x) > 8:
        raise ValueError("Exhaustive permutation enumeration is limited to eight observations")
    dx, dy = x - x.mean(), y - y.mean()
    denominator = float(np.linalg.norm(dx) * np.linalg.norm(dy))
    observed = abs(float(dx @ dy)) / denominator if denominator else 0.0
    extreme = total = 0
    for indices in itertools.permutations(range(len(x))):
        statistic = abs(float(dx @ dy[list(indices)])) / denominator if denominator else 0.0
        total += 1
        extreme += statistic >= observed - 1e-12
    return {
        "statistic": "absolute Pearson correlation",
        "observedStatistic": observed,
        "pValue": extreme / total,
        "extremePermutations": int(extreme),
        "permutations": total,
        "method": "All n! response-label permutations, with ties and observed ordering included; extreme count/n!, no Monte Carlo correction",
        "assumption": "Response labels must be exchangeable under the null. This is an association diagnostic, not a randomized-treatment causal test; weather, timing, corrections and serial dependence can violate exchangeability.",
    }


def mean_interval(fit: dict, power_mw: float) -> tuple[float, list[float]]:
    vector = np.array([1.0, power_mw])
    estimate = float(fit["intercept"] + fit["slopePerMW"] * power_mw)
    variance = float(vector @ np.asarray(fit["coefficientCovariance"]) @ vector)
    half_width = float(stats.t.ppf(0.975, fit["df"])) * math.sqrt(max(0.0, variance))
    return estimate, [estimate - half_width, estimate + half_width]


def fitted_contrast(fit: dict, before_mw: float, after_mw: float, observed_range: tuple[float, float]) -> dict:
    """Difference in fitted means. Percent CI conditions on a fixed denominator."""
    if not all(math.isfinite(v) for v in (before_mw, after_mw)):
        raise ValueError("Contrast powers must be finite")
    if not all(observed_range[0] <= v <= observed_range[1] for v in (before_mw, after_mw)):
        raise ValueError("This case study does not extrapolate beyond the observed power range")
    before, before_ci = mean_interval(fit, before_mw)
    after, after_ci = mean_interval(fit, after_mw)
    difference_vector = np.array([0.0, after_mw - before_mw])
    difference = float((after_mw - before_mw) * fit["slopePerMW"])
    variance = float(difference_vector @ np.asarray(fit["coefficientCovariance"]) @ difference_vector)
    half_width = float(stats.t.ppf(0.975, fit["df"])) * math.sqrt(max(0.0, variance))
    ci = [difference - half_width, difference + half_width]
    return {
        "powerBeforeMW": before_mw, "powerAfterMW": after_mw,
        "withinObservedRange": True,
        "fittedBefore": before, "fittedBeforeCI95": before_ci,
        "fittedAfter": after, "fittedAfterCI95": after_ci,
        "change": difference, "changeCI95": ci,
        "percentChange": difference / before * 100 if before > 0 else None,
        "percentChangeCI95": [v / before * 100 for v in ci] if before > 0 else None,
        "denominator": "Fixed fitted baseline at powerBeforeMW; its estimation uncertainty is not propagated into the percentage interval",
        "interpretation": "Conditional difference between fitted mean satellite sums within the observed study range; not a new-night prediction interval, a paired before/after observation, or a local skyglow/star-visibility forecast",
    }


def analyze_series(observations: list[dict], value_key: str, robust: bool = False) -> dict:
    x = np.array([item["powerMW"] for item in observations], dtype=float)
    y = np.array([item[value_key] for item in observations], dtype=float)
    fit = fit_ols(x, y)
    fit["permutation"] = exact_permutation(x, y)
    fit["leaveOneOut"] = [
        {
            "excludedDate": item["date"],
            "slopePerMW": fit_ols(np.delete(x, i), np.delete(y, i))["slopePerMW"],
        }
        for i, item in enumerate(observations)
    ]
    low, high = float(x.min()), float(x.max())
    fit["fitMeanBand"] = [
        {"powerMW": float(power), "fitted": estimate, "ci95": interval}
        for power in np.linspace(low, high, 25)
        for estimate, interval in [mean_interval(fit, float(power))]
    ]
    fit["contrast"] = fitted_contrast(fit, 1.38, 0.70, (low, high))
    if robust:
        result = stats.theilslopes(y, x, alpha=0.95, method="separate")
        fit["theilSen"] = {
            "slopePerMW": float(result.slope), "intercept": float(result.intercept),
            "slopeCI95PerMW": [float(result.low_slope), float(result.high_slope)],
            "method": "SciPy Theil–Sen median pairwise slope with separate intercept; small-sample nonparametric slope interval, not a causal estimate",
        }
    return fit


def build_output(source: dict, source_bytes: bytes) -> dict:
    observations = source["observations"]
    if len(observations) != 6 or len({item["date"] for item in observations}) != 6:
        raise ValueError("The source must contain the six distinct published study nights")
    for item in observations:
        if not all(isinstance(item.get(key), (int, float)) and math.isfinite(item[key]) and item[key] >= 0 for key in ("powerMW", "rawSum", "correctedSum")):
            raise ValueError("Published observation fields must be finite and nonnegative")
    corrected = analyze_series(observations, "correctedSum", robust=True)
    raw = analyze_series(observations, "rawSum")
    return {
        "schemaVersion": 1,
        "id": source["id"], "title": source["title"],
        "source": source["source"], "units": source["units"],
        "observations": observations,
        "analysis": {"corrected": corrected, "raw": raw},
        "sensitivity": {
            "rawSlopePerMW": raw["slopePerMW"], "correctedSlopePerMW": corrected["slopePerMW"],
            "correctedToRawSlopeRatio": corrected["slopePerMW"] / raw["slopePerMW"] if raw["slopePerMW"] else None,
            "correctedLeaveOneOutSlopeRangePerMW": [min(row["slopePerMW"] for row in corrected["leaveOneOut"]), max(row["slopePerMW"] for row in corrected["leaveOneOut"])],
            "interpretation": "The large raw/corrected difference demonstrates dependence on the published atmospheric, background and viewing-condition corrections; it is not a second independent replication.",
        },
        "publishedFindings": source["publishedFindings"],
        "provenance": {
            "sourceFile": "data/raw/tucson-2019-table6.json",
            "sourceSha256": hashlib.sha256(source_bytes).hexdigest(),
            "script": "scripts/analyze_intervention.py",
            "pipelineVersion": 1,
            "reproduction": ".\\.venv\\Scripts\\python.exe scripts/analyze_intervention.py",
            "dependencies": {"numpy": np.__version__, "scipy": __import__("scipy").__version__},
        },
        "limitations": [
            "Six selected study nights, not six hundred pixels or a long-term trend. Retain NightLens's separate 24-year NASA POWER/CERES investigation for the challenge's time-series question.",
            "These are rounded published table aggregates. Recomputed coefficients do not exactly reproduce the authors' full-precision estimate; original pixel, lamp and calibration data were not acquired or reprocessed.",
            "Classical OLS intervals and p-values condition on fixed predictor values and published corrections, independent homoscedastic errors and the linear model. They omit measurement, rounding, correction-parameter and systematic uncertainty.",
            "The exact permutation result requires exchangeability under the null; it does not establish randomized-treatment causality or remove weather, timing, serial dependence or private-light changes.",
            "Only one selected bright-condition night is available. Leave-one-night-out slopes and a Theil–Sen diagnostic expose sensitivity but do not cure the small sample or establish worldwide transferability.",
            "The fitted contrast stays inside the observed 0.67–1.38 MW range. Its percent interval uses a fixed fitted denominator, not a full ratio-uncertainty interval or a new-night prediction interval.",
            "DNB upward radiance in 500–900 nm is not ground zenith sky brightness. DNB misses the blue peak of white LEDs and has a different spectral response from human vision.",
            "Buildings, shielding, source spectra, atmospheric scattering and nonparticipating sources prevent conversion to arbitrary-city skyglow, exact star visibility, Bortle class, energy savings or safety effects.",
            "Published ground-sky measurements are a separately attributed study and are not used as calibration constants for the rendering. Dimmed streetlights alone did not restore a pristine night sky.",
        ],
    }


def main() -> None:
    source_bytes = SOURCE_PATH.read_bytes()
    source = json.loads(source_bytes)
    output = build_output(source, source_bytes)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
    corrected = output["analysis"]["corrected"]
    print(json.dumps({"n": corrected["n"], "slopePerMW": corrected["slopePerMW"], "pValue": corrected["pValue"], "permutation": corrected["permutation"]["pValue"]}))


if __name__ == "__main__":
    main()
