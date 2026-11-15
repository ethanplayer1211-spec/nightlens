# Five meaningful sky-date tags for NightLens

Primary sources checked November 15, 2026. Implementation reference: `data/sky-date-references.json`. This is a small curated set, not a complete event calendar or a visibility forecast. No images, meteor tracks or weather predictions were acquired.

## Recommended tags and what the button changes

| Tag | Event timing | Actual observing preview |
|---|---|---|
| **Mars beside Jupiter** | NASA identifies the mornings of **November 15–16, 2026** as a close apparent pairing. It does not publish an exact conjunction UTC in the cited article. | Resolve **2026-11-16 05:00 in the selected place's IANA timezone**, then calculate the planets and aim between their horizontal direction vectors. Show this as a chosen observing preview, not the exact conjunction instant. |
| **Moon's terminator** | Calculate the next **First Quarter** with Astronomy Engine. | Use an explicitly labeled local evening near that event, such as **21:00 on the local date containing the calculated phase instant**. Aim at the calculated Moon when above the horizon. |
| **Moonlit city** | Calculate the next **Full Moon** with Astronomy Engine. | Select a labeled evening near that global phase event. Retain the natural Moon contribution instead of treating full Moon as a dark-sky opportunity. |
| **An evening with less moonlight** | Calculate the next **New Moon** with Astronomy Engine. | Choose a labeled local evening near that event and show the genuine star field. New Moon does not remove sunlight, clouds, city light or guarantee the Milky Way core is above the horizon. |
| **Plan a Geminid night** | IMO predicts a **broad maximum around 2026-12-14 14:00 UT**, approximately 14:00 UTC at the published hourly precision. | For Malaysia, **December 15 around 02:00–04:00 MYT** is a useful geometric planning example. For other places, evaluate their own local dark intervals near the maximum instead of applying Malaysia's date everywhere. |

The date action must update the existing real observing instant, timezone clock and astronomical calculation. Camera targeting uses calculated vectors; it must not swap in a decorative sky photograph or fixed star arrangement. Preserve source labels and access caveats for each named viewpoint.

## Mars and Jupiter: a NASA event with an immediate useful view

[NASA's November 2026 What's Up article](https://science.nasa.gov/solar-system/skywatching/whats-up-november-2026-skywatching-tips-from-nasa/), published November 2, identifies this close pairing and explains that proximity in the sky does not imply proximity in space. Treat the article's observing dates as dates, not as a precise conjunction ephemeris.

The installed Astronomy Engine 2.1.19 gives these **calculated sanity examples**, using the explicitly recorded coordinates and assumed 0 m elevation in the JSON:

- **KL, November 16 05:00 MYT = November 15 21:00 UTC:** Mars altitude approximately **51.75°**, Jupiter **52.28°**, separation **1.1966°**, Sun **−28.88°**.
- **Penang, the same local/UTC times:** Mars **51.18°**, Jupiter **51.63°**, separation **1.1965°**, Sun **−30.90°**.
- Both planets also calculate above the geometric horizon in the other five named-city examples at their own November 16 05:00 local time. **Sydney is already in nautical twilight** in that example, with the Sun approximately **−8.86°**. This must be shown rather than suggesting identical darkness worldwide.

Recalculate these quantities for the actual selected point/elevation. Buildings, terrain, clouds and contrast can prevent detection even when geometric altitude is positive. For a camera midpoint, add normalized planet direction vectors and normalize the sum; averaging raw azimuth degrees fails around the north wrap.

## Lunar-quarter dates: phase instant and local viewing time are different

Use `SearchMoonQuarter(referenceInstant)` and iterate `NextMoonQuarter` until the requested quarter is found: **0 new, 1 first, 2 full, 3 last**. Use one clearly defined reference instant—such as the currently selected sky instant—and label “next after this view” if appropriate. Do not store a one-time November result as an evergreen upcoming event.

Independent primary reference: [USNO 2026 phase table](https://aa.usno.navy.mil/calculated/moon/phases?year=2026), its [JSON service](https://aa.usno.navy.mil/api/moon/phases/year?year=2026), and [phase-service explanation](https://aa.usno.navy.mil/data/MoonPhases). The source reports **Universal Time to the minute**. It is adequate as an approximately UTC minute-level reference, not as a claim of sub-minute timestamp precision.

| Phase after November 15 | Installed engine calculation, UTC | USNO published Universal Time |
|---|---|---|
| First Quarter | 2026-11-17 **11:48:27** | **11:48** |
| Full Moon | 2026-11-24 **14:54:04** | **14:53** |
| New Moon | 2026-12-09 **00:52:31** | **00:52** |

These are model calculations, not observations. The roughly one-minute full-Moon difference should remain visible in the research record; round user-facing engine times to minutes and label them **Calculated**. Do not attribute the engine's seconds to NASA or claim they exactly reproduce USNO.

The phase event is global and geocentric. The view is location-specific and topocentric. Convert the phase instant to the selected IANA local date before choosing 21:00; then show both the phase time and preview time when they differ. For example, the December 9 new-Moon instant is still December 8 in New York. A UTC date reused as a local date can choose the wrong evening.

[NASA's Moon Viewing Tips](https://science.nasa.gov/moon/viewing-tips/) supports the educational value of a partly illuminated Moon and surface relief near the day/night boundary. The [NASA phase explanation](https://science.nasa.gov/moon/moon-phases/) distinguishes reflected sunlight, phase and rise/set behavior. Even a correctly chosen phase requires checking actual Sun/Moon altitude and local horizon obstruction.

## Geminids: a planning date, not a simulated meteor count

Use the dated [IMO 2026 calendar](https://www.imo.net/files/meteor-shower/cal2026.pdf), printed pages **20–21**, for the nominal **December 14 at 14h UT** maximum. It expressly describes a broad maximum and variability. The same text maps the historical maximum-position range to roughly **December 13 21h through December 14 18h UT in 2026**. That range is historical timing context, not a confidence interval or a guarantee of sustained activity.

[NASA's Geminid page](https://science.nasa.gov/solar-system/meteors-meteorites/geminids/) supplies the shower context and emphasizes that meteors can occur across the sky rather than only at the radiant. The NASA overview and IMO calendar use different activity-end conventions; the tag does not need to claim an exact start/end boundary. No ideal-condition hourly count should be transferred to a selected city, weather setting or rendering slider.

Near maximum the published radiant is approximately **RA 112°, Dec +33°**. A fixed-coordinate calculation is a coarse directional aid: use the source's daily radiant drift if precision is needed, and do not present the simple example as an individually predicted meteor trajectory. Because the radiant is northerly, its culmination is lower from Sydney and Kari than from London, Seoul or New York; extreme southern latitudes can lose it altogether.

At KL on **December 14 22:00 MYT**, the nominal maximum time, the simple radiant calculation is only about **13° high** and the Moon is still about **18° above the horizon**. At **December 15 02:00 MYT**, the radiant is about **56° high**, the Sun about **−66°**, and the Moon about **−39°**. This makes the later local interval a useful planning example without claiming weather or a meteor rate. Penang gives similar geometry, but the application must calculate its actual point rather than copy KL's numbers.

Suggested initial examples by region are **December 15 02:00 local for KL/Penang, Seoul and Sydney**, and **December 14 02:00 local for London, New York and Kari**. They are examples, not a globally optimal schedule. A simple implementation can evaluate local candidates on December 14 and 15 between 00:00 and 05:00, exclude daylight/below-horizon cases, and rank dark, Moon-down intervals with a higher radiant and proximity to the nominal maximum. It must label this as **geometry-based planning**, not observing-condition optimization.

The event action should show real stars, planets, Moon and date-dependent surroundings lighting under the existing model. It should **not create guaranteed meteors or measured shower tracks**. Archive or explicitly date the 2026 card after its window; do not silently reuse 14:00 UTC as the peak for another year.

## Educational mini-challenge: keep light where it is needed

Credit [DarkSky International and IES's Five Principles](https://darksky.org/resources/guides-and-how-tos/lighting-principles/). A compact interactive challenge can ask the user to keep the same place, camera, instant and atmosphere while exploring a hypothetical group of **nonessential fixtures**:

1. **Useful:** keep essential safety lighting outside the experiment.
2. **Targeted:** enable shielding and observe the illustrative directional change.
3. **Low level:** choose an appropriate lower output for participating fixtures; do not score the user for maximum darkness.
4. **Controlled:** schedule the selected group after midnight, using the existing before/after clock actions to verify activation.
5. **Warm-colored:** compare warm and cool scenarios while retaining natural Sun/Moon and atmosphere effects.

Finish with one evidence question: **“Does 50% dimming of selected streetlights establish 50% less skyglow?”** Correct answer: **No**. Other sources and atmospheric transport remain, and NightLens's local appearance is uncalibrated.

Link the separate existing Tucson case instead of inventing a conversion coefficient. [NASA's Tucson account](https://science.nasa.gov/earth/earth-observatory/experimenting-with-tucson-night-lights-148259/) explains the intervention and multiple urban sources. The application's sourced six-night replay, ground-sky findings and statistical limitations are already documented in `docs/TUCSON_EVIDENCE.md`. Satellite-sum changes, separate ground measurements and illustrative local appearance are different quantities. Do not turn an educational completion badge into an exact-star-count, energy-saving or safety claim.

## Appearance and evidence boundaries

Bright Moon light, urban light and haze can reduce faint-background contrast; an opaque cloud layer can block the sky. NASA's [beginner skywatching guidance](https://science.nasa.gov/solar-system/skywatching/night-sky-network/may2024-night-sky-notes/) supports checking Moon phase and ambient lighting. The current visual haze coefficients remain artistic assumptions, not a calibrated forecast from NASA aerosol history. A new-Moon date alone does not establish a dark site, weather, Bortle class, exact visible-star count or access to a viewpoint.
