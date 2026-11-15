"""Reproducible, offline annual aggregation and OLS + Newey-West analysis."""
from __future__ import annotations

import calendar
import json
import math
from pathlib import Path

import numpy as np
import statsmodels.api as sm

ROOT = Path(__file__).resolve().parents[1]


def annualize(observations: list[dict]) -> list[dict]:
    """A year is valid only with all 12 distinct finite, nonnegative months."""
    years: dict[int, dict[int, float | None]] = {}
    for item in observations:
        year, month, value = item["year"], item["month"], item["value"]
        if not isinstance(year, int) or not isinstance(month, int) or not 1 <= month <= 12:
            raise ValueError("Invalid monthly timestamp")
        if month in years.setdefault(year, {}):
            raise ValueError("Duplicate monthly observation")
        years[year][month] = value
    annual = []
    for year, months in sorted(years.items()):
        valid = {m: v for m, v in months.items() if isinstance(v, (int, float)) and math.isfinite(v) and v >= 0}
        value = None
        if len(valid) == 12:
            weights = {m: calendar.monthrange(year, m)[1] for m in valid}
            value = sum(v * weights[m] for m, v in valid.items()) / sum(weights.values())
        annual.append({"year": year, "value": value, "validMonths": len(valid)})
    return annual


def analyze(annual: list[dict], start: int, end: int) -> dict:
    if start >= end:
        raise ValueError("Start year must precede end year")
    subset = [a for a in annual if start <= a["year"] <= end]
    valid = [a for a in subset if a["value"] is not None and math.isfinite(a["value"])]
    if len(valid) < 2:
        return {"n": len(valid), "missingYears": end - start + 1 - len(valid), "status": "insufficient"}
    x = np.array([a["year"] - start for a in valid], dtype=float)
    y = np.array([a["value"] for a in valid], dtype=float)
    fit = sm.OLS(y, sm.add_constant(x)).fit()
    slope = float(fit.params[1])
    first = next((a["value"] for a in subset if a["year"] == start), None)
    last = next((a["value"] for a in subset if a["year"] == end), None)
    delta = last - first if first is not None and last is not None else None
    result = {
        "n": len(valid), "missingYears": end - start + 1 - len(valid),
        "status": "exploratory" if len(valid) >= 8 else "insufficient",
        "startYear": start, "endYear": end,
        "absoluteChange": delta,
        "percentChange": delta / first * 100 if delta is not None and first is not None and first > 0 else None,
        "slopePerYear": slope, "interceptAtStart": float(fit.params[0]),
        "ci95PerYear": None, "pValue": None, "residualLag1": None,
        "method": "OLS; Newey–West HAC covariance, lag 1, small-sample correction, Student-t inference (n−2 df)",
    }
    if len(valid) >= 8:
        robust = fit.get_robustcov_results(cov_type="HAC", maxlags=1, use_correction=True, use_t=True)
        result["ci95PerYear"] = [float(v) for v in robust.conf_int(alpha=0.05)[1]]
        result["pValue"] = float(robust.pvalues[1])
        if np.std(fit.resid[:-1]) > 1e-12 and np.std(fit.resid[1:]) > 1e-12:
            result["residualLag1"] = float(np.corrcoef(fit.resid[:-1], fit.resid[1:])[0, 1])
    return result


def main() -> None:
    for region in ("penang", "seoul"):
        source = ROOT / "public" / "data" / f"{region}.json"
        data = json.loads(source.read_text(encoding="utf-8"))
        annual = annualize(data["observations"])
        years = [a["year"] for a in annual]
        data["annual"] = annual
        data["windows"] = {
            f"{start}-{end}": analyze(annual, start, end)
            for start in years for end in years if start < end
        }
        data["processing"] = {
            "aggregation": "Day-weighted mean of 12 complete monthly means; incomplete years excluded; month 13 excluded",
            "scaling": "NASA API values used as returned; dimensionless, no additional scaling",
            "quality": "Fill −999, nonfinite and negative AOD excluded; no per-observation quality flags are supplied by this API",
            "uncertainty": "HAC lag-1 intervals address limited serial dependence, not measurement error, higher-order correlation, model bias or causal inference. No multiple-testing correction; selectable windows are exploratory.",
        }
        source.write_text(json.dumps(data, indent=2, ensure_ascii=False, allow_nan=False) + "\n", encoding="utf-8")
        print(region, json.dumps(data["windows"]["2001-2024"]))


if __name__ == "__main__":
    main()
