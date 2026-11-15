# Data sources and access proof

Verified November 15, 2026 (Malaysia time). No fabricated measurements are included.

## Added perspective Observatory sources

- **ESA/Gaia/DPAC EDR3 integrated brightness/colour survey:** historical image, not a live sky photograph or measured city brightness. Source and attribution: https://www.esa.int/media/interactive-map-of-the-sky-from-gaia-s-early-data-release-3. Acknowledgement A. Moitinho; CC BY-SA 3.0 IGO. Original 2000×1000 PNG, exact URL, projection and SHA-256 are pinned in `data/sky-assets.json`. Runtime reprojection and illustrative tone mapping are documented in `OBSERVATORY.md`. Reacquire using `python scripts/acquire_sky_assets.py`; changed bytes are rejected.
- **Open-Meteo / GeoNames:** optional worldwide city search, coordinates, elevation and IANA timezones via https://open-meteo.com/en/docs/geocoding-api. Current cloud cover, temperature and humidity use https://open-meteo.com/en/docs with Unix timestamps; coverage is a weather-model value, not a sensor observation or NASA product. Data CC BY 4.0; source notices https://open-meteo.com/en/licence. Requests have visible failure states and do not block local astronomy. No current weather is substituted for conditions at a manually selected preview time.
- **NASA/JPL Horizons:** an independent airless topocentric Moon benchmark at Penang, 2026-11-15 13:00 UTC. The exact query URL and complete response are cached in `data/validation/horizons-moon-20261115.json`; API documentation https://ssd-api.jpl.nasa.gov/doc/horizons.html. A 0.05° position tolerance is tested. This is a limited validation reference, not the runtime ephemeris and not validation of visual brightness.

These additions do not change the NASA historical dataset below or resolve the stricter challenge-tab condition. Asset licenses remain separate from the application's MIT code license.

## Official challenge and eligibility

- Challenge: https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/
- Resources tab: https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources
- Submission guide, dated November 13: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging guide, dated November 13: https://www.spaceappschallenge.org/resources/judging-awards-guide/

The official tab was directly inspected through the user-opened, signed-in browser. Its NASA section lists Giovanni (https://giovanni.gsfc.nasa.gov/), Hydrology Time Series (https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series), AppEEARS (https://appeears.earthdatacloud.nasa.gov/), Climate Data Online (https://www.ncei.noaa.gov/cdo-web/), and the SeaWiFS time-series research article (https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf). The tab also includes partner resources.

NASA POWER is not recorded in the selected challenge Resources tab. The official NASA/spaceapps answered discussions [1827](https://github.com/nasa/spaceapps/discussions/1827) and [1947](https://github.com/nasa/spaceapps/discussions/1947) explicitly require meaningful use of at least one NASA source from that tab for Global Awards. This corrects the earlier inference from the submission guide’s broader wording. No qualifying tab-listed source has been demonstrated in this build; Moon imagery and SRTM context do not resolve that condition. Organizer eligibility remains unresolved.

## Working numerical dataset: NASA POWER / CERES SYN1deg

- Provider: NASA Langley Research Center, POWER; underlying CERES SYN1deg aerosol field.
- Documentation: https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/
- API documentation: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- CERES product documentation: https://ceres.larc.nasa.gov/Data/
- Variable: `AOD_55`, aerosol optical depth at 0.55 µm / 550 nm.
- Units: dimensionless. API source header: `SYN1DEG`.
- Scientific kind: satellite-derived, model-assimilated product. MODIS aerosol retrievals and MATCH supply the aerosol field; it is not a direct ground sensor measurement.
- Native source resolution: 1° latitude × 1° longitude.
- Time coverage used: January 2001–December 2024, 288 monthly means per region.
- Penang query coordinate: 5.4141° N, 100.3354° E.
- Seoul query coordinate: 37.5665° N, 126.9780° E.
- Spatial meaning: one source grid cell selected by the query point, not a citywide average. The returned point coordinate is not a cell-boundary record.

Exact queries:

https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=AOD_55&community=RE&longitude=100.3354&latitude=5.4141&start=2001&end=2024&format=JSON

https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=AOD_55&community=RE&longitude=126.978&latitude=37.5665&start=2001&end=2024&format=JSON

Provenance is stored in `public/data/{penang,seoul}.json`: exact query, retrieved-at UTC timestamp, original header, raw response SHA-256, observations, annual aggregates, processing notes and all selectable regression windows. Original responses are retained at `data/raw/power-{penang,seoul}.json`.

No rescaling is applied. API fill −999, nonfinite and negative values are excluded. API annual entry month 13 is not treated as a month. Annual means require 12 valid monthly observations and weight each by calendar days. No per-observation quality flags are supplied by this endpoint. Missing values remain null; no interpolation occurs.

## Preferred radiance dataset: blocked, not used

- NASA Black Marble: https://blackmarble.gsfc.nasa.gov/
- VNP46A4 v2: https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP46A4
- DOI: https://doi.org/10.5067/VIIRS/VNP46A4.002
- CMR collection identifier: `C3860065683-LAADS`, version `2`.
- Public archive listing: https://ladsweb.modaps.eosdis.nasa.gov/archive/allData/5200/VNP46A4/2023/001/.json
- Identified Penang tile: `VNP46A4.A2023001.h28v08.002.2025162082338.h5`, listed size 95,138,289 bytes.
- Exact attempted file: https://ladsweb.modaps.eosdis.nasa.gov/archive/allData/5200/VNP46A4/2023/001/VNP46A4.A2023001.h28v08.002.2025162082338.h5

A byte-range request followed an OAuth redirect to `urs.earthdata.nasa.gov` and returned an HTML sign-in page, not HDF5. Both CMR discovery and the LAADS route were evaluated. No credentials were requested or stored. No file was downloaded, so units/scaling and quality flags were not applied to observations. V2 documentation identifies floating-point radiances, unlike V1 integer scaling; no hardcoded V1 scaling is used.

Consequence: NightLens does not answer whether nighttime artificial radiance is increasing in Penang/Seoul. It investigates a related atmospheric variable, and presents lighting changes strictly as an independent educational illustration.

## Astronomy and catalog

- Astronomy Engine: https://github.com/cosinekitty/astronomy
- JavaScript API: https://github.com/cosinekitty/astronomy/tree/master/source/js
- HYG v3.8 archive: https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/v3/hyg_v38.csv.gz
- HYG project archive: https://github.com/astronexus/HYG-Database
- Current HYG home: https://codeberg.org/astronexus/hyg
- Catalog license: CC BY-SA 4.0, David Nash / Astronexus. The versioned subset retains attribution and license metadata in `public/data/stars.json`.

Selection: Sun excluded; catalog V magnitude ≤ 5.8. Result: 4,105 records. RA is in hours; declination is in degrees at J2000. Magnitude selection is a rendering/performance limit, not an observer visibility threshold. Coordinates are transformed for the selected place and instant; no randomly placed stars are added.

## Educational lighting guidance

DarkSky International and Illuminating Engineering Society, Five Principles for Responsible Outdoor Lighting:
https://darksky.org/resources/guides-and-how-tos/lighting-principles/

Principles are paraphrased and attributed in the Evidence notebook. No certification, endorsement, quantitative performance model or safety standard is implied.


## Human-lighting intervention evidence (added)

NASA Earth Observatory documents the Tucson 2019 experiment: https://science.nasa.gov/earth/earth-observatory/experimenting-with-tucson-night-lights-148259/ . The numerical source is Kyba et al., DOI 10.1177/1477153520958463, Table 6: https://journals.sagepub.com/doi/full/10.1177/1477153520958463?journalCode=lrtd . Six factual city-level observations are transcribed at published precision in `data/raw/tucson-2019-table6.json`, hashed, processed by `scripts/analyze_intervention.py` and exported to `public/data/tucson-intervention.json`. Data are authors' corrected/uncorrected aggregates from NOAA-generated Suomi NPP VIIRS records, not raw NASA Black Marble. No full-precision raster/lamp download occurred. The publisher's mW/MW header discrepancy and normalization are explicitly documented.

Barentine et al. (2020), DOI 10.1016/j.jqsrt.2020.107120, Table 7 supplies separately reported ground-sky reductions and measurement uncertainties: https://www.johncbarentine.com/uploads/7/8/0/8/78081652/barentine-et-al-2020.pdf . These are cited published findings, not new NightLens ground measurements. Article figures/full text are not bundled or relicensed. Full provenance, corrections and limitations: `TUCSON_EVIDENCE.md`.

## OpenStreetMap surroundings (added)

Overpass: https://overpass-api.de/api/interpreter ; API documentation https://wiki.openstreetmap.org/wiki/Overpass_API ; contributor credit and ODbL 1.0 https://www.openstreetmap.org/copyright . The Penang raw response, compact geometry, exact query URL, retrieval/source timestamps and SHA-256 are retained under `data/raw/osm-penang.json`, `public/data/horizon-penang.json` and `data/osm-sources.json`. Script: `scripts/acquire_horizons.py`. All 909 footprints are preserved; the renderer shows a bounded nearby subset. Heights/facades and the outdoor/raised viewpoint are approximations; geometry is not a photograph or surveyed terrain. Failed optional acquisitions are recorded without fabricated substitutes.

## Named viewpoint context

Seven public stations use cached OSM footprints, building parts, roads, parks and furniture. `data/viewpoint-map-sources.json` records raw queries, timestamps, hashes and fallbacks. `scripts/acquire_viewpoint_scenes.py <ids> --verify` checks exact cached reproduction without network. OSM derived data remain ODbL 1.0.

NASA/USGS SRTMGL3 V003 via Open Topo Data supplies 2,175 near-grid and 3,087 far-grid samples (58 raw API batches). Native postings are 3 arc-seconds, approximately 90 m at the equator; NightLens samples at 400/500 m near and 2 km far. WGS84 coordinates, EGM96 metre heights, source hashes and raw responses are retained in `data/viewpoint-terrain-sources.json`. This is a February 2000 radar surface/void-filled product, not local sky brightness, bathymetry or a current bare-earth survey. Published architecture/place constraints and the final eye positions are in VIEWPOINT_SOURCES.md.

Sydney Harbour and New York East River water surfaces use complete OSM water-relation boundaries, with original island holes, clipped to the station ±4 km window. A GPU mask prevents historical radar elevations from drawing land over those sourced water polygons. The clip edges are coverage boundaries, not shorelines; water colour/ripples, level and tide are illustrative. `data/viewpoint-water-sources.json` preserves raw replies/hashes and exact methods. `scripts/acquire_viewpoint_water.py --verify` reproduces the cached polygons using pinned Shapely 2.1.2. Penang has an explicit unavailable coastal mask: incomplete shore coverage is labeled instead of inventing mainland coast.

## Immersive source assets, November 15 quality pass

The renderer now uses the NASA SVS LROC Moon visualization map (`data/moon-assets.json`), attributed NanoRay Petronas model via Ai2 Objaverse (`data/landmark-model-sources.json`), generic CC0 paving and two separate historical source photographs (`data/realism-context-sources.json`). Five original font binaries are self-hosted (`data/font-assets.json`). Wider OSM context adds 17,179 cached source ways across KL, Penang, Seoul and Sydney (`data/context-sources.json`); London and New York wider-context acquisition failed and are explicitly empty, while their existing near-map caches remain available. Atacama wider urban context is not applicable. None of these assets changes the NASA POWER/CERES analysis or resolves the challenge’s tab-listed NASA source requirement. See `REALISM_DESIGN_PASS.md` and `REALISM_RULES_AND_MOON.md`.
