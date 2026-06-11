# Scroll rope-climb sprite frames

The cat that climbs a yarn rope while you scroll. Each frame is a **self-contained
painted scene** (cat + rope + yarn ball) on a transparent background. Until these
exist, the cat falls back to the procedural rope-climb — nothing breaks.

**Two ways to populate this folder:**

1. **Already have 5 transparent PNGs?** Drop them in (names below) and run
   `npm run climb-frames`.
2. **Have a 5-panel contact sheet** (idle | up | up | down | down on a *dark*
   background)? Slice + background-key it automatically, then embed:
   ```
   node scripts/slice-climb-sheet.js path/to/sheet.png
   npm run climb-frames
   ```
   This only works when the sheet's background is clearly darker than the cat's
   fur (pass a threshold as the 2nd arg to tune).

| File        | Pose |
|-------------|------|
| `idle.png`  | hanging on the rope, relaxed |
| `up1.png`   | climbing up — reach A |
| `up2.png`   | climbing up — reach B (alternates with up1) |
| `down1.png` | descending — A |
| `down2.png` | descending — B (alternates with down1) |

**Spec**
- Transparent background, **cat only** — no rope, no yarn ball, no labels (the app
  draws the coral rope + floor ball procedurally behind the cat).
- Same character / scale / proportions across all 5 frames (side-on climbing pose).
- The gripping paws should sit near the **top-centre** of the frame so the vertical
  rope passes through them — tune alignment with `CLIMB_GRIP_FX` / `CLIMB_GRIP_FY`
  / `CLIMB_TARGET_H` in `src/renderer.js`.
- Any resolution (the app scales by height); a consistent aspect ratio is best.

**QA after embedding**

```
npm run climb-frames
npx electron . --shot --state=paper --dir=up   --at=1500   # writes _render.png
npx electron . --shot --state=paper --dir=down --at=1500
```
