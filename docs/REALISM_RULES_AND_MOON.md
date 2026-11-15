# Realism sources and third-party imagery boundaries

Research date: November 15, 2026. This is a source review, not an organizer eligibility decision or a substitute for the owner's submission declarations.

## Space Apps and third-party material

The current [NASA/spaceapps discussion 1827](https://github.com/nasa/spaceapps/discussions/1827) permits third-party materials when their permissions and references are supplied. It also says Global Awards require a NASA data source from the selected challenge's Resources. The [Navigator-answered discussion 1947, November 12, 2026](https://github.com/nasa/spaceapps/discussions/1947) repeats that requirement, calls for meaningful use, and requires visible disclosure on AI-generated images/videos. Code assistance and scientific image textures should be distinguished from generative imagery in the project disclosure.

The indexed primary [2026 Participant Terms](https://www.spaceappschallenge.org/legal/) additionally describe non-NASA Solution Materials as needing to be “freely and publicly available without restriction” or open source. The full live legal, FAQ and guide pages returned fetch/certificate failures during this review; certificate verification was not bypassed. The indexed statement and answered discussion support using appropriately licensed open context, but do **not** explicitly authorize Google's proprietary Street View imagery for this application.

`DATA_SOURCES.md` records the previously browser-inspected resource names: Giovanni, Hydrology Time Series, AppEEARS, Climate Data Online, and a SeaWiFS time-series paper. NASA POWER, Black Marble, the SVS Moon texture and SRTMGL3 are not individually recorded as listed. Using SRTM through Open Topo Data does not demonstrate use of AppEEARS. No newly acquired qualifying challenge series is claimed here. The existing unresolved tab-resource condition remains unresolved; the Moon asset strengthens visual provenance without certifying challenge eligibility. The stricter answered 2026 guidance should be considered alongside the earlier guide wording recorded in `CHALLENGE_REVIEW.md`.

## Google Street View: a separate licensing boundary

[Google's Geo Guidelines](https://about.google/brand-resource-center/products-and-services/geo-guidelines/) allow an ordinary provider-supplied embedded viewer. They prohibit taking screenshots out of Street View, making offline copies, deriving/tracing information and stitching imagery; academic/nonprofit projects are included. Consequently a live external reference viewer and an extracted, relit or sky-replaced scene texture are different uses. This review does not establish permission for the latter.

The [Street View Static API policies](https://developers.google.com/maps/documentation/streetview/policies) require visible provider attribution and restrict caching/extraction and derived content. The [usage/billing documentation](https://developers.google.com/maps/documentation/streetview/usage-and-billing), updated November 9, 2026, requires billing plus an API key or OAuth token; Static API images are limited to 640×640. No billing account, API key, Google imagery download or Street View extraction was created or used for this extension.

Product recommendation from this evidence: retain open mapped/sourced reconstruction and appropriately licensed panoramas for the simulated sky. A Google-provided reference embed/link could be evaluated separately if genuinely useful, with its own attribution and terms; do not present it as a NASA-approved reusable texture or bundle it into the offline HTML.

## NASA Moon asset

`public/data/moon-lroc-2025-2k.jpg` preserves the ready-sized original 2048×1024 JPEG from the [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/). Credit: NASA's Scientific Visualization Studio. It is a compiled, aesthetically treated LRO surface map, not live lunar photography or calibrated luminance. Exact provenance, checksum and model limitations are in `data/moon-assets.json`.

[NASA media-use guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/) covers educational simulations with source acknowledgement, subject to identified third-party restrictions and no endorsement claim. The SVS item did not identify a separate third-party restriction on this map. Its rights remain separate from the application's MIT code license.

`python scripts/acquire_moon_asset.py` verifies local original bytes without network. Add `--download` to reacquire the pinned official source; differing bytes fail rather than silently updating. No cropping, resizing, image editing or transcoding was performed.

Renderer requirements: use independently calculated phase/Sun direction and angular size. Validate north-pole orientation, longitude handedness and libration; texture acquisition alone validates none of these. The installed Astronomy Engine exposes `Libration(date)` (including geocentric diameter) and `RotationAxis(Body.Moon, date)` (J2000 pole and IAU spin). A fixed front-facing texture should not be described as an exact lunar attitude model.
