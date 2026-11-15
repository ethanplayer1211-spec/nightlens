# NightLens — final submission review

**Prepared 15 November 2026. A saved draft is not submitted for judging.**

## Links

- Project: https://github.com/ethanplayer1211-spec/nightlens
- Live app: https://nightlens-sky-atlas.leveling-magician.chatgpt.site
- Seven-slide public demo: https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/
- Separate brief: https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/NightLens-judge-brief.pdf

## Summary

NightLens turns a personal question—why can I no longer see stars above my city?—into an evidence-led digital observatory. Explore a calculated sky above a sourced city reconstruction, compare your environmental settings with a clear-sky reference, and test scheduled dimming of selected nonessential fixtures. The challenge investigation analyzes 2001–2024 MODIS Terra aerosol data near Penang, exported through NASA Giovanni. It exposes the original record, missing data, trend, confidence interval and exploratory significance. A separate six-night Tucson study shows why fixture dimming and sky response differ. Measured atmospheric records, calculated astronomy and illustrative appearance remain distinct. Public source, reproducible analysis, evidence exports and a seven-slide demo make the work reviewable. No exact star-visibility, energy-saving or safety forecasts are claimed.

## Project details

WHY I BUILT IT
The creator: “I made this website because these days, I can't visually see any stars in the sky, and that makes me upset. I hope people seeing this website can see what the sky can become, with certain actions.”

START WITH THE EXPERIENCE
• Observatory: select a place and instant; drag the calculated sky. Seven named city reconstructions provide context. Clear 360° uses an explicitly virtual elevated platform, not an accessible or surveyed rooftop.
• Lighting and Environment are separate. Haze, fog, clouds and glare visibly change the illustration. Compare offers captured Before with editable After, or your current settings against a clear-sky reference. Actual Sun/Moon and astronomical geometry remain.
• City experiment: scrub 18:00–midnight; schedules activate at the chosen time. Adjust participating nonessential fixtures, dimming, shielding and colour. Essential safety lighting is excluded.

THE NASA CHALLENGE INVESTIGATION
• Challenge-listed NASA Giovanni: MODIS Terra MOD08_M3 v6.1 combined Dark Target/Deep Blue AOD at 550 nm, 2001–2024. Requested bounds: 100–101° E, 5–6° N; actual 1° grid centre: 100.5° E, 5.5° N. This is a source grid cell, not a citywide average.
• 288 monthly timestamps; October 2022 is fill. Excluding incomplete 2022 leaves 23 complete annual values. Calendar-day weighting, OLS and calendar-year Newey–West HAC lag 1 with small-sample correction and Student-t inference are reproducible in Python. Missing years are not bridged. Windows under eight complete years suppress inference.
• Endpoint change: −15.1%. Fitted trend: −0.01555 AOD/decade; 95% CI −0.03982 to +0.00873; p≈0.197. The trend is inconclusive. Window selection is exploratory and does not establish causation. POWER/CERES Penang/Seoul context remains separate; products are not spliced.
• Original NASA CSV, request, SHA-256, annual CSV and evidence JSON are available. Aerosols are atmospheric context, not a nighttime-lighting trend or a visibility calibration.

HUMAN ACTION, WITH EVIDENCE
The app separately reanalyzes six published Tucson 2019 VIIRS observations. Municipal power 1.38→0.70 MW corresponds to a fitted satellite-sum response of about −7.6%, not −50%. Conditional 95% interval: −10.3% to −4.9%, with fixed fitted denominator uncertainty omitted. Exact permutation and leave-one-night-out checks are included. This is not a forecast for the selected city. DarkSky International/IES Five Principles guide the educational lighting scenarios.

WHAT THE APP DOES NOT CLAIM
Lighting/weather transfer, materials and fine architecture are illustrative. The sky is a calculated reconstruction, not a live photograph or a calibrated naked-eye forecast. No Bortle class, exact visible-star count, energy saving or safety effect is calculated. No Black Marble radiance trend is claimed.

BUILD & DISCLOSURE
React, TypeScript, Vite, native WebGL/Canvas and Astronomy Engine; HYG stars, ESA/Gaia survey field, NASA LROC lunar map, attributed OSM/terrain and licensed source assets. NumPy/SciPy/statsmodels support reproducible statistics. 74 TypeScript and 24 scientific tests pass; production build passes. Codex assisted implementation, analysis code, research, tests, prose, slide layout and packaging. Source observations and photographic assets are attributed originals; no generated photographic image/video/audio is used. Claude Code was attempted with permission but produced no code after provider authorization refusal. Full licenses, asset sources and AI disclosure are in the repository. NASA does not endorse NightLens.

PUBLIC REVIEW
Project/source: https://github.com/ethanplayer1211-spec/nightlens
Live app: https://nightlens-sky-atlas.leveling-magician.chatgpt.site
Seven-slide demo: https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/
Separate two-page brief: https://nightlens-sky-atlas.leveling-magician.chatgpt.site/demo/NightLens-judge-brief.pdf
Judges: begin with README and docs/JUDGES_GUIDE.md.

## Owner’s final checks

- Owner confirmed at least two accepted Universal Event teammates and Malaysia residence timezone.
- Review all seven demo slides, public app and source repository.
- Confirm project name, summary, personal motivation, sources and SI-use selections.
- Review the existing owner-checked original-work and legal declarations.
- Only after approval, click Submit for Judging before 23:59 MYT on 15 November 2026.
- Verify an explicit submission success notification; Save Progress alone does not count.
