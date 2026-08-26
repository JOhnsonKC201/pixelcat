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

// ---- the front-facing face --------------------------------------------------
// sit, type and beg all wear the SAME face. It used to be typed out three times
// over, which is exactly why the eye offsets had already drifted apart between
// them; one helper means a change to the face lands on every pose at once.
//
// The proportions here are deliberate kindchenschema (baby schema), because that -
// not anatomical accuracy - is what makes a 24-cell sprite lovable:
//   * eyes LARGE, and set LOW on the skull instead of on its midline
//   * eyes WIDE apart, which leaves a tall round forehead above them
//   * muzzle SHORT and broad - it still breaks the skull line (that is the dog
//     cue) but reads as a stubby puppy snout rather than a working snout
// None of that inflates the SKULL, which stays small on purpose - see the note in
// composeSitDog about why a big round skull turns a pixel quadruped into a teddy.
//   o = { cx, headY, headRx, headRy, snoutY }
function dogFace(B, o) {
  const { ellipse } = _c();
  const { cx, headY, headRx, headRy, snoutY } = o;
  const eRx = B.eyeRx || 2.0, eRy = B.eyeRy || 2.2;
  const snoutRx = B.snoutRx || 3.5, snoutRy = B.snoutRy || 2.2;

  // --- THE SNOUT: the single most important dog cue -------------------------
  // Drawn after the skull, centred low enough that its lower arc breaks the
  // skull's silhouette. carveJaw() then traces a jaw line around it at the end of
  // the pose, which is what actually sells the protrusion at 4px/cell.
  ellipse(cx, snoutY, snoutRx, snoutRy, 'W');
  if (B.snoutDark) ellipse(cx, snoutY - snoutRy * 0.18, snoutRx * 0.95, snoutRy * 0.80, 'K');   // muzzle mask (shepherd/husky/pug)

  // nose: big, dark, and parked at the TIP of the snout, not up on the face. Kept
  // nearly round rather than a wide bar - an oversized rounded nose is itself a
  // baby-schema cue, and the bar version read as a moustache.
  ellipse(cx, snoutY - snoutRy * 0.34, 1.5, 1.2, 'N');

  // --- eyes ----------------------------------------------------------------
  // Bigger than they were. The old note here said big eyes read as kitten rather
  // than canine - true of big eyes on a big round skull, but on a SMALL skull with
  // a short muzzle they read as puppy, which is the whole point. The renderer
  // stamps a dark pupil and a sparkle inside whatever box these leave behind, so
  // growing the iris grows the pupil with it.
  const eyeY = headY + headRy * 0.10;
  // As wide apart as the skull allows, held inside two hard limits: an eye must
  // not reach the grid's centre column (eyeBox() splits the sprite there to tell
  // left eye from right, so an eye touching it registers as the wrong one), and it
  // must stay clear of the ear seam carveEars() traces down the cheek.
  const eyeOff = Math.max(eRx + 0.4, Math.min(eRx + 1.5, headRx - eRx - 1.2));
  ellipse(cx - eyeOff, eyeY, eRx, eRy, 'E');
  ellipse(cx + eyeOff, eyeY, eRx, eRy, 'E');
  // tan "eyebrow" pips - a strong breed cue on shepherds, beagles, rotties
  if (B.brows) {
    ellipse(cx - eyeOff, eyeY - eRy - 1.1, 1.3, 0.9, 'X');
    ellipse(cx + eyeOff, eyeY - eRy - 1.1, 1.3, 0.9, 'X');
  }
}

// ---- ears -------------------------------------------------------------------
// Hanging ears are drawn BEFORE the skull so they read as attached behind it.
// Shape matters more than size: this used to be one long slab per side running
// from the crown to below the jaw, which widened the head all the way up and made
// every drop-eared breed read as a lamb in a bonnet. A real drop ear is a
// TEARDROP - a narrow root at the temple, a fat lobe swinging free below the cheek
// - and drawing it that way is what leaves the crown bare, which is where the tall
// round puppy forehead comes from.
//   o = { cx, headY, headRx, headRy }
function hangEars(B, o) {
  const { ellipse } = _c();
  const ear = B.ear || 'floppy';
  if (ear !== 'floppy' && ear !== 'long' && ear !== 'round') return;
  const { cx, headY, headRx, headRy } = o;
  const drop = ear === 'long' ? 2.6 : ear === 'round' ? 0.9 : 1.6;   // how far past the jaw the lobe swings
  const lobe = ear === 'round' ? 2.9 : ear === 'long' ? 2.3 : 2.6;   // poodle ears are pompoms, hound ears are straps
  for (const s of [-1, 1]) {
    ellipse(cx + s * (headRx - 1.6), headY + headRy * 0.20, 2.0, headRy * 0.70, 'K');            // root, tucked behind the temple
    ellipse(cx + s * (headRx - 0.7), headY + headRy * 0.74 + drop, lobe, lobe * 0.94, 'K');      // lobe, hanging clear of the jaw
  }
}

// Perked and rose ears sit ON TOP of the skull, so they are drawn after it.
//   o = { cx, headY, headRx, headRy, apex }   apex = grid row the tips reach
function perkEars(B, o) {
  const { ellipse, triangle } = _c();
  const ear = B.ear || 'floppy';
  const { cx, headY, headRx, headRy } = o;
  // rose ear (pug/bulldog): a small folded nub tucked high on the skull
  if (ear === 'rose') {
    for (const s of [-1, 1]) ellipse(cx + s * (headRx - 1.0), headY - headRy * 0.62, 1.9, 2.0, 'K');
    return;
  }
  if (ear !== 'perk' && ear !== 'semi' && ear !== 'big') return;
  // Dog perk-ears are broader at the base and blunter than a cat's needle. The
  // apex is clamped to row 0.4 by the caller for the same reason the cat's ears
  // were: outlineHalo() cannot write above row 0, so a tip drawn off the top of
  // the grid comes back sliced flat AND with no outline on it.
  // Set OUT on the skull as a fraction of its width, not at a fixed column: a
  // fixed offset put the small-headed breeds' ears entirely inside the silhouette,
  // where they read as markings rather than as ears.
  const ew = ear === 'big' ? 3.0 : 2.6, eo = headRx * (ear === 'big' ? 0.70 : 0.62);
  const apex = o.apex + (ear === 'big' ? 0 : ear === 'semi' ? 1.3 : 0.5);
  const base = headY - headRy * 0.28;
  for (const s of [-1, 1]) {
    triangle(cx + s * (eo + 0.6), apex, cx + s * (eo + ew), base + 1.9, cx + s * (eo - ew), base, 'K');
    ellipse(cx + s * (eo + 0.6), apex + 1.0, 1.3, 1.2, 'K');     // blunt the tip - a needle tip is a cat
    const iw = ew * 0.5;
    triangle(cx + s * (eo + 0.4), apex + 2.2, cx + s * (eo + iw), base + 1.2, cx + s * (eo - iw), base + 0.3, 'I');
    // semi-perk (collie / shiba): the top third folds forward over itself
    if (ear === 'semi') ellipse(cx + s * (eo + 0.3), apex + 1.1, 1.8, 1.4, 'K');
  }
}

// Seam a hanging ear off the cheek. On a solid coat the flap and the skull are the
// same colour, so nothing DRAWN survives - only a carved gap the halo can trace.
// The seam follows the skull's own elliptical edge rather than running down a
// straight column: a column only lines up with the head at one row, and the old
// one was parked far enough inboard that it sliced a cell off each eye. Starting
// it above the eyes is safe precisely because the skull is at its widest there.
function carveEars(B, o) {
  const { setCell } = _c();
  const ear = B.ear || 'floppy';
  if (ear !== 'floppy' && ear !== 'long' && ear !== 'round') return;
  const { cx, headY, headRx, headRy } = o;
  const top = Math.round(headY - headRy * 0.55), bot = Math.round(headY + headRy * 0.72);
  for (let r = top; r <= bot; r++) {
    const dy = (r - headY) / headRy;
    if (Math.abs(dy) >= 1) continue;
    const half = headRx * Math.sqrt(1 - dy * dy);
    setCell(Math.round(cx - half), r, '.');
    setCell(Math.round(cx + half), r, '.');
  }
}

// ---- sitting dog ------------------------------------------------------------
// Parametric like composeSit: a build descriptor B varies the silhouette so each
// breed is a different DOG, not a palette swap.
//   B = { bodyW, headRx, headRy, snoutRx, snoutRy, snoutY, ear, legLen,
//         eyeRx, eyeRy, brows, fluff, marking }
function composeSitDog(B) {
  const { setCell, ellipse } = _c();
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  // Head still deliberately SMALLER than the cat's. An oversized round skull is
  // what makes a small pixel quadruped read as a meerkat or a teddy, and that has
  // not stopped being true just because the brief asked for a cuter dog. The puppy
  // proportion is bought two other ways instead: inside the head (see dogFace) and
  // by trimming the BODY - a narrower chest and stubbier legs move the head-to-body
  // ratio the cute way round without the skull ever growing enough to read as a bear.
  const headRx = B.headRx || 5.6, headRy = B.headRy || 4.7;
  const headY = 6.8;
  const snoutRx = B.snoutRx || 3.5, snoutRy = B.snoutRy || 2.2;
  const snoutY = B.snoutY == null ? 11.0 : B.snoutY;
  const legLen = B.legLen == null ? 1 : B.legLen;
  const fluff = !!B.fluff;
  const head = { cx: CX, headY, headRx, headRy };

  // --- body: rump, then a BROAD chest, then a neck ---------------------------
  // The chest is the tell. A cat's sitting silhouette tapers to a narrow front;
  // a dog's flares out. The neck sits LOW so it never swallows the muzzle - that
  // was what flattened the face into a cat's in the first pass.
  ellipse(CX, 25.8, 7.2 * bw, 4.3, 'C');                       // haunch / seated rump
  ellipse(CX, 20.4, 5.4 * bw, 6.0, 'C');                       // chest (still flared, but trimmed: see the head note)
  ellipse(CX, 15.4, 3.5 * bw, 3.0, 'C');                       // neck
  if (fluff) { ellipse(CX - 4.9 * bw, 18.2, 2.2, 3.2, 'C'); ellipse(CX + 4.9 * bw, 18.2, 2.2, 3.2, 'C'); }  // shoulder floof

  hangEars(B, head);
  ellipse(CX, headY, headRx, headRy, 'C');                     // skull
  perkEars(B, { ...head, apex: 0.4 });
  dogFace(B, { ...head, snoutY });

  // --- front legs + paws ----------------------------------------------------
  // Short and stubby on purpose - stumpy limbs are a baby-schema cue, and a
  // shorter column leaves more of the sprite to the head. legLen shrinks them
  // further for the dwarf breeds (corgi, dachshund), where short legs are the
  // whole point of the silhouette rather than a recolour.
  const pawY = 28.4;
  const legRy = 4.3 * legLen, legCy = pawY - legRy * 0.80;
  ellipse(CX - 2.6, legCy, 1.9, legRy, 'C');
  ellipse(CX + 2.6, legCy, 1.9, legRy, 'C');
  ellipse(CX - 2.6, pawY, 2.3, 1.8, 'W', ['C']);
  ellipse(CX + 2.6, pawY, 2.3, 1.8, 'W', ['C']);

  // --- chest blaze ----------------------------------------------------------
  // Most dogs carry a lighter bib; on solid coats white==coat so this is a no-op.
  ellipse(CX, 21.0, fluff ? 3.0 : 2.4, 4.6, 'W', ['C']);

  applyMarking(B.marking, { cx: CX, top: 14.4, bot: 29.0, w: 6.2 * bw, headY, headRx });

  // --- carve separations LAST so the halo traces them on every coat ----------
  // This is the only way internal edges survive on solid blacks, where every
  // drawn line is the same colour as the coat.
  carveJaw(CX, snoutY, snoutRx, snoutRy, true);
  carveEars(B, head);
  for (let r = 22; r <= 29; r++) setCell(CX, r, '.');                                  // between the front legs
  for (let r = 24; r <= 29; r++) { setCell(CX - 5, r, '.'); setCell(CX + 5, r, '.'); }  // leg vs haunch
  setCell(CX - 2, 29, '.'); setCell(CX + 2, 29, '.');                                   // toe splits
}

// Trace the underside of the muzzle so it reads as a volume standing proud of the
// skull rather than a paler patch painted on a flat face. Used by every pose.
// `smile` adds the mouth, which only the front-facing poses want - and adding it
// HERE rather than while drawing the face means it is carved after applyMarking,
// so a solid breed marking can no longer bury it.
//
// The mouth is three cells on ONE row, tucked directly under the nose. It used to
// be five cells across two rows, and the lower row landed inside this jaw arc - the
// arc's ends rise as they wrap the muzzle, so the two carves sandwiched single
// muzzle cells between them and the leftovers read, unmistakably, as a mouthful of
// TEETH on every light coat. One row above the arc's reach is the only clean place
// a mouth fits on a muzzle this short.
function carveJaw(cx, sy, srx, sry, smile) {
  const { setCell } = _c();
  const wide = Math.round(srx + 0.4);
  for (let dc = -wide; dc <= wide; dc++) {
    const t = dc / (wide || 1);
    const r = Math.round(sy + sry * Math.sqrt(Math.max(0, 1 - t * t)) + 0.9);
    setCell(cx + dc, r, '.');
  }
  if (!smile) return;
  const my = Math.round(sy - sry * 0.34 + 1.5);
  for (let dc = -1; dc <= 1; dc++) setCell(cx + dc, my, '.');
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
  const { ellipse } = _c();
  B = B || {};
  const CX = 12;
  const headRx = B.headRx || 5.5, headRy = B.headRy || 4.6;
  const headY = 6.4;
  const snoutRx = B.snoutRx || 3.5, snoutRy = B.snoutRy || 2.2;
  const snoutY = B.snoutY == null ? 10.6 : B.snoutY - 0.4;
  const head = { cx: CX, headY, headRx, headRy };
  // The renderer paints the keys and the kneading paws over this, so the sprite is
  // just head + a chest spread wide across the desk edge.
  ellipse(CX, 18.6, 7.2, 5.2, 'C');               // chest, flattened onto the desk
  ellipse(CX, 14.2, 3.6, 3.0, 'C');               // neck
  hangEars(B, head);
  ellipse(CX, headY, headRx, headRy, 'C');
  perkEars(B, { ...head, apex: 0.4 });
  dogFace(B, { ...head, snoutY });                // snout hangs over the keys
  ellipse(CX, 19.0, 2.6, 4.0, 'W', ['C']);        // chest blaze
  applyMarking(B.marking, { cx: CX, top: 13.5, bot: 23.5, w: 6.6, headY, headRx });
  carveJaw(CX, snoutY, snoutRx, snoutRy, true);
  carveEars(B, head);
}

// ---- curled dog (the loaf answer): nose-to-tail donut ------------------------
// Cats loaf into a brick. Dogs curl into a spiral, and the read has to survive at
// 24x30 cells on a solid black coat, where nothing DRAWN separates one volume from
// the next. The old pass had the right ingredients - body, hip, head, tail arc -
// and still came out an amorphous lump, for three reasons worth writing down:
//
//   1. every mass sat at the same height, so the back never arched ABOVE anything
//      and the silhouette was one flat oval;
//   2. the tail swept the entire lower half of the coil at a constant width, so it
//      stopped being a tail and simply became the body's own outline;
//   3. the head was a circle inside that oval with nothing carved between it and
//      the shoulder, and the eye was a lone dot on a flank-coloured field.
//
// So this version stacks the masses instead of spreading them: a high rump, a back
// that arcs clearly over a head DROPPED low and forward, a tail that tapers as it
// wraps round the front, and the nose coming to rest on the tail tip. That
// nose-to-tail closure is the whole reason a curled dog reads as asleep rather than
// as a bag of fur. The shut eye is carved as a CURVE, not dotted - at this size a
// dot is a pupil, and only a line says "closed".
function composeCurlDog(B) {
  const { setCell, ellipse, triangle } = _c();
  B = B || {};
  const bw = B.bodyW || 1;
  const ear = B.ear || 'floppy';
  const BX = 10.0, BY = 20.2, BRX = 7.0 * bw, BRY = 5.2;   // the coiled body
  const HX = 17.4, HY = 22.2, HRX = 4.3, HRY = 4.1;        // head: RIGHT, and dropped LOW under the backline

  // --- the tail, drawn FIRST so the body covers all but its outer edge ---------
  // A tail the same colour as the coat can only read two ways at 4px per cell: as a
  // bulge in the silhouette, or from behind a carved gap. This one uses the
  // silhouette, and deliberately NOT the gap: drawn BEHIND the body, the only part
  // of it that survives is the part hanging below the belly, and a silhouette bulge
  // gets outlined by the halo for free. Carving it free instead was tried twice and
  // is worse both ways - a full-length seam sweeps one long smiling curve across a
  // blank flank (a grin the dog did not ask for), and a short seam over just the
  // front half lands as a row of disconnected dots. The body ellipse is held clear
  // of the floor so this bulge has somewhere to show; the pale tip does the rest.
  const TAIL = [[2.8, 25.0, 2.00], [4.1, 25.8, 1.95], [5.4, 26.4, 1.90], [6.8, 26.9, 1.85],
    [8.2, 27.2, 1.80], [9.6, 27.3, 1.70], [11.0, 27.3, 1.60], [12.3, 27.0, 1.48], [13.4, 26.5, 1.35]];
  for (const [c, r, w] of TAIL) ellipse(c, r, w, w * 0.88, 'C');
  const tip = TAIL[TAIL.length - 1];
  ellipse(tip[0], tip[1] + 0.3, 1.2, 1.0, 'W', ['C']);     // pale tail tip, come to rest under the chin

  // --- the coil ---------------------------------------------------------------
  // Three stacked heights, not one flat oval: the rump rides highest on the left,
  // the back falls away to the right, and the head tucks in beneath it. The head
  // also has to project past the body's own right edge or it is not a head, it is a
  // bulge - that is what HX + HRX buys over BX + BRX. The body stops short of the
  // floor on purpose; the floor belongs to the tail.
  ellipse(6.2, 18.9, 4.9 * bw, 4.6, 'C');          // rump, hiked above the backline
  ellipse(BX, BY, BRX, BRY, 'C');                  // curled body
  ellipse(HX, HY, HRX, HRY, 'C');                  // head, laid down and tucked forward

  // ear: hangs off the side of the skull and pools on the floor, which is what a
  // sleeping dog's ear actually does - and what stops the head reading as a ball
  if (ear === 'floppy' || ear === 'long' || ear === 'round') {
    ellipse(HX + 2.9, HY + 1.8, 2.2, ear === 'long' ? 3.2 : 2.7, 'K');
  } else {
    triangle(HX + 3.4, HY - 6.2, HX + 1.0, HY - 2.2, HX + 4.8, HY - 1.4, 'K');   // even a perked ear folds back in sleep
  }

  // Face features are painted AFTER applyMarking - in this pose the coiled body
  // sits at the same rows as the head, so a solid marking (beagle tricolour) would
  // otherwise bury the eye.
  applyMarking(B.marking, { cx: BX, top: 15.0, bot: 25.0, w: 7.0 * bw, headY: HY, headRx: HRX });

  const SX = 14.8, SY = 24.3, SRX = 2.5, SRY = 1.7;// muzzle, laid flat and pointing back into the coil
  ellipse(SX, SY, SRX, SRY, 'W');
  ellipse(SX + 2.6, SY + 1.8, 2.0, 1.2, 'W', ['C']);   // a scrap of pale chest under the chin
  ellipse(SX - 1.8, SY, 1.4, 1.1, 'N');            // nose at the tip, a whisker from the tail tip

  // --- carve the separations LAST, so the halo traces them on every coat -------
  carveJaw(SX, SY, SRX, SRY);
  // Seam the head off the shoulder along the head's OWN edge, stopping above the
  // muzzle. A straight column only lines up with a circle at one row; following the
  // arc is what makes the head read as a separate ball resting against the body
  // rather than as a bulge in it. It also runs near-vertically, which matters: the
  // only other carve this pose ever carried was a long horizontal one across the
  // flank, and a lone horizontal curve on a blank field reads as a grin.
  for (let r = Math.round(HY - HRY); r <= Math.round(HY); r++) {
    const dy = (r - HY) / HRY;
    if (Math.abs(dy) >= 1) continue;
    setCell(Math.round(HX - HRX * Math.sqrt(1 - dy * dy)), r, '.');
  }
  // --- the closed eye ---------------------------------------------------------
  // Two things happen here and they reinforce each other. The 'E' slit gives
  // eyeBox() something to find, so the renderer strokes its own closed-lid arc over
  // this spot while the pet is loafing; the carved curve means the shut eye still
  // reads everywhere the raw grid is painted with no lid drawn over it at all - the
  // contact sheet, the settings preview, the tray icon. A dot cannot do that job: at
  // this size a dot is a pupil, and only a line says "closed".
  const EX = 17.6, EY = 21.0;
  ellipse(EX, EY, 1.9, 0.7, 'E');
  for (const [dc, dr] of [[-2, 0], [-1, 1], [0, 1], [1, 1], [2, 0]]) setCell(Math.round(EX) + dc, Math.round(EY) + dr, '.');
}

// ---- begging dog (the rear-up answer) ---------------------------------------
// Up on the haunches with both front paws dangling at the chest. Cats bat at
// things overhead; dogs BEG, so the paws hang loose rather than reaching.
function composeBegDog(B) {
  const { setCell, ellipse } = _c();
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  const headRx = B.headRx || 5.4, headRy = B.headRy || 4.6;
  const headY = 5.6;
  const snoutRx = B.snoutRx || 3.5, snoutRy = B.snoutRy || 2.2;
  const snoutY = B.snoutY == null ? 9.8 : B.snoutY - 1.3;
  const head = { cx: CX, headY, headRx, headRy };
  ellipse(CX, 26.4, 6.8 * bw, 3.6, 'C');          // seated base
  ellipse(CX, 19.4, 4.9 * bw, 7.4, 'C');          // torso stretched tall
  ellipse(CX, 13.4, 3.5, 3.0, 'C');               // neck, extended upward
  hangEars(B, head);
  ellipse(CX, headY, headRx, headRy, 'C');
  // The reared body already fills this grid to its top row, so the ear tips get less
  // headroom here than in the seated pose - hence the lower apex.
  perkEars(B, { ...head, apex: 0.4 });
  dogFace(B, { ...head, snoutY });                // snout tipped up, hopeful
  // dangling front paws held close to the chest, wrists limp - the beg tell
  ellipse(CX - 3.0, 17.0, 1.5, 2.8, 'C'); ellipse(CX - 3.4, 19.6, 1.9, 1.5, 'W', ['C']);
  ellipse(CX + 3.0, 17.4, 1.5, 2.8, 'C'); ellipse(CX + 3.4, 20.0, 1.9, 1.5, 'W', ['C']);
  ellipse(CX, 19.6, 2.3, 4.6, 'W', ['C']);        // chest blaze
  applyMarking(B.marking, { cx: CX, top: 13.0, bot: 29.0, w: 5.6 * bw, headY, headRx });
  carveJaw(CX, snoutY, snoutRx, snoutRy, true);
  carveEars(B, head);
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
