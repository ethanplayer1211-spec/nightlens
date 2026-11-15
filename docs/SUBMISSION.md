# Submission draft — owner review required

The official project editor contains a saved NightLens revision (November 15, 2026 10:23 Malaysia time), verified by reopening the editor. The owner reviewed/checked the declarations. No Submit for Judging action was performed. Public final-project and demo links remain required, and the public non-editor tab still showed its prior placeholder title. This local document is the durable source draft.

## Project name

NightLens — The Atlas of Lost Starlight

## High-level project summary

NightLens is a digital observatory for the changing night sky. It lets people investigate 24 years of NASA aerosol optical-depth records for grid cells near Penang and Seoul, inspect a calculated astronomical sky, and ask “What if?” about responsible outdoor lighting. A traceable trend explorer reports how much the environmental variable changed, its fitted trend, confidence interval and exploratory significance. A separate City Experiment offers scheduled dimming and a draggable sky comparison. Measured environmental records, calculated astronomy and illustrative lighting effects are carefully distinguished.

## Challenge

Be An Earth System Trend Detective!
https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/

## Link to final project

PENDING PUBLICATION — insert the public URL only after deployment and an unauthenticated access check. The local preview URL is not a public submission link.

## Link to project demo

PENDING — provide a publicly accessible video ≤30 seconds or a slide deck ≤7 slides, including title/intro. `DEMO_STORYBOARD.md` supplies a 28-second script. A storyboard alone is not the required demo.

## Detailed description

Environmental changes can alter our experience of the sky, but atmospheric records and light-pollution illustrations should not be conflated. NightLens makes that distinction part of the experience.

The Time Machine explores NASA POWER’s CERES SYN1deg aerosol optical depth at 550 nm from 2001–2024. Each location selects a 1° source grid cell, not a citywide average. Monthly values are cached with provenance and raw-response checksums. Complete years are aggregated using calendar-day weighting. The user selects a period and inspects the actual annual record, endpoint change and linear trend. Confidence intervals and two-sided p-values use a Newey–West lag-1 HAC covariance estimate, with small-sample correction and Student-t inference. Shorter than eight complete years suppresses inference; all windows are labeled exploratory. The complete data and assumptions can be downloaded as CSV or JSON evidence.

The Observatory uses Astronomy Engine and an attributed HYG star catalog. It calculates the sky for a selected place, date and local evening time, including the Moon and selected planets. Below-horizon objects are filtered, and the interface shows altitude/direction and Moon illumination. It does not guarantee observability or provide live weather.

The What If? — City Experiment schedules dimming of participating nonessential outdoor fixtures. Timeline scrubbing activates or reverses the schedule at the chosen time. A draggable divider compares the same astronomical geometry with baseline and hypothetical lighting appearance. Shielding, color and four preset experiments make responsible lighting principles tangible. All visual effects are explicitly illustrative. No conversion to exact skyglow reduction, Bortle class, star count, energy savings or safety outcome is claimed. Essential safety lighting is excluded.

The central circular sky chart, restrained controls and evidence notebook use the visual language of a celestial atlas. The product is a static React/TypeScript application with local cached data; the scientific pipeline uses Python, NumPy, SciPy and statsmodels. It does not require an account, permanent backend or runtime API credentials.

## NASA data and resources actually used

- NASA POWER monthly API, `AOD_55`, 2001–2024, exact requests and raw SHA-256 hashes documented in `DATA_SOURCES.md`.
- NASA CERES SYN1deg aerosol product documentation: https://power.larc.nasa.gov/docs/methodology/data/sources_clds_aerosols/
- NASA CERES product description: https://ceres.larc.nasa.gov/Data/
- Official challenge and November 13 submission/judging guides were consulted.

NASA POWER is not recorded in the selected challenge Resources tab. The official NASA/spaceapps answered discussions [1827](https://github.com/nasa/spaceapps/discussions/1827) and [1947](https://github.com/nasa/spaceapps/discussions/1947) explicitly require meaningful use of at least one NASA source from that tab for Global Awards. This corrects the earlier inference from the submission guide’s broader wording. No qualifying tab-listed source has been demonstrated in this build; Moon imagery and SRTM context do not resolve that condition. Organizer eligibility remains unresolved. NASA does not endorse this application.

Black Marble VNP46A4 was evaluated but could not be downloaded without Earthdata sign-in. It is not an analyzed dataset in this version. The numerical investigation is aerosols; it is not a radiance trend investigation.

## Use of SI

Codex assisted with coding, documentation, research and testing. The user supplied the project concept and requirements. NASA records and HYG coordinates were downloaded from their cited sources, not generated by AI. There is no trained custom machine-learning model. No generative bitmap, video or audio asset is used. See `AI_DISCLOSURE.md`.

## Other references and tools

- Astronomy Engine, Don Cross, MIT: https://github.com/cosinekitty/astronomy
- HYG v3.8, David Nash / Astronexus, CC BY-SA 4.0: https://github.com/astronexus/HYG-Database
- DarkSky International / Illuminating Engineering Society lighting principles: https://darksky.org/resources/guides-and-how-tos/lighting-principles/
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Vite: https://vite.dev/
- Lucide icons, ISC: https://lucide.dev/
- NumPy: https://numpy.org/
- SciPy: https://scipy.org/
- statsmodels: https://www.statsmodels.org/
- Vitest: https://vitest.dev/
- pytest: https://docs.pytest.org/
- Fonts: Instrument Serif, DM Sans, DM Mono via Google Fonts, SIL Open Font License.

## Required owner checks

- Confirm every teammate is registered/accepted at the same Local Event or Universal Event, and meets its team-size requirements.
- The November 13 judging guide requires ≥1 teammate at a Local Event and ≥2 at the Universal Event; maximum six.
- Confirm the Local Event’s deadline. The official guide uses November 15, 2026, 23:59 in the event’s local timezone (Universal Event: team owner’s residence timezone). Malaysia client time is UTC+08:00.
- Approve publication; verify the final public URL and public demo URL without login.
- Fill remaining factual team information and all required form fields in English.
- Personally review final original-work, licensing and legal declarations; submit before the applicable deadline.
- After any later form changes, follow the official save/resubmit flow and verify a success banner. A saved draft is not a judged submission.


## Local extension after the saved revision

The perspective Observatory extension is implemented and locally tested. The saved online draft has not been updated to describe it. Before a later final submission, include the current location/time sky, embedded Gaia survey, optional Open-Meteo model conditions, illustrative lighting themes, and standalone HTML. Retain the separation from NASA POWER/CERES aerosol history. Add the actual new source references:

- ESA/Gaia/DPAC, acknowledgement A. Moitinho; Gaia EDR3 integrated brightness/colour sky map, CC BY-SA 3.0 IGO: https://www.esa.int/media/interactive-map-of-the-sky-from-gaia-s-early-data-release-3
- Open-Meteo / GeoNames geocoding and current model conditions, CC BY 4.0: https://open-meteo.com/en/docs/geocoding-api and https://open-meteo.com/en/docs ; source/license notices https://open-meteo.com/en/licence
- NASA/JPL Horizons limited independent Moon position reference: https://ssd-api.jpl.nasa.gov/doc/horizons.html ; exact query/response cached in the project.

Codex implemented this extension. A specifically approved Claude Code collaboration failed with an account/organization authorization error before any code contribution. Do not claim Claude co-authorship. See `AI_DISCLOSURE.md`, `OBSERVATORY.md` and `VALIDATION.md` for actual scope and limits. This addition is not a published demo or a final judging submission.


## Realism / human-intervention extension after the saved revision

The local implementation now adds six editable environmental combinations, stronger glare/cloud attenuation, coherent constellation/star/label contrast, a recurring after-midnight nonessential-fixture schedule, map-based surroundings and an observed intervention case. The saved online draft is still the earlier revision; it has not been silently updated or submitted.

Additional references required before a later submission:

- NASA Earth Observatory, Experimenting with Tucson Night Lights: https://science.nasa.gov/earth/earth-observatory/experimenting-with-tucson-night-lights-148259/
- Kyba et al., DOI 10.1177/1477153520958463, Table 6 (actual numerical source for the six-night VIIRS reanalysis): https://journals.sagepub.com/doi/full/10.1177/1477153520958463?journalCode=lrtd
- Barentine et al., DOI 10.1016/j.jqsrt.2020.107120, Table 7, separately cited ground measurements: https://www.johncbarentine.com/uploads/7/8/0/8/78081652/barentine-et-al-2020.pdf
- OpenStreetMap contributors / ODbL: https://www.openstreetmap.org/copyright ; Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API

Describe the numerical source as attributed rounded published VIIRS aggregates from NOAA-generated Suomi NPP data, not a newly downloaded Black Marble record. Keep its small-sample reanalysis separate from the original 24-year NASA POWER challenge investigation and the uncalibrated appearance model. Building footprints are mapped, but heights/facades/terrain/viewpoint remain approximations. Essential safety lighting remains excluded. Current validation and source limitations are in `VALIDATION.md`, `OBSERVATORY.md` and `TUCSON_EVIDENCE.md`.

## Prepared local addition: named viewpoints

The Observatory adds seven named virtual outdoor stations, initially KL Tower Sky Deck looking toward the Petronas Twin Towers. Cached OSM footprint/building-part geometry and NASA/USGS SRTMGL3 V003 terrain align the city context with the calculated astronomical frame. Published landmark dimensions constrain simplified original geometry. Facades, materials, furniture shapes, paving and railings remain illustrative; no surveyed or exact photorealistic city is claimed. The selected date changes astronomy, not the city-construction vintage. Source references/provenance: docs/VIEWPOINT_SOURCES.md and data/viewpoint-{map,terrain}-sources.json. This local addition has not been copied to the official editor, deployed, pushed or submitted for judging.

## Current design-pass handoff (local only)

The Observatory now opens with an explicit Tonight preview, an immersive sky, progressive controls, wider mapped context, a georegistered attributed Petronas artist model, an assumed George Town terrace and a NASA LROC Moon surface with calculated size/phase/orientation. Separate historical reference photographs and source credits help users assess the reconstruction. Local fonts and all seven viewpoint bundles are included in the approximately 16.03 MiB standalone. City fine detail, domestic foreground and lighting appearance remain illustrative, not a live photograph or measured digital twin. No changes were made to the saved online editor, public deployment or judging submission during this pass. The corrected tab-listed-resource eligibility gap above must be resolved before claiming Global Awards eligibility.
