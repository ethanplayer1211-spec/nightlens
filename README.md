# NightLens — The Atlas of Lost Starlight

A digital observatory for the changing night sky. Built for NASA Space Apps 2026, **Be An Earth System Trend Detective!**

NightLens connects two carefully separated experiences: a reproducible NASA atmospheric trend investigation and a hypothetical outdoor-lighting experiment over a calculated sky. It does not claim the atmospheric record measures light pollution.

## Run locally

Requires Node.js 22.12+ (validated with 24.18.1) and npm.

```powershell
npm ci
npm run dev -- --port 4173
```

Open http://127.0.0.1:4173. The initial view is an explicitly labeled 21:00 local Tonight preview above Kuala Lumpur on a virtual clear-horizon platform; switch Clear 360° off for the named KL Tower viewpoint. Now uses the actual clock; choosing a place returns to Now. Sky Lab / What If? — City Experiment and the NASA Time Machine remain available. There are no runtime API keys or accounts. Historical scientific records, the star subset and Gaia survey map are cached locally. City search and optional current model conditions use Open-Meteo over HTTPS. Local buildings use OpenStreetMap footprints through Overpass, with a cached Penang sample. Network failure is labeled and does not stop astronomy. Five original WOFF2 fonts are self-hosted under the SIL Open Font License; system fallbacks remain.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --port 4173
```

Production output: `dist/`. Deploy as a static Vite app; no Python server is required. See `docs/DEPLOYMENT.md`. Public version 1: https://nightlens-sky-atlas.leveling-magician.chatgpt.site. Final judging submission has not been performed.

## Implemented

- **City Experiment:** 6 PM–midnight timeline; configurable half-hour schedule; participating-fixture brightness and coverage; shielding; warm/cool scenario; draggable and keyboard-accessible before/after comparison; working reset. Lighting does not change celestial coordinates.
- **Four experiments:** City After Dark, Shield the Streets, Warmer Nights, Protect the Observatory. These set hypothetical controls, not validated outcomes. Adjusting the timeline preserves the selected study; other edits create a custom study.
- **Observatory:** worldwide city search, coordinates and seven saved places; current instant with IANA timezone/DST handling; full-day scrubbing and manual previews; perspective pan/zoom; 4,105 HYG stars, seven major planets and a phase-oriented Moon; a real ESA/Gaia/DPAC EDR3 survey background reprojected into the local horizon. Busy city, quiet neighbourhood, rural night and no-artificial-light themes share the same geometry, with a draggable/keyboard comparison and working reset. Timestamped Open-Meteo current cloud cover is optional and excluded from time previews.
- **Combined environments:** City street, After midnight, Rooftop lookout, Open coast, Dark-sky field and Overcast city; independent haze, cloud coverage/opacity, nearby glare, natural/enhanced treatment, fixture participation, shielding, colour and recurring dimming across midnight. Maximum artificial light suppresses the stellar field; labels/asterisms and mapped building occlusion follow the same display rules. All appearance effects remain uncalibrated.
- **Mapped surroundings:** cached actual Penang OpenStreetMap footprints and optional live footprints for other places; explicitly estimated heights, illustrative facades and selected outdoor/raised viewpoints. Rooftop/coast/field alternatives are illustrative. OSM data retain ODbL.
- **Observed human intervention:** attributed six-night Tucson2019 VIIRS table reanalysis; raw/corrected scatter and fit, Student-t intervals, exact 720-permutation association test, leave-one-night-out sensitivity and a bounded replay/export. Separate published ground-sky measurements retain their measurement-uncertainty labels. This does not forecast the selected city or replace the 24-year NASA investigation.
- **Compact sky:** `/sky.html` is a dedicated sky page. `npm run build` also produces `public/downloads/nightlens-sky.html` (about 16.06 MiB), a single HTML containing code, styles, five fonts, catalog, Gaia and NASA Moon maps, all seven city/terrain bundles, Petronas model, generic paving materials, source-reference photos and study analysis. JSON assets are gzip-packed and require DecompressionStream support. It needs no external request to calculate or draw the sky; location search/weather need the network. The packaged build was verified through a local static server. Direct file-origin execution and deliberate offline-network disconnection remain untested. Device geolocation depends on browser secure-context support.
- **Challenge-listed NASA record:** MODIS Terra MOD08_M3 v6.1 via Giovanni, Penang 100–101° E / 5–6° N, 2001–2024. Original CSV, raw SHA-256, 288 monthly timestamps, 23 complete annual values, calendar-year HAC trend inference without bridging the excluded 2022 gap, reproducible request and exports. The full-window trend is inconclusive (p≈0.197).
- **Curated sky moments and learning:** five date tags (lunar phases, 2026 Mars/Jupiter pair, Geminid planning), three lighting experiments, comparison and a Night Designer question with attributed evidence. No meteor simulation or real-world visibility forecast.
- **Clear 360°:** a fictional observation platform sits above every rendered source vertex, with a low railing below the eye. Original city geometry remains fixed, and astronomy uses the virtual observer height. This is not a surveyed/accessible rooftop.
- **Time Machine context:** NASA POWER / CERES SYN1deg aerosol optical depth at 550 nm, 2001–2024, 288 monthly records per region, complete annual means, selectable interval and year, endpoint comparison, fitted trend, exploratory confidence interval and p-value, annual CSV and evidence JSON downloads.
- **Evidence:** persistent notebook, methodology view, source attribution, model limitations, NASA data/illustration distinction, DarkSky International / IES educational guidance and AI disclosure.
- **Responsive controls:** desktop instrument panel and mobile layout, native touch-capable ranges, keyboard operation, focus styles, native modal dialog and reduced-motion support.

## Scientific boundary

The historical variable is **aerosol optical depth**, dimensionless, for one 1° source grid cell selected by the listed coordinates. It is not nighttime radiance, a citywide average, live weather, ground air quality, or sky brightness.

The preferred Black Marble VNP46A4 annual nighttime-radiance file redirected to Earthdata Login. Its data were **not** downloaded, quality-filtered or analyzed. This scope reduction is visible in the Evidence panel. MODIS via Giovanni and NASA POWER are actual working atmospheric datasets; it is not relabeled as Black Marble.

The sky uses Astronomy Engine, an attributed HYG catalog subset and an ESA/Gaia/DPAC historical survey map. A single cached NASA/JPL Horizons Moon ephemeris is used as an independent position benchmark, not as a runtime data feed or validation of all bodies/dates. Lighting, haze, cloud, Moon influence, star-symbol size and contrast are **illustrative**, without calibrated photometry. The perspective Sun and Moon have calculated angular sizes; the Moon has an IAU body orientation and an attributed NASA surface texture. Sky Lab retains schematic symbols. There is no prediction of exact star detectability, Bortle class, energy savings, safety or observatory performance. Essential safety lighting is outside the city experiment.

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

The selected challenge Resources tab lists NASA Giovanni. NightLens now numerically analyzes a MODIS Terra monthly AOD export from that resource, with original CSV, checksum, reproducible request and uncertainty. This addresses the earlier demonstrated resource-use gap. Organizers retain eligibility decisions; registration, team composition, demo, public links and final declarations require owner review.

Live demo: **not deployed**. Remote repository: **not created or pushed**. Official judging submission: **not submitted**. The signed-in Space Apps editor has a saved NightLens revision, verified after reopening, with description, actual NASA links, source credits and AI disclosure. Its final-project/demo links remain blank; the public Project tab still shows its previous placeholder title.

## License and attribution

Application code: MIT (`LICENSE`). HYG v3.8 subset and its source archive: **CC BY-SA 4.0**, David Nash / Astronexus; retained separately under the original license. Gaia survey image and its runtime reprojection: **CC BY-SA 3.0 IGO**, ESA/Gaia/DPAC, acknowledgement A. Moitinho. These data/image licenses remain separate from the application code. Open-Meteo / GeoNames data: CC BY 4.0. OpenStreetMap building geometry: ODbL 1.0. Published-study factual values are attributed with their source/right notices; article figures/full text are not bundled. Astronomy Engine: MIT, Don Cross. Interface icons: Lucide, ISC. NASA POWER/CERES data and DarkSky/IES guidance retain their source attribution. See `docs/THIRD_PARTY_NOTICES.md`.

## Named city viewpoints

The Observatory now starts at KL Tower’s Sky Deck facing Petronas, with six other curated outdoor stations. OpenStreetMap footprints/parts and NASA/USGS SRTM terrain provide geographic structure; fine architecture and foreground details remain approximate. City/lighting selections share the same astronomical frame. See `docs/VIEWPOINT_SOURCES.md` for exact station inputs, published landmark constraints and limitations. The standalone HTML embeds all seven stations.

Recording polish: immersive Controls reuses the full lighting/atmosphere/experiment panel, explicit On/Off switches and adjustable render quality. Display-only lighting changes ease for 360 ms; redraws are coalesced per browser frame. Reset lighting & view preserves the selected instant. See [the recording guide](docs/RECORDING_GUIDE.md) for a 28-second rehearsal. Actual capture performance depends on hardware.

The current toolbar is **Adjust sky / Compare / Reset**. Adjust sky opens three guided steps; technical controls are collapsed under Advanced. KL and Sydney offer an attributed historical photographic reference viewer. The calculated 3D scene remains a reconstruction. See the updated recording guide above.
