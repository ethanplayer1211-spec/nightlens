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

`sky.html` is a second Vite entry containing the Observatory. `scripts/package-sky.mjs` bundles the same implementation, code, styles, HYG JSON and Gaia PNG into one standalone HTML, about 6.15 MiB. The normal build creates it under `public/downloads/` and copies it to `dist/downloads/`. It contains no credentials or API keys. It calculates and renders from embedded assets without a server. Search and weather still require network access; device location depends on the browser's permission and secure-context rules. It uses system fonts when not externally loaded.

WebGL draws the survey field and Canvas draws catalog objects. WebGL or texture failure is labeled and keeps a simpler star-only view. That failure path has been reviewed in code, not tested across actual GPU failures. Browser testing is recorded in `VALIDATION.md`; real-device touch, assistive technology, comprehensive GPU/browser compatibility and outdoor comparison remain unverified.

Location/weather providers are separate from the NASA POWER/CERES historical data. No observing-location choice silently changes or invents a NASA historical series. Essential safety lighting remains outside the hypothetical experiment; DarkSky International and IES guidance is attributed in the Evidence panel.
