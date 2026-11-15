# NightLens immersive design pass

November 15, 2026. This extends the existing React application; the NASA investigation, Sky Lab and original evidence remain available.

## Design reference and adaptations

The reference is [Apple’s official Vision Pro product page](https://www.apple.com/apple-vision-pro/): a dominant visual, restrained navigation, large editorial typography, progressive explanation and controls near the experience they affect. NightLens adapts those composition patterns into its own celestial atlas. No Apple source code, imagery, logos or fonts are copied.

The opening now has one full-bleed sky and one primary “Enter the sky” action. Viewpoints and lighting open as mutually exclusive drawers. The immersive view leaves a quiet place/time annotation, source credits and a compact action dock. Lower sections connect the reconstruction to historical source photographs, the Tucson intervention and NASA’s long-term atmospheric record. Fonts are self-hosted rather than fetched from Google at runtime.

Motion is purposeful: section arrival, drawer opening, place-title changes and camera travel to a selected target. Direct pointer/wheel input cancels camera travel; reduced-motion preferences make transitions immediate. There are no decorative particles or arbitrary moving stars.

## Place and sky fidelity

- All seven featured cities retain a named station and cached mapped/terrain scene. Additional context contributes 17,179 source ways across four cities, merged without replacing more detailed near geometry. Rendering is capped at 4,500 buildings. Additional London/NY context is unavailable; their near caches remain. Atacama’s urban extension is not applicable.
- KL uses an estimated northeast point on KL Tower’s 300 m deck, plus a separate assumed 1.7 m eye height. An attributed NanoRay artist model is registered to mapped Petronas spire centers and scaled to 452 m. Its source bridge is replaced with the separate dimension-constrained approximation. This is an artist model, not surveyed CAD.
- Penang uses a public George Town neighbourhood anchor, with an explicitly assumed 7 m terrace, rail and potted shrubs. The surrounding mapped footprints are geographic data; missing heights, facade finishes, shutters and inferred low-rise roofs are illustrative. It is not the user’s home or a documented real terrace.
- The NASA SVS LROC surface map is sampled on a lunar sphere. Sun/Moon distances set disk size; lunar pole/spin and Sun direction determine texture orientation and phase. A magnified study deliberately hides local obstructions and says so. Normal station views retain city depth occlusion.
- GGX-inspired materials, coarse reflections, generic CC0 paving, static atmospheric perspective and mild highlight bloom improve depth and material separation. Direct celestial lighting is attenuated by the selected cloud coverage/opacity. These rendering coefficients are uncalibrated.

Two unretouched historical reference thumbnails appear separately with author/license credits. The KL caption’s camera-pose conflict is disclosed; the Sydney image is nearby but not angularly calibrated. Neither photograph supplies the calculated sky or silently changes with its date. No Google Street View imagery was extracted or embedded.

## Evidence and packaging

Source manifests and offline hash verifiers cover the new Moon, fonts, model, photographs, material maps and OSM context. Original source bytes remain preserved. See `THIRD_PARTY_NOTICES.md`, `REALISM_CONTEXT_RESEARCH.md`, `LANDMARK_MODEL_RESEARCH.md` and `REALISM_RULES_AND_MOON.md`.

The standalone HTML is approximately 16.03 MiB. It embeds code/styles, five fonts, 4,105 stars, Gaia/Moon maps, all seven map/context/terrain bundles, water geometry where available, the Petronas model, paving textures, reference photos and the Tucson analysis. JSON uses gzip with browser DecompressionStream support. Location search and current weather remain optional network services. Direct file-origin execution and deliberate offline disconnection have not been verified.

## Limits and release state

This is a substantially improved sourced reconstruction, not a photorealistic digital twin or a current camera feed. Fine architecture, missing structures, ground/deck surfaces, city luminance and star contrast need measured inputs and field comparison before stronger claims. Proper motion, refraction, horizon dip, eclipses and calibrated eye/camera response are omitted. Physical-device performance, touch feel, assistive technology and a broad GPU/browser matrix remain unverified.

The NASA POWER/CERES and Tucson calculations remain separate from the illustrative renderer. Global Awards eligibility is unresolved because meaningful use of a NASA source from the selected challenge’s Resources tab has not been demonstrated. The new NASA imagery does not establish that requirement. No public deployment, remote push, online editor change or judging submission occurred in this pass.
