// Shared dog-sprite core - the dog counterpart to cat-sprite.js. Loaded as a
// classic script by the overlay (index.html) and the settings window
// (settings.html), so it reads cat-sprite.js's grid primitives (setCell/ellipse/
// triangle/buildSprite) as bare identifiers off the shared global lexical scope.
// cat-sprite.js MUST be loaded first. Also required as a CommonJS module by the
// icon/preview scripts, which pass those primitives in via `attach()`.
//
// A dog is NOT a recoloured cat. Four things carry the read at this size:
//   1. a muzzle that PROTRUDES past the skull line (cats are flat-faced here)
//   2. ears that hang or flop rather than sit as sharp triangles
//   3. a broader chest and a thicker neck
//   4. a nose that is big, dark, and sits at the TIP of the snout
// Everything below is in service of those four.

// In the browser these come from cat-sprite.js's global scope. In Node the
// module has no globals to read, so `attach()` injects them before use.
/* global CELL, setCell, ellipse, triangle, buildSprite */
let P = null;   // primitives, when running under Node
const _c = () => (P || { CELL, setCell, ellipse, triangle, buildSprite });

// ---- sitting dog ------------------------------------------------------------
// Parametric like composeSit: a build descriptor B varies the silhouette so each
// breed is a different DOG, not a palette swap.
//   B = { bodyW, headRx, headRy, snoutRx, snoutRy, snoutY, ear, legLen,
//         eyeRx, eyeRy, brows, fluff, marking }
function composeSitDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  // Head deliberately SMALLER than the cat's relative to the body. An oversized
  // round skull is what makes a small pixel quadruped read as a meerkat or a
  // teddy; a dog's head is roughly a third of its seated height.
  const headRx = B.headRx || 5.6, headRy = B.headRy || 4.7;
  const headY = 6.8;
  const snoutRx = B.snoutRx || 3.3, snoutRy = B.snoutRy || 2.8;
  const snoutY = B.snoutY == null ? 10.6 : B.snoutY;
  const ear = B.ear || 'floppy';
  const legLen = B.legLen == null ? 1 : B.legLen;
  const eRx = B.eyeRx || 1.7, eRy = B.eyeRy || 1.8;
  const fluff = !!B.fluff;

  // --- body: rump, then a BROAD chest, then a neck ---------------------------
  // The chest is the tell. A cat's sitting silhouette tapers to a narrow front;
  // a dog's flares out. The neck sits LOW so it never swallows the muzzle - that
  // was what flattened the face into a cat's in the first pass.
  ellipse(CX, 25.6, 7.7 * bw, 4.4, 'C');                       // haunch / seated rump
  ellipse(CX, 20.0, 5.9 * bw, 6.2, 'C');                       // chest (wider than the cat's 5.2)
  ellipse(CX, 15.2, 3.7 * bw, 3.0, 'C');                       // neck
  if (fluff) { ellipse(CX - 5.2 * bw, 18.0, 2.2, 3.2, 'C'); ellipse(CX + 5.2 * bw, 18.0, 2.2, 3.2, 'C'); }  // shoulder floof

  // --- hanging ears go BEHIND the skull so they read as attached -------------
  // They must extend clearly BELOW the jaw or they just look like a lumpy head.
  const earOx = headRx - 0.6;
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    const drop = ear === 'long' ? 5.6 : ear === 'round' ? 3.6 : 4.4;
    const eyC = ear === 'long' ? 10.4 : ear === 'round' ? 7.6 : 9.0;
    const exr = ear === 'round' ? 2.6 : 2.2;
    ellipse(CX - earOx, eyC, exr, drop, 'K');
    ellipse(CX + earOx, eyC, exr, drop, 'K');
  }

  // --- skull ---------------------------------------------------------------
  ellipse(CX, headY, headRx, headRy, 'C');

  // --- perked ears sit ON TOP of the skull ---------------------------------
  // Dog perk-ears are broader at the base and less needle-like than a cat's.
  if (ear === 'perk' || ear === 'semi' || ear === 'big') {
    const ew = ear === 'big' ? 2.9 : 2.5, eo = ear === 'big' ? 3.9 : 3.6;
    const apex = ear === 'big' ? -1.6 : ear === 'semi' ? 0.6 : -0.6;
    triangle(CX - eo - 0.6, apex, CX - eo - ew, 7.4, CX - eo + ew, 5.6, 'K');
    triangle(CX + eo + 0.6, apex, CX + eo + ew, 7.4, CX + eo - ew, 5.6, 'K');
    const iw = ew * 0.5;
    triangle(CX - eo - 0.4, apex + 2.0, CX - eo - iw, 6.9, CX - eo + iw, 5.8, 'I');
    triangle(CX + eo + 0.4, apex + 2.0, CX + eo + iw, 6.9, CX + eo - iw, 5.8, 'I');
    // semi-perk (collie / shiba): the top third folds forward over itself
    if (ear === 'semi') {
      ellipse(CX - eo - 0.2, apex + 1.2, 1.7, 1.3, 'K');
      ellipse(CX + eo + 0.2, apex + 1.2, 1.7, 1.3, 'K');
    }
  }
  // rose ear (pug/bulldog): a small folded nub tucked high on the skull
  if (ear === 'rose') {
    ellipse(CX - headRx + 0.8, 3.8, 1.8, 1.9, 'K');
    ellipse(CX + headRx - 0.8, 3.8, 1.8, 1.9, 'K');
  }

  // --- THE SNOUT: the single most important dog cue -------------------------
  // Drawn after the skull, centred low enough that its lower arc breaks the
  // skull's silhouette. The carve pass at the bottom of this function then traces
  // a jaw line around it, which is what actually sells the protrusion at 4px/cell.
  ellipse(CX, snoutY, snoutRx, snoutRy, 'W');
  if (B.snoutDark) ellipse(CX, snoutY - snoutRy * 0.2, snoutRx * 0.95, snoutRy * 0.78, 'K');   // muzzle mask (shepherd/husky/pug)

  // nose: big, dark, and parked at the TIP of the snout, not up on the face
  const noseY = snoutY - snoutRy * 0.30;
  ellipse(CX, noseY, 1.6, 1.1, 'N');

  // mouth: carved to '.' so outlineHalo() paints it dark on ANY coat, including
  // solid blacks where a drawn line would vanish. A shallow dog grin, not a cat's
  // tight w-mouth: a short stem under the nose, then two flares.
  const my = Math.round(noseY + 1.4);
  setCell(CX, my, '.');
  setCell(CX - 1, my + 1, '.'); setCell(CX + 1, my + 1, '.');
  setCell(CX - 2, my + 1, '.'); setCell(CX + 2, my + 1, '.');

  // --- eyes ----------------------------------------------------------------
  // Set wide and high on the skull, ABOVE the muzzle line, which is what gives a
  // dog its forward-facing look. Smaller than the cat's - big round eyes read as
  // kitten, not canine.
  const eyeY = headY - 0.6;
  ellipse(CX - 3.0, eyeY, eRx, eRy, 'E');
  ellipse(CX + 3.0, eyeY, eRx, eRy, 'E');
  // tan "eyebrow" pips - a strong breed cue on shepherds, beagles, rotties
  if (B.brows) { ellipse(CX - 3.0, eyeY - 2.5, 1.3, 0.9, 'X'); ellipse(CX + 3.0, eyeY - 2.5, 1.3, 0.9, 'X'); }

  // --- front legs + paws ----------------------------------------------------
  // legLen shrinks for the dwarf breeds (corgi, dachshund) - short legs are the
  // whole point of those silhouettes, so they scale rather than just recolour.
  const pawY = 28.4;
  const legRy = 5.0 * legLen, legCy = pawY - legRy * 0.84;
  ellipse(CX - 2.3, legCy, 1.8, legRy, 'C');
  ellipse(CX + 2.3, legCy, 1.8, legRy, 'C');
  ellipse(CX - 2.3, pawY, 2.1, 1.7, 'W', ['C']);
  ellipse(CX + 2.3, pawY, 2.1, 1.7, 'W', ['C']);

  // --- chest blaze ----------------------------------------------------------
  // Most dogs carry a lighter bib; on solid coats white==coat so this is a no-op.
  ellipse(CX, 20.5, fluff ? 3.0 : 2.4, 4.8, 'W', ['C']);

  applyMarking(B.marking, { cx: CX, top: 14.0, bot: 29.0, w: 6.6 * bw, headY, headRx });

  // --- carve separations LAST so the halo traces them on every coat ----------
  // This is the only way internal edges survive on solid blacks, where every
  // drawn line is the same colour as the coat.
  carveJaw(CX, snoutY, snoutRx, snoutRy);
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    // seam each hanging ear off the cheek so it reads as a separate flap
    const seamTop = Math.round(headY - 1), seamBot = Math.round(headY + headRy + 1.6);
    for (let r = seamTop; r <= seamBot; r++) {
      setCell(Math.round(CX - earOx + 2.0), r, '.');
      setCell(Math.round(CX + earOx - 2.0), r, '.');
    }
  }
  for (let r = 22; r <= 29; r++) setCell(CX, r, '.');                                  // between the front legs
  for (let r = 24; r <= 29; r++) { setCell(CX - 5, r, '.'); setCell(CX + 5, r, '.'); }  // leg vs haunch
  setCell(CX - 2, 29, '.'); setCell(CX + 2, 29, '.');                                   // toe splits
}

// Trace the underside of the muzzle so it reads as a volume standing proud of the
// skull rather than a paler patch painted on a flat face. Used by every pose.
function carveJaw(cx, sy, srx, sry) {
  const { setCell } = _c();
  const wide = Math.round(srx + 0.4);
  for (let dc = -wide; dc <= wide; dc++) {
    const t = dc / (wide || 1);
    const r = Math.round(sy + sry * Math.sqrt(Math.max(0, 1 - t * t)) + 0.9);
    setCell(cx + dc, r, '.');
  }
}

// ---- breed markings ---------------------------------------------------------
// Each is a distinct coat STRUCTURE, applied over the built body. Positions are
// RELATIVE to a body box the calling pose describes, so the same breed composes
// correctly whether it is sitting, bowing, curled or begging - absolute grid
// coordinates would only ever be right for one pose.
//   box = { cx, top, bot, w, headY, headRx }   (top/bot bound the torso+rump)
function applyMarking(kind, box) {
  const { setCell, ellipse } = _c();
  if (!kind || kind === 'solid' || !box) return;
  const { cx, top, bot, w } = box;
  const headY = box.headY == null ? top - 4 : box.headY;
  const headRx = box.headRx || 5.4;
  const H = Math.max(1, bot - top);
  const y = (f) => top + H * f;                 // fraction down the torso
  const x = (f) => cx + w * f;                  // fraction across the half-width

  if (kind === 'spots') {                                    // dalmatian
    const pips = [[-0.62, 0.16], [-0.30, 0.44], [0.52, 0.28], [0.70, 0.62], [-0.66, 0.72],
      [0.24, 0.06], [0.66, 0.02], [-0.10, 0.86], [0.34, 0.80], [-0.44, 0.32]];
    for (const [fx, fy] of pips) ellipse(x(fx), y(fy), 1.2, 1.2, 'K', ['C', 'W']);
    ellipse(cx - headRx * 0.72, headY - 0.4, 1.4, 1.3, 'K', ['C']);
  } else if (kind === 'saddle') {                            // german shepherd: dark cape over the back
    // A cape, not a coat of paint: it stops well short of the chest and the legs,
    // otherwise the whole dog just turns black and the breed stops reading.
    for (let r = Math.round(y(0.02)); r <= Math.round(y(0.68)); r++) {
      const t = (r - y(0.02)) / Math.max(1, y(0.68) - y(0.02));
      const half = w * (1.02 - t * 0.30);
      for (let c = Math.round(cx - half); c <= Math.round(cx + half); c++) setCell(c, r, 'K');
    }
    ellipse(cx, y(0.42), w * 0.40, H * 0.36, 'C', ['K']);    // chest stays light under the cape
  } else if (kind === 'tri') {                               // beagle / bernese: dark back + tan points
    for (let r = Math.round(y(0.00)); r <= Math.round(y(0.46)); r++) {
      const half = w * 0.98;
      for (let c = Math.round(cx - half); c <= Math.round(cx + half); c++) setCell(c, r, 'K');
    }
    ellipse(cx, y(0.34), w * 0.44, H * 0.34, 'W', ['K']);
    ellipse(x(-0.80), y(0.72), 1.8, 2.0, 'X', ['C', 'K']);
    ellipse(x(0.80), y(0.72), 1.8, 2.0, 'X', ['C', 'K']);
  } else if (kind === 'merle') {                             // australian shepherd: mottled patches
    const blots = [[-0.72, 0.10], [0.62, 0.26], [-0.46, 0.62], [0.44, 0.76], [-0.14, 0.02], [0.78, 0.56], [-0.80, 0.86]];
    for (const [fx, fy] of blots) ellipse(x(fx), y(fy), 1.8, 1.5, 'K', ['C']);
    ellipse(cx + headRx * 0.66, headY - 0.2, 1.9, 1.8, 'K', ['C']);
  } else if (kind === 'mask') {                              // husky: dark cap + goggle stripes
    ellipse(cx, headY - 2.0, headRx * 0.94, 2.5, 'K', ['C']);
    ellipse(cx - headRx * 0.80, headY + 1.0, 1.3, 2.3, 'K', ['C']);
    ellipse(cx + headRx * 0.80, headY + 1.0, 1.3, 2.3, 'K', ['C']);
  } else if (kind === 'patch') {                             // border collie / cow-patch
    ellipse(x(-0.84), y(0.24), 2.7, H * 0.30, 'K', ['C', 'W']);
    ellipse(x(0.78), y(0.70), 2.5, H * 0.22, 'K', ['C', 'W']);
    ellipse(cx + headRx * 0.70, headY - 0.4, 2.2, 2.2, 'K', ['C']);
  } else if (kind === 'points') {                            // rottweiler/dobie tan points, no cape
    ellipse(cx, y(0.40), w * 0.34, H * 0.26, 'X', ['C', 'K']);
    ellipse(x(-0.36), y(0.98), 1.9, 1.6, 'X', ['C', 'W']);
    ellipse(x(0.36), y(0.98), 1.9, 1.6, 'X', ['C', 'W']);
  } else if (kind === 'curly') {                             // poodle: scalloped rim reads as curls
    // Nick the silhouette rather than dotting the middle - a curly coat shows at
    // this size as a bumpy OUTLINE, and stray interior dots just look like dirt.
    const rim = [[-0.96, 0.08], [0.96, 0.08], [-1.00, 0.40], [1.00, 0.40],
      [-0.88, 0.72], [0.88, 0.72], [-0.66, 0.96], [0.66, 0.96]];
    for (const [fx, fy] of rim) ellipse(x(fx), y(fy), 1.6, 1.6, 'C');
    for (const [fx, fy] of rim) setCell(Math.round(x(fx)), Math.round(y(fy)), '.');
  }
}

// ---- play bow (the dog answer to the cat's hunting crouch) -------------------
// Front end flat on the floor, elbows down, rump HIGH, tail up. This is the
// universal canine play invitation, so it is what the dog does when it wants to
// chase the cursor or start a game of fetch.
function composeBowDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const bw = B.bodyW || 1;
  const ear = B.ear || 'floppy';
  // 30x22, drawn in three-quarter profile facing LEFT. The whole read depends on
  // one silhouette: a steep diagonal from a high rump down to a chest flat on the
  // floor. Keep the rump strictly above the shoulders or it collapses into a loaf.
  ellipse(22.0, 6.6, 4.8 * bw, 4.4, 'C');         // raised rump - the highest mass
  ellipse(16.0, 11.4, 5.0 * bw, 3.4, 'C');        // back, raking steeply down to the front
  ellipse(10.0, 15.6, 4.2, 3.0, 'C');             // shoulders, pressed flat to the floor
  // tail flagged straight UP off the rump - with the chest down, this is the
  // unmistakable read of a play bow rather than a dog simply lying down
  for (let a = 0; a < 5; a++) ellipse(24.6 + a * 0.8, 4.4 - a * 1.05, 1.5 - a * 0.12, 1.5 - a * 0.12, 'C');
  // rear legs folded under the hiked rump
  ellipse(23.0, 14.6, 2.1, 4.2, 'C'); ellipse(23.0, 18.4, 2.3, 1.6, 'W', ['C']);
  // front legs stretched FORWARD along the ground - the giveaway of a play bow
  ellipse(7.0, 17.6, 3.6, 1.7, 'C'); ellipse(3.8, 18.0, 2.0, 1.5, 'W', ['C']);
  ellipse(10.6, 18.2, 3.2, 1.6, 'C'); ellipse(7.8, 18.6, 1.9, 1.4, 'W', ['C']);
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    ellipse(7.2, 16.2, 1.9, 3.2, 'K');            // ear swings forward and hangs
  }
  ellipse(5.4, 14.6, 3.9, 3.4, 'C');              // head, dropped to the floor
  if (ear === 'perk' || ear === 'semi' || ear === 'big') {
    triangle(3.8, 9.4, 2.4, 13.6, 6.4, 12.6, 'K');
    triangle(7.4, 9.2, 6.2, 13.4, 10.0, 12.4, 'K');
  }
  ellipse(15.0, 14.4, 4.2, 1.7, 'W', ['C']);      // pale belly line along the underside
  applyMarking(B.marking, { cx: 16.0, top: 7.0, bot: 17.5, w: 5.6 * bw, headY: 14.6, headRx: 3.9 });
  ellipse(2.5, 16.2, 2.4, 1.9, 'W');              // snout laid flat on the ground
  ellipse(1.5, 15.8, 1.3, 1.0, 'N');
  ellipse(6.0, 13.6, 1.6, 1.7, 'E');              // one visible eye, looking up at you
  if (B.brows) ellipse(6.2, 11.4, 1.2, 0.8, 'X');
  carveJaw(2.5, 16.2, 2.4, 1.9);
  for (let r = 13; r <= 19; r++) setCell(20, r, '.');   // seam the rear leg off the rump
}

// ---- keyboard dog (the type pose) -------------------------------------------
// Same "paws on the home row" idea as the cat, but a dog leans its whole chest
// onto the desk and lets the snout hang over the keys.
function composeTypeDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const CX = 12;
  const ear = B.ear || 'floppy';
  const headRx = B.headRx || 5.5, headRy = B.headRy || 4.6;
  const headY = 6.4;
  const snoutRx = B.snoutRx || 3.2, snoutRy = B.snoutRy || 2.7;
  const snoutY = B.snoutY == null ? 10.2 : B.snoutY - 0.4;
  // The renderer paints the keys and the kneading paws over this, so the sprite is
  // just head + a chest spread wide across the desk edge.
  ellipse(CX, 18.6, 7.2, 5.2, 'C');               // chest, flattened onto the desk
  ellipse(CX, 14.2, 3.6, 3.0, 'C');               // neck
  const earOx = headRx - 0.6;
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    const drop = ear === 'long' ? 5.4 : ear === 'round' ? 3.5 : 4.2;
    ellipse(CX - earOx, 8.6, 2.2, drop, 'K');
    ellipse(CX + earOx, 8.6, 2.2, drop, 'K');
  }
  ellipse(CX, headY, headRx, headRy, 'C');
  if (ear === 'perk' || ear === 'semi' || ear === 'big') {
    const ew = ear === 'big' ? 2.9 : 2.5, eo = ear === 'big' ? 3.9 : 3.6;
    const apex = ear === 'big' ? -1.8 : -0.8;
    triangle(CX - eo - 0.6, apex, CX - eo - ew, 7.0, CX - eo + ew, 5.2, 'K');
    triangle(CX + eo + 0.6, apex, CX + eo + ew, 7.0, CX + eo - ew, 5.2, 'K');
    const iw = ew * 0.5;
    triangle(CX - eo - 0.4, apex + 2.0, CX - eo - iw, 6.5, CX - eo + iw, 5.4, 'I');
    triangle(CX + eo + 0.4, apex + 2.0, CX + eo + iw, 6.5, CX + eo - iw, 5.4, 'I');
  }
  ellipse(CX, snoutY, snoutRx, snoutRy, 'W');     // snout hanging over the keys
  if (B.snoutDark) ellipse(CX, snoutY - snoutRy * 0.2, snoutRx * 0.95, snoutRy * 0.78, 'K');
  ellipse(CX, snoutY - snoutRy * 0.30, 1.6, 1.1, 'N');
  ellipse(CX - 3.0, headY - 0.6, 1.7, 1.8, 'E');
  ellipse(CX + 3.0, headY - 0.6, 1.7, 1.8, 'E');
  if (B.brows) { ellipse(CX - 3.0, headY - 3.1, 1.3, 0.9, 'X'); ellipse(CX + 3.0, headY - 3.1, 1.3, 0.9, 'X'); }
  ellipse(CX, 19.0, 2.6, 4.0, 'W', ['C']);        // chest blaze
  applyMarking(B.marking, { cx: CX, top: 13.5, bot: 23.5, w: 6.6, headY, headRx });
  carveJaw(CX, snoutY, snoutRx, snoutRy);
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    for (let r = Math.round(headY - 1); r <= Math.round(headY + headRy + 1.4); r++) {
      setCell(Math.round(CX - earOx + 2.0), r, '.');
      setCell(Math.round(CX + earOx - 2.0), r, '.');
    }
  }
}

// ---- curled dog (the loaf answer): nose-to-tail donut ------------------------
// Cats loaf into a brick. Dogs curl into a spiral with the nose tucked against a
// hind leg and the tail wrapped over the face, so the silhouette is a ring.
function composeCurlDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const CX = 12, CY = 22;
  const bw = B.bodyW || 1;
  const ear = B.ear || 'floppy';
  // Cats loaf into a brick; dogs coil into a spiral with the nose tucked in and the
  // tail wrapped over the paws, so the target silhouette is a RING. The tail arc
  // along the lower left is what distinguishes it from a sleeping cat.
  ellipse(CX - 0.5, CY - 0.4, 7.2 * bw, 4.6, 'C');// the coiled body mass
  ellipse(CX - 4.8, CY - 1.8, 3.4, 3.6, 'C');     // hip, folded forward
  ellipse(CX + 4.6, CY - 3.8, 3.9, 3.4, 'C');     // head laid down on the flank
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    ellipse(CX + 7.8, CY - 1.8, 2.0, 3.2, 'K');   // ear draped over the shoulder
  } else {
    triangle(CX + 7.2, CY - 7.4, CX + 5.2, CY - 3.6, CX + 8.8, CY - 3.2, 'K');
  }
  // Face features are painted AFTER applyMarking below - in this pose the coiled
  // body sits at the same rows as the head, so a solid marking (beagle tricolour)
  // would otherwise bury the eye.
  // the tail sweeps around the front and rests over the paws - closes the ring
  for (let a = 0; a <= 14; a++) {
    const th = Math.PI * (0.30 + a / 14 * 0.86);
    ellipse(CX - 0.5 + Math.cos(th) * 8.4, CY - 0.4 + Math.sin(th) * 5.6, 1.8, 1.6, 'C');
  }
  ellipse(CX - 1.5, CY + 2.6, 4.8, 1.6, 'W', ['C']);// belly fur against the floor
  applyMarking(B.marking, { cx: CX - 0.5, top: CY - 5.0, bot: CY + 5.0, w: 7.4 * bw, headY: CY - 3.2, headRx: 4.2 });
  ellipse(CX + 1.6, CY - 1.6, 2.7, 2.1, 'W');     // snout tucked toward the tail
  ellipse(CX + 0.2, CY - 1.2, 1.4, 1.0, 'N');
  ellipse(CX + 5.2, CY - 4.2, 1.8, 0.7, 'E');     // eye closed to a contented slit
  carveJaw(CX + 1.6, CY - 1.6, 2.7, 2.1);
  // seam the tail off the body so the coil reads as two overlapping volumes
  for (let a = 1; a <= 13; a++) {
    const th = Math.PI * (0.30 + a / 14 * 0.86);
    setCell(Math.round(CX - 0.5 + Math.cos(th) * 6.6), Math.round(CY - 0.4 + Math.sin(th) * 4.2), '.');
  }
}

// ---- begging dog (the rear-up answer) ---------------------------------------
// Up on the haunches with both front paws dangling at the chest. Cats bat at
// things overhead; dogs BEG, so the paws hang loose rather than reaching.
function composeBegDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  const ear = B.ear || 'floppy';
  const headRx = B.headRx || 5.4, headRy = B.headRy || 4.6;
  const headY = 5.6;
  const snoutRx = B.snoutRx || 3.2, snoutRy = B.snoutRy || 2.7;
  const snoutY = B.snoutY == null ? 9.3 : B.snoutY - 1.3;
  ellipse(CX, 26.4, 6.8 * bw, 3.6, 'C');          // seated base
  ellipse(CX, 19.4, 4.9 * bw, 7.4, 'C');          // torso stretched tall
  ellipse(CX, 13.4, 3.5, 3.0, 'C');               // neck, extended upward
  const earOx = headRx - 0.6;
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    const drop = ear === 'long' ? 5.4 : ear === 'round' ? 3.5 : 4.2;
    ellipse(CX - earOx, 7.8, 2.2, drop, 'K');
    ellipse(CX + earOx, 7.8, 2.2, drop, 'K');
  }
  ellipse(CX, headY, headRx, headRy, 'C');
  if (ear === 'perk' || ear === 'semi' || ear === 'big') {
    const ew = ear === 'big' ? 2.9 : 2.5, eo = ear === 'big' ? 3.9 : 3.6;
    const apex = ear === 'big' ? -2.6 : -1.6;
    triangle(CX - eo - 0.6, apex, CX - eo - ew, 6.2, CX - eo + ew, 4.4, 'K');
    triangle(CX + eo + 0.6, apex, CX + eo + ew, 6.2, CX + eo - ew, 4.4, 'K');
    const iw = ew * 0.5;
    triangle(CX - eo - 0.4, apex + 2.0, CX - eo - iw, 5.7, CX - eo + iw, 4.6, 'I');
    triangle(CX + eo + 0.4, apex + 2.0, CX + eo + iw, 5.7, CX + eo - iw, 4.6, 'I');
  }
  ellipse(CX, snoutY, snoutRx, snoutRy, 'W');     // snout tipped up, hopeful
  if (B.snoutDark) ellipse(CX, snoutY - snoutRy * 0.2, snoutRx * 0.95, snoutRy * 0.78, 'K');
  ellipse(CX, snoutY - snoutRy * 0.30, 1.6, 1.1, 'N');
  ellipse(CX - 3.0, headY - 0.6, 1.8, 1.9, 'E');
  ellipse(CX + 3.0, headY - 0.6, 1.8, 1.9, 'E');
  if (B.brows) { ellipse(CX - 3.0, headY - 3.1, 1.3, 0.9, 'X'); ellipse(CX + 3.0, headY - 3.1, 1.3, 0.9, 'X'); }
  // dangling front paws held close to the chest, wrists limp - the beg tell
  ellipse(CX - 3.0, 17.0, 1.5, 2.8, 'C'); ellipse(CX - 3.4, 19.6, 1.9, 1.5, 'W', ['C']);
  ellipse(CX + 3.0, 17.4, 1.5, 2.8, 'C'); ellipse(CX + 3.4, 20.0, 1.9, 1.5, 'W', ['C']);
  ellipse(CX, 19.6, 2.3, 4.6, 'W', ['C']);        // chest blaze
  applyMarking(B.marking, { cx: CX, top: 13.0, bot: 29.0, w: 5.6 * bw, headY, headRx });
  carveJaw(CX, snoutY, snoutRx, snoutRy);
  for (let r = 22; r <= 28; r++) setCell(CX, r, '.');
  // seam each dangling forearm off the chest
  for (let r = 15; r <= 20; r++) { setCell(CX - 5, r, '.'); setCell(CX + 5, r, '.'); }
}

// ---- seated with one front paw raised ---------------------------------------
// The canine composePawUp: same knobs (o.lift / o.out), same reason for existing -
// a limb composed into the grid inherits the coat's shading, outline and breed
// markings, where a rectangle drawn over the finished sprite inherits none of it.
// A dog's front legs sit closer together and lower than a cat's, so the shoulder
// and the planted-leg erase are tuned to composeSitDog rather than shared.
function composePawUpDog(B, o) {
  const { setCell, ellipse } = _c();
  B = B || {}; o = o || {};
  const lift = Math.max(0, Math.min(1, o.lift == null ? 1 : o.lift));
  const out = Math.max(0, Math.min(1, o.out || 0));
  const CX = 12, bw = B.bodyW || 1;
  const legLen = B.legLen == null ? 1 : B.legLen;
  composeSitDog(B);

  // lift the left foreleg: erase it, close the chest back up, restore the blaze
  for (let r = 19; r <= 29; r++) for (let c = 7; c <= 12; c++) setCell(c, r, '.');
  ellipse(CX, 25.6, 7.7 * bw, 4.4, 'C', ['.']);
  ellipse(CX, 20.0, 5.9 * bw, 6.2, 'C', ['.']);
  ellipse(CX, 20.5, B.fluff ? 3.0 : 2.4, 4.8, 'W', ['C']);

  const shX = CX - 2.0, shY = 21.0;
  const pawX = CX - 2.3 - out * 4.4, pawY = 28.4 - 5.0 * (1 - legLen) - lift * 15.0;
  for (let i = 0; i <= 6; i++) {
    const f = i / 6;
    ellipse(shX + (pawX - shX) * f, shY + (pawY - shY) * f, 1.6, 1.6, 'C');
  }
  ellipse(pawX, pawY, 2.1, 1.7, 'W', ['C']);
  if (lift > 0.62) {                                  // paw turned toward you: pads show
    ellipse(pawX, pawY + 0.5, 1.0, 0.7, 'I', ['W']);
    ellipse(pawX - 1.6, pawY - 0.5, 0.6, 0.6, 'I', ['W']);
    ellipse(pawX + 1.6, pawY - 0.5, 0.6, 0.6, 'I', ['W']);
  }
  for (let r = 24; r <= 29; r++) setCell(CX + 5, r, '.');    // planted right leg vs haunch
  setCell(CX + 2, 29, '.');                                  // its toe split
  if (lift > 0.15) for (let c = Math.round(Math.min(pawX, shX)) - 1; c <= Math.round(shX) + 1; c++) setCell(c, Math.round(shY) - 1, '.');
}

// ---- rope climb -------------------------------------------------------------
// ---- breed palettes ---------------------------------------------------------
// Dog noses are overwhelmingly black or liver, never the pink a cat gets, so the
// `nose` values here run dark on purpose. `tongue` is dog-only (panting).
const DOG_PATTERNS = [
  { name: 'Black Lab', coat: '#2f3138', mark: '#25272d', white: '#2f3138', patch: '#2f3138', eye: '#8a6a3a', nose: '#16181c', inner: '#6a4c52', outline: '#15171b', tongue: '#e8747f' },
];

// Build archetypes. `ear`, `tail` and `legLen` do most of the visual work.
const DOG_BUILDS = {
  retriever:  { bodyW: 1.10, headRx: 6.7, headRy: 5.5, ear: 'floppy', tail: 'feather', fluff: true,  marking: 'solid'  },
  spitz:      { bodyW: 1.00, headRx: 6.2, headRy: 5.3, ear: 'perk',   tail: 'curl',    snoutRx: 3.2, marking: 'solid'  },
  dwarf:      { bodyW: 1.14, headRx: 6.6, headRy: 5.5, ear: 'big',    tail: 'stub',    legLen: 0.58, marking: 'solid'  },
  hound:      { bodyW: 1.02, headRx: 6.4, headRy: 5.4, ear: 'long',   tail: 'straight', brows: true, marking: 'tri'    },
  working:    { bodyW: 1.12, headRx: 6.8, headRy: 5.6, ear: 'perk',   tail: 'curl',    snoutDark: true, fluff: true, marking: 'mask' },
  spotted:    { bodyW: 1.04, headRx: 6.4, headRy: 5.3, ear: 'floppy', tail: 'straight', marking: 'spots' },
  shepherd:   { bodyW: 1.08, headRx: 6.6, headRy: 5.5, ear: 'big',    tail: 'plume',   snoutDark: true, brows: true, marking: 'saddle' },
  collie:     { bodyW: 1.00, headRx: 6.3, headRy: 5.3, ear: 'semi',   tail: 'plume',   fluff: true,  marking: 'patch'  },
  longdog:    { bodyW: 1.20, headRx: 5.9, headRy: 4.9, ear: 'long',   tail: 'straight', legLen: 0.50, snoutRx: 3.9, snoutRy: 2.6, marking: 'solid' },
  brachy:     { bodyW: 1.16, headRx: 7.0, headRy: 5.8, ear: 'rose',   tail: 'curl',    snoutRx: 2.6, snoutRy: 2.0, snoutY: 11.2, snoutDark: true, eyeRx: 2.3, eyeRy: 2.4, marking: 'solid' },
  labrador:   { bodyW: 1.12, headRx: 6.7, headRy: 5.5, ear: 'floppy', tail: 'straight', marking: 'solid' },
  poodle:     { bodyW: 1.02, headRx: 6.3, headRy: 5.4, ear: 'round',  tail: 'plume',   fluff: true,  marking: 'curly'  },
  merledog:   { bodyW: 1.06, headRx: 6.5, headRy: 5.4, ear: 'floppy', tail: 'plume',   fluff: true,  marking: 'merle'  },
  toy:        { bodyW: 0.82, headRx: 6.0, headRy: 5.4, ear: 'big',    tail: 'curl',    snoutRx: 2.7, snoutRy: 2.3, eyeRx: 2.3, eyeRy: 2.4, marking: 'solid' },
};

//  Lab
const DOG_PATTERN_BUILD = ['labrador'];

// Tail shape per breed, read by the renderer's drawDogTail.
const DOG_TAILS = DOG_PATTERN_BUILD.map((b) => DOG_BUILDS[b].tail || 'straight');

// Node-only: hand in cat-sprite.js's primitives, since a CommonJS module has no
// access to the browser's shared global script scope.
function attach(prims) { P = prims; }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    attach, composeSitDog, composeBowDog, composeTypeDog, composeCurlDog, composeBegDog,
    composePawUpDog, applyMarking, DOG_PATTERNS, DOG_BUILDS, DOG_PATTERN_BUILD, DOG_TAILS,
  };
}
