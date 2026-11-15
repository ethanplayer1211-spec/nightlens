# NightLens — The Atlas of Lost Starlight

A digital observatory for the changing night sky. Built for NASA Space Apps 2026, **Be An Earth System Trend Detective!**

NightLens connects two carefully separated experiences: a reproducible NASA atmospheric trend investigation and a hypothetical outdoor-lighting experiment over a calculated sky. It does not claim the atmospheric record measures light pollution.

## Run locally

Requires Node.js 22.12+ (validated with 24.18.1) and npm.

```powershell
npm ci
npm run dev -- --port 4173
```

Open http://127.0.0.1:4173. The initial view is the Observatory, with the actual current instant and a selectable observing place. Sky Lab / What If? — City Experiment and the NASA Time Machine remain available. There are no runtime API keys or accounts. Historical scientific records, the star subset and Gaia survey map are cached locally. City search and optional current model conditions use Open-Meteo over HTTPS. Local buildings use OpenStreetMap footprints through Overpass, with a cached Penang sample. Network failure is labeled and does not stop astronomy. Fonts have local system fallbacks if Google Fonts is unavailable.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --port 4173
```

Production output: `dist/`. Deploy as a static Vite app; no Python server is required. See `docs/DEPLOYMENT.md`. Nothing has been published or submitted from this checkout.

## Implemented

- **City Experiment:** 6 PM–midnight timeline; configurable half-hour schedule; participating-fixture brightness and coverage; shielding; warm/cool scenario; draggable and keyboard-accessible before/after comparison; working reset. Lighting does not change celestial coordinates.
- **Four experiments:** City After Dark, Shield the Streets, Warmer Nights, Protect the Observatory. These set hypothetical controls, not validated outcomes. Adjusting the timeline preserves the selected study; other edits create a custom study.
- **Observatory:** worldwide city search, coordinates and seven saved places; current instant with IANA timezone/DST handling; full-day scrubbing and manual previews; perspective pan/zoom; 4,105 HYG stars, seven major planets and a phase-oriented Moon; a real ESA/Gaia/DPAC EDR3 survey background reprojected into the local horizon. Busy city, quiet neighbourhood, rural night and no-artificial-light themes share the same geometry, with a draggable/keyboard comparison and working reset. Timestamped Open-Meteo current cloud cover is optional and excluded from time previews.
- **Combined environments:** City street, After midnight, Rooftop lookout, Open coast, Dark-sky field and Overcast city; independent haze, cloud coverage/opacity, nearby glare, natural/enhanced treatment, fixture participation, shielding, colour and recurring dimming across midnight. Maximum artificial light suppresses the stellar field; labels/asterisms and mapped building occlusion follow the same display rules. All appearance effects remain uncalibrated.
- **Mapped surroundings:** cached actual Penang OpenStreetMap footprints and optional live footprints for other places; explicitly estimated heights, illustrative facades and selected outdoor/raised viewpoints. Rooftop/coast/field alternatives are illustrative. OSM data retain ODbL.
- **Observed human intervention:** attributed six-night Tucson2019 VIIRS table reanalysis; raw/corrected scatter and fit, Student-t intervals, exact 720-permutation association test, leave-one-night-out sensitivity and a bounded replay/export. Separate published ground-sky measurements retain their measurement-uncertainty labels. This does not forecast the selected city or replace the 24-year NASA investigation.
- **Compact sky:** `/sky.html` is a dedicated sky page. `npm run build` also produces `public/downloads/nightlens-sky.html` (about 6.52 MiB), a single HTML containing code, styles, catalog, survey map, Penang footprints and study analysis. It needs no external request to calculate or draw the sky; location search/weather need the network. Open the HTML directly in a modern browser. Device geolocation depends on browser secure-context support.
- **Time Machine:** NASA POWER / CERES SYN1deg aerosol optical depth at 550 nm, 2001–2024, 288 monthly records per region, complete annual means, selectable interval and year, endpoint comparison, fitted trend, exploratory confidence interval and p-value, annual CSV and evidence JSON downloads.
- **Evidence:** persistent notebook, methodology view, source attribution, model limitations, NASA data/illustration distinction, DarkSky International / IES educational guidance and AI disclosure.
- **Responsive controls:** desktop instrument panel and mobile layout, native touch-capable ranges, keyboard operation, focus styles, native modal dialog and reduced-motion support.

## Scientific boundary

The historical variable is **aerosol optical depth**, dimensionless, for one 1° source grid cell selected by the listed coordinates. It is not nighttime radiance, a citywide average, live weather, ground air quality, or sky brightness.

The preferred Black Marble VNP46A4 annual nighttime-radiance file redirected to Earthdata Login. Its data were **not** downloaded, quality-filtered or analyzed. This scope reduction is visible in the Evidence panel. NASA POWER is the actual working dataset; it is not relabeled as Black Marble.

The sky uses Astronomy Engine, an attributed HYG catalog subset and an ESA/Gaia/DPAC historical survey map. A single cached NASA/JPL Horizons Moon ephemeris is used as an independent position benchmark, not as a runtime data feed or validation of all bodies/dates. Lighting, haze, cloud, Moon influence, symbol size and visual star contrast are **illustrative**, without calibrated photometry. There is no prediction of exact star detectability, Bortle class, energy savings, safety or observatory performance. Essential safety lighting is outside the city experiment.

## Reproduce data and statistics

Python 3.12 was used. The frontend runs without Python.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe scripts/acquire_data.py
.\.venv\Scripts\python.exe scripts/analyze_data.py
.\.venv\Scripts\python.exe -m pytest tests/test_analysis.py -q
```

Acquisition requires outbound HTTPS, and fails visibly on unavailable sources. It saves raw NASA responses and a versioned HYG archive under `data/raw/`; published subsets/analysis are under `public/data/`. Running acquisition must be followed by analysis before serving or building. The checks verify raw SHA-256 hashes, units, source metadata, monthly values and reproduction of every selectable analysis window.

Reacquire the exact pinned Gaia map with `python scripts/acquire_sky_assets.py`; metadata, original URL, projection, attribution and SHA-256 are in `data/sky-assets.json`. See `docs/OBSERVATORY.md` for the renderer and time-model limitations. Reproduce cached footprints with `python scripts/acquire_horizons.py`; reanalyze the intervention with `.\.venv\Scripts\python.exe scripts/analyze_intervention.py` and test it with `.\.venv\Scripts\python.exe -m pytest tests/test_intervention.py -q`. See `docs/TUCSON_EVIDENCE.md` for methods and limitations.

See `docs/DATA_SOURCES.md`, `docs/SCIENTIFIC_METHOD.md`, `docs/AI_DISCLOSURE.md`, `docs/VALIDATION.md`, `docs/SUBMISSION.md`, and `docs/DEMO_STORYBOARD.md`.

## Submission status

Official challenge Resources and the November 13, 2026 submission/judging guides were inspected in the signed-in browser on November 15. NASA POWER is not listed in the challenge Resources tab; the official submission guide permits a NASA data **or resource**, without limiting this to the tab. The original project brief imposes a stricter tab-listed-data condition that remains unmet. Global eligibility is ultimately determined by the organizers; registration, team composition, demo, public links and final declarations still need owner review.

Live demo: **not deployed**. Remote repository: **not created or pushed**. Official judging submission: **not submitted**. The signed-in Space Apps editor has a saved NightLens revision, verified after reopening, with description, actual NASA links, source credits and AI disclosure. Its final-project/demo links remain blank; the public Project tab still shows its previous placeholder title.

## License and attribution

Application code: MIT (`LICENSE`). HYG v3.8 subset and its source archive: **CC BY-SA 4.0**, David Nash / Astronexus; retained separately under the original license. Gaia survey image and its runtime reprojection: **CC BY-SA 3.0 IGO**, ESA/Gaia/DPAC, acknowledgement A. Moitinho. These data/image licenses remain separate from the application code. Open-Meteo / GeoNames data: CC BY 4.0. OpenStreetMap building geometry: ODbL 1.0. Published-study factual values are attributed with their source/right notices; article figures/full text are not bundled. Astronomy Engine: MIT, Don Cross. Interface icons: Lucide, ISC. NASA POWER/CERES data and DarkSky/IES guidance retain their source attribution. See `docs/THIRD_PARTY_NOTICES.md`.

## Named city viewpoints

The Observatory now starts at KL Tower’s Sky Deck facing Petronas, with six other curated outdoor stations. OpenStreetMap footprints/parts and NASA/USGS SRTM terrain provide geographic structure; fine architecture and foreground details remain approximate. City/lighting selections share the same astronomical frame. See `docs/VIEWPOINT_SOURCES.md` for exact station inputs, published landmark constraints and limitations. The standalone HTML embeds all seven stations.
