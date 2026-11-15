# The sky above you

The new perspective Observatory extends the existing NightLens application. Sky Lab keeps its scheduled nonessential-light experiment and circular atlas. The NASA historical investigation and processing pipeline are preserved.

## What works

- Search a city through Open-Meteo / GeoNames; select one of seven saved places; enter coordinates and an IANA timezone; or explicitly request device coordinates. Elevation from geocoding is used where available; otherwise it is assumed and labeled. Device position uses the browser's timezone, which the user can override through manual coordinates.
- Now calculates the actual UTC instant and updates every ten seconds. Each observing place displays its local IANA clock, including daylight-saving and fractional offsets. Tonight explicitly selects 21:00 on the current local date; it can still be daylight at high latitudes. Manual date/time, absolute one-hour steps and a full-day range recalculate the geometry.
- Invalid calendar dates and nonexistent DST times are rejected. Repeated DST times choose the earlier occurrence with an explicit notice. Local-day event searches handle a skipped midnight; sunset and astronomical dusk show no crossing when none occurs that day.
- Pan, zoom, keyboard camera controls, full-screen request, object selection, optional labels/asterism lines, and an aim-at-the-Milky-Way control operate on calculated coordinates. Named stations add approximate terrain/building occlusion; the geometric sky engine stays independent.
- Four lighting environments set deterministic artistic light levels (85, 48, 18, 0). A separate range supports custom levels. Comparison shares the camera and instantaneous sky, with busy city on the left and selected lighting on the right. Reset returns the current place to Now and restores default camera/theme/control settings.
- Current model conditions are requested from Open-Meteo with a source timestamp. Optional schematic clouds use its coverage value, not an invented clear-sky default. Errors leave the astronomical view usable. Conditions older than two hours are flagged and excluded; current clouds are excluded from all manual time previews.

## Geometry and imagery

Astronomy Engine supplies precession/nutation and topocentric Sun, Moon and seven major planets. The HYG subset supplies 4,105 J2000 catalog stars with V magnitude at most 5.8. Star proper motion and parallax and atmospheric refraction are omitted. Extinction is an assumed contrast effect; terrain/building occlusion is approximate at named stations. Objects below the geometric horizon are excluded. Individual star symbols, brightness, colour and bloom are schematic. In the perspective renderer, Sun/Moon angular radii derive from topocentric distance. The Moon surface uses a NASA LROC visualization map in an IAU pole/spin body frame, illuminated toward the calculated Sun. Sky Lab and WebGL fallback retain schematic glyphs.

The renderer uses an east/up/north world basis. A horizon-to-J2000-to-Galactic rotation maps each perspective view ray into Galactic longitude/latitude. The original 2000×1000 equirectangular ESA/Gaia/DPAC EDR3 image is sampled with north at the top, l=0 in the center and longitude increasing left. The input bytes, source, attribution, license and hash are pinned in `data/sky-assets.json`. No synthetic star particles or decorative moving sky are used. The integrated survey field includes stars as well as the Milky Way; overlay symbols aid navigation and are not an independent photometric measurement.

Gaia's historical integrated brightness/colour image is not a live camera view, a naked-eye exposure or a calibrated prediction of what a person will see. Daylight and Moon influence are independent of the artificial-light control. All tone mapping, cloud shape, artificial glow and star contrast remain illustrative. There is no Bortle conversion, exact visible-star count, lighting energy estimate or safety prediction.

## Independent numerical reference

`data/validation/horizons-moon-20261115.json` preserves the exact public NASA/JPL Horizons query and response for the Moon at 5.4141° N, 100.3354° E, elevation 10 m, 2026-11-15 13:00 UTC, airless topocentric coordinates. The source gives azimuth 237.013510° and altitude 37.139300°. A test compares the engine's result within 0.05° on both axes. This is a limited independent benchmark, not validation across all dates, locations, bodies or photometric effects.

## Compact HTML and operational limits

`sky.html` is a second Vite entry containing the Observatory. `scripts/package-sky.mjs` bundles the same implementation, code, styles, HYG JSON and Gaia PNG into one standalone HTML, about 12.43 MiB. The normal build creates it under `public/downloads/` and copies it to `dist/downloads/`. It contains no credentials or API keys. It calculates and renders from embedded assets without a server. Search and weather still require network access; device location depends on the browser's permission and secure-context rules. It uses system fonts when not externally loaded.

WebGL draws the survey field and finite Sun/Moon disks; Canvas draws catalog stars and annotations. WebGL or texture failure is labeled and keeps a simpler star-only view. That failure path has been reviewed in code, not tested across actual GPU failures. Browser testing is recorded in `VALIDATION.md`; real-device touch, assistive technology, comprehensive GPU/browser compatibility and outdoor comparison remain unverified.

Location/weather providers are separate from the NASA POWER/CERES historical data. No observing-location choice silently changes or invents a NASA historical series. Essential safety lighting remains outside the hypothetical experiment; DarkSky International and IES guidance is attributed in the Evidence panel.


## Realism and intervention extension

The Observatory now supports six complete combinations: City street, After midnight, Rooftop lookout, Open coast, Dark-sky field and Overcast city. They combine the same deterministic filters and can be edited independently. They are illustrative environments, not claims that the selected place has those measured conditions.

`skyAppearance.ts` holds the reusable atmosphere and night-lighting state. Relative star display contrast uses catalog magnitude flux ratios, bounded secant airmass, assumed extinction, natural light and an assumed background. Natural impression reduces the survey exposure substantially; Enhanced survey detail is explicitly an enhanced display. Maximum applied artificial intensity suppresses the stellar field. Cloud coverage and opacity jointly control attenuation; an opaque overcast layer suppresses stars, Moon symbols and constellation lines. Named labels, selection targets and asterism endpoints require sufficient display contrast. No limiting-magnitude, exact visible-star count or Bortle prediction is reported.

The lighting model separates commanded output, participating fixtures, shielding, colour and an explicit selected-source share assumption. Default dimming is 50%, participation 70%, assumed source share 35%. Shielding (0.55) and warmth (0.82) are artistic transfer factors, not calibrated optical coefficients. They affect the selected contribution, leaving the other sources present. After midnight deliberately combines more changes with a larger assumed source share (75%); it is an illustrative scenario, not a Tucson-derived prediction.

The observing night runs from 18:00 through next-day 06:00. A schedule start of 1440 is midnight; equality activates it, 06:00 deactivates it. It repeats using the selected place's local clock, including DST. Before/After actions choose 23:55 and next-day 00:05 and show the actual new date. Celestial positions are recalculated for each instant, with one geometry shared by the comparison. The selected visual treatment never changes the astronomical positions.

### Map-based surroundings

OpenStreetMap building ways are acquired through Overpass within 450 m. Penang has 909 cached source footprints; all original IDs, tags and geometry are preserved, with raw SHA-256 and query metadata in `data/osm-sources.json`. The renderer uses up to 180 nearby footprints for bounded interactive cost. **No Penang building has a tagged metric height**; 117 have floor counts. Tagged metres/feet are used where available for other locations; floor-derived height assumes 3.1 m per floor plus 1.2 m; otherwise generic building-type heights are assumed. Every Penang height is estimated.

The selected coordinate falls inside one mapped building. That building is omitted under an outdoor-view assumption; this is stated in Evidence and is not a claim to know the user's actual eye position. The initial view uses an explicitly selected 14 m raised viewpoint above flat local ground; street level (1.7 m) and 35 m viewpoints are available. City street chooses 1.7 m and can legitimately have a strongly obstructed sky. Near-plane-clipped building faces and window materials are illustrative. Terrain, actual facade appearance, actual window operation, distant buildings and building relations are not reconstructed.

Mapped structures occlude the sky. Canvas labels/hit targets also check building occlusion; the target list still reports geometric altitude, not detectability. Rooftop, coast and field alternatives are deliberately illustrative. Water reflection uses the actual Moon direction and an artistic surface model. Overpass errors are labeled and produce an illustrative skyline. Optional Seoul/Tucson cache acquisition failed; no geometry was invented under those place names. Other locations may request live footprints when Local buildings is selected.

OSM geometry/derived databases retain ODbL 1.0 with visible OpenStreetMap contributor credit; application MIT licensing does not replace it. `python scripts/acquire_horizons.py` reproduces the cached Penang asset without network, unless refresh is explicitly requested.

### Evidence of human intervention

`LightingEvidence.tsx` presents a separate published Tucson2019 VIIRS experiment and an interactive replay bounded to observed municipal electrical power. The six rounded observations are factual transcriptions, not a raw NASA API or Black Marble download. NASA Earth Observatory supplies the experimental context; Kyba et al. supplies the numbers. Original NOAA-generated Suomi NPP VIIRS data were processed by the authors. Their raw raster correction pipeline is not reproduced here.

The reproducible Python analysis includes classical OLS, parameter covariance and Student-t intervals, all 720 response permutations, leave-one-night-out slope checks, a Theil–Sen sensitivity check and raw-versus-corrected results. Replay percentages divide a fitted mean contrast by a fixed fitted baseline and omit baseline/correction uncertainty. The UI labels these as conditional intervals and never uses them as a visibility, ground-skyglow or arbitrary-city forecast. Separate published ground measurements retain their measurement-uncertainty labels, not statistical CI labels. See `TUCSON_EVIDENCE.md`.

This small study does not replace the 24-year NASA POWER/CERES challenge investigation. The app retains the defined regions, rate-of-change, uncertainty and significance analysis for that historical atmospheric variable. Neither analysis silently calibrates the illustrative scene.

The standalone HTML now embeds the Penang footprint cache and published-study analysis, alongside code/catalog/survey assets, and is about 12.43 MiB. It can render its initial mapped scene and replay the study without external data requests. Other-location map search and current weather remain network dependent.

## Named city stations

Seven stations now anchor the view to a specific mapped position: KL Tower Sky Deck, Penang Esplanade, Namsan north plaza, Mrs Macquarie’s Point, Primrose Hill, Pier 1 Granite Prospect, and Mirador de Kari. Kuala Lumpur is the initial station, facing the Petronas Twin Towers. Featured city search/saved-place selections use the station; manual/device coordinates remain at the exact selected coordinates. Camera reset and Face landmark return to the station bearing; pan and pitch allow looking down at the foreground. Lighting combinations retain the selected station.

Native WebGL depth-tests actual OSM footprints and parts alongside simplified landmark architecture and SRTM terrain. Ground/deck/standing eye height are separate, with a 300 m KL deck and assumed 1.7 m eye offset. NASA/USGS terrain is historical radar surface context, not a present ground or foundation survey. Source hashes, coordinates, source links, native/query resolutions and limitations are in VIEWPOINT_SOURCES.md and data/viewpoint-*-sources.json.

The current standalone embeds all seven map/near/far assets. Search, current weather, device permissions and arbitrary-location footprint requests retain their previous network/browser requirements. Fine facades, windows, furniture shapes, railing and pavement remain illustrative. No exact photorealistic or historical city reconstruction is claimed. The camera rotates at a fixed station; it is not a walkable 3D city.

Sydney Harbour and New York East River water surfaces use complete OSM water-relation boundaries, with original island holes, clipped to the station ±4 km window. A GPU mask prevents historical radar elevations from drawing land over those sourced water polygons. The clip edges are coverage boundaries, not shorelines; water colour/ripples, level and tide are illustrative. `data/viewpoint-water-sources.json` preserves raw replies/hashes and exact methods. `scripts/acquire_viewpoint_water.py --verify` reproduces the cached polygons using pinned Shapely 2.1.2. Penang has an explicit unavailable coastal mask: incomplete shore coverage is labeled instead of inventing mainland coast.

## Current immersive design pass

The default opening is a labeled Tonight preview (21:00 local), with Now retaining the real clock and place selection returning to Now. A full-bleed hero, mutually exclusive Viewpoints / Light & atmosphere drawers and an immersive quiet view replace the dense first screen. The immersive dock changes lighting themes, after-midnight preset and comparison, returns to Tonight, and offers a magnified Moon study when above the geometric horizon. The study explicitly hides local obstructions; normal station views retain depth occlusion. Escape exits and restores page scrolling/focus. Camera transitions stop for direct input and respect reduced-motion preferences.

KL’s current estimated camera is 3.152949, 101.703889, approximately 17.5 m northeast of the mapped tower center, behind an assumed 20 m-radius deck rail. Penang now uses a George Town neighbourhood anchor at 5.4141, 100.3354 with an assumed 7 m terrace, not the user’s residence. Existing Penang asset IDs retain `penang-esplanade`; their geographic coverage is reused without altering NASA records. Farther OSM context is merged by element identity with detailed near geometry taking precedence, capped at 4,500 rendered buildings. London/NY’s additional-context files explicitly report unavailable; previous near-map assets still render.

The NanoRay Petronas artist model, generic CC0 paving, five self-hosted OFL fonts and historical reference photographs have separate licenses. Photos appear in an editorial reference section, not behind the astronomical sky. The current standalone is about 16.03 MiB, embeds all seven scene bundles and fonts, and initializes gzip-packed JSON with DecompressionStream. See `REALISM_DESIGN_PASS.md` and `THIRD_PARTY_NOTICES.md`. Exact architectural/photometric realism, actual offline file-origin behavior, real-device performance and broad GPU compatibility remain unverified.

## Recording polish

Controls are now available inside the immersive view, including named-station Tonight previews, all three appearance tabs and a Balanced/High detail pixel-density choice. The same controls are mounted once, so state stays shared. Switches expose On/Off states; theme choices preserve the independent comparison setting. Enabling annotations reveals their layer; Moon study toggles back to the prior camera. Escape closes the panel before the immersive view. Reset lighting & view now preserves the selected observing instant (this supersedes the earlier reset-to-Now behavior).

Only scalar display transfer values are interpolated over a bounded 360 ms smoothstep transition; geometric sky, camera, matrix and discrete selected conditions are preserved. Rapid changes retarget from the current interpolated state. Redraw invalidations are coalesced into a single browser animation-frame request and stop when settled. Reduced-motion preferences make appearance transitions immediate. No measured star detectability, physical radiative-transfer calibration or guaranteed capture FPS is added.

## Sky-first and Ultra pass

Default framing now pitches to at least 28 degrees with at least a 90-degree horizontal field, from the same geographic observer. The registry retains original station cameras for City view. Sky only hides city/foreground rendering and bypasses local building label/hit occlusion; it retains the original sky/time/rotation and geometric 0-degree horizon filter. Its hidden-obstruction label remains visible in quiet mode. Moon study remains a distinct magnified view.

Ultra is now the default: at least 2x supersampling on standard displays, up to 3x on high-density displays, bounded by a 4K pixel budget and 4096-pixel maximum dimension. The city postprocess adds edge-aware directional filtering before its existing subtle bloom. Catalog star cores are finer; their positions and display-contrast rules are unchanged. Quality switching, higher framing and Clear sky have no effect on the NASA analyses. This improves raster detail, not the fidelity of approximate source facades or calibrated star visibility.

## Guided controls and photographic reference pass

The primary toolbar now exposes only Adjust sky, Compare and Reset. The adjustment panel presents place/time, three lighting looks and two visibility switches. Detailed light/atmosphere/schedule controls, individual chart layers, weather and quality are retained in a collapsed Advanced disclosure. The selected-time and lighting-preset states remain distinct; waiting schedule/custom settings do not falsely select the midnight preview. More preset combinations below the hero are also collapsed.

Quick lighting looks change only artificial-light inputs. The midnight look explicitly previews the following 00:05, using the existing scenario assumptions; other looks preserve time and atmospheric conditions. Reset restores local buildings and appearance/camera defaults without discarding the observing instant. Star guides show names/asterisms where contrast permits. The enhanced-survey warning is now visible regardless of guide mode.

The existing licensed KL and Sydney historical photographs are available directly below the place selector in a native modal viewer with author/license, source-date/pose limits and a fixed-image warning. Source bytes are unchanged and included in the standalone. The photo is never composited into the sky or relit by the lighting controls. Other cities do not offer a nonexistent reference. City facade room/floor lighting is now spatially correlated to reduce unrelated speckling; facades and lighting remain approximate, not photographic scans or measured luminance.
