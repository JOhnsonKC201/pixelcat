# Scroll rope-climb sprite frames (per coat)

The cat that climbs a yarn rope while you scroll. Frames are **per coat**: each coat
folder holds 5 self-contained painted scenes (cat + rope + yarn ball). Any coat
**without** its own folder falls back to **`tuxedo`** (the default set), so the
painted climb shows on every coat. If no folders exist at all, the cat falls back to
the procedural rope-climb — nothing breaks.

## Layout

```
assets/climb/
├── _sheets/            # original contact sheets (not embedded), for reproducibility
├── tuxedo/             # the DEFAULT set every other coat falls back to
│   ├── idle.png  up1.png  up2.png  down1.png  down2.png
├── orange-tabby/       # optional per-coat override (same 5 files)
└── …                   # one folder per coat slug you want to customise
```

Coat slug = the `PATTERNS` name (in `src/cat-sprite.js`) lowercased with spaces →
hyphens: `Orange Tabby` → `orange-tabby`, `Tuxedo` → `tuxedo`, `Calico` → `calico`.

| File | Pose |
|------|------|
| `idle.png` | hanging on the rope, relaxed |
| `up1.png` / `up2.png` | climbing up (alternate) |
| `down1.png` / `down2.png` | descending (alternate) |

## Add / replace a coat

1. **From a 5-panel contact sheet** (idle \| up \| up \| down \| down on a *dark*
   background — darker than the fur):
   ```
   node scripts/slice-climb-sheet.js path/to/sheet.png <coat-slug> [bgThreshold]
   npm run climb-frames
   ```
   It slices the 5 panels and keys out the dark background into
   `assets/climb/<coat-slug>/`. Tune `bgThreshold` if the body gets eaten (lower) or
   halos appear (raise).
2. **Already have 5 transparent PNGs?** Put them in `assets/climb/<coat-slug>/` with
   the names above and run `npm run climb-frames`.

Each frame is a full painted scene (cat + rope + ball) on a transparent background.
Alignment/scale is controlled by `CLIMB_SCENE_H` / `CLIMB_ANCHOR_X` / `CLIMB_DROP`
in `src/renderer.js`.

## QA after embedding

```
npm run climb-frames
npx electron . --shot --state=paper --dir=up   --at=900   # writes _render.png (default coat -> tuxedo fallback)
npx electron . --shot --state=paper --dir=down --pattern=tuxedo --at=900
```
