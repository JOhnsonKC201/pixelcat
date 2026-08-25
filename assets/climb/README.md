# Scroll rope-climb sprite frames (per coat)

> **⚠️ These are currently GATED OFF.** `PAINTED_CLIMB = false` in
> `src/renderer.js` stops any of this art loading, so every coat and both species
> use the **procedural** climb instead. The painted scenes are a different art
> language from the pet itself: the sprite is a chunky ~24x30-cell flat-filled
> character, while these are fine-grained and softly shaded, so the pet visibly
> changed style *and* size mid-scroll (measured at 169px wide sitting against 75px
> climbing). Tuxedo is the shipped default coat and had painted art, so every new
> user hit that break on their first scroll.
>
> The art below is still shipped and the frame picker is still covered by
> `tests/climb.test.js`. To restore it: repaint to match the sprite style (see
> `~/pixelpets-frame-pack/prompts/`, which now specify that style explicitly), then
> flip `PAINTED_CLIMB` back to `true`.
>
> Note that while gated off, `src/climb-frames.js` is ~4.7 MB of base64 that ships
> and parses at startup for nothing. Moving the coat folders under
> `assets/climb/_disabled/` and re-running `npm run climb-frames` would empty it
> (the embed script skips `_`-prefixed directories).

The cat that climbs a yarn rope while you scroll. Frames are **per coat**: each coat
folder holds 5 self-contained painted scenes (cat + rope + yarn ball). A coat
**with** its own folder uses the painted art; a coat **without** one uses the
**procedural** rope-climb in its own colours (no cross-coat fallback). **Tuxedo** is
the default coat out of the box.

Painted coats currently shipped: `tuxedo`, `orange-tabby`, `mackerel-tabby`, `gray`.
Every other coat (siamese, calico, black, …) climbs procedurally until a sheet is
added for it. (`black` was supplied on a checkerboard background that couldn't be
keyed cleanly - re-send it on a solid/transparent background to enable it.)

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
   background - darker than the fur):
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
