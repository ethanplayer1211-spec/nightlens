# Scientific method and limitations

## Separate three claims

1. The historical explorer analyzes actual NASA-derived atmospheric records.
2. Astronomical geometry is calculated from a library and a licensed catalog.
3. The lighting experiment is an uncalibrated educational rendering.

These paths do not feed an undocumented conversion from satellite values to star visibility.

## Historical environmental investigation

Question: how did 550 nm aerosol optical depth change in the source grid cell selected by Penang or Seoul’s coordinate from 2001 to 2024?

The source is NASA POWER’s CERES SYN1deg aerosol field (`AOD_55`, dimensionless). This is a 1° gridded, satellite-derived/model-assimilated atmospheric product, not artificial-light radiance. Aerosols can affect transparency and scattering, but this record does not establish the nighttime optical conditions at a particular observing site.

Processing in `scripts/acquire_data.py` and `scripts/analyze_data.py`:

- Retain raw NASA response and SHA-256; validate source and units.
- Exclude API fill −999, nonfinite and negative values.
- Ignore month 13, which is the API’s annual aggregate.
- Require all 12 valid months; use a day-weighted mean, including leap years.
- Exclude an incomplete year rather than interpolating it.
- Report endpoint absolute change and percentage change only with both endpoints and a positive starting value.
- Regress annual AOD on actual year offset using OLS.
- With ≥ 8 valid years, use Newey–West HAC covariance with lag 1, small-sample correction, and Student-t inference with n−2 degrees of freedom.
- Report the two-sided slope p-value and 95% confidence interval. With fewer observations, provide descriptive results and withhold inference.
- Calculate residual lag-1 correlation as a diagnostic, retained in evidence JSON.

Analysis is precomputed for each selectable start/end interval. The UI never fabricates live recalculations; it selects the corresponding reproducible result. The line chart plots the actual annual data; the dashed line is the fitted trend. The displayed interval describes the slope, not a confidence band around the time series.

### Actual full-period results

| Source cell | Complete years | Endpoint AOD change | Endpoint % change | Slope AOD/decade | 95% CI, AOD/decade | Two-sided p |
|---|---:|---:|---:|---:|---:|---:|
| Penang coordinate | 24 | +0.0468104 | +13.0976% | +0.0124921 | −0.0158701 to +0.0408543 | 0.370917 |
| Seoul coordinate | 24 | −0.0391986 | −6.7972% | −0.0665470 | −0.115015 to −0.0180794 | 0.009367 |

Penang’s fit is inconclusive at α=0.05 under this test. Seoul’s fit meets this exploratory threshold. Neither result establishes a cause, and neither describes artificial lighting. Endpoint comparison is not the same as a fitted slope.

Limitations: short annual sample; linearity assumption; potential autocorrelation beyond lag 1; product changes, retrieval/model bias, measurement uncertainty and spatial representativeness. HAC does not remove those issues. Looking at many windows can produce apparently significant results by chance; there is no multiple-testing correction. Eight years is a conservative UI threshold, not a guarantee of robust inference. Results are exploratory.

## Astronomical geometry

The local date and selected minute are converted explicitly to UTC using the chosen city’s offset: Penang +08:00, Seoul +09:00. These locations do not require a daylight-saving transition table for the supported UI dates. Minute 1440 means the next day’s midnight.

For each HYG J2000 star, convert RA hours to degrees, create an equatorial unit vector, apply Astronomy Engine’s `Rotation_EQJ_HOR`, and convert using `HorizonFromVector` with no refraction. The library’s rotation accounts for precession/nutation. Proper motion and parallax are omitted; no subarcminute catalog accuracy claim is made.

Moon, Sun, Venus, Mars, Jupiter and Saturn use topocentric `Equator(..., ofdate=true, aberration=true)` then `Horizon` without refraction. Objects below geometric altitude 0° are filtered. Moon illumination comes from `Illumination`. The target list is geometrical, not a guarantee of detectability. No live weather provider is used.

Projection is azimuthal equidistant with north up, east left and zenith centered:

`r = (90 − altitude) / 90 × chartRadius`

`x = centerX − r × sin(azimuth)`

`y = centerY − r × cos(azimuth)`

Moon symbol size/phase glyph and star sizes are schematic; local terrain, atmospheric refraction and optical instrument response are not modeled.

## City Experiment

Reusable state: `time`, `scheduleStart`, `dimmingPercent`, `participatingFixturePercent`, `shieldingEnabled`, `lightColorScenario`. `time`/`scheduleStart` are integer local minutes in [1080,1440]. Percentages are clamped to [0,100]; invalid/nonfinite inputs are rejected.

Defaults: 21:00 local, dimming starts 20:00, 50% dimming, 70% of selected nonessential fixtures participating, shielding off, cooler scenario. Fixture brightness is the UI inverse of dimming percentage. Schedule equality activates the dimming. Dragging backward before the start restores baseline output. Shielding/color scenarios apply throughout the evening; only brightness reduction is scheduled.

For participant fraction `p`, scheduled fixture output `q`, artistic shielding coefficient `s` (0.62 if enabled), and artistic warm-color coefficient `w` (0.87 if warm):

`fixtureContribution = (1 − p) + p × q × s × w`

`illustrativeGlow = 0.24 + 0.76 × sqrt(fixtureContribution)`

Before schedule start, `q=1`; afterward `q=1−dimmingPercent/100`. The floor represents an unchanged illustrative background. These constants are design choices, with no calibrated radiative-transfer interpretation. They are not measured skyglow, spectral response, Bortle conversion, energy use or star-count estimates. The square-root mapping explicitly avoids treating 50% fixture dimming as 50% less skyglow.

The derived glow changes radial atmospheric tint and magnitude-dependent catalog-symbol contrast. Additional haze, cloud, twilight and Moon appearance use bounded, illustrative factors. The cloud control can brighten the rendered urban background and reduce star-symbol contrast. There is no randomized weather, moving decorative particle layer or unrelated animation.

The baseline/experiment share one calculated sky at one instant; clip paths form the comparison. The divider supports pointer dragging and a labeled native keyboard range. Dimming/presets never move celestial coordinates. Timeline movement recalculates both views together.

Reset creates a fresh default scenario and resets comparison/divider, chart zoom, haze/cloud/Moon switches, grid/asterisms and selected object. It preserves the manually selected city and observing date.

Essential safety lighting is excluded. The experiment is not a real infrastructure control or a recommendation to shut down safety lighting. Educational principles are attributed to DarkSky International and IES; local professional lighting design remains necessary.

## Validation

TypeScript tests exercise schedule boundaries, backward scrubbing, midnight, reset copies, deterministic output, participation edge cases, no linear dimming-to-skyglow claim, UTC conversion, invalid coordinates/dates, cardinal projection and an independent Equator/Horizon API comparison for Vega. Data tests validate hashes and every monthly value against raw responses. Python tests validate calendar weighting, missing values, duplicates, SciPy/OLS agreement and exact regeneration of all selectable NASA analysis windows.

Browser checks and remaining verification limits are recorded in `docs/VALIDATION.md`. No claim of ground-calibrated visual accuracy or external JPL benchmark validation is made.
