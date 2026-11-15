# NightLens — The Atlas of Lost Starlight

A digital observatory for the changing night sky. Built for NASA Space Apps 2026, **Be An Earth System Trend Detective!**

NightLens connects two carefully separated experiences: a reproducible NASA atmospheric trend investigation and a hypothetical outdoor-lighting experiment over a calculated sky. It does not claim the atmospheric record measures light pollution.

## Run locally

Requires Node.js 22.12+ (validated with 24.18.1) and npm.

```powershell
npm ci
npm run dev -- --port 4173
```

Open http://127.0.0.1:4173. The initial view is Sky Lab / What If? — City Experiment. There are no runtime API keys or accounts. All scientific records and the star subset are cached locally. Fonts have local system fallbacks if Google Fonts is unavailable.

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
- **Observatory:** Penang/Seoul, manual observing date, explicit local timezone, actual catalog stars, Moon illumination/altitude, Sun altitude, selected planets above the geometric horizon, target inspection, chart grid/asterisms and zoom.
- **Time Machine:** NASA POWER / CERES SYN1deg aerosol optical depth at 550 nm, 2001–2024, 288 monthly records per region, complete annual means, selectable interval and year, endpoint comparison, fitted trend, exploratory confidence interval and p-value, annual CSV and evidence JSON downloads.
- **Evidence:** persistent notebook, methodology view, source attribution, model limitations, NASA data/illustration distinction, DarkSky International / IES educational guidance and AI disclosure.
- **Responsive controls:** desktop instrument panel and mobile layout, native touch-capable ranges, keyboard operation, focus styles, native modal dialog and reduced-motion support.

## Scientific boundary

The historical variable is **aerosol optical depth**, dimensionless, for one 1° source grid cell selected by the listed coordinates. It is not nighttime radiance, a citywide average, live weather, ground air quality, or sky brightness.

The preferred Black Marble VNP46A4 annual nighttime-radiance file redirected to Earthdata Login. Its data were **not** downloaded, quality-filtered or analyzed. This scope reduction is visible in the Evidence panel. NASA POWER is the actual working dataset; it is not relabeled as Black Marble.

The sky uses Astronomy Engine and an attributed HYG catalog subset. Lighting, haze, cloud, Moon influence, symbol size and visual star contrast are **illustrative**, without calibrated photometry. There is no prediction of exact star detectability, Bortle class, energy savings, safety or observatory performance. Essential safety lighting is outside the city experiment.

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

See `docs/DATA_SOURCES.md`, `docs/SCIENTIFIC_METHOD.md`, `docs/AI_DISCLOSURE.md`, `docs/VALIDATION.md`, `docs/SUBMISSION.md`, and `docs/DEMO_STORYBOARD.md`.

## Submission status

Official challenge Resources and the November 13, 2026 submission/judging guides were inspected in the signed-in browser on November 15. NASA POWER is not listed in the challenge Resources tab; the official submission guide permits a NASA data **or resource**, without limiting this to the tab. The original project brief imposes a stricter tab-listed-data condition that remains unmet. Global eligibility is ultimately determined by the organizers; registration, team composition, demo, public links and final declarations still need owner review.

Live demo: **not deployed**. Remote repository: **not created or pushed**. Official submission: **not submitted**.

## License and attribution

Application code: MIT (`LICENSE`). HYG v3.8 subset and its source archive: **CC BY-SA 4.0**, David Nash / Astronexus; retained separately under the original license. Astronomy Engine: MIT, Don Cross. Interface icons: Lucide, ISC. NASA POWER/CERES data and DarkSky/IES guidance retain their source attribution. See `docs/THIRD_PARTY_NOTICES.md`.
