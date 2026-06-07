// ===== Desktop pixel cat: 12 patterns, mochi-drag, typing, hunt, purr ========
// Role-coded sprites recolored per pattern, on a full-screen click-through overlay.
// Roles:  . transparent  O outline  H white halo  C coat  K markings  W white
//         X patch (tortie/calico)   E eye   N nose   I inner-ear

const CELL = 5;
const canvas = document.getElementById('cat');
const ctx = canvas.getContext('2d');
const qp = new URLSearchParams(location.search);
const SHOT = qp.get('shot') === '1';
const SHEET = qp.get('sheet') === '1';   // contact-sheet QA mode (all poses x coats)
const FORCED_STATE = qp.get('state');
function resize() {
  if (SHEET) return;   // the contact sheet sizes its own canvas
  if (SHOT) { canvas.width = 260; canvas.height = 320; }
  else { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  ctx.imageSmoothingEnabled = false;
}
resize();
if (!SHOT && !SHEET) window.addEventListener('resize', resize);

// ---- sprite builder (writes to current target G/GC/GR) ----------------------
let G, GC, GR;
const inb = (c, r) => c >= 0 && c < GC && r >= 0 && r < GR;
function setCell(c, r, role) { if (inb(c, r)) G[r][c] = role; }
function ellipse(cx, cy, rx, ry, role, onlyOn) {
  for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) {
    for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1 && inb(c, r)) { if (!onlyOn || onlyOn.includes(G[r][c])) G[r][c] = role; }
    }
  }
}
function triangle(ax, ay, bx, by, cx2, cy2, role) {
  const minc = Math.floor(Math.min(ax, bx, cx2)), maxc = Math.ceil(Math.max(ax, bx, cx2));
  const minr = Math.floor(Math.min(ay, by, cy2)), maxr = Math.ceil(Math.max(ay, by, cy2));
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  for (let r = minr; r <= maxr; r++) for (let c = minc; c <= maxc; c++) {
    const d1 = sign(c, r, ax, ay, bx, by), d2 = sign(c, r, bx, by, cx2, cy2), d3 = sign(c, r, cx2, cy2, ax, ay);
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) setCell(c, r, role);
  }
}
function outlineHalo() {
  const solid = (c, r) => inb(c, r) && G[r][c] !== '.' && G[r][c] !== 'O' && G[r][c] !== 'H';
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) {
    if (G[r][c] !== '.') continue;
    if (solid(c - 1, r) || solid(c + 1, r) || solid(c, r - 1) || solid(c, r + 1)) G[r][c] = 'O';
  }
  const isO = (c, r) => inb(c, r) && G[r][c] === 'O';
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) {
    if (G[r][c] !== '.') continue;
    if (isO(c - 1, r) || isO(c + 1, r) || isO(c, r - 1) || isO(c, r + 1)) G[r][c] = 'H';
  }
}
function eyeBox(side) {
  let minC = 999, maxC = -1, minR = 999, maxR = -1;
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) {
    if (G[r][c] !== 'E') continue;
    if (side === 'L' ? c >= GC / 2 : c < GC / 2) continue;
    minC = Math.min(minC, c); maxC = Math.max(maxC, c); minR = Math.min(minR, r); maxR = Math.max(maxR, r);
  }
  return { cx: ((minC + maxC + 1) / 2) * CELL, cy: ((minR + maxR + 1) / 2) * CELL,
    w: (maxC - minC + 1) * CELL, h: (maxR - minR + 1) * CELL };
}
function muzzlePt() {
  let sx = 0, sy = 0, n = 0;
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) if (G[r][c] === 'N') { sx += c; sy += r; n++; }
  n = n || 1; return { x: (sx / n + 0.5) * CELL, y: (sy / n + 0.5) * CELL };
}
function buildSprite(cols, rows, compose) {
  G = Array.from({ length: rows }, () => Array(cols).fill('.')); GC = cols; GR = rows;
  compose();
  outlineHalo();
  return { grid: G, COLS: cols, ROWS: rows, SW: cols * CELL, SH: rows * CELL,
    eyes: [eyeBox('L'), eyeBox('R')], muzzle: muzzlePt() };
}

// --- sitting cat (upright, two planted paws) --------------------------------
// Parametric: a build descriptor B varies the silhouette (body width, head/ear
// size, eye shape, fluff) so different coats are different breeds, not recolours.
//   B = { bodyW, headRx, headRy, earApexY, earHalf, eyeRx, eyeRy, cheek, fluff }
function composeSit(B) {
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  const headRx = B.headRx || 6.3, headRy = B.headRy || 5.8;
  const earY = B.earApexY == null ? 1 : B.earApexY, ew = B.earW || 2.4, eo = B.earOut || 4;
  const eRx = B.eyeRx || 2, eRy = B.eyeRy || 2.4, fluff = !!B.fluff, cheek = B.cheek || 0;
  // body: wide lower haunch (gives a sitting base), mid body, head
  ellipse(CX, 24, 7.6 * bw, 5 + (fluff ? 0.4 : 0), 'C');
  ellipse(CX, 16, 5.2 * bw, 7.5, 'C');
  ellipse(CX, 8, headRx, headRy, 'C');
  if (cheek) { ellipse(CX - headRx * 0.7, 9.6, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6, 1.7, 2.2, 'C'); }
  if (fluff) { ellipse(5.4, 10.4, 1.9, 2.4, 'C'); ellipse(18.6, 10.4, 1.9, 2.4, 'C'); } // cheek ruff
  // ears — proper cat triangles on top of the head, slight outward tilt
  triangle(CX - eo - 0.5, earY, CX - eo - ew, 7.6, CX - eo + ew, 6.4, 'K');
  triangle(CX + eo + 0.5, earY, CX + eo + ew, 7.6, CX + eo - ew, 6.4, 'K');
  const iw = ew * 0.55;
  triangle(CX - eo - 0.3, earY + 2, CX - eo - iw, 7.2, CX - eo + iw, 6.6, 'I');
  triangle(CX + eo + 0.3, earY + 2, CX + eo + iw, 7.2, CX + eo - iw, 6.6, 'I');
  if (fluff) { ellipse(CX - eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); ellipse(CX + eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); } // ear tufts
  // muzzle + chest (fuller chest when fluffy)
  ellipse(CX, 12, 3, 2, 'W', ['C']); ellipse(CX, 17, fluff ? 3.4 : 2.7, 7, 'W', ['C']);
  // two front legs (narrow columns down the front) + planted paws
  ellipse(10, 23, 1.6, 5.2, 'C'); ellipse(14, 23, 1.6, 5.2, 'C');
  ellipse(10, 27.4, 2, 1.7, 'W', ['C']); ellipse(14, 27.4, 2, 1.7, 'W', ['C']);
  // eyes + nose
  ellipse(9, 8.2, eRx, eRy, 'E'); ellipse(15, 8.2, eRx, eRy, 'E');
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  // tabby markings ONLY on real tabbies (stripes look wrong on calico/solid coats)
  if (B.tabby) {
    [[11, 6], [12, 7], [13, 6]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); }); // forehead M
    for (let r = 0; r < GR; r++) for (let c = 17; c < GC; c++) if (G[r][c] === 'C' && r % 2 === 0) G[r][c] = 'K';
    [8, 10, 14, 16].forEach((sc) => { for (let r = 13; r < 26; r += 2) { if (G[r][sc] === 'C') setCell(sc, r, 'K'); } });
  }
  // tortie/calico colour patches (invisible on coats where patch == coat)
  ellipse(8, 19, 2.2, 3, 'X', ['C', 'K']); ellipse(15, 23, 2.2, 2.3, 'X', ['C', 'K']);
  // carve sitting-leg outlines LAST so the halo draws them on ANY colour: a gap
  // between the two front legs, and one between each leg and the outer haunch —
  // so the silhouette reads as two front paws flanked by the back legs.
  for (let r = 19; r <= 28; r++) setCell(12, r, '.');                          // between the front legs
  for (let r = 22; r <= 28; r++) { setCell(8, r, '.'); setCell(16, r, '.'); }  // each front leg vs haunch
}

// --- hunting crouch (front-facing, low & wide, ears back) -------------------
function composeHunt() {
  const CX = 15;
  ellipse(CX, 12, 11, 5.4, 'C');         // wide low body
  ellipse(CX, 8, 6.2, 5, 'C');           // head, front-centre
  // flattened ears angled outward (pinned-back hunting look)
  triangle(9, 4, 6, 8, 13, 7, 'K'); triangle(21, 4, 17, 7, 24, 8, 'K');
  triangle(9, 5, 8, 8, 12, 7, 'I'); triangle(21, 5, 18, 7, 22, 8, 'I');
  // tail flicked low to the right
  [[26, 13], [27, 11]].forEach(([c, r]) => ellipse(c, r, 1.6, 1.6, 'C'));
  // white muzzle, low chest, two tucked front paws, tail tip
  ellipse(CX, 12, 2.6, 1.7, 'W', ['C']);
  ellipse(CX, 15, 3.2, 2.4, 'W', ['C']);
  ellipse(13, 17, 1.8, 1.5, 'W', ['C']); ellipse(17, 17, 1.8, 1.5, 'W', ['C']);
  ellipse(27, 11, 1.2, 1.2, 'W', ['C']);
  // big locked eyes + nose
  ellipse(12, 8, 2.2, 2.4, 'E'); ellipse(18, 8, 2.2, 2.4, 'E');
  setCell(15, 11, 'N'); setCell(14, 11, 'N');
  // markings: forehead hint + body bands + patches
  [[13, 5], [14, 6], [15, 5], [16, 6], [17, 5]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); });
  for (let r = 10; r < 16; r += 2) for (let c = 4; c < GC; c++) if (G[r][c] === 'C' && c % 2 === 0) G[r][c] = 'K';
  ellipse(9, 12, 2.4, 2.4, 'X', ['C', 'K']); ellipse(21, 13, 2.2, 2.2, 'X', ['C', 'K']);
}

// --- typing "keyboard cat": a wide, low cat sprawled belly-down, head up and
//     alert, both forepaws stretched forward onto the keys. Grid 34x18. Normal
//     sparkly eyes (drawCat draws them) — no overlay. The keyboard + animated
//     key presses + chaos glyphs are added in renderTypeSprawl.
function composeTypeSprawl(B) {
  B = B || {};
  const fluff = !!B.fluff;
  ellipse(17, 12.8, 12.5, 4.4, 'C');                       // long low sprawled body
  ellipse(8.5, 12, 3.6, 3.8, 'C'); ellipse(25.5, 12, 3.6, 3.8, 'C');  // haunches
  ellipse(17, 7.2, 6, 5.4, 'C');                           // raised head, centre
  triangle(12.5, 0.6, 10, 5.6, 15, 5.2, 'K'); triangle(21.5, 0.6, 19, 5.2, 24, 5.6, 'K');
  triangle(12.6, 2.4, 11, 5.4, 14, 5.2, 'I'); triangle(21.4, 2.4, 20, 5.2, 23, 5.4, 'I');
  if (fluff) { ellipse(11, 5, 0.9, 1.4, 'W', ['C', 'K']); ellipse(23, 5, 0.9, 1.4, 'W', ['C', 'K']); }
  ellipse(14.5, 7.4, 2, 2.2, 'E'); ellipse(19.5, 7.4, 2, 2.2, 'E');   // eyes
  ellipse(17, 10.2, 2.3, 1.6, 'W', ['C']); setCell(17, 10, 'N'); setCell(16, 10, 'N');
  ellipse(17, 13, 2.6, 2.4, 'W', ['C']);                   // white chest
  ellipse(13, 15.6, 2.3, 1.7, 'W', ['C']); ellipse(21, 15.6, 2.3, 1.7, 'W', ['C']);  // forepaws
  [[29, 10.5], [31, 8.5], [30.5, 6]].forEach(([c, r]) => ellipse(c, r, 1.4, 1.4, 'C'));  // tail
  ellipse(30.5, 6, 1.0, 1.0, 'W', ['C']);
  if (B.tabby) {
    [[15, 2.8], [17, 2.4], [19, 2.8]].forEach(([c, r]) => { const rr = Math.round(r), cc = Math.round(c); if (G[rr] && G[rr][cc] === 'C') setCell(cc, rr, 'K'); });
    for (let r = 11; r < 15; r += 2) for (let c = 6; c < 29; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
  }
  ellipse(11, 13, 2.2, 2.0, 'X', ['C', 'K']); ellipse(23, 13, 2.2, 2.0, 'X', ['C', 'K']);
}

// --- sleeping curl: a tight ROUND ball with the tail wrapped over the face ----
// Round body silhouette, head tucked low-left, tail sweeping around the front to
// rest by the nose. Eyes are closed (drawn as an adaptive arc in the sleep branch
// + sheet so they read on any coat); 'E' marks the spot but renders as coat.
function composeSleepCurl() {
  ellipse(13, 11, 9.6, 8, 'C');                          // round curled body
  ellipse(6.6, 13.6, 4.5, 3.9, 'C');                     // head tucked low at the front-left
  // folded ears on top of the tucked head
  triangle(3.6, 10.6, 2.3, 13.2, 5.5, 12.7, 'K');
  triangle(8.4, 10.4, 7.0, 13.0, 10.0, 12.8, 'K');
  triangle(3.8, 11.2, 3.0, 12.9, 4.9, 12.6, 'I');
  triangle(8.3, 11.0, 7.5, 12.7, 9.2, 12.6, 'I');
  // tail: from the back-right, around the bottom, curling up the front to the nose
  0; /* wrapped tail drawn dynamically */
  0;              // tail tip resting by the face
  ellipse(5.2, 15.2, 2.0, 1.5, 'W', ['C']);              // white chin / tucked paw
  ellipse(5.9, 13.3, 1.1, 0.9, 'E');                     // closed eye marker
  setCell(4, 14, 'N');                                   // nose
  ellipse(15, 11.5, 2.6, 2.4, 'X', ['C']);               // patch so tortie/calico read
}

const spriteHunt = buildSprite(30, 20, composeHunt);
const spriteSleep = buildSprite(24, 20, composeSleepCurl);
const SLW = spriteSleep.SW, SLH = spriteSleep.SH;        // sleeping-pose dims
const TW = 34 * CELL, TH = 18 * CELL;            // side keyboard-cat dims (per-coat sprites built below)
// Sit grid is always 24x30, so SW/SH and the mochi bands stay constant across the
// per-coat body builds (different shapes, same canvas). The sit sprites themselves
// are built per coat below, once PATTERNS + their builds are defined.
const SW = 24 * CELL, SH = 30 * CELL;            // sit dims (mochi uses these)
const HW = spriteHunt.SW, HH = spriteHunt.SH;    // hunt dims

// offscreen buffer big enough for either sprite
const oc = document.createElement('canvas');
oc.width = Math.max(SW, HW, TW); oc.height = Math.max(SH, HH, TH);
const octx = oc.getContext('2d'); octx.imageSmoothingEnabled = false;
const HEAD_SRC = 14 * CELL, FEET_SRC = 7 * CELL, MID_SRC = SH - HEAD_SRC - FEET_SRC;

// ---- coat patterns ----------------------------------------------------------
const PATTERNS = [
  { name: 'Orange Tabby', coat: '#e8943c', mark: '#b5641d', white: '#f7f1e6', patch: '#e8943c', eye: '#8bbf5a', nose: '#e0888f', inner: '#f0b6a0', outline: '#5a3514' },
  { name: 'Mackerel Tabby', coat: '#9aa3b0', mark: '#5c6470', white: '#f2f4f7', patch: '#9aa3b0', eye: '#9ccf6a', nose: '#e3a0a6', inner: '#f0c4c4', outline: '#2f343d' },
  { name: 'Brown Tabby', coat: '#a07d52', mark: '#5f4528', white: '#efe6d4', patch: '#a07d52', eye: '#c9a23c', nose: '#c98b85', inner: '#e6bda6', outline: '#352718' },
  { name: 'Siamese', coat: '#e8dcc4', mark: '#5a4636', white: '#f3ecdd', patch: '#e8dcc4', eye: '#6db4d6', nose: '#d6a3a8', inner: '#e3b9bd', outline: '#3a2f26' },
  { name: 'Tuxedo', coat: '#2b2d33', mark: '#2b2d33', white: '#f4f5f7', patch: '#2b2d33', eye: '#8bbf5a', nose: '#e6a6ac', inner: '#caa0a6', outline: '#141519' },
  { name: 'Black', coat: '#2b2d33', mark: '#212329', white: '#2b2d33', patch: '#2b2d33', eye: '#d8b13a', nose: '#b06b72', inner: '#6b4a52', outline: '#141519' },
  { name: 'Gray', coat: '#8b94a3', mark: '#8b94a3', white: '#8b94a3', patch: '#8b94a3', eye: '#c9a23c', nose: '#d99fa5', inner: '#e9c2c2', outline: '#2f343d' },
  { name: 'White', coat: '#f2f1ec', mark: '#f2f1ec', white: '#ffffff', patch: '#f2f1ec', eye: '#6db4d6', nose: '#f0b4ba', inner: '#f7d4d4', outline: '#9b948a' },
  { name: 'Cream', coat: '#ecd6ab', mark: '#ecd6ab', white: '#f7eed6', patch: '#ecd6ab', eye: '#c9a23c', nose: '#e2a7ab', inner: '#f2cbcb', outline: '#b59a6a' },
  { name: 'Tortoiseshell', coat: '#2b2d33', mark: '#1f2024', white: '#2b2d33', patch: '#c9762a', eye: '#c9a23c', nose: '#b06b72', inner: '#7a5560', outline: '#141519' },
  { name: 'Calico', coat: '#f3f1ec', mark: '#2b2d33', white: '#ffffff', patch: '#d6802f', eye: '#c9a23c', nose: '#d98f95', inner: '#f0cccc', outline: '#6f6a62' },
  { name: 'Slate', coat: '#8d97ac', mark: '#6f7892', white: '#8d97ac', patch: '#8d97ac', eye: '#ffffff', nose: '#ff9aa2', inner: '#ff9aa2', outline: '#2e323d' },
];

// Body-build archetypes — different breeds get different silhouettes:
//   slender = oriental (slim body, small head, tall narrow ears, almond eyes)
//   stocky  = british shorthair (chonky body, big round head, small ears, cheeks)
//   fluffy  = longhair/persian (broad body, cheek ruff, ear tufts, full chest)
//   standard = the original moggy shape
const BUILDS = {
  standard: { earApexY: 1, earW: 2.4, earOut: 4 },
  slender: { bodyW: 0.85, headRx: 5.7, headRy: 5.4, earApexY: -1, earW: 2.3, earOut: 4.2, eyeRx: 2.1, eyeRy: 2.0 },
  stocky: { bodyW: 1.16, headRx: 6.8, headRy: 6.0, earApexY: 1.4, earW: 2.7, earOut: 3.9, cheek: 1, eyeRx: 2.0, eyeRy: 2.2 },
  fluffy: { bodyW: 1.08, headRx: 6.4, headRy: 5.9, earApexY: 0.8, earW: 2.5, earOut: 4, fluff: true, eyeRx: 2.0, eyeRy: 2.3 },
};
//  Orange    Mackerel  Brown    Siamese   Tuxedo    Black     Gray     White    Cream    Tortie   Calico   Slate
const PATTERN_BUILD = ['standard', 'slender', 'fluffy', 'slender', 'standard', 'slender', 'stocky', 'fluffy', 'stocky', 'fluffy', 'fluffy', 'slender'];
const TABBY = [true, true, true, false, false, false, false, false, false, false, false, false]; // only Orange/Mackerel/Brown get stripes
const sprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 30, () => composeSit({ ...BUILDS[b], tabby: TABBY[i] })));
// each coat also gets its own typing (kneading) body, so every breed types differently
// one shared side "keyboard cat" shape, recoloured per coat (+ tabby stripes / fluffy tufts)
const typeSprites = PATTERN_BUILD.map((b, i) => buildSprite(34, 18, () => composeTypeSprawl({ tabby: TABBY[i], fluff: BUILDS[b].fluff })));
let patternIndex = Number(localStorage.getItem('pattern') || 0);
if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = 0;
const forcedPattern = qp.get('pattern');
if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }

// Custom coats: layer user-defined palettes (from themes.json, sent by main over
// IPC) on top of the 12 built-ins, building each one's sit + type sprites at
// runtime. Re-applied wholesale on every update so add/delete just work.
const BASE_PATTERNS = PATTERNS.length;
function applyThemes(list) {
  PATTERNS.length = BASE_PATTERNS; PATTERN_BUILD.length = BASE_PATTERNS; TABBY.length = BASE_PATTERNS;
  sprites.length = BASE_PATTERNS; typeSprites.length = BASE_PATTERNS;
  for (const th of (Array.isArray(list) ? list : [])) {
    if (!th || !th.name || !th.coat) continue;
    const build = BUILDS[th.build] ? th.build : 'standard';
    PATTERNS.push({ name: th.name, coat: th.coat, mark: th.mark || th.coat, white: th.white || th.coat,
      patch: th.patch || th.coat, eye: th.eye || '#8bbf5a', nose: th.nose || '#e0888f',
      inner: th.inner || '#f0b6a0', outline: th.outline || '#222831' });
    PATTERN_BUILD.push(build);
    TABBY.push(!!th.tabby);
    sprites.push(buildSprite(24, 30, () => composeSit({ ...BUILDS[build], tabby: !!th.tabby })));
    typeSprites.push(buildSprite(34, 18, () => composeTypeSprawl({ tabby: !!th.tabby, fluff: BUILDS[build].fluff })));
  }
  if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = 0;
  if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }
}

// ---- colour helpers ---------------------------------------------------------
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lerpHex(a, b, t) { const ca = hexToRgb(a), cb = hexToRgb(b), m = (i) => Math.round(ca[i] + (cb[i] - ca[i]) * t); return `rgb(${m(0)},${m(1)},${m(2)})`; }
function toRgb(s) { if (s[0] === '#') return hexToRgb(s); const m = s.match(/\d+/g); return [+m[0], +m[1], +m[2]]; }
function rgbStr(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }
function shadeStr(rgb, f) { const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(rgb[0])},${c(rgb[1])},${c(rgb[2])})`; }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HOT_BODY = '#d9534f', HOT_OUTLINE = '#7a1f1a', HALO = '#fbfdff';
const BODY = new Set(['C', 'K', 'W', 'X', 'I']);

// ---- draw the cat body into context g (local origin 0,0) -------------------
function drawCat(g, sp, t, palRGB, o) {
  const { bob = 0, blinking = false, look = { x: 0, y: 0 }, typing = false, eyeMode = 'open' } = o;
  const closed = blinking || eyeMode === 'happy';
  const grid = sp.grid, COLS = sp.COLS, ROWS = sp.ROWS;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = grid[r][c];
    if (ch === '.') continue;
    const base = ch === 'E' ? (closed ? palRGB.C : palRGB.E) : palRGB[ch];
    if (!base) continue;
    const f = BODY.has(ch) || (ch === 'E' && closed) ? 1.12 - (r / ROWS) * 0.34 : 1;
    g.fillStyle = f === 1 ? rgbStr(base) : shadeStr(base, f);
    g.fillRect(c * CELL, r * CELL + bob, CELL, CELL);
  }
  if (!typing) {
    g.strokeStyle = 'rgba(245,245,245,0.6)'; g.lineWidth = 1; g.lineCap = 'round';
    const my = sp.muzzle.y + bob, cl = sp.muzzle.x - 4.5 * CELL, cr = sp.muzzle.x + 4.5 * CELL;
    for (const [sx, dir] of [[cl, -1], [cr, 1]]) for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(sx, my + i * 3 - 2); g.lineTo(sx + dir * 13, my + i * 5 - 1); g.stroke();
    }
  }
  if (eyeMode === 'happy') {
    g.strokeStyle = rgbStr(palRGB.O); g.lineWidth = 2; g.lineCap = 'round';
    for (const e of sp.eyes) { g.beginPath(); g.arc(e.cx, e.cy + bob - 1, e.w * 0.5, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  } else if (!blinking) {
    const eLook = typing ? { x: look.x * 0.3, y: 0.85 } : look;
    for (const e of sp.eyes) {
      const pw = Math.max(4, Math.round(e.w * 0.46)), ph = Math.max(5, Math.round(e.h * 0.7));
      const cx = e.cx + eLook.x * (e.w * 0.15), cy = e.cy + eLook.y * (e.h * 0.15) + bob;
      const px = Math.round(cx - pw / 2), py = Math.round(cy - ph / 2);
      g.fillStyle = '#22242b';
      g.fillRect(px, py + 1, pw, ph - 2);          // tall body
      g.fillRect(px + 1, py, pw - 2, ph);          // rounded top/bottom -> oval-ish
      g.fillStyle = 'rgba(255,255,255,0.95)';
      g.fillRect(px + pw - 3, py + 1, 2, 2);        // bright sparkle (top-right)
      g.fillStyle = 'rgba(255,255,255,0.4)';
      g.fillRect(px + 1, py + ph - 3, 2, 2);        // soft glint (bottom-left)
    }
  }
}

function drawSteam(t, headCx, earTop) {
  for (let i = 0; i < 4; i++) {
    const ph = (((t + i * 240) % 960) / 960), x = Math.round(headCx + (i - 1.5) * 9), y = Math.round(earTop - 3 - ph * 12), h = Math.max(2, Math.round(5 - ph * 2));
    ctx.globalAlpha = (1 - ph) * 0.95; ctx.fillStyle = i % 2 === 0 ? '#ffd9de' : '#f4f0f2'; ctx.fillRect(x, y, 2, h);
  }
  const pph = ((t % 1100) / 1100); ctx.globalAlpha = (1 - pph) * 0.9; ctx.fillStyle = '#ffe2e6';
  const psz = Math.round(3 + pph * 3); ctx.fillRect(Math.round(headCx - psz / 2), Math.round(earTop - 6 - pph * 10), psz, psz);
  ctx.globalAlpha = 1;
}
function drawShadow(cx, cy, alpha, rx) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`; ctx.beginPath(); ctx.ellipse(cx, cy + 2, rx || 24, 5, 0, 0, Math.PI * 2); ctx.fill();
}
// A big keyboard key the cat presses; `lit` = currently pressed (top face brightens).
function drawKey(cx, topY, w, h, lit) {
  const x0 = Math.round(cx - w / 2), y = Math.round(topY);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.beginPath(); ctx.ellipse(cx, y + h + 4, w / 2 + 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#565c6a'; ctx.fillRect(x0, y + h - 3, w, 7);                  // front/side
  ctx.fillStyle = lit ? '#eef3ff' : '#c4c8cf'; ctx.fillRect(x0, y, w, h - 2);    // top face
  ctx.fillStyle = lit ? '#ffffff' : '#e2e5ea'; ctx.fillRect(x0 + 2, y, w - 4, 3); // highlight
  ctx.fillStyle = '#3a3f48';
  ctx.fillRect(x0 - 1, y, 1, h + 4); ctx.fillRect(x0 + w, y, 1, h + 4); ctx.fillRect(x0, y - 1, w, 1);
}
// Cat-chaos keystrokes that pop up from a pressed key (pure paw mash, no words).
const KB_KEYS = 'asdf jkl;gh'.split('');
function catGlyph() {
  const k = KB_KEYS[Math.floor(Math.random() * KB_KEYS.length)] || 'f';
  return Math.random() < 0.35 ? k.repeat(2 + Math.floor(Math.random() * 3)) : k;  // sometimes a kneaded run
}


let lLast = false, rLast = false;
// "Keyboard cat" typing render: the sprawled cat on a little laptop keyboard,
// the two front keys under its paws pressing alternately; chaos letters float up.
function renderTypeSprawl(t, palRGB, pal, overheat, blinking, look) {
  const sp = overheat ? 42 : 80;
  const lp = Math.max(0, Math.sin(t / sp)), rp = Math.max(0, Math.sin(t / sp + Math.PI));
  const bob = Math.round(Math.sin(t / 260) * 1.0);
  const lift = 11;                                   // raise the cat so the keyboard shows below it
  const ox = Math.round(pos.x - TW / 2), oy = Math.round(pos.y - TH - lift);
  const kbW = 138, kbH = 17, kbX = Math.round(pos.x - kbW / 2), kbY = Math.round(pos.y - kbH);
  drawShadow(pos.x, pos.y + 2, 0.2, kbW / 2 + 8);
  ctx.fillStyle = '#23262e'; ctx.fillRect(kbX - 2, kbY + kbH - 5, kbW + 4, 7);       // front lip / base
  ctx.fillStyle = '#3a3f4b'; ctx.fillRect(kbX, kbY, kbW, kbH - 3);                    // deck
  ctx.fillStyle = '#4b515f'; ctx.fillRect(kbX + 2, kbY + 1, kbW - 4, 2);             // top highlight
  ctx.fillStyle = '#2b2f39';                                                          // suggested key dents
  for (let r = 0; r < 2; r++) for (let kx = kbX + 6; kx < kbX + kbW - 9; kx += 11) ctx.fillRect(kx, kbY + 3 + r * 5, 8, 3);
  const lcx = pos.x - 22, rcx = pos.x + 22, keyTop = kbY - 3;
  drawKey(lcx, keyTop + Math.round(lp * 3), 15, 9, lp > 0.7);
  drawKey(rcx, keyTop + Math.round(rp * 3), 15, 9, rp > 0.7);
  const typeSp = typeSprites[patternIndex];
  octx.clearRect(0, 0, oc.width, oc.height);
  drawCat(octx, typeSp, t, palRGB, { bob, blinking, look });
  ctx.drawImage(oc, 0, 0, TW, TH, ox, oy + bob, TW, TH);
  const lHigh = lp > 0.82, rHigh = rp > 0.82;
  if (lHigh && !lLast) kbChars.push({ x: lcx, y: keyTop - 6, t0: t, ch: catGlyph() });
  if (rHigh && !rLast) kbChars.push({ x: rcx, y: keyTop - 6, t0: t, ch: catGlyph() });
  lLast = lHigh; rLast = rHigh;
  if (overheat) drawSteam(t, pos.x, oy + 2 * CELL + bob);
}
// Animated tail: a curling, swaying stroke that flicks on idle actions and wags
// faster while the cat is petted. Drawn behind the body so its root tucks under.
function drawTail(footX, footY, t, pal, flickT0, petting) {
  const baseX = footX + SW * 0.20, baseY = footY - SH * 0.24, segLen = SH * 0.052;
  let flick = 0;
  if (flickT0 >= 0 && t - flickT0 < 650) { const e = (t - flickT0) / 650; flick = Math.sin(e * Math.PI * 3) * (1 - e) * 0.55; }
  const wag = Math.sin(t / 540) * 0.10 + (petting ? Math.sin(t / 120) * 0.07 : 0);
  const pts = []; let x = baseX, y = baseY, ang = -1.15;
  for (let i = 0; i <= 10; i++) {
    pts.push([x, y]);
    const w = i / 10;                                    // tip sways most
    ang += 0.20 + (wag + flick) * w + Math.sin(t / 430 + i * 0.6) * 0.03 * w;
    x += Math.cos(ang) * segLen; y += Math.sin(ang) * segLen;
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = pal.O; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.stroke();
  ctx.strokeStyle = pal.C; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.stroke();
  const tip = pts[pts.length - 1];
  ctx.fillStyle = pal.O; ctx.beginPath(); ctx.arc(tip[0], tip[1], 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = pal.W; ctx.beginPath(); ctx.arc(tip[0], tip[1], 3.2, 0, Math.PI * 2); ctx.fill();
}
// Thinking indicator: three dots that pulse near the head (AI agent working).
function drawThinkBubble(x, y, t) {
  for (let i = 0; i < 3; i++) {
    const a = (Math.sin(t / 170 - i * 0.9) + 1) / 2;
    ctx.globalAlpha = 0.35 + a * 0.6; ctx.fillStyle = '#3a3f4b';
    ctx.fillRect(Math.round(x + i * 6), Math.round(y - a * 2), 4, 4);
  }
  ctx.globalAlpha = 1;
}
// "Working" spinner near the head while an AI agent is editing/testing/building.
function drawWorkBubble(x, y, t) {
  const cx = x + 4, cy = y - 1, R = 4.6, a = t / 260;
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const ang = a + i * Math.PI / 4;
    ctx.globalAlpha = 0.2 + 0.7 * (i / 8); ctx.strokeStyle = '#5a8f5a';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * (R - 2), cy + Math.sin(ang) * (R - 2));
    ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// Stroke a smooth curve through points (quadratic via segment midpoints).
function strokeSmooth(pts, style, width) {
  ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  ctx.stroke();
}
// Sleepy "z z z" drifting up from the head while the cat naps.
function drawZzz(x, y, t) {
  ctx.fillStyle = '#9aa6c0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const ph = ((t / 1100 + i * 0.34) % 1);
    ctx.globalAlpha = (1 - ph) * 0.9;
    ctx.font = `bold ${8 + i * 3}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillText('z', Math.round(x + i * 7 + Math.sin(ph * 6) * 2), Math.round(y - ph * 22));
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}
// Little "!" + sparkles above the head when an AI agent finishes a task.
function drawDoneSpark(x, y, t) {
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(x - 1, y - 7, 2, 5); ctx.fillRect(x - 1, y - 1, 2, 2);   // exclamation
  ctx.fillStyle = '#fff3b0';
  const tw = (Math.sin(t / 90) + 1) / 2;
  ctx.globalAlpha = 0.5 + tw * 0.5;
  ctx.fillRect(x + 9, y - 5, 2, 2); ctx.fillRect(x - 11, y - 2, 2, 2);  // sparkles
  ctx.globalAlpha = 1;
}
function drawHeart(x, y, color, alpha) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.fillRect(x - 3, y - 2, 2, 2); ctx.fillRect(x + 1, y - 2, 2, 2);
  ctx.fillRect(x - 3, y, 6, 2); ctx.fillRect(x - 2, y + 2, 4, 1); ctx.fillRect(x - 1, y + 3, 2, 1);
  ctx.globalAlpha = 1;
}
let lastHot = null;
function sendHot(x, y, w, h, dragging) {
  if (SHOT || !window.cat) return;
  const o = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), dragging };
  if (lastHot && lastHot.dragging === o.dragging && Math.abs(lastHot.x - o.x) < 4 && Math.abs(lastHot.y - o.y) < 4 && Math.abs(lastHot.w - o.w) < 4 && Math.abs(lastHot.h - o.h) < 4) return;
  lastHot = o; window.cat.setHot(o);
}

// ---- live state -------------------------------------------------------------
let cursor = { x: 0, y: 0 }, prevCursor = { x: 0, y: 0 }, velEMA = 0;
let heat = 0, keyPulse = false, lastKeyAt = -9999;
let nextBlink = 1500, blinkUntil = 0, prevT = 0, labelUntil = 0;
let huntUntil = 0, pouncing = false, pounceT0 = 0, pounceFrom = null, pounceTarget = null;
let hearts = [], lastHeart = 0;
let kbChars = [];   // cat-chaos keystrokes floating up from the keyboard
// stretch reminder (08) + AI-agent thinking/done (10/11)
let stretchT0 = -1, nextStretch = 0;
let agentState = 'idle', doneHopT0 = -1, doneHopPending = false, errorPending = false;
const STRETCH_INTERVAL = 1000 * 60 * 20, STRETCH_MS = 1700, DONE_MS = 760;
// paper unroll (09)
let paperLen = 0, paperUntil = 0, scrollPulses = 0;
// liveliness: eased gaze, idle micro-actions, animated tail + frame governor
let smoothLook = { x: 0, y: 0 };
let lookTarget = null, lookTargetUntil = 0;
let nextIdleAt = 0, leanTarget = 0, lean = 0, leanUntil = 0, tailFlickT0 = -1, loafUntil = 0;
let lastDrawn = 0, wantHighFps = true, rafPaused = false;
// Comnyang-style productivity layer: settings from main + reminder/break bubble
let config = null;
let bubbleText = '', bubbleUntil = 0;
let purring = false;
// Comnyang mood/energy model: 0-100, decays over time, bumped by stimuli. Bands
// (sleepy/calm/playful/zoomies) gate + scale every behavior; see bandOf()/intensity.
let energy = 45;
let startleT0 = -1, startleUntil = 0, startleMode = 'creep', startleFrom = null, startleTo = null, startleCooldownUntil = -9999;
let zoomiesT0 = -1, prevBand = '';

let pos;
try { pos = JSON.parse(localStorage.getItem('pos')); } catch (e) { /* ignore */ }
if (SHOT) pos = { x: 130, y: 250 };
else if (!pos || typeof pos.x !== 'number') pos = { x: canvas.width - 80, y: canvas.height - 80 };
pos.x = clamp(pos.x, 40, canvas.width - 40); pos.y = clamp(pos.y, SH + 10, canvas.height - 10);
let head = { x: pos.x, y: pos.y - SH, vx: 0, vy: 0 };
let feet = { x: pos.x, y: pos.y, vx: 0, vy: 0 };
let grabbing = false;

if (window.cat) {
  window.cat.onCursor((d) => { cursor.x = d.x; cursor.y = d.y; resumeRaf(); });
  if (window.cat.onKey) window.cat.onKey(() => { keyPulse = true; resumeRaf(); });
  if (window.cat.onAgent) window.cat.onAgent((s) => {
    // Map any agent verb to a reaction category (Claude Code/Codex/Cursor hooks can
    // send natural words like "editing", "testing", "error", "done").
    const v = String(s || 'idle').toLowerCase();
    const cat = /(done|stop|complete|finish|success)/.test(v) ? 'done'
      : /(error|fail|denied|blocked)/.test(v) ? 'error'
      : /(edit|writ|creat|refactor|test|build|compil|run|install|search|read|tool)/.test(v) ? 'working'
      : /(think|plan|prompt|start|busy)/.test(v) ? 'thinking'
      : 'idle';
    if (cat === 'done') { doneHopPending = true; agentState = 'idle'; energy = clamp(energy + 25, 0, 100); }
    else if (cat === 'error') { errorPending = true; agentState = 'idle'; energy = clamp(energy + 30, 0, 100); }
    else if (cat === 'working') { agentState = 'working'; energy = clamp(energy + 8, 0, 100); }
    else if (cat === 'thinking') { agentState = 'thinking'; energy = clamp(energy + 6, 0, 100); }
    else agentState = 'idle';
    resumeRaf();
  });
  if (window.cat.onScroll) window.cat.onScroll(() => { scrollPulses++; });
  if (window.cat.onThemes) window.cat.onThemes((list) => { applyThemes(list); if (SHEET) renderSheet(); else resumeRaf(); });
  if (window.cat.onMood) window.cat.onMood((c) => {
    if (c === 'sleep') energy = 5;
    else if (c === 'zoomies') energy = 96;
    else energy = Math.max(energy, 60);   // wake -> playful
    resumeRaf();
  });
  if (window.cat.onConfig) window.cat.onConfig((c) => {
    if (!c) return;
    config = c;
    if (typeof c.pattern === 'number') patternIndex = clamp(c.pattern, 0, PATTERNS.length - 1);
    resumeRaf();
  });
  if (window.cat.onRemind) window.cat.onRemind((d) => triggerReminder(d && d.message));
  if (window.cat.onBreak) window.cat.onBreak(() => triggerBreak());
}

// Replace {name} (and provide clean fallbacks when no name is set).
function catName() { return config && config.name ? config.name : ''; }
function template(msg) {
  const n = catName();
  return String(msg || '').replace(/\{name\}/g, n).replace(/\s+([,!?.])/g, '$1').replace(/,\s*!/g, '!').trim();
}
// A reminder/break: show a speech bubble, do the big stretch, meow.
function triggerReminder(message) {
  bubbleText = template(message) || 'Meow!';
  bubbleUntil = performance.now() + 5000;
  stretchT0 = performance.now();
  if (config && config.soundOn) playMeow();
  resumeRaf();
}
function triggerBreak() {
  const n = catName();
  bubbleText = n ? `Break time, ${n}! Stretch with me~` : 'Break time! Stretch with me~';
  bubbleUntil = performance.now() + 6000;
  stretchT0 = performance.now();
  if (config && config.soundOn) playMeow();
  resumeRaf();
}

// ---- procedural sound (WebAudio; no asset files) ---------------------------
let actx = null;
function audio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { actx = null; }
  return actx;
}
function playMeow() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain();
  g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30);
  let last = null;
  for (const [type, detune] of [['triangle', 0], ['sine', 6]]) {
    const o = ac.createOscillator(); o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(620, t0);
    o.frequency.linearRampToValueAtTime(720, t0 + 0.10);
    o.frequency.linearRampToValueAtTime(520, t0 + 0.28);
    o.connect(g); o.start(t0); o.stop(t0 + 0.32); last = o;
  }
  if (last) last.onended = () => { try { g.disconnect(); } catch (e) { /* ignore */ } }; // don't leak the gain node
}
let purrNodes = null;
function startPurr() {
  const ac = audio(); if (!ac || purrNodes) return;
  const carrier = ac.createOscillator(); carrier.type = 'sawtooth'; carrier.frequency.value = 50;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
  const amp = ac.createGain(); amp.gain.value = 0.04;
  const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 22;
  const lfoGain = ac.createGain(); lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain); lfoGain.connect(amp.gain);
  carrier.connect(lp); lp.connect(amp); amp.connect(ac.destination);
  carrier.start(); lfo.start();
  purrNodes = { carrier, lfo, amp, lfoGain };
}
function stopPurr() {
  if (!purrNodes) return;
  try {
    purrNodes.carrier.stop(); purrNodes.lfo.stop();
    purrNodes.lfoGain.disconnect(); purrNodes.amp.disconnect();
  } catch (e) { /* ignore */ }
  purrNodes = null;
}
// Happy little chirp/trill (AI agent finished a task).
function playChirp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(780, t0);
  o.frequency.linearRampToValueAtTime(1180, t0 + 0.08);
  o.frequency.linearRampToValueAtTime(1020, t0 + 0.2);
  o.connect(g); o.start(t0); o.stop(t0 + 0.24);
  o.onended = () => { try { g.disconnect(); } catch (e) { /* ignore */ } };
}
// Startled "mrrp" — a short falling growl (sudden jolt / agent error).
function playMrrp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t0);
  o.frequency.linearRampToValueAtTime(300, t0 + 0.16);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
  o.connect(lp); lp.connect(g); o.start(t0); o.stop(t0 + 0.2);
  o.onended = () => { try { g.disconnect(); lp.disconnect(); } catch (e) { /* ignore */ } };
}

// Speech bubble above the head — same dark-rounded style as the coat label.
function drawBubble(cx, topY, text, alpha) {
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const padX = 8, w = Math.min(260, ctx.measureText(text).width + padX * 2), h = 20;
  const x = Math.round(cx - w / 2), y = Math.round(topY - h);
  ctx.fillStyle = 'rgba(20,20,24,0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6); else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 4, y + h); ctx.lineTo(cx + 4, y + h); ctx.lineTo(cx, y + h + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.fillText(text, cx, y + h / 2 + 1);
  ctx.globalAlpha = 1;
}

// Unspooling roll of paper (drawn in front of the cat while you scroll).
function drawPaper(cx, topY, len, t) {
  const w = 14, x = Math.round(cx - w / 2), sway = Math.round(Math.sin(t / 160) * 1.5);
  topY = Math.round(topY);
  ctx.fillStyle = '#fbfbf7'; ctx.fillRect(x + sway, topY, w, len);
  ctx.fillStyle = '#e6e6df'; ctx.fillRect(x + sway, topY, 1, len); ctx.fillRect(x + sway + w - 1, topY, 1, len);
  ctx.fillStyle = '#c9c9bf';
  for (let yy = topY + 6; yy < topY + len - 2; yy += 5) ctx.fillRect(x + sway + 2, yy, w - 5, 1);
  ctx.fillStyle = '#fbfbf7'; for (let i = 0; i < w; i += 3) ctx.fillRect(x + sway + i, topY + len, 2, i % 2 ? 2 : 3);
  ctx.fillStyle = '#3a3f48'; ctx.fillRect(x - 2, topY - 6, w + 4, 7);          // roll body
  ctx.fillStyle = '#dadbd0'; ctx.fillRect(x - 1, topY - 5, w + 2, 5);
  ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + w / 2 - 1, topY - 4, 2, 3);      // core
}

// hunt/pet tuning
const HUNT_TRIGGER = 0.5, HUNT_SPEED = 6, STANDOFF = 28, POUNCE_RANGE = 46, POUNCE_MS = 300;

// mood/energy tuning (all tunable). Decay is per-ms; ~1.8/s gives a calm ~20-30s
// drift to sleep when nothing is happening, without snoozing the instant you stop.
const ENERGY_DECAY = 0.0018;
const SLEEPY_MAX = 15, CALM_MAX = 50, PLAYFUL_MAX = 80;
const STARTLE_VEL = 3.5, STARTLE_JUMP = 320, STARTLE_MS = 820, ZOOMIES_MS = 2500;
function bandOf(e) { return e <= SLEEPY_MAX ? 'sleepy' : e <= CALM_MAX ? 'calm' : e <= PLAYFUL_MAX ? 'playful' : 'zoomies'; }
function addEnergy(n) { energy = clamp(energy + n, 0, 100); }

function restSprings() { head = { x: pos.x, y: pos.y - SH, vx: 0, vy: 0 }; feet = { x: pos.x, y: pos.y, vx: 0, vy: 0 }; }
function persistPos() { localStorage.setItem('pos', JSON.stringify({ x: pos.x, y: pos.y })); }

// ---- main loop --------------------------------------------------------------
function draw(t) {
  // self-schedule; fully pause when the page is hidden (resumes on visibility)
  if (!document.hidden) requestAnimationFrame(draw); else { rafPaused = true; return; }
  // idle throttle: when nothing interactive is happening, render ~33fps not 60
  if (!wantHighFps && t - lastDrawn < 28) return;
  lastDrawn = t;

  const dt = Math.min(64, t - prevT); prevT = t;
  const step = Math.min(2.5, dt / 16);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  wantHighFps = true; // default high; the fully-idle calm path lowers it below

  // cursor velocity (px/ms, smoothed) + raw single-tick displacement (for startle)
  const moved = Math.hypot(cursor.x - prevCursor.x, cursor.y - prevCursor.y);
  const inst = moved / Math.max(1, dt);
  velEMA = velEMA * 0.5 + inst * 0.5; prevCursor = { x: cursor.x, y: cursor.y };

  // mood/energy: decay toward sleep, derive the active band + an intensity scalar
  // that scales existing behaviours (calm = mellow, zoomies = frantic). When mood
  // is off, behave exactly like before (band 'playful', intensity 1).
  const moodOn = !(config && config.moodOn === false);
  if (moodOn) energy = clamp(energy - dt * ENERGY_DECAY, 0, 100);
  const band = moodOn ? bandOf(energy) : 'playful';
  const intensity = !moodOn ? 1 : band === 'calm' ? 0.6 : band === 'playful' ? 1 : band === 'zoomies' ? 1.5 : 0.4;
  if (moodOn) {
    if (band === 'zoomies') { if (zoomiesT0 < 0) zoomiesT0 = t; if (t - zoomiesT0 > ZOOMIES_MS) { energy = 8; zoomiesT0 = -1; } }
    else zoomiesT0 = -1;
    if (band !== prevBand) { tailFlickT0 = t; prevBand = band; }   // ear/tail beat on a mood shift
  }

  if (keyPulse) { lastKeyAt = t; heat = Math.min(1, heat + 0.12); keyPulse = false; addEnergy(6); }
  heat = Math.max(0, heat - dt * 0.0009);

  // STARTLE: an abrupt cursor jump / velocity spike (the "sudden big change") makes
  // the cat flinch, freeze, then bolt or creep back. Cooldown stops re-fires.
  if (moodOn && !SHOT && !grabbing && t > startleCooldownUntil && (inst > STARTLE_VEL || moved > STARTLE_JUMP)) {
    startleT0 = t; startleUntil = t + STARTLE_MS; startleCooldownUntil = t + 1500;
    startleMode = Math.random() < 0.5 ? 'bolt' : 'creep';
    startleFrom = { x: pos.x, y: pos.y };
    const left = pos.x < canvas.width / 2;
    startleTo = { x: left ? 60 : canvas.width - 60, y: clamp(pos.y, SH + 10, canvas.height - 10) };
    huntUntil = 0; pouncing = false; addEnergy(35);
    if (config && config.soundOn) playMrrp();
  }
  // finalize a finished startle: commit position, reset springs
  if (startleT0 >= 0 && t >= startleUntil) {
    pos.x = clamp(pos.x, 40, canvas.width - 40); pos.y = clamp(pos.y, SH + 10, canvas.height - 10);
    persistPos(); restSprings(); startleT0 = -1;
  }
  if (errorPending) {   // an agent error makes the cat flinch in place (no bolt)
    startleT0 = t; startleUntil = t + STARTLE_MS; startleCooldownUntil = t + 1500;
    startleMode = 'creep'; startleFrom = { x: pos.x, y: pos.y }; startleTo = { x: pos.x, y: pos.y };
    errorPending = false;
    if (config && config.soundOn) playMrrp();
  }
  const startleActive = FORCED_STATE === 'startle' || (startleT0 >= 0 && t < startleUntil);

  // paper unroll: scrolling grows the paper; it retracts when you stop.
  if (scrollPulses > 0) { paperUntil = t + 700; paperLen = Math.min(70, paperLen + scrollPulses * 7); addEnergy(scrollPulses * 4); scrollPulses = 0; }
  if (FORCED_STATE === 'paper') paperLen = 50;
  else if (t > paperUntil) paperLen = Math.max(0, paperLen - dt * 0.06);
  const paperActive = FORCED_STATE === 'paper' || paperLen > 1;

  // Mouse-hunt: when enabled in settings, a fast cursor flick (far enough away)
  // makes the cat crouch, stalk, and pounce. Off by config (or when the cat is set
  // to ignore the cursor) -> the cat stays put.
  const follow = !(config && config.followCursor === false);
  const huntOn = follow && !!(config && config.huntOn);
  const dCur = Math.hypot(cursor.x - pos.x, cursor.y - (pos.y - SH * 0.5));
  if (huntOn && !grabbing && !SHOT && velEMA > HUNT_TRIGGER && dCur > 70) { huntUntil = t + 1400; addEnergy(0.6 * step); }
  const hunting = !startleActive && (FORCED_STATE === 'hunt' || (huntOn && t < huntUntil));

  // pet detection (cursor resting on the head, slow, not hunting/grabbing)
  const headBox = { x: pos.x - SW / 2, y: pos.y - SH, w: SW, h: SH * 0.42 };
  const inHead = cursor.x >= headBox.x && cursor.x <= headBox.x + headBox.w && cursor.y >= headBox.y && cursor.y <= headBox.y + headBox.h;
  const petting = FORCED_STATE === 'pet' || (!grabbing && !hunting && !startleActive && inHead && velEMA < 0.25);
  if (petting) addEnergy(0.6 * step);   // affection nudges mood up toward calm/playful

  // purr while petted (only when sound is on); start/stop once on the edge
  const wantPurr = petting && !SHOT && !!(config && config.soundOn);
  if (wantPurr && !purring) { startPurr(); purring = true; }
  else if (!wantPurr && purring) { stopPurr(); purring = false; }

  let typing, overheat, heatT;
  if (FORCED_STATE === 'overheat') { typing = true; overheat = true; heatT = 1; }
  else if (FORCED_STATE === 'typing') { typing = true; overheat = false; heatT = 0; }
  else { typing = !grabbing && !hunting && !startleActive && (t - lastKeyAt) < 350 && !(moodOn && band === 'sleepy'); overheat = heat > 0.7; heatT = overheat ? (heat - 0.7) / 0.3 : 0; }

  const P = PATTERNS[patternIndex];
  const catSprite = sprites[patternIndex];   // this coat's body build (slender/stocky/fluffy/standard)
  const palRGB = {
    O: toRgb(heatT ? lerpHex(P.outline, HOT_OUTLINE, heatT) : P.outline),
    C: toRgb(heatT ? lerpHex(P.coat, HOT_BODY, heatT) : P.coat),
    K: toRgb(heatT ? lerpHex(P.mark, HOT_BODY, heatT) : P.mark),
    W: toRgb(heatT ? lerpHex(P.white, HOT_BODY, heatT * 0.5) : P.white),
    X: toRgb(heatT ? lerpHex(P.patch, HOT_BODY, heatT) : P.patch),
    I: toRgb(P.inner), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO),
  };
  const pal = { O: rgbStr(palRGB.O), C: rgbStr(palRGB.C), W: rgbStr(palRGB.W), N: rgbStr(palRGB.N) };

  // gaze: track the cursor, unless "Follow cursor" is off (then rest forward and
  // let the random idle look-arounds carry the life instead).
  const look = follow
    ? (() => { const fx = pos.x, fy = pos.y - SH * 0.72, vx = cursor.x - fx, vy = cursor.y - fy, l = Math.hypot(vx, vy) || 1; return { x: vx / l, y: vy / l }; })()
    : { x: 0, y: 0.12 };
  const blinking = t < blinkUntil;

  if (startleActive) {
    // ---- STARTLE: flinch + puff, freeze, then bolt to an edge or creep back -
    const se = FORCED_STATE === 'startle' ? ((t % STARTLE_MS) / STARTLE_MS) : clamp((t - startleT0) / STARTLE_MS, 0, 1);
    let puff = 1, jit = 0;
    if (se < 0.18) { puff = 1 + 0.20 * Math.sin((se / 0.18) * Math.PI); jit = Math.sin(t / 26) * 2.5; }   // flinch
    else if (se >= 0.42) {                                                                                 // move phase
      const m = (se - 0.42) / 0.58;
      if (startleMode === 'bolt' && startleFrom && startleTo) {
        const ease = 1 - Math.pow(1 - m, 2);
        pos.x = startleFrom.x + (startleTo.x - startleFrom.x) * ease;
        pos.y = startleFrom.y + (startleTo.y - startleFrom.y) * ease;
      } else { jit = Math.sin(t / 60) * (1 - m) * 3; }                                                     // creep wobble
    }
    pos.x = clamp(pos.x, 40, canvas.width - 40); pos.y = clamp(pos.y, SH + 10, canvas.height - 10);
    restSprings();
    const oy = Math.round(pos.y - SH);
    drawShadow(pos.x, pos.y, 0.16);
    octx.clearRect(0, 0, oc.width, oc.height);
    drawCat(octx, catSprite, t, palRGB, { bob: 0, blinking, look: { x: 0, y: -0.25 }, eyeMode: 'open' });
    ctx.save();
    ctx.translate(pos.x + jit, pos.y);
    ctx.scale(puff, puff);
    ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
    ctx.restore();
    drawDoneSpark(pos.x + 2, oy - 4, t);   // a startled "!" pops over the head
    sendHot(pos.x - SW / 2 - 6, oy - 6, SW + 12, SH + 12, false);
  } else if (hunting) {
    // ---- MOUSE HUNT: stalk toward the cursor, then pounce -------------------
    const dx = cursor.x - pos.x, dy = cursor.y - pos.y, d = Math.hypot(dx, dy) || 1;
    let leap = 0, stretchY = 1;
    if (pouncing) {
      const e = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const ease = 1 - Math.pow(1 - e, 2);
      const tgt = pounceTarget || cursor;
      pos.x = pounceFrom.x + (tgt.x - pounceFrom.x) * ease;
      pos.y = pounceFrom.y + (tgt.y - pounceFrom.y) * ease;
      leap = Math.sin(e * Math.PI) * 18; stretchY = 1 + Math.sin(e * Math.PI) * 0.18;
      if (e >= 1) { pouncing = false; huntUntil = 0; persistPos(); }
    } else if (FORCED_STATE !== 'hunt' && d < POUNCE_RANGE) {
      pouncing = true; pounceT0 = t; pounceFrom = { x: pos.x, y: pos.y }; pounceTarget = { x: cursor.x, y: cursor.y };
    } else if (FORCED_STATE !== 'hunt') {
      const mv = Math.min(Math.max(0, d - STANDOFF), HUNT_SPEED * step);
      pos.x += dx / d * mv; pos.y += dy / d * mv;
    }
    pos.x = clamp(pos.x, 30, canvas.width - 30); pos.y = clamp(pos.y, HH + 10, canvas.height - 10);
    restSprings();
    const creep = Math.round(Math.sin(t / 90) * 1.5);
    const ox = Math.round(pos.x - HW / 2), oy = Math.round(pos.y - HH) - Math.round(leap);
    const facingLeft = FORCED_STATE !== 'hunt' && cursor.x < pos.x;
    drawShadow(pos.x, pos.y, 0.18, 26);
    octx.clearRect(0, 0, oc.width, oc.height);
    drawCat(octx, spriteHunt, t, palRGB, { bob: creep, blinking, look, eyeMode: 'open' });
    ctx.save();
    if (facingLeft) { ctx.translate(ox + HW, oy); ctx.scale(-1, stretchY); ctx.drawImage(oc, 0, 0, HW, HH, 0, 0, HW, HH); }
    else { ctx.translate(ox, oy); ctx.scale(1, stretchY); ctx.drawImage(oc, 0, 0, HW, HH, 0, 0, HW, HH); }
    ctx.restore();
    sendHot(0, 0, 0, 0, false); // non-interactive while hunting -> clicks pass through
  } else {
    // ---- not hunting: keep mochi springs settling toward pos ---------------
    const restTop = { x: pos.x, y: pos.y - SH };
    if (FORCED_STATE === 'mochi') {
      head.x = pos.x; head.y = pos.y - SH * 1.7; head.vx = head.vy = 0; feet.x = pos.x; feet.y = pos.y; feet.vx = feet.vy = 0;
    } else {
      const ht = grabbing ? { x: clamp(cursor.x, 8, canvas.width - 8), y: clamp(cursor.y, 8, canvas.height - 8) } : restTop;
      const HK = grabbing ? 0.45 : 0.14, HD = grabbing ? 0.45 : 0.16;
      head.vx += ((ht.x - head.x) * HK - head.vx * HD) * step; head.vy += ((ht.y - head.y) * HK - head.vy * HD) * step;
      head.x += head.vx * step; head.y += head.vy * step;
      const ftx = grabbing ? head.x : pos.x, fty = grabbing ? head.y + SH : pos.y, FK = 0.07, FD = 0.12;
      feet.vx += ((ftx - feet.x) * FK - feet.vx * FD) * step; feet.vy += ((fty - feet.y) * FK - feet.vy * FD) * step;
      if (grabbing) feet.vy += 2.2 * step;
      feet.x += feet.vx * step; feet.y += feet.vy * step;
    }
    const axX = feet.x - head.x, axY = feet.y - head.y, len = Math.hypot(axX, axY) || 1, ang = Math.atan2(axY, axX), ratio = len / SH;
    const speed = Math.hypot(head.vx, head.vy) + Math.hypot(feet.vx, feet.vy);
    const calm = !grabbing && FORCED_STATE !== 'mochi' && Math.abs(ratio - 1) < 0.02 && speed < 0.45 && Math.abs(ang - Math.PI / 2) < 0.03;
    const eyeMode = petting ? 'happy' : 'open';
    const bob = Math.round(Math.sin(t / (typing ? 220 : 600)) * 2);

    // --- liveliness: eased gaze + periodic idle micro-actions ---------------
    const restIdle = calm && !petting && !typing && !grabbing && !FORCED_STATE && agentState === 'idle';
    if (restIdle) {
      const idleScale = 2 - intensity;   // zoomies -> more frequent darts, calm -> rarer
      if (nextIdleAt === 0) nextIdleAt = t + (4000 + Math.random() * 6000) * idleScale;
      if (t > nextIdleAt) {
        nextIdleAt = t + (5000 + Math.random() * 9000) * idleScale;
        const roll = Math.random();
        if (roll < 0.40) { lookTarget = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.5 }; lookTargetUntil = t + 800 + Math.random() * 1100; }
        else if (roll < 0.60) { tailFlickT0 = t; }
        else if (roll < 0.74) { leanTarget = (Math.random() < 0.5 ? -1 : 1) * 0.035; leanUntil = t + 750; }
        else if (roll < 0.90) { loafUntil = t + 4000 + Math.random() * 4000; }   // settle into a content loaf
        else { blinkUntil = t + 230; nextBlink = t + 380; }   // sleepy double-blink
      }
    } else { nextIdleAt = 0; }
    if (lookTarget && t > lookTargetUntil) lookTarget = null;
    if (t > leanUntil) leanTarget = 0;
    lean += (leanTarget - lean) * 0.09 * step;
    const gaze = lookTarget || look;
    smoothLook.x += (gaze.x - smoothLook.x) * 0.10 * step;
    smoothLook.y += (gaze.y - smoothLook.y) * 0.10 * step;

    // --- idle reactions: periodic stretch + AI-agent thinking/done ----------
    if (nextStretch === 0) nextStretch = t + STRETCH_INTERVAL;
    const idleNow = calm && !petting && !typing && agentState === 'idle';
    if (FORCED_STATE !== 'stretch' && idleNow && t > nextStretch) { stretchT0 = t; nextStretch = t + STRETCH_INTERVAL; }
    const stretching = FORCED_STATE === 'stretch' || (stretchT0 >= 0 && t - stretchT0 < STRETCH_MS);
    const thinking = FORCED_STATE === 'think' || agentState === 'thinking';
    const working = FORCED_STATE === 'work' || agentState === 'working';
    if (doneHopPending) { doneHopT0 = t; doneHopPending = false; if (config && config.soundOn) playChirp(); }
    let hop = 0, hopActive = false;
    if (FORCED_STATE === 'done') { hop = Math.sin(((t % DONE_MS) / DONE_MS) * Math.PI) * 22 * intensity; hopActive = true; }
    else if (doneHopT0 >= 0 && t - doneHopT0 < DONE_MS) { hop = Math.sin(((t - doneHopT0) / DONE_MS) * Math.PI) * 22 * intensity; hopActive = true; }

    const sleeping = moodOn && band === 'sleepy' && calm && !petting && !typing && !grabbing
      && !stretching && !thinking && !hopActive && !paperActive && FORCED_STATE !== 'mochi';

    if (FORCED_STATE === 'sleep' || sleeping) {
      // ---- SLEEP: curled loaf, eyes closed, "z z z" drifting up -------------
      const breath = Math.sin(t / 1700);
      const oy = Math.round(pos.y - SLH);
      drawShadow(pos.x, pos.y, 0.16, 30);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, spriteSleep, t, palRGB, { bob: Math.round(breath * 1.2), blinking: true, look: { x: 0, y: 0 }, eyeMode: 'open' });
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(1, 1 + breath * 0.02);
      ctx.drawImage(oc, 0, 0, SLW, SLH, -SLW / 2, -SLH, SLW, SLH);
      ctx.restore();
      // closed eye on the tucked head — contrast-adaptive so it reads on any coat
      // wrapped tail drawn over the body (two-tone: outline edge reads on any coat)
      const tpts = [[pos.x + 44, pos.y - 58], [pos.x + 52, pos.y - 34], [pos.x + 40, pos.y - 12], [pos.x + 8, pos.y - 6], [pos.x - 20, pos.y - 12], [pos.x - 34, pos.y - 26], [pos.x - 29, pos.y - 39]];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      strokeSmooth(tpts, rgbStr(palRGB.O), 9);
      strokeSmooth(tpts, rgbStr(palRGB.C), 5);
      const ttip = tpts[tpts.length - 1];
      ctx.fillStyle = rgbStr(palRGB.O); ctx.beginPath(); ctx.arc(ttip[0], ttip[1], 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgbStr(palRGB.W); ctx.beginPath(); ctx.arc(ttip[0], ttip[1], 2.4, 0, Math.PI * 2); ctx.fill();
      const lum = 0.299 * palRGB.C[0] + 0.587 * palRGB.C[1] + 0.114 * palRGB.C[2];
      ctx.strokeStyle = lum > 110 ? '#2b2d33' : '#ece6df'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(pos.x - 31, pos.y - 34 + Math.round(breath * 1.2), 3.4, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      drawZzz(pos.x - 30, oy + 30, t);
      wantHighFps = false;   // napping renders at the idle frame rate
      sendHot(pos.x - SLW / 2 - 6, oy - 6, SLW + 12, SLH + 12, false);
    } else if (typing || FORCED_STATE === 'typing' || FORCED_STATE === 'overheat') {
      // Side "keyboard cat": stands in profile on the keyboard, front paws tapping
      // the keys, mashing out cat-chaos (asdf jkl;) that floats up.
      renderTypeSprawl(t, palRGB, pal, overheat, blinking, look);
      sendHot(pos.x - SW / 2 - 6, pos.y - TH - 6, SW + 12, TH + 24, false);
    } else if (!grabbing && (calm || petting || stretching || thinking || working || hopActive || paperActive || FORCED_STATE === 'loaf')) {
      const idleSway = Math.round(Math.sin(t / 2600));                 // slow weight shift ±1
      const loafing = FORCED_STATE === 'loaf' || (calm && !petting && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && t < loafUntil);
      const wig = (petting ? Math.round(Math.sin(t / 55)) : 0) + idleSway;
      const emode = (petting || stretching || loafing) ? 'happy' : 'open';
      const eLook = (thinking || working) ? { x: 0, y: -0.5 } : smoothLook;
      const breath = Math.sin(t / 1500);                              // gentle breathing
      let sx = 1 - breath * 0.012, sy = 1 + breath * 0.020;
      if (loafing) { sx *= 1.2; sy *= 0.6; }   // squished, content loaf
      if (stretching) {
        const se = FORCED_STATE === 'stretch' ? ((t % STRETCH_MS) / STRETCH_MS) : clamp((t - stretchT0) / STRETCH_MS, 0, 1);
        const k = Math.sin(se * Math.PI); sy = 1 + k * 0.32; sx = 1 + k * 0.10;
      }
      const ox = Math.round(pos.x - SW / 2) + wig, oy = Math.round(pos.y - SH) - Math.round(hop);
      drawShadow(pos.x + wig, pos.y, 0.18);
      if (!stretching && !thinking && !working) drawTail(pos.x + wig, pos.y, t, pal, tailFlickT0, petting);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, catSprite, t, palRGB, { bob, blinking, look: eLook, eyeMode: emode });
      ctx.save();
      ctx.translate(pos.x + wig, pos.y - hop);
      if (lean) ctx.rotate(lean);
      ctx.scale(sx, sy);
      ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
      ctx.restore();
      if (overheat) drawSteam(t, ox + SW / 2, oy + CELL);   // red+steam cooldown after typing
      if (petting && t - lastHeart > 430) { hearts.push({ x: pos.x + (Math.random() - 0.5) * 18, y: oy - 2, t0: t }); lastHeart = t; }
      if (thinking) drawThinkBubble(pos.x + SW * 0.32, oy + 4, t);
      else if (working) drawWorkBubble(pos.x + SW * 0.32, oy + 2, t);
      if (hopActive) drawDoneSpark(pos.x, oy - 4, t);
      if (paperActive && !petting && !stretching) drawPaper(pos.x, pos.y - 36, Math.round(paperLen), t);
      if (t < labelUntil) {
        ctx.globalAlpha = Math.min(1, (labelUntil - t) / 300); ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const name = P.name, w = ctx.measureText(name).width + 10, bx = pos.x, by = oy + SH + 14;
        ctx.fillStyle = 'rgba(20,20,24,0.82)'; ctx.fillRect(bx - w / 2, by - 13, w, 13); ctx.fillStyle = '#fff'; ctx.fillText(name, bx, by); ctx.globalAlpha = 1;
      }
      // fully idle (only breathing/tail)? let the governor drop to ~33fps
      if (calm && !petting && !stretching && !thinking && !working && !hopActive && !paperActive && !blinking
          && !lookTarget && t > lookTargetUntil && hearts.length === 0 && t >= bubbleUntil
          && (tailFlickT0 < 0 || t - tailFlickT0 > 700) && Math.abs(lean) < 0.004) wantHighFps = false;
      sendHot(ox - 6, oy - 6, SW + 12, SH + 12, false);
    } else if (grabbing || FORCED_STATE === 'mochi' || ratio > 1.06) {
      drawShadow(feet.x, feet.y, 0.10);
      octx.clearRect(0, 0, oc.width, oc.height); drawCat(octx, catSprite, t, palRGB, { bob: 0, blinking, look });
      const midDestH = Math.max(2, len - HEAD_SRC - FEET_SRC), midSX = clamp(Math.sqrt(MID_SRC / midDestH), 0.28, 1);
      ctx.save(); ctx.translate(head.x, head.y); ctx.rotate(ang - Math.PI / 2);
      ctx.drawImage(oc, 0, 0, SW, HEAD_SRC, -SW / 2, 0, SW, HEAD_SRC);
      ctx.drawImage(oc, 0, HEAD_SRC, SW, MID_SRC, -SW * midSX / 2, HEAD_SRC, SW * midSX, midDestH);
      ctx.drawImage(oc, 0, HEAD_SRC + MID_SRC, SW, FEET_SRC, -SW / 2, HEAD_SRC + midDestH, SW, FEET_SRC);
      ctx.restore();
      const minX = Math.min(head.x, feet.x) - SW / 2, maxX = Math.max(head.x, feet.x) + SW / 2, minY = Math.min(head.y, feet.y) - 12, maxY = Math.max(head.y, feet.y) + 12;
      sendHot(minX, minY, maxX - minX, maxY - minY, grabbing);
    } else {
      drawShadow(pos.x, pos.y, 0.16);
      octx.clearRect(0, 0, oc.width, oc.height); drawCat(octx, catSprite, t, palRGB, { bob: 0, blinking, look });
      const sq = clamp(ratio, 0.65, 1.06), sy = sq, sx = 1 / Math.sqrt(sq);
      ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(sx, sy); ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH); ctx.restore();
      sendHot(pos.x - SW / 2 - 6, pos.y - SH - 6, SW + 12, SH + 12, false);
    }
  }

  // floating hearts (update + draw; persist after petting ends)
  hearts = hearts.filter((h) => t - h.t0 < 1100);
  for (const h of hearts) { const a = (t - h.t0) / 1100; drawHeart(Math.round(h.x + Math.sin(a * 6) * 4), Math.round(h.y - a * 26), a < 0.5 ? '#ff5a6e' : '#ff8a98', (1 - a) * 0.95); }

  // cat-chaos keystrokes drifting up off the keyboard
  kbChars = kbChars.filter((c) => t - c.t0 < 900);
  if (kbChars.length) {
    ctx.font = 'bold 11px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const c of kbChars) {
      const a = (t - c.t0) / 900;
      ctx.globalAlpha = (1 - a) * 0.9; ctx.fillStyle = '#3a3f4b';
      ctx.fillText(c.ch, Math.round(c.x + Math.sin(a * 5) * 3), Math.round(c.y - a * 24));
    }
    ctx.globalAlpha = 1;
  }

  // reminder/break speech bubble — drawn here (outside the pose branches) so it's
  // visible even if a reminder fires mid-hunt or mid-type.
  if (t < bubbleUntil && bubbleText) drawBubble(pos.x, pos.y - SH - 6, bubbleText, Math.min(1, (bubbleUntil - t) / 400));

  // natural blinking: varied timing with occasional slow/sleepy + double blinks
  if (t > nextBlink && t > blinkUntil) {
    const sleepy = Math.random() < 0.22;
    blinkUntil = t + (sleepy ? 230 : 120);
    nextBlink = (Math.random() < 0.18) ? t + 360 : t + 2000 + Math.random() * 2800;
  }
}
function resumeRaf() { if (rafPaused) { rafPaused = false; lastDrawn = 0; requestAnimationFrame(draw); } }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (purring) { stopPurr(); purring = false; } }  // draw() won't run to stop it
  else resumeRaf();
});
// Contact-sheet QA mode: draw the grid, then export the canvas to main (which
// writes the PNG). Re-renders after themes/config arrive so custom coats appear.
function sheetPal(P) {
  return { O: toRgb(P.outline), C: toRgb(P.coat), K: toRgb(P.mark), W: toRgb(P.white), X: toRgb(P.patch), I: toRgb(P.inner), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO) };
}
function sheetSprite(pose, i) {
  if (pose === 'sleep') return spriteSleep;
  if (pose === 'typing') return typeSprites[i] || typeSprites[0];
  if (pose === 'hunt') return spriteHunt;
  return sprites[i] || sprites[0];   // sit, loaf
}
function renderSheet() {
  const poses = ['sit', 'sleep', 'typing', 'hunt', 'loaf'];
  const coats = PATTERNS;
  const cellW = 96, cellH = 92, labelW = 66, headH = 24;
  canvas.width = labelW + coats.length * cellW;
  canvas.height = headH + poses.length * cellH + 6;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1d1f26'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cfd3db'; ctx.font = 'bold 10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
  coats.forEach((P, i) => ctx.fillText(P.name.slice(0, 13), labelW + i * cellW + cellW / 2, headH / 2));
  poses.forEach((pose, r) => {
    const cy = headH + r * cellH;
    ctx.fillStyle = (r % 2) ? '#23262f' : '#1d1f26'; ctx.fillRect(0, cy, canvas.width, cellH);
    ctx.fillStyle = '#9aa0ad'; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(pose, 8, cy + cellH / 2);
    coats.forEach((P, i) => {
      const cx = labelW + i * cellW, sp = sheetSprite(pose, i), palRGB = sheetPal(P), closed = pose === 'sleep';
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, sp, 0, palRGB, { bob: 0, blinking: closed, look: { x: 0, y: 0 }, eyeMode: 'open' });
      const sc = Math.min((cellW - 16) / sp.SW, (cellH - 16) / sp.SH);
      const dw = sp.SW * sc, dh = sp.SH * sc, dx = cx + (cellW - dw) / 2, dy = cy + (cellH - dh) / 2;
      ctx.drawImage(oc, 0, 0, sp.SW, sp.SH, dx, dy, dw, dh);
    });
  });
}

if (SHEET) {
  renderSheet();
  setTimeout(() => { renderSheet(); if (window.cat && window.cat.sheetImage) window.cat.sheetImage(canvas.toDataURL('image/png')); }, 700);
} else {
  requestAnimationFrame(draw);
}

// ---- input ------------------------------------------------------------------
window.addEventListener('mousemove', (e) => { cursor.x = e.clientX; cursor.y = e.clientY; });
window.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  cursor.x = e.clientX; cursor.y = e.clientY;
  audio();                                // real gesture: unlock WebAudio for later meows
  huntUntil = 0; pouncing = false;        // grabbing cancels a hunt
  grabbing = true;
  sendHot(cursor.x - SW, cursor.y - SH, SW * 2, SH * 2, true);
});
window.addEventListener('mouseup', () => {
  if (!grabbing) return;
  grabbing = false;
  pos.x = clamp(head.x, 40, canvas.width - 40); pos.y = clamp(head.y + SH, SH + 10, canvas.height - 10);
  persistPos();
});
// Double-click opens Settings (Quit lives in the tray now).
window.addEventListener('dblclick', () => { audio(); if (window.cat && window.cat.openSettings) window.cat.openSettings(); });
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  audio();
  patternIndex = (patternIndex + 1) % PATTERNS.length;
  localStorage.setItem('pattern', patternIndex);            // fast local fallback
  if (window.cat && window.cat.setPattern) window.cat.setPattern(patternIndex); // sync tray + settings.json
  labelUntil = performance.now() + 1500;
});
