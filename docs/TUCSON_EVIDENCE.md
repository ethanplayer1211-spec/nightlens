# Tucson: a measured lighting intervention, with limits

NightLens retains its separate 2001–2024 NASA POWER/CERES aerosol investigation. That 24-year regional analysis addresses the selected challenge's long-term time-series question. The short Tucson case is additional evidence about a human lighting intervention. It does not turn aerosol optical depth into light pollution, replace the challenge investigation, or calibrate the sky rendering for arbitrary cities.

## Actual sources and transcription

The numerical input is a factual transcription of six city-level observations in **Table 6** of Kyba et al., *Direct measurement of the contribution of street lighting to satellite observations of nighttime light emissions from urban areas*, first online 2020, issue 2021, *Lighting Research & Technology* 53(3), 189–211, [DOI 10.1177/1477153520958463](https://doi.org/10.1177/1477153520958463). [Publisher full text](https://journals.sagepub.com/doi/full/10.1177/1477153520958463?journalCode=lrtd) is accessible without an Earthdata login. [NASA Earth Observatory's account](https://science.nasa.gov/earth/earth-observatory/experimenting-with-tucson-night-lights-148259/) provides NASA context; the article's table supplies the actual numbers.

`data/raw/tucson-2019-table6.json` is explicitly a **published-table transcription**, despite its archival directory name. It is not a raw NASA API response, a Black Marble file or a new satellite extraction. It preserves the six dates, reported powers, raw and corrected aggregate sums. Table 4 provides the included viewing-angle, overpass-time and correction metadata. The output records a SHA-256 of the exact input file.

The HTML Table 6 header renders its power unit as `mW`. We normalize these numbers as **MW**, corroborated by section 2.1's explicit megawatt network totals and Table 1's corresponding kilowatt values. This interpretation is disclosed, not silently hidden. Table 1 and Table 6 also have slightly different power values: for example, the final night is 1010 kW in Table 1 but 1.00 in Table 6. We retain Table 6 as published rather than merge tables or claim full precision.

The source reports sum-of-lights in **nW cm⁻² sr⁻¹ relative to a 1 km² area**. This is its area-normalized aggregate: area-weighted sums on a resampled 50 m grid divided by 400. It is not lumens, electrical energy, ordinary mean single-pixel radiance, or ground zenith sky brightness. Powers refer only to the participating municipal network.

The authors selected six cloud-free VIIRS DNB overpasses, approximately 01:41–02:56 local time, on March 29/31 and April 3/7/8/11, 2019. Only the second April 7 overpass was cloud-free. These are NOAA-generated Suomi NPP Sensor Data Records, not NASA Black Marble VNP46A2/VNP46A4. The joint NASA-NOAA mission and NASA explanatory resource are credited accurately.

The article is free to read, copyright CIBSE 2020; no Creative Commons or open-data license was verified. This project includes attributed factual numerical transcription, not copies of article text, figures or its full PDF. Original lamp-level records are available from the authors upon request and were not acquired. No claim of an unrestricted license over the paper is made.

## What is recomputed

Run, without network access:

```powershell
.\.venv\Scripts\python.exe scripts/analyze_intervention.py
.\.venv\Scripts\python.exe -m pytest tests/test_intervention.py -q
```

The script uses existing pinned NumPy/SciPy dependencies and writes `public/data/tucson-intervention.json`. It fits an intercept and slope of summed radiance on municipal power for both the raw and corrected series. Exported values include coefficient covariance, slope standard error, two-sided Student-t p-value, pointwise 95% t intervals, R², residual error and six leave-one-night-out slopes. Residual degrees of freedom are **4** because **n=6 nights**; pixels are not independent additional replicates.

For corrected observations, the recomputed slope is **1143.244242 per MW**, 95% t interval **741.762081–1544.726402 per MW**, R² **0.939855313**, p **0.001384673**. This differs slightly from the authors' full-precision fit; it is labeled a reanalysis of rounded published observations. Raw observations give slope **2667.939401 per MW**, showing substantial dependence on corrections. Corrected leave-one-night-out slopes span **1022.999521–1250.955762 per MW**. These diagnostics expose sensitivity and do not remove the small-sample limitations.

An exhaustive association check permutes response labels across all **6! = 720** orderings, using absolute Pearson correlation. Observed ordering and ties are included; p is the exact extreme count divided by 720, with no Monte Carlo +1 correction. Corrected data yield **2/720 = 0.002777778**. Exchangeability under the null is required. This is not a randomized-treatment causal test; timing, meteorology, private lighting and estimated corrections may violate that assumption.

A separately labeled SciPy Theil–Sen median pairwise slope is a robust diagnostic, with its small-sample slope interval. It is not a second independent experiment. Raw/corrected and alternative-method results are sensitivity analyses, not opportunities to select whichever p-value is smallest.

## Fitted contrast and uncertainty

The exported contrast compares fitted mean satellite sums at **1.38 MW and 0.70 MW**, both inside the observed **0.67–1.38 MW** range. The slope times the power difference gives the fitted change. Its 95% interval uses the shared coefficient covariance; the intercept cancels in a difference. It is not a paired same-night observation or a new-night prediction interval.

For a percentage display, the denominator is explicitly the **fixed fitted baseline at 1.38 MW**. The absolute-difference interval is divided by that fixed number. Consequently it does **not** propagate baseline-estimation uncertainty and must not be presented as a complete ratio-uncertainty interval. The script refuses contrasts outside the observed range. No arbitrary-city reduction, energy saving, star count or visibility prediction is produced.

Classical OLS uncertainty conditions on a linear model, fixed powers/corrections, independent homoscedastic errors and residual Student-t assumptions. It omits measurement, rounding, correction-parameter and systematic uncertainty. With only one bright-condition night and six nights total, apparent significance is not a guarantee of transferability. The leave-one-night-out and Theil–Sen diagnostics do not cure these limitations.

## Satellite radiance versus the sky people see

The authors corrected for natural background/airglow using dark control hexagons and for changing conditions using lit nonparticipating nearby communities. Viewing angles ranged from 21.9° to 48.8°. The corrections depend on assumptions about stability and similarity of the controls. NightLens uses the published corrected aggregates directly and does not reproduce original raster processing or propagate the correction parameters' uncertainty.

DNB detects approximately **500–900 nm**, whereas human vision and ground photometers respond differently. It misses the blue peak of white LEDs, and buildings, source directions, trees, spectra and atmosphere alter the relation between ground lighting and upward satellite radiance. Therefore a satellite-radiance decrease is not the same fraction of skyglow reduction or restored stars.

The reported municipal satellite contribution **13% (95% CI 10–16%)** and hypothetical undimmed contribution **18% (15–23%)** are the authors' findings, kept separate from this rounded-table reanalysis. They are not universal constants in NightLens's renderer.

Ground evidence comes from a separate paper: Barentine et al. (2020), *Recovering the city street lighting fraction from skyglow measurements in a large-scale municipal dimming experiment*, *JQSRT* 253, 107120, [DOI 10.1016/j.jqsrt.2020.107120](https://doi.org/10.1016/j.jqsrt.2020.107120); [author-hosted paper](https://www.johncbarentine.com/uploads/7/8/0/8/78081652/barentine-et-al-2020.pdf). Its Table 7, printed page 13, reports ground zenith-brightness changes of **−5.4 ± 0.9% at Reid Park** and **−3.6 ± 0.9% at Tanque Verde** for the 90%-to-30% midnight program. The ±0.9 is measurement uncertainty associated with 1σ scatter and an instrument-resolution floor (section 3.3, printed page 7), **not a 95% confidence interval**. No ground time series was downloaded or reanalyzed.

These measured changes were modest. They do not support an automatic pristine Milky Way appearing when only streetlights dim at midnight. Nonparticipating lighting remained, crossing/intersection lighting was retained, and the source papers do not establish local safety outcomes. Responsible design and essential safety lighting remain requirements.

The UI must continue to label lighting, atmosphere and hypothetical before/after appearances as illustrative. Neither this case study nor the long-term NASA aerosol record supplies a calibrated prediction of the number of stars visible from a user's street.
