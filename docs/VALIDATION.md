# Validation record

November 15, 2026, Malaysia time. This file records observed results, not a guarantee of scientific or operational accuracy.

## Commands that passed

- `npm test`: 22 tests, 3 files. Schedule/reset/determinism, UTC handling, astronomy projection/library comparison, data provenance/units/raw values, short-series handling, exports and schema validation.
- `.\.venv\Scripts\python.exe -m pytest tests/test_analysis.py -q`: 10 tests. Calendar weighting, missing/nonfinite/fill data, duplicate month rejection, independent SciPy regression comparison, and regeneration of every Penang/Seoul analysis window from the original NASA responses.
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
- No external JPL ephemeris benchmark or field star-visibility comparison was performed.
- No real-device touch/assistive-technology test, comprehensive browser matrix, load test, or real outdoor lighting validation was performed.
- Black Marble HDF5 acquisition remains blocked by Earthdata authentication; no nighttime-radiance trend was analyzed.
- A locally served production build is not a public deployment. No remote repository has been pushed; no public production site or official judging submission is claimed.
- The official demo artifact/public URL is pending; the 28-second storyboard is a prepared script.
