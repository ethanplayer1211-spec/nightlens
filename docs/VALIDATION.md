# Final validation · 15 November 2026

**74 TypeScript tests + 24 scientific Python tests pass (98 total).** `npm run lint`, `npm run typecheck` and `npm run build` pass. The build reports a size advisory for a 516 kB minified chunk; it is not a build failure. No measured cross-device FPS claim is made.

## Functional checks

- **Comparison:** captured Before remains separate from edited After; Clear reference removes artificial glow, haze, fog and cloud cover while retaining the actual Sun/Moon. Tests preserve sky/camera/matrix identity and shared observer geometry.
- **Schedules and reset:** existing scenario tests cover exact activation times and restoring defaults. A public browser check exercised both compare modes, Foggy, the divider and Reset; Reset removed the comparison and returned the default view.
- **Environment:** independent artificial-light, haze, fog, cloud and glare controls affect illustrative appearance. Fog also attenuates distant city structures. Appearance transitions are deterministic and bounded; reduced-motion preference removes their duration.
- **Astronomy:** calculations use the selected observer and instant. The test suite includes a limited independent JPL Moon benchmark. This does not certify every object, date, refraction condition or catalog uncertainty.
- **Scientific pipeline:** 24 Python tests check complete-year aggregation, missing-data handling, calendar-year HAC inference and the attributed Tucson reanalysis against independent numerical calculations.
- **Demo:** exactly seven 1280×720 slides, including the opening and directory. All slide renders were reviewed; changed slides were re-rendered. The public HTML has working previous/next and keyboard navigation, bounded transitions and reduced-motion CSS. Native PowerPoint animation is unverified. The separate two-page judge brief is supplemental material.
- **PDFs:** Poppler reports seven demo pages and two brief pages. Both brief pages and the cover were rendered and visually reviewed; slide layouts were also reviewed in the saved Spaces deck.

## Public release verification

Sites version 3, source `4fc5888a183975a73de62e0657fe660df4c3b6b3`, published at 23:41 MYT. Anonymous requests returned HTTP 200 for the app, demo, all seven slide images and both PDFs. Every public slide/PDF matched the reviewed local bytes. The original NASA export also returned HTTP 200 with SHA-256 `121f595c5668c0fe56c51537c959e1bac660195b5527da2a049538adf23dc299`.

The GitHub source was pushed to public `ethanplayer1211-spec/nightlens`. The official project draft was saved at 23:37 MYT with project/demo links, motivation, resources and SI disclosure. **It still requires Submit for Judging and owner review.**

## Practical limits

- Lighting/weather transfer and fine architectural materials are illustrative, not calibrated photographs or a naked-eye visibility forecast.
- No Bortle class, exact star visibility, energy saving or safety effect is inferred.
- Physical touch hardware, broad GPU/browser testing, native PPTX animation and deliberate network-disconnected standalone use were not verified in this pass.
- Historical browser proofs and superseded research/release notes were separated into the owner's local `.local/finalization-archive/` bundle. They are excluded from the clean repository; original scientific data, licenses, acquisition records and reproducible scripts remain.
