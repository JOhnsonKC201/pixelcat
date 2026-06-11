# Scroll rope-climb sprite frames

Drop **5 PNG frames** here, then run `npm run climb-frames` to embed them into
`src/climb-frames.js`. Until they exist, the cat falls back to the procedural
rope-climb (a seated cat gripping the rope) — nothing breaks.

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
