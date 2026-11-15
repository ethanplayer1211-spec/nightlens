# Validation record

## Recording polish — November 15, 2026, 18:18 MYT

**60 TypeScript tests + 21 Python scientific tests passed (81 total)**. ESLint passed without warnings; TypeScript and the production build passed. The two added tests verify bounded/reversible display transitions, immediate reduced-motion output, exact convergence, input immutability and preservation of the sky/camera/matrix references. No scientific dataset or analysis pipeline was changed.

The standalone verifier passed for **16,826,106 bytes (~16.05 MiB)**, matching its production copy and all pinned embedded source assets. The sky-focused standalone includes the new control panel, states and transitions; the full app remains the recording route for the 24-year NASA Time Machine.

Production browser rehearsal verified:

- Immersive Controls contains one shared control instance and one set of tab IDs. Lighting / Atmosphere / Experiment tabs and switches work, with explicit On/Off states. Current-model weather details are collapsed and visibly excluded in previews.
- Before 23:55 reported Waiting for 00:00; After 00:05 reported Dimming active. The midnight action selected the following local 00:05 and comparison; the keyboard divider reached 96.
- Theme changes preserved comparison both when Off and when On. Reset lighting & view restored appearance defaults while retaining the selected 00:05 instant. This supersedes the earlier reset-to-Now checks below.
- Immersive station selection changed to the mapped Penang terrace at an explicit local 21:00 preview. High detail / Balanced selections updated the renderer quality state. Physical high-DPI resolution/FPS was not benchmarked.
- Label/asterism switches enabled annotations. Moon study reached 12 degrees, then toggled back to the prior 88-degree station camera and mapped-3d mode. Escape closed Controls while leaving the immersive view open. The Evidence dialog opened above it and closed correctly.
- An opaque cloud combination and scalar display changes reached settled renderer state. Transition math was tested separately; no claim of a measured real-world photometric transition is made.
- Full-HD DOM layout was checked at 1920×1080 without document overflow; the panel remained within bounds. Visual proof uses the default 1280×720 capture. At 390×844 the immersive document width was 390 and the panel stayed between x=16 and x=374. Mobile tabs, Moon-light switch, close/reopen and Escape worked. Viewport overrides were reset.
- The walkthrough reached NASA Time Machine with 24 complete annual values and zero missing. The updated standalone initialized, exposed the immersive panel, applied shielding/midnight and reported Dimming active. Inspected browser warning/error logs were empty.

Proof: `recording-controls-desktop.jpg`, `recording-controls-mobile.jpg`, `recording-nasa-evidence.jpg`, `recording-package.jpg` under `evidence/browser/`. The take has not been screen-recorded, encoded, uploaded or submitted. Actual recorder/GPU performance, physical touch, reduced-motion OS emulation and broad browser compatibility remain unverified. See `RECORDING_GUIDE.md` for the rehearsal route. Publication and official submission are unchanged.

## Current immersive design pass — November 15, 2026, 16:32 MYT

Local production checks passed: **58 TypeScript tests (7 files) + 21 scientific Python tests = 79 tests**, ESLint and TypeScript project checking through the production build. New checks cover finite Sun/Moon angular radii, orthonormal lunar attitude, a separate libration calculation, wider-context merge precedence/caps, pinned GLB topology and finite registered geometry. Existing schedule/reset, astronomy, data provenance and NASA/Tucson numerical reproduction checks still pass. This is automated verification, not field photometric calibration.

Cached acquisition verifiers passed for all seven context statuses, both research model originals, Moon image, three paving maps, two source-reference photos, five WOFF2 binaries and three font licenses. `node scripts/verify-sky-package.mjs` verified **16,813,336 bytes (~16.03 MiB)**, byte equality with the production copy, every embedded scene map/context/near/far grid and available water asset, model, seven image assets, five fonts and catalog. There are no external script tags. The unused Opera House research model is retained under data/raw and excluded from public runtime output.

Browser review used the production static server:

- The full-width opening, self-hosted typography, primary Enter action, immersive Exit/Escape behavior, page-scroll restoration and source links worked. Camera travel reached the 12° Moon study. Its NASA texture, calculated crescent and explicit local-obstruction exception were visible. Normal station geometry remained separate.
- All seven named stations reported mapped-3d with finite geometry. Penang’s replacement neighbourhood station reused the explicit asset ID and showed its terrace/rail/pots. Wider London/NY context remains unavailable while their near scenes work. Actual architecture/eye poses are not certified.
- Midnight action selected the following local 00:05 and the scheduled combination. Comparison toggled and its keyboard divider moved from 50 to 96. Reset restored Now, artificial intensity 85, natural treatment, model-cloud option and labels/asterisms off. Opaque overcast visibly suppressed the Moon disk and stellar field. Artificial intensity 100 suppressed stars. Neither setting establishes a real-world brightness threshold.
- Viewpoints and lighting drawers were mutually exclusive. The manual-coordinate entry remained reachable. Actual device geolocation was not requested in this pass. City/station selection and the IANA clock behavior remain covered by earlier browser review and current unit tests.
- Enhanced survey detail retained a visible “NOT A NAKED-EYE PREDICTION” annotation in immersive quiet mode. Historical source photographs were separate, with attribution and pose/vintage limits.
- At an explicitly verified **390×844** mobile viewport, the main app document was 375 px wide; the immersive document was 390 px wide. No document horizontal overflow appeared. The dock scrolls inside its own rail; viewport overrides were reset after review. This is desktop-browser emulation, not physical-device touch/performance testing.
- The current standalone initialized its compressed bundles, rendered mapped-3d, exposed 4,105 embedded stars, seven scene entries, five embedded fonts, Moon/model assets and zero external scripts. A Penang station change rendered from the bundle. Inspected package warning/error logs were empty. Direct file-origin execution and deliberately disconnected networking were not tested.
- Regression checks: NASA Time Machine retained 24 complete annual records, zero missing, 2001–2024. Sky Lab at 18:00 showed “Waiting for the schedule”; at midnight it was active; Reset restored 21:00 and default controls.

Proof images under `evidence/browser/`: `realism-hero-desktop.png`, `realism-kl-night.png`, `realism-penang-terrace.png`, `realism-moon-study.png`, `realism-enhanced-survey.png`, `realism-severe-glare.png`, `realism-opaque-cloud.png`, `realism-mobile.png`, `realism-mobile-immersive.png`.

Remaining limits: no outdoor comparison, exact star-detectability model, surveyed city mesh, live camera feed, broad GPU/browser matrix, physical-device performance, native full-screen success or assistive-technology certification. Local only: no deployment, remote push, online editor change or judging submission. Selected-challenge tab-resource eligibility remains unresolved; see the corrected official-answer references in CHALLENGE_REVIEW.md.

## Earlier checkpoints

The dated records below describe previous builds and are retained as history. Their test counts, package sizes, scene defaults and implementation limits do not override the current section above.

November 15, 2026, Malaysia time. This file records observed results, not a guarantee of scientific or operational accuracy.

## Commands that passed

- `npm test`: 47 tests, 5 files. Schedule/reset/determinism, UTC handling, astronomy projection/library comparison, data provenance/units/raw values, short-series handling, exports and schema validation.
- `.\.venv\Scripts\python.exe -m pytest tests/test_analysis.py tests/test_intervention.py -q`: 21 tests. Calendar weighting, missing/nonfinite/fill data, duplicate month rejection, independent SciPy regression comparison, and regeneration of every Penang/Seoul analysis window from the original NASA responses.
- `npm run typecheck`: strict TypeScript project check.
- `npm run lint`: ESLint.
- `npm run build`: TypeScript plus Vite production bundle.
- `npm install` after the targeted test/lint dependency fixes: audit reported **0 vulnerabilities**, including development dependencies. A targeted minimatch override is used for typescript-estree; lint/build/tests passed with it. Production dependencies had already shown zero reported advisories.

Installed Node.js: 24.18.1; npm: 11.16.0; Python: 3.12.10. Versions are captured by `package-lock.json` and `requirements.txt`.

## Browser checks actually performed

Using the in-app browser against the local NightLens server:

- Initial sky renders from the cached catalog, with calculated Moon/Saturn targets at the selected date/time.
- Timeline before 20:00: schedule waiting, baseline and experiment transfer values both 1.0000.
- At exactly 20:00: schedule activates, participating output 50%, experiment transfer 0.8527; baseline stays 1.0000. This transfer is an artistic value, not an estimated skyglow reduction.
- Comparison action removes/reinstates the divider; reset restores 21:00, comparison on, 50% brightness, 70% participation and City After Dark.
- Pointer dragging moved the divider from 50% to approximately 69%; keyboard Home moved the native comparison control to its minimum.
- Shield the Streets selected shielding and 70% output; Warmer Nights selected warmer lighting; Protect the Observatory selected shielding, warm color, 40% output and 19:00 start; reset returned the default study.
- Time Machine renders actual NASA annual data and Penang’s full-period inconclusive inference.
- A 2020–2024 interval suppresses confidence intervals and p-values.
- Switching to Seoul changes the annual record and corresponding inference.
- Evidence opens as a native modal dialog and closes through its labeled control.
- A 390×844 viewport showed a mobile layout with no document horizontal overflow. The timeline was moved above the sky so it remains easily reachable on mobile.
- Browser console error check returned no errors during these checks.

The final `dist/` build was also served independently on local port 4174. The app, both NASA JSON files, HYG subset and catalog license returned HTTP 200. The served data bytes exactly matched the validated source files. Browser smoke checks on that production server returned no console errors, and desktop/mobile layouts had no document horizontal overflow.

Actual browser downloads were opened and checked: the annual CSV contained 24 annual rows, units and source attribution; the evidence JSON contained 24 annual records and the reproducible Penang p-value. Copies are retained in `evidence/browser/annual-export.csv` and `evidence/browser/evidence-export.json`. Mobile chart labels and legends were checked after responsive sizing adjustments. Production screenshots are retained in `evidence/browser/production-*.jpg`.

Proof images: `evidence/browser/desktop.jpg`, `evidence/browser/mobile.jpg`. These are screenshots of the implemented code-rendered app, not scientific observational images.

## Official-site inspection

The signed-in browser confirmed the selected challenge, the official Resources tab, the November 13 submission/judging guides, and a Universal Event team with two listed members. Team-specific registration acceptance and all other organizer eligibility decisions are not certified by this observation.

Project text, actual NASA references, other-source credits and AI-use categories were prepared in the editor. Save Progress initially refused to continue without the Terms and Conditions and original-work declarations. The owner reviewed and checked both boxes in the browser; the agent did not check them. The draft was then saved, and the site confirmed Saved Revision / Last Saved November 15, 2026 10:23 Malaysia time. Reopening the editor verified persistence of the NightLens name, summary, rich-text details, references and six SI categories. The non-editor project tab still showed the prior placeholder title, so public publication of the revision is not claimed. The project remains marked Requires Submission for Judging. Public final-project/demo links remain blank. The durable local copy is `docs/SUBMISSION.md`.

## Verification limits

- No calibrated lighting/skyglow or exact visibility model exists.
- One independent NASA/JPL Horizons Moon benchmark was performed, at a single Penang instant with a 0.05° tolerance. Broader ephemeris validation and field star-visibility comparison were not performed.
- No real-device touch/assistive-technology test, comprehensive browser matrix, load test, or real outdoor lighting validation was performed.
- Black Marble HDF5 acquisition remains blocked by Earthdata authentication; no nighttime-radiance trend was analyzed.
- A locally served production build is not a public deployment. No remote repository has been pushed; no public production site or official judging submission is claimed.
- The official demo artifact/public URL is pending; the 28-second storyboard is a prepared script.


## Perspective Observatory extension, November 15

- 34 TypeScript tests and 10 Python tests passed (44 total); lint, strict TypeScript and production build passed. Added tests cover fractional IANA offsets, historical DST, repeated/nonexistent local hours, calendar rollover, skipped local midnight, invalid coordinates, geocoder/weather schemas, perspective orientation, horizon-to-Galactic rotation and the independent NASA/JPL Moon benchmark.
- Real Singapore search returned named coordinate/timezone choices. Selecting the city moved the current clock to Asia/Singapore and recalculated the sky. Open-Meteo model conditions loaded with their timestamp. Saved Sydney used Australia/Sydney, UTC+11 in November, and the southern sky; 23:55 local corresponded to 12:55 UTC.
- Now initially showed daylight in Penang; No artificial light preserved daylight. Tonight selected an explicit 21:00 preview and optional current clouds were disabled/excluded. The comparison shared one geometry and survey field.
- Keyboard comparison reached its 4% and 96% limits; camera zoom changed field of view. Manual time entry, absolute hour steps and the full-day range updated the observing instant. Reset restored Now, busy-city value 85, default camera and comparison off.
- Sky evidence opened/closed with survey/catalog licensing, location/weather attribution, visual limitations and the scoped Claude attempt disclosure.
- Desktop 1440×1000 and mobile 390×844 had no document horizontal overflow. Proof: `evidence/browser/observatory-mobile.jpg` and `evidence/browser/observatory-standalone-desktop.jpg`.
- The generated standalone HTML rendered in the browser from the production static server, with 4,105 embedded catalog stars, the embedded image complete at 2000 px width, and no external script tags. WebGL survey mode rendered successfully, with no console errors during these checks. The same HTML is designed to open directly from disk; a `file://` browser run was not performed. Network search/weather and device permissions are still browser/environment dependent.
- Full-screen permission was refused by the in-app browser; the implemented control showed its explicit unavailable message and preserved the normal view. Successful native full-screen entry is not claimed for this environment.
- Physical pointer dragging/pinch, actual device-location permission, real-device touch and forced GPU/image-failure paths were not exercised for this new renderer. Pointer/touch handlers and labeled keyboard alternatives are implemented; previous circular-atlas pointer checks are separate.
- Regression browser smoke checks confirmed the existing City Experiment moves from waiting to active, resets, and the Time Machine still displays 24 complete NASA annual values for 2001–2024. The Python reproduction tests verified its numerical outputs remain unchanged.
- Claude Code returned HTTP 403 `oauth_not_allowed_for_organization` before producing code; no contribution from Claude is claimed. The owner-approved integration was attempted, not completed.
- The saved Space Apps draft was not modified for this extension. New ESA/Open-Meteo/JPL credits and feature wording must be incorporated before a later final submission. No deployment, repository push or judging submission occurred.


## Combined environment / intervention extension, November 15

47 TypeScript tests and 21 Python tests passed (68 total). TypeScript, lint (zero warnings), and production packaging/build passed. New tests cover recurring midnight and 06:00 boundaries, evening/next-day start times, backward scrubbing, participation/source-share edge cases, separate defaults, deterministic transfer, severe glare in both visual treatments, daylight and opaque-overcast suppression, altitude/haze/Moon contrast, tagged/floor/assumed building heights, actual cached-map parsing and observer-building omission, camera near-plane clipping and obstruction, bounded empirical replay and exact agreement with processed reference results.

The 11 new scientific Python checks compare OLS/covariance/intervals with independent SciPy and statsmodels calculations; compare contrast against a linear t-test; independently enumerate all 720 response permutations; verify leave-one-night-out and Theil–Sen outputs, missing/duplicate/invalid-data rejection and exact cached-artifact/hash reproduction. Original 10 NASA aerosol reproduction tests still pass. Small-sample/statistical assumptions remain documented limits.

Browser checks actually performed on the production bundle:

- Mapped Penang footprints loaded; the raised 14 m viewpoint and local building occlusion rendered. Heights/materials were labeled approximate. Selecting street level produced stronger actual footprint obstruction; selecting a raised viewpoint revealed more sky.
- Natural impression used a subdued survey field. Artificial intensity 100 with comparison off suppressed the stellar field and asterism lines; the interface kept asterisms enabled, avoiding a misleading toggle-only test. Scope is this artistic severe-glare setting, not an empirical brightness calibration.
- The coast combination changed the lower view to an illustrative water horizon; scene changes kept the selected observing instant. Other controls remained independently editable.
- The recurring schedule showed waiting at 23:55 on November 15 and active at 00:05 on November 16, local Malaysia time. Default selected output changed 100%→50%; the combined After midnight scenario used 30% output, shielding, warmth and its disclosed larger artistic source-share assumption. The preset opened Experiment controls and used an explicit time preview.
- Reset restored Now, busy-city intensity 85, the 14 m default viewpoint, default atmosphere, comparison off and the Lighting control tab. Keyboard ArrowRight moved from Lighting to Atmosphere. Overcast selected coverage 100 and opacity 100 and opened Atmosphere controls.
- The Tucson corrected panel displayed the processed −7.6% fitted satellite-sum contrast, conditional interval −10.3% to −4.9%, exact permutation p 0.0028 and six-night diagnostics. The replay reached the upper observed power 1.38 MW with zero fitted contrast; raw/corrected switching changed results. No extrapolation was offered.
- Actual browser export completed. Its six rows, selected 0.70 MW power and −7.6005589% fitted contrast were parsed and verified; copy `evidence/browser/tucson-study-export.json`.
- A 390×844 viewport initially exposed overflow from absolutely positioned accessible preset descriptions; anchoring descriptions to their buttons fixed it. A fresh production check returned document width 375, viewport 390, no document horizontal overflow. Horizontal preset scrolling stays inside its rail. The mobile artifact is `evidence/browser/environment-mobile.jpg`; scientific chart labels use a mobile-specific size with an accessible data table.
- The standalone HTML rendered from the production static server with 4,105 embedded HYG stars, 909 embedded OSM footprints, the source/study replay available and no external script tags. Initial map rendering did not require an Overpass request. Console errors returned none. Direct `file://` execution and actual offline-network disconnection were not tested; embedded code/assets and source fallbacks were inspected.

Physical-device touch/pinch, actual device geolocation, GPU failure and successful native full-screen remain unverified or environment-limited as previously recorded. Only Penang has a cached footprint asset; optional Seoul/Tucson acquisition failed and is recorded. Live Overpass requests for arbitrary locations can fail and show their explicit fallback. Buildings are an approximate map extrusion, not photographs, surveyed heights or a complete real horizon. The sky renderer remains uncalibrated for exact human visibility. The statistical replay is a separate study, with its small-sample assumptions, and does not certify local causal effects or safety outcomes.

The saved online Space Apps draft has not been changed for this extension. Required new source/reference wording is prepared in `SUBMISSION.md`. Nothing was deployed, pushed or submitted for judging.


Final browser checks also confirmed a Seoul location change used Asia/Seoul / UTC+09:00, timed out its live map request without breaking astronomy, and explicitly labeled its fallback skyline. Returning to Penang used the embedded cache. The open six-row data table on a 390 px viewport kept its 430 px content inside a 338 px scroll area; document width remained 375 px with no horizontal document overflow. Final static-server regression checks confirmed the 24-complete-year NASA view, Sky Lab's waiting/active transition and its reset. The final mapped-scene screenshots are `environment-desktop.jpg` and `environment-sky-detail.jpg`; severe glare is `severe-glare-desktop.jpg`; study/mobile/export proofs are retained alongside them in `evidence/browser/`.

Building faces now use footprint winding for back-face culling and roof visibility from the selected eye height, reducing hidden-face artifacts and rendering work. This improves the approximate geometry without making unknown heights/materials surveyed facts. The final standalone contains all initial assets, matches its generated source byte-for-byte, and is about 6.52 MiB. No direct file-origin/offline-network-disconnection or successful arbitrary-location map service was claimed.

## Named city viewpoints — November 15, 2026

Local source/build verification: **54 TypeScript tests + 21 Python tests passed**. ESLint, TypeScript project checking and the production build passed. New tests cover all seven station assets/eye-height separation, featured-city anchoring with manual/device-coordinate preservation, bilinear terrain validation, far-grid interpolation/negative-source-value retention, low/high ray building occlusion, Petronas mapped tier retention/container removal, finite bounded 3D mesh geometry, and the Namsan camera/terrain regression.

All seven OSM scene assets passed offline raw-hash/exact-public-reproduction checks. All **58** SRTM raw-response SHA-256 hashes were independently checked, and all **14** near/far grids matched the original response elevations exactly. Water reconstruction verification reproduced the complete clipped Sydney/NY polygons and explicit Penang-unavailable asset. No missing coastline was invented. Terrain interpolation/subdivision does not add measured resolution.

Browser checks used the production static server. All seven named stations loaded mapped-3d geometry and their local timezone. Daylight views inspected KL, Sydney, New York, London, Seoul, Penang and Kari (Kari also checked under its virtual-access notice); source-derived angular positions remained in the same coordinate frame. Sydney/NY water surfaces retained source island holes. The coarse-terrain diagonal regression that previously buried the Namsan observer was corrected by including the camera ground point and subdividing the same interpolated field.

KL checks covered Tonight, fixed-station city/dark comparison, divider change 50→51, max artificial-light level 100 suppressing the stellar field, reset to current time/light85/station bearing, and the midnight schedule's 23:55/next-day00:05 transition. The named station remained selected throughout lighting combinations. Evidence opens/closes and exposes viewpoint/terrain/architecture limitations. A 390×844 responsive viewport had document width375px (scrollbar excluded), stage337.5px and no horizontal document overflow; Sydney continued to render mapped-3d. This is browser emulation, not physical-device touch validation.

The standalone HTML has **7 embedded map/near/far station entries**, sourced Sydney/NY water geometry, 4,105 HYG stars and zero external script tags. Initial KL and a New York station change rendered mapped-3d from the package. Its generated source and production copy match byte-for-byte: **13,033,548 bytes (~12.43 MiB)**. It was served over localhost; direct file-origin execution and deliberate offline-network disconnection were not tested. Optional weather/search remain network dependent. Inspected browser warning/error logs were empty.

Preserved-function regression: NASA Time Machine still reports 24 complete2001–2024 annual records and0 missing; the original Sky Lab's 18:00 waiting state, active schedule and reset to21:00 remain functional. No historical NASA analysis values or engine coordinates were replaced by scene approximations.

Proofs: evidence/browser/viewpoint-kl-day.jpg, viewpoint-kl-night.jpg, viewpoint-kl-severe-glare.jpg, viewpoint-mobile-sydney.jpg and viewpoint-new-york.jpg. Earlier sections describe dated prior versions; the seven named caches supersede their earlier Penang-only cache statement.

Limits: mapped coverage is partial; inferred heights, facade/window/material choices, landmark fine geometry and foreground railings/paving/furniture shapes are approximate. Terrain is historical SRTM radar surface context, not a current ground survey, landcover map or bathymetry. Penang's coastal mask is incomplete and visibly labeled. Current city geometry does not reconstruct historical construction when changing astronomical dates. Proper motion, atmospheric refraction and high-deck horizon dip are omitted; no exact naked-eye visibility, Bortle, safety or arbitrary-city intervention forecast is claimed. No deployment, push, online editor modification or judging submission occurred for this extension.
