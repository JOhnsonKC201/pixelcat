# Frame pack: painting poses by hand

Every pose the pet holds is composed in code from grid primitives, which is why one
`sit` covers 15 coats across two species, and why a new coat costs nine hex
values instead of an art pass. The trade is that improving how the pet *looks*
means editing geometry.

This is the escape hatch. Paint a pose, import it, and it wins over the composer
for exactly the coats you name. Everything else keeps composing, so a pack of one
frame is a perfectly valid pack.

## The model: roles, not colours

A sprite is a grid of **role letters**, one per cell:

| Letter | Role | Where it goes |
|---|---|---|
| `C` | coat | body, head, legs, the main mass |
| `K` | mark | stripes, saddle, mask, ear backs |
| `W` | white | bib, muzzle, toes, tail tip |
| `X` | patch | tortie and calico blocks, dog brows |
| `I` | inner | inner ear only |
| `N` | nose | nose pad only, anchors the whiskers and the tongue |
| `E` | eye | flat eye block, the engine paints the pupil into it |
| `O` | outline | one cell silhouette band |
| `H` | halo | **generated**, never authored |

`drawCat` looks the colour up per coat at draw time and applies its own top lit
shading. So the art you import must be **flat**: any shading painted in doubles up
with the engine's and turns muddy.

Three things are drawn live on top of the frame and must not appear in it: the
**halo**, the **pupils** (they track the cursor), and the dog **tongue**.

## Painting against the placeholder palette

Paint with these nine colours and nothing in between. They are never seen; they
exist only so a nearest-colour match can tell the roles apart.

| Role | Hex | | Role | Hex |
|---|---|---|---|---|
| coat | `#D9C7A7` | | nose | `#B04A57` |
| mark | `#33302E` | | eye | `#4FBF7A` |
| white | `#FBFBF7` | | outline | `#5C534A` |
| patch | `#D2762B` | | tongue | `#E8747F` (engine only) |
| inner | `#EFA9B8` | | | |

Transparent background. No anti aliasing, no gradients, no dithering. The importer
snaps every pixel to the nearest of the eight paintable colours and takes an area
majority vote per cell, so it survives art that does not land exactly on the grid,
but it cannot rescue a soft edge: it will report the percentage of pixels that were
not a palette colour and you should treat anything over 10 percent as a redraw.

## What can be baked, and what cannot

Five poses are **held**: the pet sits in them for whole seconds, and a still frame
is the right shape for them.

| Pose | Canvas | Notes |
|---|---|---|
| `sit` | 24x30 | the default, also the base for drag, pet, startle, greeting |
| `type` | 24x24 | no forelegs: the kneading paws are drawn over the keycaps |
| `loaf` | 24x30 | cat loaf, dog nose-to-tail curl (a side view, one eye) |
| `rear` | 24x30 | cat rear-up, dog beg. No forelegs: they are drawn live |
| `hunt` | 30x20 cat, 30x22 dog | cat crouch (front on), dog play bow (side view, one eye) |

The other six activities are **animation rigs**, not stills. Their limbs move with
a quantised parameter, so replacing one with a single frame would freeze it:

| Activity | Rig | Distinct frames per coat |
|---|---|---|
| rope climb | `climbSpriteFor(i, hand, dir)` | 4 (two grips x two headings) |
| groom, ponder, play | `pawSpriteFor(i, lift, out)` | up to 45 (`PAW_STEPS` 8 by 4 steps out) |
| bat overhead | `batSpriteFor(i, up, ph)` | 14 (two sides x seven arc steps) |

The importer refuses those poses on purpose. Generated art for them is still worth
having as a **reference to redraw the composer against**, which is how the dog was
built in the first place: iterate the geometry against a rendered contact sheet
until the silhouette reads.

## Importing

Name each PNG for the pose it fills, and optionally the coat it belongs to:

```
cat-sit.png                 every cat coat
cat-sit--Orange Tabby.png   that one coat, by its PATTERNS name
dog-hunt--retriever.png     every breed built on the retriever body
```

Then:

```
npm run frames:import -- path/to/pngs          # writes src/art-frames.js
npm run frames:import -- path/to/pngs --dry    # report only, write nothing
```

Lookup order is coat name, then build name, then `*`, then the composer. So you can
ship one `*` frame and override a single awkward coat later.

Every frame is checked before it is written, and a frame that fails is dropped with
a reason rather than shipped:

- the canvas matches the pose (a wrong size would break the layout maths built on it)
- an eye block sits **either side of the seam `eyeBox()` splits on**, or exactly one
  for the two profile poses. A face drawn off centre puts one eye in both boxes and
  `drawCat` paints the pupil as a bar across the muzzle. This has bitten the project
  twice, once on the cat and once on the dog.
- a nose exists, because the whiskers and the panting tongue anchor to it
- the bottom row is occupied, so the pose stands on the same floor line as the others

`--force` writes anyway. It is there for experiments, not for shipping.

## Verifying

```
npm test                    # includes a PNG round trip and the renderer hook
npm run poses:cat           # previews/cat-poses.png, every activity x every coat
npm run poses:dog
npm run test:boot
```

Then look at the sheets. Reading grid code cannot tell you whether a silhouette
reads as an animal, and the two coats worth checking first are **Black** and
**Slate**: they collapse coat, mark, white and patch into one colour, so anything
that only reads because of a colour change disappears. If the pose survives those,
the silhouette is doing the work.
