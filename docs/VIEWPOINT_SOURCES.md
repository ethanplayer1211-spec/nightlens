# Named virtual observing stations: source notes

Research date: November 15, 2026. These notes support a recognizable, geographically aligned reconstruction. They do not establish an exact photorealistic city, a surveyed camera pose, licensed CAD geometry or real visitor access at the selected time.

Machine-readable factual notes are in `data/viewpoint-reference-facts.json`. Coordinates below are **map-anchored virtual camera inputs**, finalized against cached OSM geometry. Their decimal precision is not a statement of survey accuracy. The primary operator/park pages verify named places and specific published dimensions; they do not certify every chosen coordinate or surface.

## One named station per featured city

| City | Selected virtual station | Latitude, longitude | Observer/surface distinction |
|---|---|---|---|
| Kuala Lumpur | KL Tower Sky Deck, northeast edge | 3.152949, 101.703889 | Operator describes deck approximately 300 m above ground. A 1.7 m standing eye offset is a separate assumption. The northeast edge is estimated, not surveyed. |
| Penang | George Town neighbourhood terrace | 5.4141, 100.3354 | Assumed 7 m platform plus 1.7 m eye offset. Public neighbourhood anchor, not a surveyed residence or the user’s home. |
| Seoul | Namsan Palgakjeong outdoor plaza | 37.5519388, 126.9885103 | Outdoor plaza, not the enclosed N Seoul Tower observatory. Eye offset is assumed 1.7 m. |
| Sydney | Mrs Macquarie’s Chair | −33.8594584, 151.221884 | Outdoor waterfront station with an assumed 1.7 m eye offset; not a surveyed rock-seat surface. |
| London | Primrose Hill summit viewpoint | 51.5395287, −0.1606936 | Outdoor eye offset is added separately to contextual terrain; park’s almost-63 m summit statement is ASL. |
| New York | Brooklyn Bridge Park Pier 1 promenade | 40.7019951, −73.9974077 | Promenade station with assumed 1.7 m eye offset. Pier 1’s reported 20 ft park peak is not this point’s surveyed elevation. |
| San Pedro de Atacama | Mirador de Kari / Piedra del Coyote | −22.9169811, −68.2545001 | Virtual geological lookout, assumed eye 1.7 m above contextual terrain. It is not an invitation or assurance of access. |

Primary place references:

- [KL Tower operator](https://kltower.com.my/): Sky Deck approximately **300 m above ground**. KL Tower and the PETRONAS Twin Towers are distinct landmarks. The selected camera looks toward the Twin Towers from the former, rather than conflating them.
- [George Town World Heritage Incorporated](https://gtwhi.com.my/): public heritage-city context. The terrace, pots, rail, low-rise materials and inferred roofs are illustrative. Existing terrain/map cache filenames retain `penang-esplanade` as an asset ID; their original coverage anchor is not the current terrace camera.
- [N Seoul Tower observatory](https://www.nseoultower.co.kr/eng/visit/observatory.asp): enclosed observation level approximately **400 m ASL**. [Operator construction data](https://www.nseoultower.co.kr/eng/global/intro2.asp): tower **236.7 m** total, comprising body **135.7 m** and steel section **101 m**. The same page lists a **270 m** foundation datum and **506.7 m** total elevation. These are separate from the selected outdoor plaza. Do not substitute total tower height for a deck height or copy a nearby foundation number to the plaza as a survey.
- [Botanic Gardens of Sydney](https://www.botanicgardens.org.au/facility/mrs-macquaries-chair) and [NSW Government](https://www.nsw.gov.au/visiting-and-exploring-nsw/locations-and-attractions/mrs-macquaries-chair-sydney): named sandstone-chair / waterfront viewpoint. Mapped landmark positions should determine the Opera House and Harbour Bridge directions.
- [The Royal Parks — Primrose Hill](https://www.royalparks.org.uk/visit/parks/regents-park-primrose-hill/primrose-hill): summit **almost 63 m above sea level** and designated skyline viewpoint. This is not a precisely surveyed height for the chosen virtual eye point.
- [Brooklyn Bridge Park — Pier 1](https://brooklynbridgepark.org/places-to-see/pier-1/): promenade and Lower Manhattan / Brooklyn Bridge views; park peak **20 ft**. That peak does not define all promenade elevations.
- [Author-produced geological field guide](https://aulados.net/Geotours/PDFs/Valles_Luna_Marte_1.pdf): Mirador de Kari approximately **−22.917200, −68.254060**. [Municipal tourism manual](https://munispa.cl/wp-content/uploads/2026/03/Manual-Turismo-Completo-22-2026.pdf) verifies the Valle de la Luna / Mirador de Kari precinct, but its **−22.924146, −68.288110** reference is an area point rather than proof of the exact lookout ledge.

The [Valley of the Moon Indigenous Association](https://valledelaluna.com/en/?wmc-currency=USD) currently publishes a notice that Ckary is closed until further notice after the May 27, 2026 earthquake safety review. A virtual night scene does not imply access, opening hours or permission to enter. This project is not a travel or site-access guide.

## Height and terrain provenance

The cached contextual terrain comes from **NASA/USGS SRTMGL3 V003 through Open Topo Data**. See `data/viewpoint-terrain-sources.json`, its raw-response files and `public/data/terrain-*.json` for exact queries, retrieval timestamps and hashes.

| Station terrain grid | Center sample, m EGM96 | NightLens query spacing |
|---|---:|---:|
| KL Sky Deck | 87 | 400 m |
| Penang Esplanade | 6 | 500 m |
| Seoul Namsan | 260 | 500 m |
| Sydney Macquarie’s Chair | 3 | 500 m |
| London Primrose Hill | 60 | 500 m |
| New York Pier 1 | 4 | 500 m |
| Atacama Kari | 2,595 | 500 m |

These are source surface samples, **not measured platform or eye elevations**. KL’s grid center is 3.15290, 101.70380, near the selected estimated northeast deck-edge coordinate. Its 87 m sample is not an exact tower foundation survey.

The product’s native postings are **3 arc-seconds, approximately 90 m at the equator**, not 400/500 m. The latter are NightLens’s coarser query-grid spacings. Horizontal coordinates are WGS84; vertical elevations use the EGM96 geoid. Operator statements saying “above sea level” may have an unspecified vertical datum and must not be treated as a matched vertical-control survey.

SRTM observed the surface during February 2000, with additional void-filling sources in version 3. Radar surface returns can include vegetation and buildings. The API does not return original per-point quality flags, uncertainty or modern construction. A terrain grid cannot establish a current facade, railing, deck or exact bare-earth foundation height.

References: [Open Topo Data SRTM documentation](https://www.opentopodata.org/datasets/srtm/), [NASA/JPL mission](https://www.jpl.nasa.gov/missions/shuttle-radar-topography-mission-srtm/), [USGS SRTM archive](https://www.usgs.gov/centers/eros/science/usgs-eros-archive-digital-elevation-shuttle-radar-topography-mission-srtm), [SRTM version 3 user guide](https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf).

For a physically consistent approximate angular height, distinguish:

`landmarkTopASL = landmarkGroundASL + landmarkHeightAGL`

`observerASL = observerGroundASL + platformHeightAGL + assumedEyeOffset`

The observer-to-landmark bearing and top elevation angle then follow the actual coordinate offsets and difference in ASL. Published 300 m deck height is not 300 m ASL. If a renderer uses approximately 300 m as its eye level rather than 301.7 m, it should state that simplification rather than claim a measured standing-eye height.

## Published architectural constraints

These facts constrain scale and recognizable silhouettes. They are **not complete building plans, a licensed mesh, a facade survey or proof of exact design**. Missing tier profiles, material finishes, lighting operations, bridge attachment details and foreground construction remain modelling assumptions.

### Kuala Lumpur

- **PETRONAS Twin Towers:** height **451.9 m**, **88 storeys**; occupied height **375 m** according to [CTBUH](https://www.skyscrapercenter.com/building/wd/149). [Operator stories](https://www.petronastwintowers.com.my/the-towers/the-stories/) corroborates 451.9 m. [Operator design/structure](https://www.petronastwintowers.com.my/the-towers/design-structure/) contains inconsistent 451.8/452 m rounding and separately specifies a **170 m AGL**, **58.4 m** bridge at **levels 41 and 42**, an observation level **370 m AGL**, and a **44-storey** circular annex. Its plan description uses interlocking squares and semicircles. Keep architectural maximum, occupied level, observation deck and bridge distinct.
- **Merdeka 118:** **678.9 m** final height in the [developer PNB annual report](https://www.pnb.com.my/sites/default/files/2024-09/2021.pdf). The [project architect](https://fkaustralia.com/project/merdeka-118/) describes a diamond plan and faceted glazed composition. Its introductory approximate 600 m wording is not the final height authority.

### Sydney

- **Sydney Harbour Bridge:** [Transport for NSW](https://www.transport.nsw.gov.au/system/files/media/documents/2023/harbour-bridge-history.pdf) gives **503 m** main arch span, arch top **134 m ASL**, **89 m** pylons, **49 m** shipping clearance, **49 m** deck width and **1,149 m** total length including approaches. Shipping clearance is not the exact roadway elevation.
- **Sydney Opera House:** the [operator’s manual](https://www.sydneyoperahouse.com/sites/default/files/collaborodam_assets/tourism-sales-manual-december-2020.pdf) gives highest sail **67 m ASL**, not 67 m above the raised podium. [Australian Government heritage documentation](https://www.dcceew.gov.au/parks-heritage/heritage/places/world/sydney-opera-house) explains the common-sphere roof-shell concept. [Facade contractor](https://www.permasteelisagroup.com/historic-project/sydney-opera-house/) lists approximate dimensions **183 m long**, **120 m wide**, **67 m high**. Neither maximum dimensions nor the sphere concept determines every shell surface.

### London

- **BT Tower:** [BT Archives](https://www.bt.com/bt-plc/assets/documents/about-bt/our-history/bt-archives/information-sheets-and-timelines/bt-tower.pdf) gives **189 m** including a **12 m** mast, main structure **177 m**, revolving floor **158 m AGL**, and notes historical microwave aerials were removed in **2011**. A dish-covered historic silhouette should not be presented as an exact present-day model.
- **The Shard:** [official building site](https://www.the-shard.com/about//) states **309.6 m**. Height alone does not establish its complete plan, facade or crown geometry.

### New York

- **One World Trade Center:** [operator](https://wtc.com/work-place/1wtc/) states **1,776 ft**, arithmetically **541.3248 m**. [Architect SOM](https://www.som.com/projects/one-world-trade-center/) describes the square base, eight triangular faces, octagonal middle and **150 ft** square upper parapet turned **45°** relative to the base. [SOM’s project news](https://www.som.com/news/one-wtc-inside-the-tallest-building-in-the-western-hemisphere/) describes a **408 ft** spire. It is already included in total architectural height; do not add it twice.
- **Brooklyn Bridge:** [NYC DOT](https://www.nyc.gov/html/dot/html/infrastructure/brooklyn-bridge.shtml) reports main span **1,595.5 ft** (486.3084 m by direct conversion), central clearance **135 ft** (41.148 m) and total including approaches **6,016 ft**. [NPS nomination](https://npgallery.nps.gov/GetAsset/763eefb2-3e0e-44e3-be5e-c7bdd9608e7b/) gives masonry towers **276 ft 6 in above high water** (84.2772 m), base **140 × 59 ft**, top **136 × 53 ft**. [Library of Congress HAER data](https://tile.loc.gov/storage-services/master/pnp/habshaer/ny/ny1200/ny1234/data/ny1234data.pdf) rounds some quantities differently and contains inconsistent parenthetical metric conversions. Preserve the original datum and use rounded modelling precision, not an artificial millimetre-accuracy claim from arithmetic conversion.

## Photographs, panorama registration and rights

No reference photograph, photographic panorama, facade texture or surveyed third-party mesh was downloaded or bundled by this research task. Public pages and numerical facts are cited; no full papers, drawings or figures are reproduced.

- [Shesmax / Maxim Shesterikov’s 2019 KL panorama](https://commons.wikimedia.org/wiki/File:Panorama_view_of_Petronas_Twin_Tower_from_KL_Tower_in_2019.jpg) is CC BY-SA 4.0, **8,654 × 3,325** pixels. Its title describes a view from KL Tower, but its camera geotag **3.158, 101.712** is near the subject Twin Towers rather than KL Tower. That inconsistency prevents using the geotag as an exact camera-pose calibration. It is not verified as a full equirectangular sphere, and no reliable heading, pitch or angular coverage was established.
- [Frostpolar’s 2020 Sky Deck photograph](https://commons.wikimedia.org/wiki/File:Sky_Deck_at_Kuala_Lumpur_Tower_(Menara_KL),_Malaysia_on_28_July_2020_at_172231.jpg) is CC BY-SA 4.0 and can inform reference study. It is an ordinary perspective photograph, not a calibrated 360° environment map.
- The [360Cities KL-Menara sphere](https://www.360cities.net/st/image/kuala-lumpur-malaysia-view-from-kl-tower-menara-feb-2009) is an actual spherical panorama, but its page requires licensing. It was not extracted or bundled.

An ordinary wide panorama cannot be stretched over 360° and called a registered city view. A licensed photograph also does not automatically provide the camera pose, depth or sky mask required for accurate star alignment. No Google Street View or proprietary map imagery is copied.

## Representation limits

The resulting city context can be recognizable and spatially grounded while remaining a **parametric approximation**. Published maximum dimensions do not prove exact building surfaces. Deck railings, facades, windows, materials, vegetation and unmeasured foreground details remain approximations unless separately surveyed assets are acquired and verified.

Current/static landmark geometry is not a historical construction reconstruction. Changing the astronomical date does not establish that every rendered building existed on that date; Merdeka 118 is an obvious example. Scene vintage and this distinction should remain clear. The historical NASA analysis and uncalibrated lighting appearance keep their separate evidence boundaries.

## Implemented reconstruction and sampling boundaries

The final station tuples in `src/lib/viewpoints.ts` and `data/viewpoint-reference-facts.json` take precedence over earlier provisional camera positions. Penang anchors footway node 7651911375; Seoul viewpoint 3832844678; Sydney viewpoint 2386873673; London viewpoint 569700954; New York Granite Prospect node 3351167989; Kari node 1621464180. KL uses an estimated northeast edge near tower node 5839389988. None is a surveyed standing-eye pose.

Seven optional far grids add ±20 km of NASA/USGS terrain, sampled every 2 km (441 points each). The original near-grid centers are preserved in source metadata and bilinearly reprojected to the final camera, rather than silently relabelled as new measurements. Negative source elevations remain preserved: they are possible noise/artefacts or lowland, not bathymetry. Surface colours are illustrative, not NASA land cover. Terrain includes an approximate spherical-Earth drop; geometric sky objects remain cut off below 0° and atmospheric refraction/horizon dip are omitted.

Mapped Petronas building-part footprints and tagged tier heights are retained; container outlines are suppressed where they would bury those parts. The skybridge, Merdeka 118, Opera House, Harbour Bridge, BT Tower, Shard, One WTC, Brooklyn Bridge and N Seoul Tower include dimension-constrained parametric approximations. Facade rhythms, materials, railings, paving, furniture shapes and lighting operation are not measured architectural reconstructions. City geometry reflects the cached map/reconstruction vintage; selecting a historical astronomical date does not reconstruct historical construction.

Sydney Harbour and New York East River water surfaces use complete OSM water-relation boundaries, with original island holes, clipped to the station ±4 km window. A GPU mask prevents historical radar elevations from drawing land over those sourced water polygons. The clip edges are coverage boundaries, not shorelines; water colour/ripples, level and tide are illustrative. `data/viewpoint-water-sources.json` preserves raw replies/hashes and exact methods. `scripts/acquire_viewpoint_water.py --verify` reproduces the cached polygons using pinned Shapely 2.1.2. Penang has an explicit unavailable coastal mask: incomplete shore coverage is labeled instead of inventing mainland coast.

## Current asset/model integration

The KL camera was refined to approximately 17.5 m northeast of the mapped tower center, about 2.5 m behind an assumed 20 m-radius rail. Penang’s current station is a virtual neighbourhood terrace, not a surveyed rooftop or the user’s home. Its retained `penang-esplanade` asset ID refers to original cache coverage, not the current camera.

The NanoRay Petronas artist model is georegistered to the two mapped spire centers and scaled to 452 m; artist bridge materials are omitted in favor of the separate 58.4 m / 170 m approximation. The original GLB contains 47,772 indexed triangles; Sketchfab metadata reports 47,988 faces. These counts are retained separately rather than assumed equal. Materials, floor bands and nighttime lighting remain illustrative. Wider context, source photos, generic paving and font provenance are described in `REALISM_DESIGN_PASS.md`. Other city landmarks remain simplified parametric/mapped geometry; the acquired Opera House research model is not rendered.
