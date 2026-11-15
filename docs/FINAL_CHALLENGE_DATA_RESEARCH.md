# Final challenge-source integration options

Research date: November 15, 2026, Malaysia evening. Scope: public primary-source inspection and bounded downloads; no account use, app edits or eligibility certification.

## Recommended immediate path: the listed SeaWiFS paper, used numerically

The exact source already recorded in the Earth System Trend Detective Resources tab is [NASA NTRS 20090042747](https://ntrs.nasa.gov/citations/20090042747), *Time-Series Analysis of Remotely-Sensed SeaWiFS Chlorophyll in River-Influenced Coastal Regions* (2009). Its [original PDF](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) downloaded successfully without credentials. NTRS identifies it as a preprint and reports Public Use Permitted. The original 27-page, 8,810,247-byte file is retained at `data/raw/final-challenge-seawifs-20090042747.pdf`, SHA-256 `5209cee13b536f0b4df59b6e4fac9f631fafd1458f1e4d936d2cfab5edda0ab3`.

Actual numerical content has been extracted and visually checked against rendered PDF pages:

- Table1, page4: ten defined 0.5-degree study-region boxes.
- Table5, page17: ten regions' published p-values, F statistics, slopes, R-squared, mean chlorophyll and river-outlet distance.
- Table6, page18: ten pairs of ordinary and robust regression slopes.

The factual transcription and candidate workflows are in `data/final-challenge-source-candidates.json`. It keeps Table5 and Table6 as separate objects. Their ordinary slopes disagree for **Eel, Ganges, Mississippi East, Pearl and Po**. These are present in the actual source image, not merely OCR mistakes. Do not silently reconcile them or combine a Table5 p-value with a different Table6 slope as though both were one fitted result.

A useful, bounded integration is an interactive **published-results robustness benchmark** beside the project's own historical analysis. It can compare the two slopes within Table6, calculate a dimensionless magnitude ratio, inspect reported Table5 significance separately, and explain why source inconsistencies and outliers matter. Example: Mississippi West's Table6 slope changes from -0.0043 to -0.0005, an **88.37% smaller absolute slope**. Across all ten pairs, six reduce and four increase in magnitude; no signs change. This is a difference between published model summaries, not an environmental percentage change.

An optional new sensitivity calculation applies Benjamini-Hochberg FDR0.05 to the ten rounded Table5 p-values: the unadjusted p<0.05 count is4/10, while only Mississippi West survives that adjustment. This correction was not reported by the paper and must be labeled as a NightLens calculation on rounded published p-values. It does not establish causal human effects.

Scientific boundaries: no raw monthly SeaWiFS observations or original robust-fit settings were obtained. Do not fabricate annual/monthly observations, recompute raw regression confidence intervals or claim to reproduce the original data-processing pipeline. The table does not explicitly specify slope time units; show values as printed and dimensionless comparisons rather than silently converting to per-year units. The source also uses differing nine-/ten-year descriptions around its1998-2007 study and contains narrative/table significance inconsistencies. Chlorophyll is a coastal optical retrieval potentially affected by sediment and colored dissolved material, not a direct measurement of nutrients, sky brightness or human causation.

This would be genuine numerical engagement with a recorded challenge-listed source, stronger than adding a citation. Whether that satisfies the organizers' complete data requirement remains their decision. It should complement, not relabel or overwrite, the existing NASA POWER/CERES aerosol investigation.

## Preferred direct AOD route after owner sign-in: classic Giovanni

The [official Giovanni guide](https://giovanni.gsfc.nasa.gov/giovanni/doc/UsersManualworkingdocument.docx.html) says full archive functionality requires Earthdata Login; it may require authorization of **NASA GESDISC DATA ARCHIVE**. Owner sign-in belongs in the browser, without sending a password or token to the agent.

Concrete request to start with:

1. Open [classic Giovanni](https://giovanni.gsfc.nasa.gov/giovanni/), sign in and authorize the archive if prompted.
2. Select **Area-Averaged Time Series**.
3. Choose **Terra MODIS MOD08_M3, Collection6.1, monthly, 1-degree**, combined Dark Target/Deep Blue aerosol optical depth at550nm. The physical SDS name is `AOD_550_Dark_Target_Deep_Blue_Combined_Mean_Mean`; the [NASA Deep Blue data reference](https://earth.gsfc.nasa.gov/climate/data/deep-blue/data) verifies that name and meaning. The runtime Giovanni catalog ID was not verified; select the actual label rather than constructing a guessed data-ID URL.
4. Dates: **2001-01-01 through2024-12-31**.
5. Penang regional box: **west100, south5, east101, north6**. If time allows, second request for Seoul: **west126, south37, east127, north38**.
6. Plot Data; download the processed **CSV**, its **Lineage/provenance**, and NetCDF/metadata when offered. Preserve the original returned files and exact task/region/version information.

This is a MODIS retrieval series, distinct from the current POWER/CERES assimilated field. Compare sources explicitly; do not merge their observations. Validate returned timestamps, units, fill/QA handling and complete years before fitting trends. The selected box is a regional1-degree average, not an urban meter reading. Satellite AOD still does not calibrate local night-sky brightness.

The classic portal loads publicly, but its variable catalog and full authenticated processing were not completed in this research task. A guessed legacy `getDataVariables.pl` route returned404 and was not repeatedly probed. The newer [Giovanni beta](https://giovanni.earthdata.nasa.gov/) advertises limited cloud credits, so avoid switching platforms during the final request unless the classic flow fails visibly.

## Verified AppEEARS fallback if Giovanni is unavailable

The public [AppEEARS product catalog](https://appeears.earthdatacloud.nasa.gov/api/product) currently lists **MOD13A3.061** as available: Terra MODIS monthly vegetation indices,1000m, from2000-02 onward. Its [actual layer metadata](https://appeears.earthdatacloud.nasa.gov/api/product/MOD13A3.061) was downloaded and checked, not inferred from a product name. Both original JSON replies and hashes are recorded in the candidate manifest.

After owner login, create a **Point extraction** for public reference points Penang5.4141,100.3354 and Seoul37.5665,126.9780; select dates01-01-2001 through12-31-2024; choose layers `_1_km_monthly_NDVI`, `_1_km_monthly_VI_Quality` and `_1_km_monthly_pixel_reliability`. Download the CSV, QA information, metadata and task parameters after processing.

This supplies a **new vegetation-context series**, not AOD or night-light evidence. Do not substitute it into the existing aerosol chart under the same label. A point is one source pixel, not a citywide mean. Source NDVI is scaled by0.0001, but AppEEARS layer metadata describes floating output; inspect returned values to avoid double-scaling. Define QA inclusion and complete-year rules before inference. Product/layer discovery alone does not count as a completed numerical extraction. No authenticated AppEEARS task was submitted here.

## Current status

Ready now: original public challenge-listed paper; visually verified numerical source tables; dimensionless robustness calculations; precise owner-authenticated export instructions. Not acquired: raw Giovanni AOD time series, AppEEARS point extraction or SeaWiFS monthly source observations. No new application feature or organizer eligibility approval is claimed by this research artifact.
