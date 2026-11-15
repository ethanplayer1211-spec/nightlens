# Record NightLens — simple controls

From `C:\My files\Nasa space app`, run:

```powershell
npm run preview -- --port 4174
```

Open http://127.0.0.1:4174/. Keep the server running while recording. Use the full app when showing NASA Time Machine; the standalone HTML is the sky-focused edition.

## What to touch

The sky toolbar now has only **Adjust sky**, **Compare**, and **Reset**.

1. Click **Adjust sky**. Under **Choose your place**, select a station. **Tonight** is an explicit local 21:00 preview; **Now** follows the actual clock.
2. Under **Choose a lighting look**, choose **Today’s city night**, **Overlit future**, or **Responsible lighting**. Responsible lighting previews 00:05 on the observing night. The other looks preserve the selected instant and atmosphere.
3. Under **Choose what you see**, **Show buildings** controls local obstructions, and **Star guides** controls names/asterism aids. Their visibility still depends on contrast and occlusion.
4. Press **Done** to see the whole sky. Use **Compare** and drag the divider. Drag the sky to pan; scroll to zoom. **Reset** restores lighting, camera and visible buildings while keeping the selected instant.

**Moon close-up** is available when the Moon is above the geometric horizon. It toggles back to the previous camera. The magnified view explicitly hides local obstructions. **Face the city** restores the original station camera.

All detailed sliders, schedule settings, individual chart layers, weather-model coverage and image quality remain under **Advanced adjustments**. Ultra is the maximum-detail default; select Balanced if capture performance needs it. The enhanced survey treatment retains a visible warning: it is not a naked-eye prediction.

## Real photographs

KL and Sydney have a **Real place photograph** button below the place selector. It opens an unretouched, attributed historical source photograph. This is a fixed reference: its date, camera-pose limits and original sky are disclosed. Lighting controls apply to the calculated reconstruction behind it. Escape or Close photograph returns to the same settings. A photograph is not offered for places without a bundled licensed reference.

The dynamic city still uses mapped/artist geometry and approximate facades. Correlated room/floor lighting reduces the previous speckled appearance, but does not establish surveyed or photographic accuracy.

## A 28-second take

| Time | Action | Suggested narration |
|---|---|---|
| 00–04 | Opening → Adjust sky | “NightLens connects a place to its calculated sky.” |
| 04–10 | Responsible lighting → Done | “Explore responsible lighting choices for nonessential fixtures.” |
| 10–16 | Compare → drag the divider slowly | “Compare hypothetical changes. The lighting appearance remains illustrative.” |
| 16–23 | Return to instrument → Time Machine | “Explore 24 years of NASA aerosol records, with uncertainty.” |
| 23–28 | Keep the source and uncertainty labels visible | “Measured records and hypothetical lighting stay separate.” |

This is a rehearsal script, not a recorded or submitted video. Add accurate team identification as required. Aerosol records are not city-light measurements, and fixture dimming is not an equal percentage change in skyglow. Keep essential safety lighting.

Rehearse once and wait for the scene to load before capture. A landscape window with 100% browser zoom is easiest to read. Actual recording FPS depends on your hardware and encoder. Publication, demo upload, judging submission and organizer eligibility decisions are separate release steps.


## Final sprint additions

Clear 360° starts on a fictional platform above the complete rendered skyline/terrain. The on-screen height is virtual, not KL Tower’s deck. Turn it off for the named source viewpoint. Show buildings is separate and hides all local geometry when off.

Pick a special sky selects actual local dates/times with tags: First-quarter Moon, Full Moon, Moonless evening, the November 2026 Mars/Jupiter pair, or Geminid planning. Dated 2026 examples become labeled archives after their window. Lunar tags recalculate. No meteor streaks or rates are simulated. Choosing Responsible lighting changes the observing clock to 00:05; the comparison then shares that instant on both sides.

For the science shot, choose **Time Machine → Penang → MODIS Terra via Giovanni**. Keep 2001–2024, the 23 complete annual values / 1 missing label, source and inconclusive inference visible. Endpoint change is −15.1%, but the fitted trend is inconclusive (p≈0.197). This difference is a useful scientific finding, not a defect to hide.

Night Designer tracks the three explored scenarios and offers one evidence question. It is learning progress, not a sky-quality/safety score. Do not claim exact star counts, city savings, prediction accuracy, photographic realism, a winning score or NASA endorsement.


## Clear-tool revision

The immersive toolbar now exposes Lighting, Environment, Compare and Reset. Place & time is a separate header action. Compare initially chooses Busy city versus No artificial light when the current lighting would give identical sides. Before/After badges name the actual lighting; location, time, camera and air are shared. Clouds and daylight warnings explain why a comparison may be muted.

For a clear take: Enter the sky → Compare → slowly move the divider → Environment → Foggy → Clear air → Done → Return → NASA trends. Foggy, Hazy and Overcast are selected illustrations, not recorded weather. Use a wide landscape window if available. Font sizing and flat row controls have been simplified; the controls no longer sit inside one combined filter drawer.
