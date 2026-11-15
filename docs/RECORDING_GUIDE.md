# Record NightLens

The production build is ready. From `C:\My files\Nasa space app`, run:

```powershell
npm run preview -- --port 4174
```

Open http://127.0.0.1:4174/ in your recording browser. Keep that terminal running during capture. Use the full app for the submission walkthrough so the NASA Time Machine is available. The downloadable HTML is a separate sky-focused edition.

## Prepare one clean take

1. Use a landscape browser window, ideally a 1920×1080 capture. Keep browser zoom at 100%. Close unrelated tabs and notification popups.
2. Start with KL Tower and **Tonight**. This is an explicitly labeled 21:00 local preview. **Now** uses the real clock and may show daylight or current model clouds.
3. Click **Enter the sky → Controls**. Select **Render quality → Balanced** for a smoother first take. Ultra is now the maximum-detail default. It limits display pixel density; it does not change astronomical positions. High detail uses more GPU on high-density displays. Smoothness still depends on your device and recorder.
4. Rehearse the actions once and let the named scene load before recording. The initial model/mesh upload can take longer than later lighting changes. Station choices inside Controls use an explicit Tonight preview; normal location search still uses Now.
5. Keep the scientific captions visible. Natural impression is the default. Enhanced survey detail has a permanent warning in quiet view and should be described as an enhanced survey visualization.

## A 28-second take

| Time | Action | Suggested narration |
|---|---|---|
| 00–04 | Show the opening, then Enter the sky | “NightLens connects a place to its calculated sky.” |
| 04–10 | Controls → Experiment; enable shielding, close Controls | “Explore responsible lighting choices for nonessential fixtures.” |
| 10–16 | After midnight; drag the comparison divider slowly across the city/sky | “Compare hypothetical changes. The lighting appearance remains illustrative.” |
| 16–23 | Return to instrument → Time Machine; show 24 complete annual values and uncertainty | “Explore 24 years of NASA aerosol records, with uncertainty.” |
| 23–28 | Keep the source/uncertainty labels readable | “Measured records and hypothetical lighting stay separate.” |

This is a rehearsal script, not a recorded or submitted video. Add the correct team identity as required by your submission. The NASA aerosol record measures atmospheric aerosols, not city lighting. Do not describe fixture dimming as an equal percentage reduction in skyglow.

## Useful controls during a longer walkthrough

- **Controls** opens the same Lighting / Atmosphere / Experiment controls inside the sky. Switches show On/Off, slider values remain visible, and the selected tab stays selected when the panel is reopened.
- **Before · 23:55 / After · 00:05** checks the recurring schedule around midnight. The observing date/time updates explicitly.
- **Compare** is an independent toggle. Choosing a lighting theme preserves its state. The divider supports dragging and keyboard arrows/Home/End.
- **Moon study** toggles into a magnified NASA-textured lunar view and returns to the preceding camera on the second click. Its local-obstruction exception is labeled. It appears only when the Moon is above the geometric horizon.
- **Annotations / Quiet view** switches labels and asterism aids. Severe glare/clouds and occlusion can still suppress them; enabling a chart aid does not make an unobservable star visible.
- **Reset lighting & view** restores appearance/camera defaults at the selected place and instant. It preserves your chosen night during a take.
- **Escape** closes Controls first; a second Escape exits the immersive view. Direct camera dragging closes the panel. Camera arrows, scroll/pinch zoom and Reset camera remain available.

Lighting changes use a bounded 360 ms display transition. Redraw requests are coalesced per browser animation frame; no continuous animation runs after the transition settles. Reduced-motion preferences make display transitions immediate. This does not establish a guaranteed recording frame rate. Actual recording/encoder performance, physical-device touch and broad GPU compatibility have not been certified.

## Sky-first / Ultra update

The opening now aims higher from the same observer. **Sky only** hides all local structures and foreground, with a visible exception label, while retaining the selected sky geometry, atmosphere and lighting. **City view** restores the original station camera. Ultra supersamples even a standard-density display, bounded at 4096 pixels per dimension and a 3840×2160 pixel budget. It improves edge/point rendering; it does not add source-model or survey information. Balanced remains available for capture performance.
