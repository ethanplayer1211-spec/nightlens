# Judges — start here

**NightLens · Be An Earth System Trend Detective! · NASA Space Apps 2026**

[Open the public app](https://nightlens-sky-atlas.leveling-magician.chatgpt.site) — no account, API key or Earthdata sign-in is required to review it.

[Seven-slide public demo](https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/) · [Download the seven-slide PDF](https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/NightLens-seven-slide-demo.pdf) · [Separate judge brief](https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/NightLens-judge-brief.pdf)

## A three-minute review

1. Open **NASA trends**. This is the challenge's numerical investigation. Choose Penang and the default **MODIS Terra via Giovanni** record. Keep 2001–2024. Inspect the original annual series, missing-year gap, endpoint change, fitted trend, confidence interval and p-value.
2. Open **Processing, source and uncertainty**. The original NASA CSV, its checksum, the precise source grid and a reproducible Giovanni request are linked. Download Annual CSV or Evidence JSON if useful.
3. Open **Observatory → Enter the sky → Compare**. Choose **Clear reference** to compare your current settings against no artificial glow, haze, fog or clouds, retaining the actual Sun and Moon. Choose **Your changes** to capture Before, then edit Lighting or Environment for After. **Set Before** refreshes that snapshot. Both sides share the same location, instant and camera. Drag the divider.
4. Open **Environment**. Try Foggy, Clear air and Overcast. Switch individual effects on/off or change their strength. These illustrative effects do not change astronomical coordinates or the NASA trend.
5. Open **Place & time**. Choose a featured city or tagged observing date. Clear 360° is an explicitly virtual elevated platform; turning it off restores the named source viewpoint. It is not a surveyed or accessible rooftop.
6. Open **City experiment** for the simplified 18:00–midnight scheduling lesson, or **Sources & method** to review evidence and limitations.

## What the NASA investigation actually establishes

The selected challenge lists **NASA Giovanni** as a resource. NightLens uses a real Giovanni export of Terra MODIS **MOD08_M3 v6.1 combined Dark Target / Deep Blue AOD at 550 nm**, monthly from 2001–2024.

- Requested region: 100–101° E, 5–6° N, near Penang. Actual source grid centre: 100.5° E, 5.5° N. One grid cell is not a citywide average.
- 288 monthly timestamps; October 2022 is fill. Requiring all 12 valid months excludes 2022 and leaves 23 complete annual values.
- Calendar-day weighted annual aggregation; OLS slope; calendar-year Newey–West HAC lag 1 with Bartlett weights, small-sample correction and Student-t inference. Missing 2022 is not bridged in lag-pair covariance.
- Endpoint change: −15.1%. Fitted slope: approximately −0.01555 AOD/decade; 95% interval −0.03982 to +0.00873; p≈0.197. **The fitted trend is inconclusive.** Endpoint difference and trend significance answer different questions.
- POWER/CERES context is separately labeled and never spliced into MODIS. No Black Marble radiance analysis is claimed.

AOD is atmospheric aerosol extinction, not nighttime radiance, ground air quality or skyglow. The record is not used to calibrate star detectability or the lighting renderer.

## Source map

| Review question | Start here |
|---|---|
| NASA input and provenance | `data/raw/giovanni-modis-penang-2001-2024.csv`, `docs/DATA_SOURCES.md` |
| Reproducible statistics | `scripts/analyze_giovanni.py`, `scripts/analyze_data.py`, `tests/test_giovanni.py` |
| Cached annual values and intervals | `public/data/penang-modis.json` |
| Astronomy and timezones | `src/lib/astronomy.ts`, `src/lib/observingTime.ts`, `src/lib/skyMoments.ts` |
| Scenario and environmental model | `src/lib/scenario.ts`, `src/lib/skyAppearance.ts` |
| Renderer and comparison | `src/components/SkyTheatre.tsx`, `src/lib/skyShader.ts`, `src/lib/cityGPU.ts` |
| Interface | `src/components/LiveObservatory.tsx`, `QuickSkyControls.tsx`, `EnvironmentControls.tsx` |
| Licenses and AI disclosure | `docs/THIRD_PARTY_NOTICES.md`, `docs/AI_DISCLOSURE.md`, `public/licenses/` |

## Run and reproduce

Node 22.12+ and npm:

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Python, from the repository root:

```sh
python -m venv .venv
# Activate the environment using your operating system's usual command.
python -m pip install -r requirements.txt
python scripts/analyze_giovanni.py
python -m pytest tests/test_analysis.py tests/test_intervention.py tests/test_giovanni.py -q
```

No credential is required to reproduce the cached analysis. A new export from Giovanni requires the reviewer's own Earthdata account and data-use agreement.

## Scientific and visual limits

Astronomical positions are calculated from Astronomy Engine, HYG and the selected observer/time. Gaia provides a historical survey field; NASA LROC provides the lunar visualization texture. These are not a live camera feed or a calibrated naked-eye forecast.

Lighting, haze, fog, clouds, materials and apparent star brightness are illustrative. The city reconstruction has incomplete mapping and approximate heights/materials. There are no exact visible-star counts, Bortle estimates, energy/safety forecasts or arbitrary-city intervention predictions. Essential safety lighting is outside the experiment. DarkSky International / IES guidance is attributed in the app. The independent six-night Tucson intervention evidence is not a calibration for Penang or another selected city.

AI assistance, source licenses and scientific limitations are disclosed. Organizer eligibility and judging decisions remain with the organizers.
