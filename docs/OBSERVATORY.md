# The sky above you

The new perspective Observatory extends the existing NightLens application. Sky Lab keeps its scheduled nonessential-light experiment and circular atlas. The NASA historical investigation and processing pipeline are preserved.

## What works

- Search a city through Open-Meteo / GeoNames; select one of seven saved places; enter coordinates and an IANA timezone; or explicitly request device coordinates. Elevation from geocoding is used where available; otherwise it is assumed and labeled. Device position uses the browser's timezone, which the user can override through manual coordinates.
- Now calculates the actual UTC instant and updates every ten seconds. Each observing place displays its local IANA clock, including daylight-saving and fractional offsets. Tonight explicitly selects 21:00 on the current local date; it can still be daylight at high latitudes. Manual date/time, absolute one-hour steps and a full-day range recalculate the geometry.
- Invalid calendar dates and nonexistent DST times are rejected. Repeated DST times choose the earlier occurrence with an explicit notice. Local-day event searches handle a skipped midnight; sunset and astronomical dusk show no crossing when none occurs that day.
- Pan, zoom, keyboard camera controls, full-screen request, object selection, optional labels/asterism lines, and an aim-at-the-Milky-Way control operate on calculated coordinates. The geometric horizon is not a reconstruction of local buildings or terrain.
- Four lighting environments set deterministic artistic light levels (85, 48, 18, 0). A separate range supports custom levels. Comparison shares the camera and instantaneous sky, with busy city on the left and selected lighting on the right. Reset returns the current place to Now and restores default camera/theme/control settings.
- Current model conditions are requested from Open-Meteo with a source timestamp. Optional schematic clouds use its coverage value, not an invented clear-sky default. Errors leave the astronomical view usable. Conditions older than two hours are flagged and excluded; current clouds are excluded from all manual time previews.

## Geometry and imagery

Astronomy Engine supplies precession/nutation and topocentric Sun, Moon and seven major planets. The HYG subset supplies 4,105 J2000 catalog stars with V magnitude at most 5.8. Star proper motion and parallax, atmospheric refraction, extinction and terrain are omitted. Objects below the geometric horizon are excluded. Symbols, the Moon's angular size, brightness, colour, and bloom are schematic; the illuminated side of the Moon is oriented toward the projected Sunward tangent.

The renderer uses an east/up/north world basis. A horizon-to-J2000-to-Galactic rotation maps each perspective view ray into Galactic longitude/latitude. The original 2000×1000 equirectangular ESA/Gaia/DPAC EDR3 image is sampled with north at the top, l=0 in the center and longitude increasing left. The input bytes, source, attribution, license and hash are pinned in `data/sky-assets.json`. No synthetic star particles or decorative moving sky are used. The integrated survey field includes stars as well as the Milky Way; overlay symbols aid navigation and are not an independent photometric measurement.

Gaia's historical integrated brightness/colour image is not a live camera view, a naked-eye exposure or a calibrated prediction of what a person will see. Daylight and Moon influence are independent of the artificial-light control. All tone mapping, cloud shape, artificial glow and star contrast remain illustrative. There is no Bortle conversion, exact visible-star count, lighting energy estimate or safety prediction.

## Independent numerical reference

`data/validation/horizons-moon-20261115.json` preserves the exact public NASA/JPL Horizons query and response for the Moon at 5.4141° N, 100.3354° E, elevation 10 m, 2026-11-15 13:00 UTC, airless topocentric coordinates. The source gives azimuth 237.013510° and altitude 37.139300°. A test compares the engine's result within 0.05° on both axes. This is a limited independent benchmark, not validation across all dates, locations, bodies or photometric effects.

## Compact HTML and operational limits

`sky.html` is a second Vite entry containing the Observatory. `scripts/package-sky.mjs` bundles the same implementation, code, styles, HYG JSON and Gaia PNG into one standalone HTML, about 6.52 MiB. The normal build creates it under `public/downloads/` and copies it to `dist/downloads/`. It contains no credentials or API keys. It calculates and renders from embedded assets without a server. Search and weather still require network access; device location depends on the browser's permission and secure-context rules. It uses system fonts when not externally loaded.

WebGL draws the survey field and Canvas draws catalog objects. WebGL or texture failure is labeled and keeps a simpler star-only view. That failure path has been reviewed in code, not tested across actual GPU failures. Browser testing is recorded in `VALIDATION.md`; real-device touch, assistive technology, comprehensive GPU/browser compatibility and outdoor comparison remain unverified.

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

The standalone HTML now embeds the Penang footprint cache and published-study analysis, alongside code/catalog/survey assets, and is about 6.52 MiB. It can render its initial mapped scene and replay the study without external data requests. Other-location map search and current weather remain network dependent.
