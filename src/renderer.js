// ===== Desktop pixel cat: 14 patterns, mochi-drag, typing, hunt, purr ========
// Role-coded sprites recolored per pattern, on a full-screen click-through overlay.
// Roles:  . transparent  O outline  H white halo  C coat  K markings  W white
//         X patch (tortie/calico)   E eye   N nose   I inner-ear

const canvas = document.getElementById('cat');
const ctx = canvas.getContext('2d');
const qp = new URLSearchParams(location.search);
const SHOT = qp.get('shot') === '1';
const SHEET = qp.get('sheet') === '1';   // contact-sheet QA mode (all poses x coats)
const FORCED_STATE = qp.get('state');
let viewW = 0, viewH = 0, viewDpr = 1;   // CSS-px layout dims, decoupled from the physical backing store
function resize() {
  if (SHEET) return;   // the contact sheet sizes its own canvas
  if (SHOT) {
    viewW = 260; viewH = 320; viewDpr = 1;
    canvas.width = 260; canvas.height = 320;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  } else {
    // HiDPI crispness: size the backing store in PHYSICAL px (innerWidth*dpr) but keep the
    // CSS box at innerWidth and scale the context by dpr - so every draw/layout coordinate
    // stays in CSS px while pixels render at native device resolution (no compositor
    // upscale-blur at non-100% scaling). All geometry reads use viewW/viewH, never canvas.*.
    viewDpr = window.devicePixelRatio || 1;
    viewW = window.innerWidth; viewH = window.innerHeight;
    canvas.style.width = viewW + 'px'; canvas.style.height = viewH + 'px';
    canvas.width = Math.round(viewW * viewDpr); canvas.height = Math.round(viewH * viewDpr);
    ctx.setTransform(viewDpr, 0, 0, viewDpr, 0, 0);
  }
  ctx.imageSmoothingEnabled = false;   // keep the sprite blit nearest-neighbor
}
resize();
if (!SHOT && !SHEET) window.addEventListener('resize', resize);



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

// --- typing cat (FRONT-FACING "keyboard kneading", Comnyang-style): the cat
//     faces the viewer and leans forward over two big keycaps. Grid 24x24. Both
//     eyes visible (they look down at the keys), tail curls up the right side.
//     Forelegs are NOT baked - drawn live kneading the keys in renderTypeFront,
//     where the keycaps are drawn too.
function composeTypeFront(B) {
  B = B || {};
  const CX = 12, fluff = !!B.fluff;
  // tail: emerges behind the right haunch and curls up beside the body - kept
  // clear of the torso silhouette so it reads as a tail, with a pale tip.
  // tail sweeps low to the right (a resting tail) - not curled up by the chest where its pale tip read as a 3rd paw
  [[20.5, 20.4], [22.2, 20.9], [23.2, 21.8], [22.6, 22.8]].forEach(([c, r]) => ellipse(c, r, 1.5, 1.5, 'C'));
  ellipse(21.8, 23.2, 1.0, 1.0, 'W', ['C']);               // tail tip (hooked over)
  // body: leaning forward - chest/shoulder mass under the head, haunches planted
  // wider at the bottom (the rear stays down while the cat reaches for the keys).
  ellipse(CX, 16, 6.0, 5.4, 'C');                          // shoulders / chest
  ellipse(6.6, 20.2, 3.4, 3.2, 'C');                       // left haunch
  ellipse(17.4, 20.2, 3.4, 3.2, 'C');                      // right haunch
  // head front-centre, slightly low (the forward lean)
  ellipse(CX, 8.5, 6.3, 5.6, 'C');
  if (fluff) { ellipse(5.6, 10.8, 1.9, 2.3, 'C'); ellipse(18.4, 10.8, 1.9, 2.3, 'C'); }  // cheek ruff
  // ears - proper cat triangles on top, slight outward tilt
  triangle(CX - 4.5, 1.2, CX - 6.4, 6.8, CX - 1.8, 5.6, 'K');
  triangle(CX + 4.5, 1.2, CX + 6.4, 6.8, CX + 1.8, 5.6, 'K');
  triangle(CX - 4.3, 3.0, CX - 5.4, 6.3, CX - 2.8, 5.6, 'I');
  triangle(CX + 4.3, 3.0, CX + 5.4, 6.3, CX + 2.8, 5.6, 'I');
  if (fluff) { ellipse(CX - 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); ellipse(CX + 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); }  // ear tufts
  // big round eyes (drawCat animates the pupils downward at the keys) + muzzle + nose
  ellipse(9, 8.7, 2.0, 2.4, 'E'); ellipse(15, 8.7, 2.0, 2.4, 'E');
  ellipse(CX, 12.2, 3, 2, 'W', ['C']);
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  // white chest bib - kept narrow so the lifted white paws never vanish against it
  ellipse(CX, 17.8, 2.1, 3.2, 'W', ['C']);
  // forelegs/paws are NOT baked - drawn live in drawKneadPaws (knead the keys)
  if (B.tabby) {
    [[11, 5], [12, 6], [13, 5]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });  // forehead M
    for (let r = 13; r < 22; r += 2) for (let c = 3; c < 21; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
  }
  ellipse(7.5, 17.5, 2.2, 2.6, 'X', ['C', 'K']);           // tortie/calico patches
  ellipse(16.5, 20, 2.0, 2.0, 'X', ['C', 'K']);
}

// --- loafing cat ("cat bread"): a compact, content resting pose. The body is a
//     low rounded mound (no upright legs - paws are tucked under), the head rests
//     low and forward on top, and the tail wraps around the front. Grid 24x30 so
//     SW/SH match the sit sprite (the draw loop swaps sprites at the same size).
//     Built per coat from the same build descriptor B as composeSit.
function composeLoaf(B) {
  B = B || {};
  const CX = 12;
  const bw = B.bodyW || 1;
  const headRx = B.headRx || 6.3, headRy = B.headRy || 5.8;
  const earY = B.earApexY == null ? 1 : B.earApexY, ew = B.earW || 2.4, eo = B.earOut || 4;
  const eRx = B.eyeRx || 2, eRy = B.eyeRy || 2.4, fluff = !!B.fluff, cheek = B.cheek || 0;
  const EH = 6;   // ears/head drop vs the sit sprite (the loaf sits low)
  // baked tail wrapped around the front-right base (drawn first, behind the body)
  [[20.4, 26.6], [18.6, 28.2], [16.2, 29.2]].forEach(([c, r]) => ellipse(c, r, 1.7, 1.6, 'C'));
  ellipse(16.2, 29.2, 0.9, 0.9, 'W', ['C']);               // pale tail tip curled to the front
  // body: a wide, low loaf mound - base sits on the ground line (row ~29)
  ellipse(CX, 25, 8.9 * bw, 4.7 + (fluff ? 0.4 : 0), 'C'); // broad base
  ellipse(CX, 21, 8.0 * bw, 4.0, 'C');                     // rounded upper mound
  // head resting low and forward on the mound
  ellipse(CX, 8 + EH, headRx, headRy, 'C');
  if (cheek) { ellipse(CX - headRx * 0.7, 9.6 + EH, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6 + EH, 1.7, 2.2, 'C'); }
  if (fluff) { ellipse(5.4, 10.4 + EH, 1.9, 2.4, 'C'); ellipse(18.6, 10.4 + EH, 1.9, 2.4, 'C'); } // cheek ruff
  // ears - same triangles as the sit head, dropped by EH
  triangle(CX - eo - 0.5, earY + EH, CX - eo - ew, 7.6 + EH, CX - eo + ew, 6.4 + EH, 'K');
  triangle(CX + eo + 0.5, earY + EH, CX + eo + ew, 7.6 + EH, CX + eo - ew, 6.4 + EH, 'K');
  const iw = ew * 0.55;
  triangle(CX - eo - 0.3, earY + 2 + EH, CX - eo - iw, 7.2 + EH, CX - eo + iw, 6.6 + EH, 'I');
  triangle(CX + eo + 0.3, earY + 2 + EH, CX + eo + iw, 7.2 + EH, CX + eo - iw, 6.6 + EH, 'I');
  if (fluff) { ellipse(CX - eo, 6.0 + EH, 0.9, 1.4, 'W', ['C', 'K']); ellipse(CX + eo, 6.0 + EH, 0.9, 1.4, 'W', ['C', 'K']); } // ear tufts
  // muzzle + a small chest bib on the front of the mound
  ellipse(CX, 12 + EH, 3, 2, 'W', ['C']);
  ellipse(CX, 22, fluff ? 3.2 : 2.6, 3.4, 'W', ['C']);
  // two tucked front paws peeking out at the base
  ellipse(9.6, 28.4, 2.0, 1.4, 'W', ['C']); ellipse(14.4, 28.4, 2.0, 1.4, 'W', ['C']);
  setCell(12, 28, '.'); setCell(12, 29, '.');              // toe split between the tucked paws
  // eyes + nose (drawCat closes them to a happy curve for the content loaf)
  ellipse(9, 8.2 + EH, eRx, eRy, 'E'); ellipse(15, 8.2 + EH, eRx, eRy, 'E');
  setCell(12, 11 + EH, 'N'); setCell(11, 11 + EH, 'N');
  // tabby: forehead M + a couple of soft side bands (kept subtle so the loaf reads clean)
  if (B.tabby) {
    [[11, 6 + EH], [12, 7 + EH], [13, 6 + EH]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });
    [[5, 23], [6, 25], [18, 23], [17, 25]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });
  }
  // tortie/calico colour patches (invisible where patch == coat)
  ellipse(7.5, 24, 2.3, 2.8, 'X', ['C', 'K']); ellipse(16, 26, 2.2, 2.2, 'X', ['C', 'K']);
}

// --- rear-up "bat the butterfly": the cat sits up TALL on its haunches, reaching
//     for a butterfly overhead. Front legs are NOT baked - they're drawn live as
//     reaching/swiping paws in renderRearBat. Grid 24x30 (matches the sit sprite).
function composeRearUp(B) {
  B = B || {};
  const CX = 12, fluff = !!B.fluff, cheek = B.cheek || 0;
  const headRx = B.headRx || 6.3, headRy = B.headRy || 5.8;
  const earY = B.earApexY == null ? 1 : B.earApexY, ew = B.earW || 2.4, eo = B.earOut || 4;
  const eRx = B.eyeRx || 2, eRy = B.eyeRy || 2.4;
  // tail curling behind for balance (drawn first, behind the body)
  [[18.5, 27], [20.5, 26], [22, 24], [22.2, 22]].forEach(([c, r]) => ellipse(c, r, 1.6, 1.6, 'C'));
  ellipse(22.2, 22, 1.0, 1.0, 'W', ['C']);                 // pale tail tip
  // wide planted rear/haunches at the base
  ellipse(CX, 27, 7.6, 4.0, 'C');
  ellipse(8.4, 26, 3.0, 2.7, 'C'); ellipse(15.6, 26, 3.0, 2.7, 'C');
  // upright torso column rising from the base
  ellipse(CX, 18.5, 4.8, 7.4, 'C');
  // head up top
  ellipse(CX, 8, headRx, headRy, 'C');
  if (cheek) { ellipse(CX - headRx * 0.7, 9.6, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6, 1.7, 2.2, 'C'); }
  if (fluff) { ellipse(5.4, 10.4, 1.9, 2.4, 'C'); ellipse(18.6, 10.4, 1.9, 2.4, 'C'); }
  // ears up
  triangle(CX - eo - 0.5, earY, CX - eo - ew, 7.6, CX - eo + ew, 6.4, 'K');
  triangle(CX + eo + 0.5, earY, CX + eo + ew, 7.6, CX + eo - ew, 6.4, 'K');
  const iw = ew * 0.55;
  triangle(CX - eo - 0.3, earY + 2, CX - eo - iw, 7.2, CX - eo + iw, 6.6, 'I');
  triangle(CX + eo + 0.3, earY + 2, CX + eo + iw, 7.2, CX + eo - iw, 6.6, 'I');
  if (fluff) { ellipse(CX - eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); ellipse(CX + eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); }
  // exposed white throat + belly down the upright front
  ellipse(CX, 12.5, 3.0, 2.2, 'W', ['C']);
  ellipse(CX, 19.5, 3.2, 7.2, 'W', ['C']);
  // two little hind paws peeking at the base
  ellipse(9.4, 29, 2.0, 1.3, 'W', ['C']); ellipse(14.6, 29, 2.0, 1.3, 'W', ['C']);
  // eyes + nose (looking up)
  ellipse(9, 8.2, eRx, eRy, 'E'); ellipse(15, 8.2, eRx, eRy, 'E');
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  if (B.tabby) {
    [[11, 6], [12, 7], [13, 6]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });
    for (let r = 14; r < 26; r += 2) for (let c = 6; c < 19; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
  }
  ellipse(8, 20, 2.2, 2.8, 'X', ['C', 'K']); ellipse(16, 24, 2.0, 2.2, 'X', ['C', 'K']);
}

const spriteHunt = buildSprite(30, 20, composeHunt);
const TW = 24 * CELL, TH = 24 * CELL;            // front-facing kneading-cat dims (per-coat sprites built below)
// Sit grid is always 24x30, so SW/SH and the mochi bands stay constant across the
// per-coat body builds (different shapes, same canvas). The sit sprites themselves
// are built per coat below, once PATTERNS + their builds are defined.
const SW = 24 * CELL, SH = 30 * CELL;            // sit dims (mochi uses these)
const HW = spriteHunt.SW, HH = spriteHunt.SH;    // hunt dims
let playArea = null;   // { x,y,w,h } fractions of the screen; the cat stays inside it
let geomBottomInset = null;   // taskbar height (DIP) from main; legacy floor inset
let geomBottomWorkY = null;   // work-area bottom (taskbar/Dock top) measured from the window's top edge; authoritative floor line (DPI-correct, clamp-agnostic)
// X margins from the cat's CENTER: the body is SW/2 wide each side, and the sit
// tail sweeps a further ~55px to the RIGHT (see drawTail) - so the right margin
// is bigger, ensuring a hard throw at the screen edge never clips the tail.
const EDGE_L = SW / 2 + 8, EDGE_R = SW / 2 + 60;
const HOME_MARGIN_R = SW / 2 + 80;   // right home sits this far in from the right edge (clears the system tray/clock)
const HOME_MARGIN_L = SW / 2 + 20;   // left home sits this far in from the left edge
const FLOOR_GAP = 0;                 // px the feet rest ABOVE the taskbar line (tunable in one place; 0 = flush)
const SMALL_MARGIN = 4;              // resting margin from the very screen bottom when there's NO bottom taskbar (top/side/auto-hide)
// Home corner: which bottom side the cat spawns at and drifts back to. Defaults to
// the right (clears the tray/clock); set restSide:'left' to keep it bottom-left.
function restSideLeft() { return !!(config && config.restSide === 'left'); }
function homeX() { return zoneClampX(restSideLeft() ? HOME_MARGIN_L : viewW - HOME_MARGIN_R); }
function zoneClampX(v) {
  if (!playArea) return clamp(v, EDGE_L, viewW - EDGE_R);
  const a = playArea.x * viewW + EDGE_L, b = (playArea.x + playArea.w) * viewW - EDGE_R;
  return clamp(v, Math.min(a, b), Math.max(a, b));
}
function zoneClampY(v) {
  if (!playArea) return clamp(v, SH + 10, viewH - 10);
  const a = playArea.y * viewH + SH, b = (playArea.y + playArea.h) * viewH - 10;
  return clamp(v, Math.min(a, b), Math.max(a, b));
}
// The cat's resting foot line = the top edge of the taskbar/Dock. Derived from
// the BOTTOM work-area inset only - on macOS the menu bar is a TOP inset
// (availTop > 0) and must not raise the cat; the Dock (if at the bottom) is the
// remainder. Falls back to a small margin when there's no bottom inset.
function groundBaselineY() {
  // Preferred: main's absolute floor line = the work-area bottom (taskbar/Dock top)
  // measured from the window top. Clamp to viewH so the cat never lands below the
  // visible window: on Windows the overlay is clamped to the work area (viewH already
  // excludes the taskbar), so the floor is simply the window bottom; on macOS the
  // overlay covers the full display and the floor is the Dock line. When the floor is
  // the very window bottom (no bottom taskbar), lift a hair off the edge.
  if (geomBottomWorkY != null) {
    // Sit right ON the work-area bottom (taskbar/Dock top) - the shadow is drawn at
    // pos.y, so this lands the cat's ground contact flush on the line. restingY() clamps
    // it into the window (viewH - 2) when the OS kept the overlay off the taskbar.
    return Math.min(geomBottomWorkY, viewH) - FLOOR_GAP;
  }
  // Legacy inset path (older main without bottomWorkY): only correct when the overlay
  // actually covers the taskbar region.
  if (geomBottomInset != null) return viewH - (geomBottomInset > 0 ? geomBottomInset + FLOOR_GAP : SMALL_MARGIN);
  const s = window.screen;
  const topInset = Math.max(0, s.availTop || 0);
  const bottomInset = Math.max(0, (s.height || 0) - (s.availHeight || 0) - topInset);
  return viewH - (bottomInset > 0 ? bottomInset + FLOOR_GAP : 48);
}
// Floor-lock: when on (the default), the cat rests on the ground line and only
// strolls horizontally - it never autonomously wanders up the screen. Orthogonal
// to the play area, which still bounds left/right. config is null until the first
// onConfig, so an unset flag reads as "on".
function floorLockOn() { return !(config && config.floorLock === false); }
function restingY() {
  return floorLockOn() ? clamp(groundBaselineY(), SH + 10, viewH - 2) : zoneClampY(groundBaselineY());
}

// offscreen buffer big enough for either sprite
const oc = document.createElement('canvas');
oc.width = Math.max(SW, HW, TW); oc.height = Math.max(SH, HH, TH);
const octx = oc.getContext('2d'); octx.imageSmoothingEnabled = false;
const HEAD_SRC = 14 * CELL, FEET_SRC = 7 * CELL, MID_SRC = SH - HEAD_SRC - FEET_SRC;


const sprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 30, () => composeSit({ ...BUILDS[b], tabby: TABBY[i] })));
// each coat also gets its own typing (kneading) body, so every breed types differently
// one shared front "kneading cat" shape, recoloured per coat (+ tabby stripes / fluffy tufts)
const typeSprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 24, () => composeTypeFront({ tabby: TABBY[i], fluff: BUILDS[b].fluff })));
// and a dedicated loaf (resting) body per coat - same 24x30 size as the sit sprite
const loafSprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 30, () => composeLoaf({ ...BUILDS[b], tabby: TABBY[i] })));
// and a rear-up "bat the butterfly" body per coat - same 24x30 size as the sit sprite
const rearSprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 30, () => composeRearUp({ ...BUILDS[b], tabby: TABBY[i] })));
const DEFAULT_PATTERN = Math.max(0, PATTERNS.findIndex((p) => p.name === 'Tuxedo'));   // tuxedo is the out-of-box coat
const storedPattern = localStorage.getItem('pattern');
let patternIndex = storedPattern != null ? Number(storedPattern) : DEFAULT_PATTERN;
if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = DEFAULT_PATTERN;
const forcedPattern = qp.get('pattern');
if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }

// Custom coats: layer user-defined palettes (from themes.json, sent by main over
// IPC) on top of the built-in coats, building each one's sit + type sprites at
// runtime. Re-applied wholesale on every update so add/delete just work.
// Cached "cold" (non-overheat) palette, rebuilt only when the coat changes - avoids
// recomputing ~12 colour conversions every single frame. Invalidated in applyThemes().
let _palKey = -1, _coldPalRGB = null, _coldPal = null;
const BASE_PATTERNS = PATTERNS.length;
function applyThemes(list) {
  _palKey = -1;   // coat palettes changed -> force a cold-palette rebuild next frame
  PATTERNS.length = BASE_PATTERNS; PATTERN_BUILD.length = BASE_PATTERNS; TABBY.length = BASE_PATTERNS;
  sprites.length = BASE_PATTERNS; typeSprites.length = BASE_PATTERNS; loafSprites.length = BASE_PATTERNS; rearSprites.length = BASE_PATTERNS;
  for (const th of (Array.isArray(list) ? list : [])) {
    if (!th || !th.name || !th.coat) continue;
    const build = BUILDS[th.build] ? th.build : 'standard';
    PATTERNS.push({ name: th.name, coat: th.coat, mark: th.mark || th.coat, white: th.white || th.coat,
      patch: th.patch || th.coat, eye: th.eye || '#8bbf5a', nose: th.nose || '#e0888f',
      inner: th.inner || '#f0b6a0', outline: th.outline || '#222831' });
    PATTERN_BUILD.push(build);
    TABBY.push(!!th.tabby);
    sprites.push(buildSprite(24, 30, () => composeSit({ ...BUILDS[build], tabby: !!th.tabby })));
    typeSprites.push(buildSprite(24, 24, () => composeTypeFront({ tabby: !!th.tabby, fluff: BUILDS[build].fluff })));
    loafSprites.push(buildSprite(24, 30, () => composeLoaf({ ...BUILDS[build], tabby: !!th.tabby })));
    rearSprites.push(buildSprite(24, 30, () => composeRearUp({ ...BUILDS[build], tabby: !!th.tabby })));
  }
  if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = DEFAULT_PATTERN;
  if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HOT_BODY = '#d9534f', HOT_OUTLINE = '#7a1f1a';

// ---- draw the cat body into context g (local origin 0,0) -------------------
// the 'H' halo renders at reduced opacity so the outline reads as a soft glow rim
// rather than a hard bright sticker ring, while the dark 'O' outline stays crisp.
const HALO_ALPHA = 0.55;
function drawCat(g, sp, t, palRGB, o) {
  const { bob = 0, blinking = false, look = { x: 0, y: 0 }, typing = false, eyeMode = 'open', blush = false, dilate = 1 } = o;
  const closed = blinking || eyeMode === 'happy';
  const grid = sp.grid, COLS = sp.COLS, ROWS = sp.ROWS;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = grid[r][c];
    if (ch === '.') continue;
    const base = ch === 'E' ? (closed ? palRGB.C : palRGB.E) : palRGB[ch];
    if (!base) continue;
    const isOut = ch === 'O';
    const f = BODY.has(ch) || (ch === 'E' && closed) ? Math.max(0.82, 1.12 - (r / ROWS) * 0.34)   // floor the body shade so dark coats don't sink into the outline
      : isOut ? 1.16 - (r / ROWS) * 0.30                                                            // rim-light: outline lit at the top, darker below
      : 1;
    g.globalAlpha = ch === 'H' ? HALO_ALPHA * clamp(1.3 - (r / ROWS) * 0.7, 0.5, 1.4) : 1;          // halo glows from the top, fades along the bottom
    g.fillStyle = f === 1 ? rgbStr(base) : shadeStr(base, f);
    g.fillRect(c * CELL, r * CELL + bob, CELL, CELL);
  }
  g.globalAlpha = 1;
  if (!typing) {
    g.strokeStyle = 'rgba(245,245,245,0.6)'; g.lineWidth = 1; g.lineCap = 'round';
    const my = sp.muzzle.y + bob, cl = sp.muzzle.x - 4.5 * CELL, cr = sp.muzzle.x + 4.5 * CELL;
    // whiskers are alive: a slow waft plus a quick twitch every ~5s (t==0 on the
    // contact sheet => no offset, so QA frames stay byte-stable).
    const waft = Math.sin(t / 1400) * 0.6;
    const twitch = (t % 5200) < 200 ? Math.sin(t / 26) * 1.5 : 0;
    for (const [sx, dir] of [[cl, -1], [cr, 1]]) for (let i = 0; i < 3; i++) {
      const tipY = my + i * 5 - 1 + waft + twitch + Math.sin(t / 900 + i) * 0.5;
      g.beginPath(); g.moveTo(sx, my + i * 3 - 2); g.lineTo(sx + dir * 13, tipY); g.stroke();
    }
  }
  if (blush) {
    g.globalAlpha = 0.52; g.fillStyle = '#ffaab8';
    for (const e of sp.eyes) {
      if (e.w <= 0) continue;
      const bx = Math.round(e.cx - 2), by = Math.round(e.cy + e.h * 0.55 + bob);
      g.fillRect(bx, by, 5, 2); g.fillRect(bx + 1, by + 2, 3, 1);  // soft oval blush cluster
    }
    g.globalAlpha = 1;
  }
  if (eyeMode === 'happy') {
    g.strokeStyle = rgbStr(palRGB.O); g.lineWidth = 2; g.lineCap = 'round';
    for (const e of sp.eyes) { if (e.w <= 0) continue; g.beginPath(); g.arc(e.cx, e.cy + bob - 1, e.w * 0.5, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
  } else if (!blinking) {
    const eLook = typing ? { x: look.x * 0.3, y: 0.85 } : look;
    for (const e of sp.eyes) {
      if (e.w <= 0) continue;                         // profile sprites have eyes on one side only
      const pw = Math.max(4, Math.round(e.w * 0.46 * dilate)), ph = Math.max(5, Math.round(e.h * 0.7 * Math.min(dilate, 1.12)));
      const cx = e.cx + eLook.x * (e.w * 0.30), cy = e.cy + eLook.y * (e.h * 0.26) + bob;
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
// A big keyboard key the cat presses; `lit` = currently pressed (lights up, glows,
// sinks); `label` is the letter on the cap (home-row F / J). Reads on any backdrop.
function drawKey(cx, topY, w, h, lit, label) {
  const x0 = Math.round(cx - w / 2), y = Math.round(topY);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(cx, y + h + 4, w / 2 + 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#565c6a'; ctx.fillRect(x0, y + h - 3, w, 7);                      // front/side
  ctx.fillStyle = lit ? '#f2f4f8' : '#cfd3da'; ctx.fillRect(x0, y, w, h - 2);        // top face (brightens a touch on press)
  ctx.fillStyle = lit ? '#ffffff' : '#e7eaef'; ctx.fillRect(x0 + 2, y, w - 4, 3);    // highlight
  ctx.fillStyle = '#3a3f48';                                                         // dark edges
  ctx.fillRect(x0 - 1, y, 1, h + 4); ctx.fillRect(x0 + w, y, 1, h + 4); ctx.fillRect(x0, y - 1, w, 1);
  if (label) {                                                                       // letter on the keycap
    ctx.fillStyle = lit ? '#1b6cff' : '#6b7280';
    ctx.font = `bold ${Math.round(h * 0.78)}px "Consolas", "SF Mono", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, y + (h - 2) / 2 + 0.5);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }
}
// The two forelegs the profile cat taps with - drawn live (NOT baked into the
// sprite) so the paws lift and strike. They reach forward-right from the chest
// (shX, shY) onto the two keys; two-tone (outline + coat) so they read on any coat.
// The cat's forelegs in true PIXEL-SPRITE style (like the Comnyang reference):
// chunky grid-aligned columns with the same dark outline as the body - no smooth
// vector curves. Each leg hops on/off its key in whole-pixel steps like real
// sprite animation; the paw is a white pixel mitt with a toe split, and square
// pink toe beans flash on the underside while a paw is lifted.
function drawKneadPaws(palRGB, lcx, rcx, keyTop, lp, rp, shY) {
  const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const paw = (kx, side, press) => {
    const lift = Math.round((1 - press) * 2) * 2.5;   // stepped 0 / 2.5 / 5 px sprite-style lift
    const out = lift >= 2 ? side * 2 : 0;             // lifted paw steps a hair outward (off the bib)
    const cx = kx + out;
    const capTop = keyTop + Math.round(press * 3);    // the key sinks as it's pressed
    const pwW = 13, pwH = 7;                          // paw block
    const pY = capTop - pwH + 2 - lift;               // paw rides the cap, hops up on the lift
    const pX = cx - pwW / 2;
    const ax = cx - side * 2 - 6, aw = 11;            // leg column, a touch inboard of its key
    const top = Math.round(shY), aH = pY - top + 3;
    // leg: outline slab + flat fur core - same blocky look as the body sprite
    rect(ax, top, aw, aH, O);
    rect(ax + 2.5, top, aw - 5, aH, C);
    // paw: outlined white pixel mitt
    rect(pX - 2, pY - 2, pwW + 4, pwH + 4, O);
    rect(pX, pY, pwW, pwH, W);
    if (lift >= 2) {                                  // lifted: underside shows square toe beans
      rect(cx - 3, pY + 3.5, 6, 3, '#ff8fa3');        // big pad
      rect(cx - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(cx - 1.5, pY, 3, 3, '#ff8fa3'); rect(cx + 3.5, pY + 0.5, 3, 3, '#ff8fa3');  // three toes
    } else {
      rect(cx - 1, pY + 2, 2, pwH - 2, O);            // planted: toe split down the mitt
    }
  };
  paw(lcx, -1, lp);   // left leg onto the left key
  paw(rcx, 1, rp);    // right leg onto the right key
}
// Front-facing "keyboard kneading" (Comnyang-style): the cat faces the viewer,
// leaning over two big keycaps, typing with its own arms. The animation is
// designed, not just oscillated: a snappy strike (eased), the body DIPS into
// each press and LEANS toward the striking paw, the eyes track the active paw,
// and every ~4.5s it plants BOTH paws for a happy double-press beat.
function renderTypeFront(t, palRGB, pal, overheat, blinking, look) {
  const sp = overheat ? 36 : 60;                                   // knead tempo
  const wave = Math.sin(t / sp);
  const snap = (v) => Math.pow(Math.max(0, v), 0.6);               // fast strike, soft lift
  const cyc = t % 4500, both = cyc > 3900 ? Math.sin(((cyc - 3900) / 600) * Math.PI) : 0;
  const lp = Math.max(snap(wave), both), rp = Math.max(snap(-wave), both);
  const dip = (lp + rp) * 1.6;                                     // body sinks into each press
  const leanA = (rp - lp) * 0.05 * (1 - both);                     // ...and tilts toward the striking paw
  const oy = Math.round(pos.y - TH);
  drawShadow(pos.x, pos.y, 0.18, 36);
  // ---- the cat: motion lives in ONE transform (pivot at the feet) so the body
  // weight-shifts smoothly instead of jittering by rounded pixel offsets.
  const typeSp = typeSprites[patternIndex];
  octx.clearRect(0, 0, oc.width, oc.height);
  drawCat(octx, typeSp, t, palRGB, { bob: 0, blinking, look: { x: (rp - lp) * 0.5, y: 0.6 } });
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(leanA);
  ctx.drawImage(oc, 0, 0, TW, TH, -TW / 2, -TH + dip, TW, TH);
  ctx.restore();
  // ---- two big blank keycaps, each pressed by its own arm ----
  const lcx = pos.x - 15, rcx = pos.x + 15, keyTop = pos.y - 12;
  drawKey(lcx, keyTop + Math.round(lp * 3), 24, 11, lp > 0.6);
  drawKey(rcx, keyTop + Math.round(rp * 3), 24, 11, rp > 0.6);
  drawKneadPaws(palRGB, lcx, rcx, keyTop, lp, rp, pos.y - 29 + dip);
  if (overheat) drawSteam(t, pos.x, oy + 2 * CELL);
}
// One front paw reaching toward a point: a SHORT two-tone forearm + white mitt with
// toe-beans. Proportional (short reach), so it reads as a paw, not a stretchy arm.
function drawReachPaw(palRGB, sx, sy, px, py) {
  const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
  const adx = px - sx, ady = py - sy, aLen = Math.hypot(adx, ady) || 1, aAng = Math.atan2(ady, adx);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(aAng);
  ctx.fillStyle = O; ctx.fillRect(-1, -4, aLen, 8);              // outline forearm
  ctx.fillStyle = C; ctx.fillRect(-1, -2.5, aLen, 5);           // coat core
  ctx.restore();
  const pwW = 8, pwH = 6, pX = Math.round(px - pwW / 2), pY = Math.round(py - pwH / 2);
  ctx.fillStyle = O; ctx.fillRect(pX - 2, pY - 2, pwW + 4, pwH + 4);   // paw outline
  ctx.fillStyle = W; ctx.fillRect(pX, pY, pwW, pwH);                    // white mitt
  ctx.fillStyle = '#ff8fa3'; ctx.fillRect(Math.round(px - 3), Math.round(py + 1), 6, 2); ctx.fillRect(Math.round(px - 1), Math.round(py - 2), 2, 2);   // toe beans
}
// Rear up on the haunches and BAT at the butterfly overhead with both front paws.
// The reared body brings the chest up near the bug, so the live paws only reach a
// short, natural distance (no rubber-arm). A near-miss sends the butterfly darting.
function renderRearBat(t, palRGB, blinking) {
  const sp = rearSprites[patternIndex] || sprites[patternIndex];
  const oy = Math.round(pos.y - SH);
  const hasBug = bfOn && bfMode !== 'out';
  const tgtX = hasBug ? bfX : pos.x;   // horizontal aim (or straight up in a --shot)
  drawShadow(pos.x, pos.y, 0.2, 34);
  octx.clearRect(0, 0, oc.width, oc.height);
  drawCat(octx, sp, t, palRGB, { bob: 0, blinking, look: { x: clamp((tgtX - pos.x) / 160, -1, 1), y: -0.75 } });   // eyes tip up at the bug
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(clamp((tgtX - pos.x) / 520, -0.08, 0.08));         // lean toward the bug
  ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
  ctx.restore();
  // two front paws BOXING up at the bug: they alternate (one strikes up while the other
  // loads), reaching just outside the head so the arms never cross the face
  const swing = (t - bfSwatT0) / 130;                // quick swipe tempo
  const shY = pos.y - SH * 0.60;
  let topPh = 0;
  for (const side of [-1, 1]) {
    const ph = Math.max(0, Math.sin(swing + (side < 0 ? 0 : Math.PI)));   // alternate up / load
    topPh = Math.max(topPh, ph);
    const restX = pos.x + side * 12, restY = shY - 4;
    const upX = pos.x + side * 21 + (tgtX - pos.x) * 0.14, upY = oy - 2;
    const pawX = restX + (upX - restX) * ph, pawY = restY + (upY - restY) * ph;
    drawReachPaw(palRGB, pos.x + side * 13, shY, pawX, pawY);
  }
  // near-miss: when a paw strikes up near the bug it startles and darts off (hit-cooldown)
  if (hasBug && topPh > 0.7 && Math.hypot(bfX - pos.x, bfY - (oy - 2)) < 50 && t > bfBatHit && bfMode !== 'dodge') {
    bfBatHit = t + 220; bfMode = 'dodge'; bfDodgeUntil = t + 360;
    const aw = Math.atan2(bfY - pos.y, bfX - pos.x) + (Math.random() - 0.5); bfVx = Math.cos(aw) * 9; bfVy = Math.sin(aw) * 9;
    if (!lowPower) idleSparkles.push({ x: bfX, y: bfY, t0: t });
  }
}
// Animated tail: rests low behind the haunch, lies along the ground sweeping
// right, then the last segments curl gently up. Tapers from a thick base to a
// pale rounded tip; flicks on idle actions and wags faster while petted.
// Drawn behind the body so its root tucks under.
function drawTail(footX, footY, t, pal, flickT0, petting) {
  const baseX = footX + SW * 0.20, baseY = footY - SH * 0.22, segLen = SH * 0.052;
  // Rest pose per segment (rad): dive down behind the haunch, level out along
  // the ground, then curl the tip up. (+y is down on canvas.)
  const REST = [1.30, 1.10, 0.85, 0.55, 0.28, 0.08, -0.05, -0.45, -0.85, -1.20];
  let flick = 0;
  if (flickT0 >= 0 && t - flickT0 < 650) { const e = (t - flickT0) / 650; flick = Math.sin(e * Math.PI * 3) * (1 - e) * 0.45; }
  const wag = Math.sin(t / 540) * ((config && config.reducedMotion) ? 0.07 : 0.12) + (petting ? Math.sin(t / 120) * 0.08 : 0);   // gentler resting sway in Calm mode
  const pts = [[baseX, baseY]];
  let x = baseX, y = baseY, dev = 0;
  for (let i = 0; i < REST.length; i++) {
    const w = (i + 1) / REST.length;                       // tip sways most; base barely moves
    dev += (wag + flick) * w * w + Math.sin(t / 430 + i * 0.6) * 0.03 * w;
    const ang = REST[i] - dev;
    x += Math.cos(ang) * segLen;
    y = Math.min(y + Math.sin(ang) * segLen, footY - 2.5); // the ground stops the tail
    pts.push([x, y]);
  }
  // Screen-edge budget: never sweep further right than EDGE_R allows for.
  let reach = 0; for (const p of pts) reach = Math.max(reach, p[0] - baseX);
  if (reach > 56) { const f = 56 / reach; for (const p of pts) p[0] = baseX + (p[0] - baseX) * f; }
  // Densify with quadratics through segment midpoints so the tapered
  // per-piece strokes show no corners.
  const sm = [pts[0]]; let px = pts[0][0], py = pts[0][1];
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    for (let k = 1; k <= 4; k++) {
      const u = k / 4, v = 1 - u;
      sm.push([v * v * px + 2 * v * u * pts[i][0] + u * u * mx,
               v * v * py + 2 * v * u * pts[i][1] + u * u * my]);
    }
    px = mx; py = my;
  }
  sm.push(pts[pts.length - 1]);
  // Two tapered passes: outline stays ~3px proud of the coat at every piece so
  // the sticker halo survives; the last stretch of coat is pale (dipped tip).
  const n = sm.length - 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    for (let j = 0; j < n; j++) {
      const s = (j + 0.5) / n;                             // 0 at base -> 1 at tip
      ctx.strokeStyle = pass === 0 ? pal.O : (s > 0.82 ? pal.W : pal.C);
      ctx.lineWidth = 7 - 4 * s + (pass === 0 ? 3 : 0);    // coat 7 -> 3, outline +3
      ctx.beginPath(); ctx.moveTo(sm[j][0], sm[j][1]); ctx.lineTo(sm[j + 1][0], sm[j + 1][1]); ctx.stroke();
    }
  }
}
// Head status indicators + heart live in effects.js (loaded before this script):
// drawThinkBubble / drawWorkBubble / drawDoneSpark / drawHeart.
let lastHot = null;
function sendHot(x, y, w, h, dragging) {
  if (SHOT || !window.cat) return;
  const o = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), dragging };
  if (lastHot && lastHot.dragging === o.dragging && Math.abs(lastHot.x - o.x) < 4 && Math.abs(lastHot.y - o.y) < 4 && Math.abs(lastHot.w - o.w) < 4 && Math.abs(lastHot.h - o.h) < 4) return;
  lastHot = o; window.cat.setHot(o);
}

// ---- live state -------------------------------------------------------------
let cursor = { x: 0, y: 0 }, prevCursor = { x: 0, y: 0 }, velEMA = 0;
let lastCursorMove = 0, staringT0 = -1, nextStareLook = 0;   // mouse-idle -> the cat stares at the cursor, then roams its eyes
let shakeFlips = 0, shakeDir = 0, lastFlipAt = 0, wobbleUntil = 0;   // mochi shake-wobble
let heat = 0, keyPulse = false, lastKeyAt = -9999;
let nextBlink = 1500, blinkUntil = 0, prevT = 0, labelUntil = 0;
let huntUntil = 0, pouncing = false, pounceT0 = 0, pounceFrom = null, pounceTarget = null;
let windingUp = false, windupT0 = 0;   // butterfly pounce: a brief anticipation coil before the spring
let huntTarget = null;   // hunt aims here (defaults to the cursor); the butterfly can borrow it
let bfOn = false, bfX = 0, bfY = 0, bfVx = 0, bfVy = 0, bfFlap = 0, bfMode = 'in', bfUntil = 0, bfNextVisit = 35000, bfPal = 0, bfNextPal = 0, bfWpX = 0, bfWpY = 0, bfNextDive = 0, bfDiveUntil = 0, bfDodgeUntil = 0, bfSwatCool = 0, bfEdgeSince = 0, bfIdleNextVisit = 0;
// paw-swat at the butterfly (a gentle reach that doesn't need a full pounce)
let bfSwatT0 = 0, bfSwatUntil = 0, bfBatHit = 0;
// a short fading sparkle trail behind the butterfly
let bfNextTrail = 0, bfTrail = [];
// "air currents" glider state (mirrors site/cat-live.js): a drifting figure-eight center + phase
let bfDriftCx = 0, bfDriftCy = 0, bfDriftTX = 0, bfDriftTY = 0, bfNextDrift = 0, bfPhase = 0;
let hearts = [], lastHeart = 0, lastBodyTrill = -9999;
// Pop one (sometimes a 2-3 burst) love particle with randomized size + drift so no
// two look alike; ~1 in 6 is a sparkle instead of a heart. `base` = typical heart scale.
function popLove(t, x, y, base, spreadX) {
  const calm = (config && config.reducedMotion) || lowPower;
  const n = calm ? 1 : (Math.random() < 0.22 ? (Math.random() < 0.4 ? 3 : 2) : 1);
  for (let i = 0; i < n; i++) {
    hearts.push({
      x: x + (Math.random() - 0.5) * spreadX,
      y: y + (Math.random() - 0.5) * 6,
      t0: t,
      s: base * (0.7 + Math.random() * 0.8),                 // 0.7x-1.5x of the context base size
      kind: (!calm && Math.random() < 0.18) ? 'spark' : 'heart',
      vy: 24 + Math.random() * 18,                           // rise distance over life (px)
      wobA: 2 + Math.random() * 5,                           // sideways wobble amplitude
      wobF: 4 + Math.random() * 4,                           // wobble frequency
      ph: Math.random() * Math.PI * 2,                       // wobble phase offset
      life: 950 + Math.random() * 500,                       // lifetime (ms)
    });
  }
}
let idleSparkles = [], nextIdleSparkle = 0;
let loafZZZ = [], nextLoafZ = 0;
let musicNotes = [], nextMusicNote = 0;        // floating notes while the Lobby Jam plays
let jamRunning = false, jamMoodCur = '';       // reconciled against config.lobbyJam (audio start/stop)
// stretch reminder (08) + AI-agent thinking/done (10/11)
let stretchT0 = -1, nextStretch = 0;
let agentState = 'idle', doneHopT0 = -1, doneHopPending = false, doneIsAgent = false, errorPending = false;
const STRETCH_INTERVAL = 1000 * 60 * 20, STRETCH_MS = 1700, DONE_MS = 760;
// scroll reaction (09): the cat grabs a vertical yarn rope and climbs it while you
// scroll - hand-over-hand, up when you scroll up and down when you scroll down,
// with a ball of yarn anchored on the floor. `paperLen` is the climb energy (grows
// while scrolling, decays to a gentle hang). `climbDir` is the eased -1..+1 heading.
let paperLen = 0, paperUntil = 0, scrollPulses = 0, scrollDirRaw = -1, climbDir = -1, climbAnim = 0, scrollRate = 0;
// liveliness: eased gaze, idle micro-actions, animated tail + frame governor
let smoothLook = { x: 0, y: 0 };
let lookTarget = null, lookTargetUntil = 0;
let nextIdleAt = 0, leanTarget = 0, lean = 0, cursorLean = 0, leanUntil = 0, tailFlickT0 = -1, loafUntil = 0, groomUntil = 0;
let playUntil = 0, playT0 = -1, mote = null;   // idle paw-play: the cat bats a drifting leaf with a front paw
let treat = null;   // a dropped treat (tray "Give a treat"): the cat trots over and noms it
let yawnUntil = 0;   // occasional sleepy yawn (open mouth + squint)
let nextRoam = 0, roamUntil = 0, roamFrom = null, roamTo = null, roamDur = 1500;   // autonomous wandering
let lastDrawn = 0, wantHighFps = true, rafPaused = false;
let lowPower = false;   // main's derived low-power flag (user toggle and/or on battery)
// Comnyang-style productivity layer: settings from main + reminder/break bubble
let config = null;
let bubbleText = '', bubbleUntil = 0;
let pomo = null;   // { on, phase: 'focus'|'break', endsAt } - main owns the clock
let purring = false;
// Comnyang mood/energy model: 0-100, decays over time, bumped by stimuli. Bands
// (calm/playful/zoomies) gate + scale every behavior; see bandOf()/intensity.
let energy = 68;   // start a touch more playful
let startleT0 = -1, startleUntil = 0, startleMode = 'creep', startleFrom = null, startleTo = null, startleCooldownUntil = -9999;
let zoomiesT0 = -1, prevBand = '', spinUntil = 0;

let pos;
try { pos = JSON.parse(localStorage.getItem('pos')); } catch (e) { /* ignore */ }
if (SHOT) pos = { x: 130, y: 250 };
if (SHOT && qp.get('treat') === '1') treat = { x: 210, y: 250, phase: 'nom', nomUntil: Infinity };   // preview render: npx electron . --shot --treat=1
else if (!pos || typeof pos.x !== 'number') pos = { x: homeX(), y: viewH - 80 };
pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
// Start each launch resting on the taskbar line (keep the remembered X, snap Y to
// the baseline) so the cat always begins the day on the same line, never mid-screen.
if (!SHOT) pos.y = restingY();
// Don't let the home spot jam against the clock: when there's no custom play area,
// pull a far-right-parked cat in from the edge on launch (only ever moves it left).
if (!SHOT && !playArea) pos.x = restSideLeft() ? Math.max(pos.x, homeX()) : Math.min(pos.x, homeX());
let head = { x: pos.x, y: pos.y - SH, vx: 0, vy: 0 };
let feet = { x: pos.x, y: pos.y, vx: 0, vy: 0 };
let grabbing = false;
let settingArea = false, areaDragStart = null, areaRect = null;   // "set play area (drag)" mode
let petBurstUntil = 0, downAt = 0, downX = 0, downY = 0;   // click-to-pet
const SETTLE_MS = 240;   // eased "settle/land" when the floor line moves (resize / DPI / display change)
let settleT0 = -1, settleFromY = 0, settleToY = 0, settleSquash = 0;

// Re-pin to the floor (taskbar line) once the overlay reaches its true full-screen
// size. The one-shot pin above runs at module load, where viewH / window.screen
// can be briefly wrong on a multi-monitor / HiDPI launch - so the cat may pin against a
// stale height and float mid-screen. resize() (top of file) only resizes the canvas;
// this re-snaps the cat after the canvas settles. Main also calls win.setBounds() on
// display changes (see main.js refit), which fires 'resize' too.
function floorIdle() {
  const t = performance.now();
  const startled = startleT0 >= 0 && t < startleUntil;
  return !grabbing && !pouncing && !startled && !(paperLen > 1) && !(roamUntil > t);
}
function repinFloor() {
  if (SHOT || SHEET) return;
  if (typeof pos === 'undefined' || !pos) return;   // resize can fire before pos exists
  if (!floorLockOn()) { pos.x = zoneClampX(pos.x); restSprings(); persistPos(); resumeRaf(); return; }
  if (!floorIdle()) return;                          // never yank the cat mid-interaction
  pos.x = zoneClampX(pos.x);
  const target = restingY();
  if (Math.abs(target - pos.y) > 1) { settleFromY = pos.y; settleToY = target; settleT0 = performance.now(); }   // ease the drop, don't teleport
  else { pos.y = target; settleT0 = -1; restSprings(); }
  persistPos(); resumeRaf();
}
window.addEventListener('resize', repinFloor);
requestAnimationFrame(repinFloor);   // self-correct once the first frame's geometry is known

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
    if (cat === 'done') {
      doneHopPending = true; doneIsAgent = true; agentState = 'idle'; energy = clamp(energy + 25, 0, 100);
      bubbleText = 'Task complete!'; bubbleUntil = performance.now() + 2600;   // Comnyang-style done bubble
    }
    else if (cat === 'error') { errorPending = true; agentState = 'idle'; energy = clamp(energy + 30, 0, 100); }
    else if (cat === 'working') { agentState = 'working'; energy = clamp(energy + 8, 0, 100); }
    else if (cat === 'thinking') { agentState = 'thinking'; energy = clamp(energy + 6, 0, 100); }
    else agentState = 'idle';
    resumeRaf();
  });
  if (window.cat.onScroll) window.cat.onScroll((dir) => { scrollPulses++; if (typeof dir === 'number') scrollDirRaw = dir; });
  if (window.cat.onThemes) window.cat.onThemes((list) => { applyThemes(list); if (SHEET) renderSheet(); else resumeRaf(); });
  if (window.cat.onMood) window.cat.onMood((c) => {
    if (c === 'zoomies') energy = 96;
    else energy = 30;                     // calm down
    resumeRaf();
  });
  if (window.cat.onSetArea) window.cat.onSetArea(() => { settingArea = true; areaDragStart = null; areaRect = null; resumeRaf(); });
  if (window.cat.onConfig) window.cat.onConfig((c) => {
    if (!c) return;
    const prevSide = config ? config.restSide : null;
    config = c;
    // Rest-side toggled live -> stroll over to the newly chosen home corner.
    if (prevSide !== null && prevSide !== c.restSide && !SHOT && !grabbing) {
      const now = performance.now();
      roamFrom = { x: pos.x, y: pos.y };
      roamTo = { x: homeX(), y: floorLockOn() ? restingY() : pos.y };
      roamDur = 1400; roamUntil = now + roamDur; nextRoam = now + 12000;
    }
    if (master) master.gain.value = volNow();
    // reconcile the Lobby Jam audio with the new config (covers settings, tray, auto-resume)
    const lj = (c.lobbyJam && typeof c.lobbyJam === 'object') ? c.lobbyJam : { on: false, mood: 'cozy' };
    if (lj.on && !jamRunning) { if (window.jamStart) window.jamStart(lj.mood); jamRunning = true; jamMoodCur = lj.mood; }
    else if (!lj.on && jamRunning) { if (window.jamStop) window.jamStop(); jamRunning = false; }
    else if (lj.on && jamRunning && lj.mood !== jamMoodCur) { if (window.jamSetMood) window.jamSetMood(lj.mood); jamMoodCur = lj.mood; }
    playArea = c.playArea || null;
    pos.x = zoneClampX(pos.x); pos.y = floorLockOn() ? restingY() : zoneClampY(pos.y); persistPos();
    if (typeof c.pattern === 'number') patternIndex = clamp(c.pattern, 0, PATTERNS.length - 1);
    resumeRaf();
  });
  if (window.cat.onPower) window.cat.onPower((p) => { lowPower = !!(p && p.lowPower); resumeRaf(); });
  if (window.cat.onRemind) window.cat.onRemind((d) => triggerReminder(d && d.message));
  if (window.cat.onNotify) window.cat.onNotify((d) => triggerNotify(d));
  if (window.cat.onBreak) window.cat.onBreak(() => triggerBreak());
  if (window.cat.onTreat) window.cat.onTreat(() => dropTreat());
  if (window.cat.onPomo) window.cat.onPomo((d) => { pomo = d || null; resumeRaf(); });
  if (window.cat.onGeom) window.cat.onGeom((g) => {
    if (g && Number.isFinite(g.bottomInset)) geomBottomInset = g.bottomInset;
    if (g && Number.isFinite(g.bottomWorkY)) geomBottomWorkY = g.bottomWorkY;
    if (typeof pos !== 'undefined' && pos && (pos.x < EDGE_L || pos.x > viewW - EDGE_R)) pos.x = homeX();   // a resolution/display change stranded the cat off-screen -> re-home
    repinFloor();   // settle onto the now-correct floor line (guards idle/floor-lock internally)
  });
}

// Replace {name} (and provide clean fallbacks when no name is set).
function catName() { return config && config.name ? config.name : ''; }
function template(msg) {
  return fillPlaceholders(msg, { name: catName() });
}
// A generic notification from main: speech bubble + optional meow.
// (Any Windows toast is raised in main; here we just draw + chirp.)
function triggerNotify(d) {
  if (!d) return;
  bubbleText = template(d.message) || 'Meow!';
  bubbleUntil = performance.now() + (d.ttl || 5000);
  stretchT0 = performance.now();
  if (config && config.soundOn && d.sound !== false) playMeow();
  resumeRaf();
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
// --- Treat: tray "Give a treat" drops a little fish nearby; the cat trots over and
//     noms it (look down, hearts, a happy chirp, an energy bump). Uses the roam
//     machinery to walk, re-aiming each time the walk expires until it arrives.
const TREAT_STANDOFF = 26;   // how far beside the treat the cat stands to eat
function treatApproachX() { return zoneClampX(treat.x - Math.sign(treat.x - pos.x || 1) * TREAT_STANDOFF); }
function dropTreat() {
  if (SHOT || typeof pos === 'undefined' || !pos) return;
  const side = pos.x < viewW / 2 ? 1 : -1;                    // drop toward the roomier side
  const tx = clamp(pos.x + side * (130 + Math.random() * 90), EDGE_L, viewW - EDGE_R);
  treat = { x: tx, y: restingY(), phase: 'walk', nomUntil: 0 };
  addEnergy(8);                                               // a treat is exciting
  resumeRaf();
}
function updateTreat(t, f) {
  if (!treat) return;
  if (f.grabbing || f.hunting || f.startleActive || f.typing || paperLen > 1) return;   // interactions pause the trek
  if (treat.phase === 'nom') { if (t > treat.nomUntil) { addEnergy(12); treat = null; } return; }
  const approach = treatApproachX();
  const dist = Math.abs(pos.x - approach);
  if (roamUntil <= t) {
    if (dist > 10) {                                          // still walking -> (re)aim at the treat
      roamFrom = { x: pos.x, y: pos.y };
      roamTo = { x: approach, y: floorLockOn() ? restingY() : pos.y };
      roamDur = clamp(dist * 3, 400, 1800); roamUntil = t + roamDur; nextRoam = t + 20000;
    } else {                                                  // arrived -> nom it
      treat.phase = 'nom'; treat.nomUntil = t + 1100;
      lookTarget = { x: treat.x, y: treat.y }; lookTargetUntil = t + 1100;
      popLove(t, pos.x, (pos.y - SH) - 4, 1.6, 12);
      if (config && config.soundOn) playChirp();
    }
  }
}
function drawTreat() {
  if (!treat) return;
  const x = treat.x, y = treat.y - 5;                         // rest on the floor line, beside the feet
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#5a3514'; ctx.lineWidth = 2; ctx.fillStyle = '#e8943c';
  ctx.beginPath(); ctx.ellipse(x, y, 10, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();   // body
  ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 16, y - 6); ctx.lineTo(x + 16, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();   // tail
  ctx.fillStyle = '#f7f1e6'; ctx.beginPath(); ctx.arc(x - 4, y - 1.5, 1.6, 0, Math.PI * 2); ctx.fill();   // eye white
  ctx.fillStyle = '#3a2f26'; ctx.beginPath(); ctx.arc(x - 4, y - 1.5, 0.8, 0, Math.PI * 2); ctx.fill();   // pupil
  ctx.restore();
}

// ---- procedural sound lives in audio.js (loaded before this script) --------
// audio() / playMeow() / startPurr() / stopPurr() / playChirp() / playMrrp() are
// defined there and shared via the overlay's global script scope.

// Speech bubble above the head - same dark-rounded style as the coat label.
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

// Pomodoro pixel timer - a tiny dark panel with a phase dot (tomato = focus,
// green = break) and an mm:ss countdown, floating beside the cat.
function drawPomoTimer(x, y, t) {
  const remain = Math.max(0, (pomo.endsAt || 0) - Date.now());
  const mm = String(Math.floor(remain / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
  const focus = pomo.phase !== 'break';
  const w = 56, h = 20;
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = 'rgba(20,20,24,0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 5); else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = focus ? 'rgba(232,90,70,0.9)' : 'rgba(139,191,90,0.9)';
  ctx.lineWidth = 1; ctx.stroke();
  // phase dot pulses gently so the timer reads as alive
  const pulse = 0.7 + Math.sin(t / 500) * 0.3;
  ctx.globalAlpha = pulse; ctx.fillStyle = focus ? '#e85a46' : '#8bbf5a';
  ctx.fillRect(x + 5, y + h / 2 - 3, 6, 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f2f4f8'; ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${mm}:${ss}`, x + 15, y + h / 2 + 1);
  ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
}

// Ball of yarn - a wound coral disc with wrap-strands and a glint. Shared by the
// rope climb as the rope's anchor on the floor. (cx, cy) = ball centre.
function drawYarnBall(cx, cy) {
  const YARN_OUT = '#c8455a', YARN_DK = '#e0556e', YARN_MID = '#f2697f', YARN_LT = '#ff8fa3', YARN_HI = '#ffd0d8';
  const R = 12, bx = Math.round(cx), by = Math.round(cy);
  ctx.fillStyle = YARN_MID; ctx.beginPath(); ctx.ellipse(bx, by, R, R, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = YARN_DK;  ctx.beginPath(); ctx.ellipse(bx, by + 4, R, R - 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();                                                  // wrap strands, clipped to the disc
  ctx.beginPath(); ctx.ellipse(bx, by, R, R, 0, 0, Math.PI * 2); ctx.clip();
  ctx.lineCap = 'round';
  ctx.strokeStyle = YARN_LT; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(bx - R, by - 7); ctx.lineTo(bx + R, by + 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - R, by - 1); ctx.lineTo(bx + R - 2, by + 11); ctx.stroke();
  ctx.strokeStyle = YARN_OUT;
  ctx.beginPath(); ctx.moveTo(bx + R, by - 9); ctx.lineTo(bx - R + 1, by + 9); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = YARN_HI; ctx.fillRect(bx - 8, by - 9, 4, 3);   // top-left glint
}

// One gripping front paw on the rope: a rotated two-tone arm slab from the shoulder
// (sx,sy) to the grip (px,py), capped with a white mitt. `splay` shows pink toe-beans
// as the paw re-grabs. Same blocky language as the old drawFeedPaw.
function drawGripPaw(palRGB, sx, sy, px, py, splay) {
  const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const pwW = 12, pwH = 7, pY = Math.round(py - pwH / 2);
  const adx = px - sx, ady = py - sy, aLen = Math.hypot(adx, ady) || 1, aAng = Math.atan2(ady, adx);
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(aAng);
  ctx.fillStyle = O; ctx.fillRect(0, -5, aLen + 3, 10);   // outline slab
  ctx.fillStyle = C; ctx.fillRect(0, -3, aLen + 3, 6);    // coat core
  ctx.restore();
  const pX = px - pwW / 2;
  rect(pX - 2, pY - 2, pwW + 4, pwH + 4, O);   // paw outline
  rect(pX, pY, pwW, pwH, W);                    // white mitt
  if (splay) {
    rect(px - 3, pY + 3.5, 6, 3, '#ff8fa3'); rect(px - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(px + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
  } else {
    rect(px - 1, pY + 2, 2, pwH - 2, O);       // closed grip: toe-split line
  }
}

// Shared rope geometry so the rope, the procedural grip-paws, AND the raster climb
// frame all line up: a vertical strand from above the head down to a floor ball.
function ropeGeom(pos, t, energy) {
  const ropeX = Math.round(pos.x - 26);                      // just left of centre, in front of the chest
  const topY = Math.round(pos.y - SH - 55);                  // plenty of rope rising above the head
  const ballY = Math.round(pos.y - 6);                       // ball rests on the floor line
  const sway = Math.sin(t / 220) * (1 + energy / 40);        // whole-rope sway, livelier with energy
  const ropeAt = (y) => ropeX + Math.sin((y - topY) / 16 + t / 240) * sway;   // rope x at height y
  return { ropeX, topY, ballY, sway, ropeAt };
}

// The coral yarn rope + the floor ball (no cat) - shared by the procedural climb
// and the raster climb (which blits a painted cat over this).
function drawRope(pos, t, climbing, dir, energy) {
  const YARN_DK = '#e0556e', YARN_MID = '#f2697f', YARN_LT = '#ff8fa3';
  const g = ropeGeom(pos, t, energy), dirN = clamp(dir, -1, 1);
  const texOff = climbing ? t * 0.05 * dirN : 0;             // twist phase scrolls with climb dir
  for (let y = g.topY; y < g.ballY; y++) {
    const x = Math.round(g.ropeAt(y)), k = y - g.topY;
    ctx.fillStyle = YARN_MID; ctx.fillRect(x, y, 3, 1);
    if ((((k + texOff) % 5) + 5) % 5 < 2) { ctx.fillStyle = YARN_DK; ctx.fillRect(x + 2, y, 1, 1); }
    else { ctx.fillStyle = YARN_LT; ctx.fillRect(x, y, 1, 1); }
  }
  const ballBob = climbing ? Math.round(Math.sin(t / 120) * 1.5) : 0;
  drawYarnBall(g.ropeAt(g.ballY), g.ballY + ballBob);
}

// Procedural rope climb (FALLBACK when no raster frames are present): seated cat's
// two paws grip the rope hand-over-hand, hauling UP (dir<0) or DOWN (dir>0).
function drawRopeClimb(palRGB, pos, t, climbing, dir, energy, bob, sway) {
  const YARN_OUT = '#c8455a', YARN_LT = '#ff8fa3';
  const g = ropeGeom(pos, t, energy), dirN = clamp(dir, -1, 1);
  bob = bob || 0; sway = sway || 0;
  drawRope(pos, t, climbing, dir, energy);

  // two gripping paws, hand-over-hand (one holds while the other re-grabs). The
  // shoulders ride the body heave (bob/sway) while the grip points stay on the rope,
  // so the arms visibly extend and compress with each pull - a smooth climbing stroke.
  const shX = pos.x - 6 + sway, shY = Math.round(pos.y - SH * 0.42 - bob);   // shoulders at the chest
  const gripBaseY = Math.round(pos.y - SH * 0.42), SPAN = 22;
  const ph = (t / (climbing ? 460 : 1100)) % 1;                // faster cycle while actively climbing
  for (let i = 0; i < 2; i++) {
    const phi = (ph + i * 0.5) % 1;
    const yo = Math.cos(phi * Math.PI * 2) * (SPAN / 2);       // this paw rides high<->low
    const reach = phi < 0.5 ? Math.sin((phi / 0.5) * Math.PI) : 0;   // 0..1..0 arc on the re-grab
    const gy = gripBaseY + yo + (climbing ? reach * 6 * dirN : 0);   // bias the re-grab toward climb dir
    drawGripPaw(palRGB, shX, shY, g.ropeAt(gripBaseY + yo) + reach * 3.5, gy, climbing && reach > 0.55);
  }

  // falling debris flecks + bright twists riding the rope while actively climbing
  if (climbing && energy > 6) {
    const span = g.ballY - g.topY - 10;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) {                              // lint falls (gravity), regardless of dir
      const yy = ((t / 6 + i * 37) % span + span) % span;
      ctx.fillStyle = i === 1 ? YARN_OUT : YARN_LT;
      ctx.fillRect(Math.round(g.ropeAt(g.topY + yy) - 5 - i), Math.round(g.topY + 8 + yy), 2, 2);
    }
    ctx.fillStyle = '#fff0d6';
    for (let i = 0; i < 2; i++) {                              // highlight twists travel in the climb dir
      const yy = ((-t / 5 * dirN + i * 50) % span + span) % span;
      ctx.fillRect(Math.round(g.ropeAt(g.topY + yy)), Math.round(g.topY + 6 + yy), 2, 3);
    }
    ctx.globalAlpha = 1;
  }
}

// --- raster climb: painted PER-COAT sprite frames. A coat with its own set climbs
// with the painted art; a coat WITHOUT one uses the procedural climb in its colours ---
const CLIMB_SCENE_H = 2.4;      // full painted scene (cat+rope+ball) height as a multiple of the seated sprite
const CLIMB_ANCHOR_X = 0.5;     // horizontal anchor fraction of the frame (rope/cat centre over pos.x)
const CLIMB_DROP = 4;           // sink the scene a touch so the ball rests on the floor line
const coatSlug = (name) => String(name || '').toLowerCase().replace(/\s+/g, '-');
// Coats whose painted climb art doesn't match the coat: skip them so they fall back
// to the procedural climb in their OWN colours. 'gray' is painted as a green-eyed
// gray+white bicolor, but the gray coat is solid gray with gold eyes - repaint to re-enable.
const CLIMB_FRAME_SKIP = new Set(['gray']);
let climbImgs = {};   // { coat: { idle, up1, up2, down1, down2: Image } }
(function loadClimbFrames() {
  if (typeof CLIMB_FRAMES === 'undefined') return;
  for (const coat of Object.keys(CLIMB_FRAMES)) {
    if (CLIMB_FRAME_SKIP.has(coat)) continue;   // mismatched art -> use procedural climb
    climbImgs[coat] = climbImgs[coat] || {};
    for (const frame of Object.keys(CLIMB_FRAMES[coat])) {
      const im = new Image();
      im.onload = () => { climbImgs[coat][frame] = im; if (typeof resumeRaf === 'function') resumeRaf(); };
      im.src = CLIMB_FRAMES[coat][frame];
    }
  }
})();

// True only when THIS coat has its own decoded painted set (no cross-coat fallback).
const coatHasFrames = (coat) => { const f = climbImgs[coat]; return !!(f && f.idle && f.idle.complete); };

// Pick a frame for this coat: idle when hanging, alternating up1/up2 climbing up,
// down1/down2 climbing down. Returns null if the coat has no painted set.
function pickClimbImg(t, climbing, dir, coat) {
  const f = climbImgs[coat];
  if (!f) return null;
  if (!climbing || Math.abs(dir) < 0.25) return f.idle;
  const a = Math.floor(climbAnim) % 2;   // alternation rate scales with scroll intensity (see climbFps)
  if (dir < 0) return (a ? f.up2 : f.up1) || f.idle;
  return (a ? f.down2 : f.down1) || f.idle;
}

// Blit the painted climb scene (cat + rope + ball, one self-contained image)
// anchored so the yarn ball rests on the floor line.
function drawClimbFrame(pos, t, climbing, dir, coat, bob) {
  const img = pickClimbImg(t, climbing, dir, coat);
  if (!img || !img.naturalHeight) return;
  const h = Math.round(SH * CLIMB_SCENE_H), w = Math.round(img.naturalWidth * (h / img.naturalHeight));
  const dx = Math.round(pos.x - w * CLIMB_ANCHOR_X);
  const dy = Math.round(pos.y - h + CLIMB_DROP - (bob || 0));   // continuous heave on top of the crisp pose swap
  ctx.drawImage(img, dx, dy, w, h);
}
// Grooming: the cat raises a front paw to its muzzle and licks it, washing its face.
// Drawn over the seated sprite (cx = body centre, faceY = muzzle height).
function drawGroom(palRGB, cx, faceY, t) {
  const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // Two timescales: a slow lift/hold/lower envelope, plus quick tongue flicks on top.
  // The paw rises to the muzzle and settles there while the cat licks it several times
  // per raise, instead of one sleepy full-travel bob per cycle.
  const CYCLE = 2400;
  const c = (t % CYCLE) / CYCLE;                                   // 0..1 within a raise
  let lift = c < 0.16 ? c / 0.16 : c > 0.80 ? (1 - c) / 0.20 : 1;  // ease up, hold, ease down
  lift = Math.max(0, Math.min(1, lift));
  lift = lift * lift * (3 - 2 * lift);                            // smoothstep
  const licking = c > 0.16 && c < 0.80;                           // tongue works while paw is up
  const lick = licking ? (Math.sin(t / 90) + 1) / 2 : 0;          // fast flick, ~3 per raise
  const shY = faceY + 32;                                          // chest anchor y
  const pawX = cx - 2, pawY = faceY + 12 - lift * 11 + lick * 1.2; // rests at muzzle, nods per lick
  const pwW = 13, pwH = 7;
  const pY = Math.round(pawY - pwH / 2);
  const aw = 10, ax = Math.round(pawX - aw / 2);
  const aTop = pY + pwH;                                           // arm hangs below the paw
  const aH = Math.max(0, Math.round(shY) - aTop);
  if (aH > 0) { rect(ax, aTop, aw, aH, O); rect(ax + 2, aTop, aw - 4, aH, C); }
  rect(pawX - pwW / 2 - 2, pY - 2, pwW + 4, pwH + 4, O);          // paw outline
  rect(pawX - pwW / 2, pY, pwW, pwH, W);                           // white mitt
  if (lift > 0.6) {                                                // paw near face: show toe beans on underside
    rect(pawX - 3, pY + 3.5, 6, 3, '#ff8fa3');
    rect(pawX - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(pawX + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
  } else {
    rect(pawX - 1, pY + 2, 2, pwH - 2, O);                        // contact: toe-split line
  }
  if (licking) {                                                  // pink tongue flicking the paw
    ctx.globalAlpha = 0.45 + lick * 0.55;                         // wet flash on each reach
    const th = 2 + Math.round(lick * 3);                          // tongue extends, then retracts
    rect(pawX - 2, pY + pwH - 1, 4, th, '#ff9aa8');               // tongue
    rect(pawX - 1, pY + pwH - 1 + th, 2, 1, '#ff8090');           // pointed wet tip
    ctx.globalAlpha = 1;
  }
  const sp = (t % 1600) / 1600;                                   // occasional "squeaky clean" sparkle
  if (sp < 0.4) { ctx.globalAlpha = (0.4 - sp) * 2; ctx.fillStyle = '#fff6d6';
    const sx = cx + 11, sy = faceY - 5 - sp * 7; ctx.fillRect(sx, sy, 2, 2); ctx.fillRect(sx + 2, sy - 3, 1, 1); ctx.globalAlpha = 1; }
}

// Idle paw-play: a small leaf drifts in front of the seated cat and it bats at it with
// a front paw. Self-contained (it plays by itself, never grabs the cursor) so it reads
// as "alive and playful" without getting in the user's way.
function startPlay(t) {
  const side = Math.random() < 0.5 ? -1 : 1;
  playT0 = t; playUntil = t + 2600 + Math.random() * 1600;
  mote = { x: pos.x + side * 16, y: pos.y - SH * 0.95, vx: side * 0.5, vy: 0.5, spin: Math.random() * 6.28, side, batCyc: -1 };
  tailFlickT0 = t;
}
// A little tumbling leaf the cat bats around (drawn in screen coords).
function drawMote(x, y, spin) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(spin);
  ctx.fillStyle = '#5fae4e'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();      // leaf body
  ctx.fillStyle = '#7ccb62'; ctx.beginPath(); ctx.ellipse(-1, -0.7, 3.2, 1.5, 0, 0, Math.PI * 2); ctx.fill(); // lit top
  ctx.strokeStyle = '#3c7a32'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4.5, 0); ctx.lineTo(5, 0); ctx.stroke();                                       // center vein
  ctx.strokeStyle = '#4e8f40'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(7.6, 1.3); ctx.stroke();         // stem
  ctx.restore();
}
// A sleepy yawn drawn INTO the offscreen sprite buffer (so it scales/leans with the
// cat): a dark open mouth below the nose with a little pink tongue. `open` is 0..1.
function drawYawn(g, sp, bob, open) {
  const mx = sp.muzzle.x, my = sp.muzzle.y + bob + 6;
  g.fillStyle = '#3a2230';
  g.beginPath(); g.ellipse(mx, my, 2.8, 1.2 + 4.6 * open, 0, 0, Math.PI * 2); g.fill();   // open mouth
  g.fillStyle = '#ff8fa3';
  g.beginPath(); g.ellipse(mx, my + 1.8 * open, 1.5, 0.9 + 2.0 * open, 0, 0, Math.PI * 2); g.fill();   // tongue
}
// Update the leaf physics + draw the batting paw. Called from the seated render once
// per frame while `playing` (oy = sprite top). Reuses drawGripPaw for the reaching arm.
function renderPlay(palRGB, oy, t, step) {
  if (!mote) { mote = { x: pos.x + 14, y: oy + SH * 0.06, vx: 0, vy: 0.5, spin: 0.6, side: 1, batCyc: -1 }; if (playT0 < 0) playT0 = t; }   // QA --state=play
  // the leaf springs gently back toward a hover point in front of the face, with a
  // little gravity so it keeps sinking and the cat keeps batting it back up.
  const hoverX = pos.x + mote.side * 12, hoverY = oy + SH * 0.30;
  mote.vx += (hoverX - mote.x) * 0.010 * step;
  mote.vy += ((hoverY - mote.y) * 0.010 + 0.06) * step;
  mote.vx *= 0.93; mote.vy *= 0.93;
  mote.x += mote.vx * step; mote.y += mote.vy * step;
  mote.spin += 0.05 * step;
  // the left front paw reaches up toward the leaf and strikes once per cycle
  const CYC = 540, cyc = Math.floor((t - playT0) / CYC), phase = ((t - playT0) % CYC) / CYC;
  const strike = Math.sin(clamp(phase, 0, 1) * Math.PI);
  const shX = pos.x - 8, shY = oy + SH * 0.60, reach = 0.42 + strike * 0.5;
  const px = shX + (mote.x - shX) * reach, py = shY + (mote.y - shY) * reach;
  drawGripPaw(palRGB, shX, shY, px, py, strike > 0.55);   // splayed toe-beans on the strike
  if (cyc !== mote.batCyc && phase > 0.42 && phase < 0.72) {   // connect once per cycle near the strike peak
    mote.batCyc = cyc;
    const aw = Math.atan2(mote.y - shY, mote.x - shX) + (Math.random() - 0.5) * 0.8;
    mote.vx += Math.cos(aw) * 2.8; mote.vy += Math.sin(aw) * 1.4 - 2.0;   // knock it up and away
    idleSparkles.push({ x: mote.x, y: mote.y, t0: t });
    tailFlickT0 = t;
  }
  drawMote(mote.x, mote.y, mote.spin);
}

// hunt/pet tuning
const HUNT_TRIGGER = 0.4, HUNT_SPEED = 6, STANDOFF = 28, POUNCE_RANGE = 46, POUNCE_MS = 300, POUNCE_WINDUP_MS = 300;
// butterfly play: the cat only engages the butterfly once the cursor has been still this
// long (the cursor always wins). BF_TOP keeps the butterfly's targets off the top edge;
// BF_EDGE is the screen-edge keep-out for the whole sprite (covers the wingspan).
const BF_PLAY_IDLE = 1800, BF_TOP = 46, BF_EDGE = 18, BF_SCALE = 1.25;
// If you leave the machine alone (no cursor/keys) this long, a butterfly comes out so
// the cat has something to play with - then keeps dropping by every so often while idle.
const IDLE_BUTTERFLY_MS = 7500;
// Come back after being away this long and the cat notices you: happy eyes, hearts, a chirp.
const GREET_IDLE_MS = 90000;
// "air currents & the chase" (mirrors site/cat-live.js): the butterfly glides a drifting
// figure-eight across the screen; the cat creeps after it via the existing roam machinery.
const DRIFT_PHASE_RATE = 0.012, DRIFT_EASE = 0.012, LISSA_RATIO = 2, LISSA_DELTA = Math.PI / 2;
const DRIFT_REPICK_MS = [4200, 3000], WANDER_ACCEL = 0.022;
const BURST_RATIO = 3.0, BURST_GATE = 0.7, BURST_LIFT = 26, FLAP_BURST_MULT = 2.2;
const BUG_INTEREST_MIN = 90, BUG_STANDOFF = 70, BUG_RETARGET_DIST = 60, BUG_CREEP_MS = 1400, BUG_POUNCE_TRIGGER = POUNCE_RANGE * 1.9;
// Keep the butterfly playing in a zone AROUND the cat's head (the zone follows the cat)
// instead of roaming the whole screen. The figure-eight swing stays < the zone half-extents.
// All tunable: widen BF_ZONE_X for more room, shrink for a cozier play space.
const BF_ZONE_X = 150, BF_ZONE_TOP = 130, BF_ZONE_BOT = 40;
const BF_LISSA_AX = 70, BF_LISSA_AY = 44;
// Gentle paw-swat at a butterfly that's near the head but just out of full-pounce range.
const BF_SWAT_RANGE = 150, BF_SWAT_MS = 600;

// mood/energy tuning (all tunable). Decay is per-ms; ~1.8/s gives a gentle drift
// back to calm when nothing is happening.
const ENERGY_DECAY = 0.0007;   // slower drift back to calm -> the cat stays lively/playful longer
const CALM_MAX = 50, PLAYFUL_MAX = 80;
const STARTLE_VEL = 3.5, STARTLE_JUMP = 320, STARTLE_MS = 820, ZOOMIES_MS = 2500;
// Night-time sleepiness: late at night the cat winds down toward calm faster, so it
// loafs and dozes more (a big stimulus can still rouse it). Cached to once a minute
// so we're not allocating a Date every frame.
const NIGHT_DECAY_MULT = 2.4;
let _nightAt = 0, _nightCached = false;
function isNight(t) {
  if (t - _nightAt > 60000) { const h = new Date().getHours(); _nightCached = h >= 23 || h < 6; _nightAt = t; }
  return _nightCached;
}
const STARTLE_RANGE = 160;   // only flinch when the cursor lunges NEAR the cat - not on every fast move across the screen
function bandOf(e) { return e <= CALM_MAX ? 'calm' : e <= PLAYFUL_MAX ? 'playful' : 'zoomies'; }
function addEnergy(n) { energy = clamp(energy + n, 0, 100); }

function restSprings() { head = { x: pos.x, y: pos.y - SH, vx: 0, vy: 0 }; feet = { x: pos.x, y: pos.y, vx: 0, vy: 0 }; }
function persistPos() { localStorage.setItem('pos', JSON.stringify({ x: pos.x, y: pos.y })); }

// ---- main loop --------------------------------------------------------------
// ---- butterfly visitor (periodic): flits in, pesters the cat, leaves ---------
var BFLY_STYLES = [
  { name: 'iridescent', halo: '#dfe9ff', main: '#5a3fa0', core: '#56cfe1', glint: '#bdecff', body: '#241f30', shimmer: true },
  { name: 'monarch',    halo: '#ffe6cc',  main: '#e8943c', core: '#b5641d', veins: '#3a2412', dots: '#fff6e8', body: '#1c140c' },
  { name: 'pastel',     halo: '#ffe9f6', main: '#d98fc9', core: '#efb3df', core2: '#cdbcf2', glint: '#ffffff', body: '#2a2433' },
];
function drawButterfly(g, bx, by, sc, st, flap, t, rot) {
  const open = 0.30 + 0.70 * Math.abs(Math.cos(flap));
  let core = st.core;
  if (st.shimmer) core = lerpHex(st.core, '#9a6cff', 0.5 + 0.5 * Math.sin(t / 430));
  g.save(); g.translate(Math.round(bx), Math.round(by)); g.scale(sc, sc); if (rot) g.rotate(rot);
  const E = (x, y, rx, ry, col) => { if (rx <= 0.2) return; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
  // soft glow so it reads on dark backgrounds (every style, including monarch)
  { const glow = st.halo || st.main; g.globalAlpha = 0.14; E(0, -1, 12 * open + 4, 11, glow); g.globalAlpha = 0.10; E(0, 1, 8, 9, glow); g.globalAlpha = 1; }
  for (const side of [-1, 1]) {
    const ux = side * 7 * open, lx = side * 5.5 * open;
    if (st.halo) { g.globalAlpha = 0.85; E(ux, -3, 6.2 * open + 1, 6.6, st.halo); E(lx, 5, 4.6 * open + 1, 4.8, st.halo); g.globalAlpha = 1; }
    E(ux, -3, 6.0 * open, 6.2, st.main); E(ux, -3.6, 4.0 * open, 4.4, core);
    E(lx, 5, 4.4 * open, 4.6, st.main); E(lx, 5, 2.8 * open, 3.0, st.core2 || core);
    if (st.veins) { g.strokeStyle = st.veins; g.lineWidth = 0.7; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(0, -2); g.lineTo(side * (8 * open + k), -7 + k); g.stroke(); } }
    if (st.dots) { E(side * 9 * open, -6, 0.8, 0.8, st.dots); E(side * 6 * open, 2, 0.8, 0.8, st.dots); }
    if (st.glint) { g.fillStyle = st.glint; g.fillRect(Math.round(side * 8 * open - 0.5), -6, 1, 1); }
  }
  E(0, 0, 1.4, 8, st.body); E(0, -7, 1.6, 1.9, st.body);
  g.strokeStyle = st.body; g.lineWidth = 0.8; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -8); g.lineTo(-2.6, -12.5); g.moveTo(0, -8); g.lineTo(2.6, -12.5); g.stroke();
  g.fillStyle = st.glint || core; g.fillRect(-3, -13, 1, 1); g.fillRect(2, -13, 1, 1);
  g.restore();
}
function startBflyVisit(t) {
  if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) pos = { x: viewW / 2, y: viewH - 80 };
  bfOn = true; bfMode = 'in'; bfUntil = t + 22000 + Math.random() * 8000;
  bfPal = (bfPal + 1) % BFLY_STYLES.length; bfNextPal = t + 8000 + Math.random() * 4000;
  // enter from whichever side has more room (toward screen interior) so it never spawns
  // pinned into a corner.
  const side = pos.x < viewW / 2 ? 1 : -1;
  bfX = clamp(pos.x + side * 220, BF_EDGE, viewW - BF_EDGE); bfY = clamp(pos.y - SH - 40, BF_TOP, viewH - BF_EDGE);
  bfVx = -side * 4; bfVy = 0; bfWpX = pos.x; bfWpY = pos.y - SH * 0.8; bfNextDive = t + 3000; bfDiveUntil = 0; bfDodgeUntil = 0; bfTrail = [];
  // seed the glider CENTER on the cat so it flies in from the side and settles into the zone
  bfDriftCx = pos.x; bfDriftCy = clamp(pos.y - SH - 30, BF_TOP, viewH - BF_EDGE);
  bfDriftTX = bfDriftCx; bfDriftTY = bfDriftCy; bfPhase = Math.random() * Math.PI * 2; bfNextDrift = t + 500;
}
// Flight + cat reaction. f = { follow, grabbing, hunting, typing, petting, startleActive, calm }.
function updateButterflyDesk(t, dt, step, f) {
  const force = SHOT && qp.get('bfly') === '1';
  const allow = f.follow && !lowPower && !(config && config.reducedMotion) && !(config && config.butterflyOn === false) && !f.grabbing && !f.typing;
  if (!bfOn) {
    // "do nothing -> the cat plays": once the cursor + keyboard have been idle a while,
    // summon a butterfly early (and keep them coming while you're away), instead of only
    // on the slow ~50-100s periodic timer.
    const idleMs = t - Math.max(lastCursorMove, lastKeyAt);
    const idleWants = idleMs > IDLE_BUTTERFLY_MS && t > bfIdleNextVisit;
    if (force) startBflyVisit(t);
    else if (allow && f.calm && (t > bfNextVisit || idleWants)) startBflyVisit(t);
    if (!bfOn) return;
  }
  // honor reduced-motion if it gets toggled on mid-visit: let the butterfly leave gracefully
  if (config && (config.reducedMotion || config.butterflyOn === false) && bfMode !== 'out') bfMode = 'out';   // toggled off mid-visit -> leave gracefully
  wantHighFps = true;
  const dtf = Math.min(dt, 50) / 16.67;
  if (t > bfNextPal) { bfPal = (bfPal + 1) % BFLY_STYLES.length; bfNextPal = t + 8000 + Math.random() * 4000; }
  const headX = pos.x, headY = pos.y - SH * 0.72;
  // the cat only plays with the butterfly while the cursor sits still; any cursor move
  // refreshes lastCursorMove (the cursor is always the priority).
  const cursorIdle = (t - lastCursorMove) > BF_PLAY_IDLE;
  if (t > bfUntil && bfMode !== 'out') bfMode = 'out';
  if (bfMode === 'dodge' && t > bfDodgeUntil) bfMode = 'wander';
  if (bfMode !== 'out') {
    if (bfMode === 'in' && (Math.hypot(bfX - headX, bfY - headY) < 160 || t > bfNextDive)) bfMode = 'wander';
    if (bfMode === 'wander' && t > bfNextDive) {
      bfMode = 'dive'; bfDiveUntil = t + 1800; bfNextDive = t + 3500 + Math.random() * 3500;
      if (cursorIdle && Math.random() < 0.55 && !f.hunting && !SHOT) { huntUntil = t + 1400; huntTarget = { x: bfX, y: bfY }; }
    }
    // hold the dive while a hunt is in progress so the bug stays reachable for the pounce
    if (bfMode === 'dive' && t > bfDiveUntil && t >= huntUntil) bfMode = 'wander';
  }
  let tx, ty, burst = false;
  if (bfMode === 'out') { tx = bfX < headX ? -40 : viewW + 40; ty = bfY; }
  else if (bfMode === 'dive') { tx = headX + Math.sin(t / 200) * 26; ty = headY - 6 + Math.cos(t / 170) * 12; }
  else if (bfMode === 'dodge') { tx = bfWpX; ty = bfWpY; }
  else {
    // air-current glider CONFINED to a zone around the cat's head (the zone follows the cat),
    // so the butterfly plays near the cat instead of roaming the screen. Flap-bursts still
    // climb within the band (mirrors site/cat-live.js's figure-eight, just penned in).
    bfPhase += DRIFT_PHASE_RATE * dtf;
    const ax = BF_LISSA_AX, ay = BF_LISSA_AY;
    const zL = Math.max(BF_EDGE, headX - BF_ZONE_X), zR = Math.min(viewW - BF_EDGE, headX + BF_ZONE_X);
    const zT = Math.max(BF_TOP, headY - BF_ZONE_TOP), zB = Math.min(viewH - BF_EDGE, headY + BF_ZONE_BOT);
    if (t > bfNextDrift) {
      // pick the figure-eight CENTER inside the zone, inset by the swing so the whole
      // oscillation stays inside it (min/max guard a degenerate zone near a screen edge)
      const cxLo = Math.min(zL + ax, zR - ax), cxHi = Math.max(zL + ax, zR - ax);
      const cyLo = Math.min(zT + ay, zB - ay), cyHi = Math.max(zT + ay, zB - ay);
      bfDriftTX = cxLo + Math.random() * (cxHi - cxLo);
      bfDriftTY = cyLo + Math.random() * (cyHi - cyLo);
      bfNextDrift = t + DRIFT_REPICK_MS[0] + Math.random() * DRIFT_REPICK_MS[1];
    }
    bfDriftCx += (bfDriftTX - bfDriftCx) * DRIFT_EASE * dtf;
    bfDriftCy += (bfDriftTY - bfDriftCy) * DRIFT_EASE * dtf;
    bfWpX = clamp(bfDriftCx + ax * Math.sin(bfPhase), zL, zR);
    let gy = bfDriftCy + ay * Math.sin(bfPhase * LISSA_RATIO + LISSA_DELTA);
    burst = Math.sin(bfPhase * BURST_RATIO) > BURST_GATE;
    if (burst) gy -= BURST_LIFT;                                      // flap-burst to gain height, then glide down
    bfWpY = clamp(gy, zT, zB);
    tx = bfWpX; ty = bfWpY;
  }
  let accel = bfMode === 'dodge' ? 0.02 : (bfMode === 'dive' ? 0.045 : (bfMode === 'out' ? 0.05 : WANDER_ACCEL));
  // ease-out: ease off the throttle as it nears the target so arrivals glide, not snap
  if (bfMode !== 'dodge' && bfMode !== 'out') accel *= clamp(Math.hypot(tx - bfX, ty - bfY) / 100, 0.4, 1);
  bfVx += (tx - bfX) * accel * dtf; bfVy += (ty - bfY) * accel * dtf;
  bfVx += Math.sin(t / 130 + 1.3) * 0.5 * dtf; bfVy += Math.sin(t / 90) * 0.6 * dtf;
  { const dx = bfX - cursor.x, dy = bfY - cursor.y, d = Math.hypot(dx, dy); if (d < 90 && d > 0.1) { const ff = (90 - d) / 90 * 3.6; bfVx += dx / d * ff * dtf; bfVy += dy / d * ff * dtf; } }
  bfVx *= 0.92; bfVy *= 0.92;
  const sp = Math.hypot(bfVx, bfVy), maxv = bfMode === 'dodge' ? 10 : (bfMode === 'out' ? 8 : 5.5);
  if (sp > maxv) { bfVx *= maxv / sp; bfVy *= maxv / sp; }
  bfX += bfVx * dtf; bfY += bfVy * dtf;
  bfFlap += (0.18 + sp * 0.03) * dtf * (burst ? FLAP_BURST_MULT : 1);   // wings beat harder during a climb-burst
  // despawn once it has flown off-screen — or, as a failsafe, if it has been leaving too long
  // (can't reach the edge for any reason), so it can never get trapped on-screen forever.
  if (bfMode === 'out' && (bfX < -30 || bfX > viewW + 30 || t > bfUntil + 6000)) { bfOn = false; huntTarget = null; bfNextVisit = t + 50000 + Math.random() * 50000; bfIdleNextVisit = t + 14000 + Math.random() * 10000; return; }
  // keep the sprite on-screen — but NOT while leaving, or the clamp pins it at the edge and it
  // can never reach the off-screen despawn threshold above (it would flutter there forever).
  if (bfMode !== 'out') {
    const m = 10;
    if (bfX < m) { bfX = m; bfVx = Math.abs(bfVx); } if (bfX > viewW - m) { bfX = viewW - m; bfVx = -Math.abs(bfVx); }
    if (bfY < m) { bfY = m; bfVy = Math.abs(bfVy); } if (bfY > viewH - m) { bfY = viewH - m; bfVy = -Math.abs(bfVy); }
  }
  // anti-stick safety net: if the butterfly lingers against ANY edge it has gotten trapped
  // (regardless of mode/cat position). Boot it back toward the cat's head.
  const atEdge = bfX <= BF_EDGE || bfX >= viewW - BF_EDGE || bfY <= BF_TOP || bfY >= viewH - BF_EDGE;
  if (atEdge) { if (!bfEdgeSince) bfEdgeSince = t; } else bfEdgeSince = 0;
  if (bfEdgeSince && t - bfEdgeSince > 600 && bfMode !== 'out') {
    bfMode = 'wander'; bfDriftTX = headX; bfDriftTY = headY - 40; bfNextDrift = t + 1500; bfEdgeSince = 0;   // re-aim the glide center inward
    bfVx += (headX - bfX) * 0.04; bfVy += (headY - bfY) * 0.04;   // re-aim inward, toward the cat
  }
  // short fading sparkle trail (kept tiny; skipped in low power)
  if (!lowPower && t > bfNextTrail) { bfTrail.push({ x: bfX, y: bfY, t0: t }); bfNextTrail = t + 90; }
  if (bfTrail.length) bfTrail = bfTrail.filter((s) => t - s.t0 < 480);
  // while a hunt is winding up (not yet airborne), keep the aim on the live butterfly so
  // the pounce lands on where it actually is, not a stale snapshot
  if (cursorIdle && t < huntUntil && !pouncing) huntTarget = { x: bfX, y: bfY };
  if (cursorIdle && !f.grabbing && !f.startleActive) {
    lookTarget = { x: clamp((bfX - headX) / 200, -1, 1), y: clamp((bfY - headY) / 150, -1, 1) }; lookTargetUntil = t + 250;
    // subtle head/body lean tracking the butterfly so the cat reads as watching it play
    if (!f.hunting && t > bfSwatCool) { leanTarget = clamp((bfX - pos.x) / 280, -0.06, 0.06); leanUntil = t + 220; }
  }
  const dh = Math.hypot(bfX - headX, bfY - headY);
  // the chase pays off: once the cat has crept within range of a calmly wandering bug, pounce at it
  if (cursorIdle && bfMode === 'wander' && dh < BUG_POUNCE_TRIGGER && !f.hunting && t >= huntUntil && t > bfSwatCool && !SHOT) {
    huntUntil = t + 1400; huntTarget = { x: bfX, y: bfY }; bfSwatCool = t + 900;
  }
  // gentle paw-swat: the bug is near the head but just out of pounce range (or the pounce is
  // cooling down) -> raise a front paw and swipe at it. Shares bfSwatCool with the lean + pounce
  // so the three never stack; ordered AFTER the pounce so a real pounce always wins.
  if (cursorIdle && !f.hunting && t >= huntUntil && bfMode !== 'out' && dh > 62 && dh < BF_SWAT_RANGE && t > bfSwatCool && roamUntil < t) {
    bfSwatT0 = t; bfSwatUntil = t + BF_SWAT_MS; bfSwatCool = t + 700; tailFlickT0 = t;
  }
  if (dh < 60 && t > bfDodgeUntil + 200 && !f.hunting && t >= huntUntil) {
    if (cursorIdle && t > bfSwatCool) { bfSwatCool = t + 900; tailFlickT0 = t; leanTarget = clamp((bfX - pos.x) / 120, -0.12, 0.12); leanUntil = t + 260; }
    bfMode = 'dodge'; bfDodgeUntil = t + 460;
    const aw = Math.atan2(bfY - headY, bfX - headX) + (Math.random() - 0.5);
    bfVx = Math.cos(aw) * 10; bfVy = Math.sin(aw) * 10;
    bfWpX = clamp(bfX + Math.cos(aw) * 90, 20, viewW - 20); bfWpY = clamp(bfY + Math.sin(aw) * 60, BF_TOP, viewH - 40);
  }
}

function draw(t) {
  // self-schedule; fully pause when the page is hidden (resumes on visibility)
  if (!document.hidden) requestAnimationFrame(draw); else { rafPaused = true; return; }
  // idle throttle: when nothing interactive is happening, render at a low fps to
  // spare the GPU (it composites the whole transparent overlay every drawn frame).
  // ~20fps normally, ~12fps in low power; active animation stays 60fps via wantHighFps.
  if (!wantHighFps && t - lastDrawn < (lowPower ? 80 : 48)) return;
  lastDrawn = t;

  const dt = Math.min(64, t - prevT); prevT = t;
  const step = Math.min(2.5, dt / 16);
  // eased settle onto the floor line (armed by repinFloor on resize / DPI / display change)
  if (settleT0 >= 0) {
    const se = clamp((t - settleT0) / SETTLE_MS, 0, 1);
    const k = 1 - Math.pow(1 - se, 3);                 // easeOutCubic
    pos.y = settleFromY + (settleToY - settleFromY) * k;
    settleSquash = (1 - k) * 0.03;                     // a whisper of squash that resolves on landing
    if (se >= 1) { pos.y = settleToY; settleT0 = -1; settleSquash = 0; restSprings(); persistPos(); }
    wantHighFps = true;
  }
  ctx.clearRect(0, 0, viewW, viewH);
  wantHighFps = true; // default high; the fully-idle calm path lowers it below

  // cursor velocity (px/ms, smoothed) + raw single-tick displacement (for startle)
  const moved = Math.hypot(cursor.x - prevCursor.x, cursor.y - prevCursor.y);
  const inst = moved / Math.max(1, dt);
  const cursorDx = cursor.x - prevCursor.x;
  velEMA = velEMA * 0.5 + inst * 0.5; prevCursor.x = cursor.x; prevCursor.y = cursor.y;   // mutate in place (no per-frame allocation)
  // any real cursor movement refreshes the idle timer and drops a stare instantly
  if (moved > 0.5) {
    const away = t - lastCursorMove;
    lastCursorMove = t;
    if (staringT0 >= 0) { staringT0 = -1; lookTarget = null; }
    // welcome back: you were away a good while -> the cat perks up and greets you
    // (happy eyes + hearts via petBurst, plus a friendly chirp). Same recipe as a tap.
    if (away > GREET_IDLE_MS && !SHOT && !grabbing && t >= petBurstUntil && !(startleT0 >= 0 && t < startleUntil)) {
      petBurstUntil = t + 1400; addEnergy(18);
      if (config && config.soundOn) playChirp();
    }
  }

  // shake-wobble: while held, fast side-to-side shaking (direction flips) makes
  // the stretched body wobble like jello. Flips expire quickly so a slow waggle
  // doesn't count; reduced motion skips the whole reaction.
  if (grabbing && !((config && config.reducedMotion) || lowPower)) {
    const dir = cursorDx > 6 ? 1 : cursorDx < -6 ? -1 : 0;
    if (dir && shakeDir && dir !== shakeDir) {
      shakeFlips = (t - lastFlipAt < 220) ? shakeFlips + 1 : 1;
      lastFlipAt = t;
      if (shakeFlips >= 4) {
        if (t > wobbleUntil && config && config.soundOn) playMrrp();   // one startled mrrp per wobble
        wobbleUntil = t + 850; shakeFlips = 0;
      }
    }
    if (dir) shakeDir = dir;
  } else { shakeFlips = 0; shakeDir = 0; }

  // mood/energy: decay toward calm, derive the active band + an intensity scalar
  // that scales existing behaviours (calm = mellow, zoomies = frantic). When mood
  // is off, behave exactly like before (band 'playful', intensity 1).
  const moodOn = !(config && config.moodOn === false);
  const startleOn = !(config && config.startleOn === false);   // flinch when the cursor lunges at it
  if (moodOn) energy = clamp(energy - dt * ENERGY_DECAY * (isNight(t) ? NIGHT_DECAY_MULT : 1), 0, 100);
  const band = moodOn ? bandOf(energy) : 'playful';
  const intensity = !moodOn ? 1 : band === 'calm' ? 0.6 : band === 'zoomies' ? 1.5 : 1;
  if (moodOn) {
    if (band === 'zoomies') { if (zoomiesT0 < 0) zoomiesT0 = t; if (t - zoomiesT0 > ZOOMIES_MS) { energy = 8; zoomiesT0 = -1; } }
    else zoomiesT0 = -1;
    if (band !== prevBand) { tailFlickT0 = t; prevBand = band; }   // ear/tail beat on a mood shift
  }

  if (keyPulse) { lastKeyAt = t; heat = Math.min(1, heat + 0.12); keyPulse = false; addEnergy(6); }
  heat = Math.max(0, heat - dt * 0.0009);

  // STARTLE: an abrupt cursor jump / velocity spike (the "sudden big change") makes
  // the cat flinch, freeze, then bolt or creep back. Cooldown stops re-fires.
  const startleNear = Math.hypot(cursor.x - pos.x, cursor.y - (pos.y - SH * 0.5)) < STARTLE_RANGE;
  if (moodOn && startleOn && !SHOT && !grabbing && t >= huntUntil && !pouncing && t > startleCooldownUntil && startleNear && (inst > STARTLE_VEL || moved > STARTLE_JUMP)) {
    startleT0 = t; startleUntil = t + STARTLE_MS; startleCooldownUntil = t + 1500;
    startleMode = Math.random() < 0.5 ? 'bolt' : 'creep';
    startleFrom = { x: pos.x, y: pos.y };
    const left = pos.x < viewW / 2;
    startleTo = { x: left ? zoneClampX(60) : zoneClampX(viewW - 60), y: zoneClampY(pos.y) };
    huntUntil = 0; pouncing = false; addEnergy(35);
    if (config && config.soundOn) playMrrp();
  }
  // finalize a finished startle: commit position, reset springs
  if (startleT0 >= 0 && t >= startleUntil) {
    pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
    persistPos(); restSprings(); startleT0 = -1;
  }
  if (errorPending) {   // an agent error makes the cat flinch in place (no bolt)
    startleT0 = t; startleUntil = t + STARTLE_MS; startleCooldownUntil = t + 1500;
    startleMode = 'creep'; startleFrom = { x: pos.x, y: pos.y }; startleTo = { x: pos.x, y: pos.y };
    errorPending = false;
    if (config && config.soundOn) playMrrp();
  }
  const startleActive = FORCED_STATE === 'startle' || (startleT0 >= 0 && t < startleUntil);

  // rope climb: scrolling builds climb energy; it bleeds off to a gentle hang.
  const pulses = scrollPulses;   // how many wheel ticks since last frame (= instantaneous scroll speed)
  if (scrollPulses > 0) {
    paperUntil = t + 700; paperLen = Math.min(70, paperLen + scrollPulses * 7); addEnergy(scrollPulses * 4); scrollPulses = 0;
  }
  if (FORCED_STATE === 'paper') { paperLen = 50; scrollDirRaw = qp.get('dir') === 'down' ? 1 : -1; }   // --dir=up|down for shots
  else if (t > paperUntil) paperLen = Math.max(0, paperLen - dt * 0.06);
  const paperActive = FORCED_STATE === 'paper' || paperLen > 1;
  const climbing = paperActive && (t < paperUntil || FORCED_STATE === 'paper');   // actively scrolling vs just hanging
  climbDir += (scrollDirRaw - climbDir) * Math.min(1, dt * 0.012);                 // eased -1 (up) .. +1 (down)
  const instRate = dt > 0 ? pulses / (dt / 1000) : 0;                              // wheel ticks/sec this frame (spiky)
  scrollRate += (instRate - scrollRate) * Math.min(1, dt * 0.005);                 // heavily smoothed scroll speed
  const climbFps = climbing ? clamp(1 + scrollRate * 0.09, 1, 6) : 0;             // gentle scroll ~1 fps .. hard flick ~6 fps
  climbAnim += (dt / 1000) * climbFps;                                             // frame accumulator (whole numbers = frame swaps)
  // Smooth climb heave: the body hauls up and dips with each hand-over-hand pull, so
  // the torso reads as climbing instead of hanging frozen. Amplitude grows a little
  // with scroll intensity; a gentle dangle remains while just hanging on the rope.
  const climbStroke = (t / (climbing ? 460 : 1100)) % 1;                          // matches the grip cycle in drawRopeClimb
  const climbBob = paperActive ? Math.sin(climbStroke * Math.PI * 2) * (climbing ? 2.2 + Math.min(scrollRate, 45) * 0.045 : 1.1) : 0;
  const climbSway = paperActive ? Math.cos(climbStroke * Math.PI * 2) * (climbing ? 1.0 : 0.6) : 0;

  // Mouse-hunt: when enabled in settings, a fast cursor flick (far enough away)
  // makes the cat crouch, stalk, and pounce. Off by config (or when the cat is set
  // to ignore the cursor) -> the cat stays put.
  const follow = !(config && config.followCursor === false);
  const huntOn = follow && !!(config && config.huntOn);
  const dCur = Math.hypot(cursor.x - pos.x, cursor.y - (pos.y - SH * 0.5));
  if (huntOn && !grabbing && !SHOT && velEMA > HUNT_TRIGGER && dCur > 70) { huntUntil = t + 1400; huntTarget = null; addEnergy(0.6 * step); }
  const hunting = !startleActive && (FORCED_STATE === 'hunt' || (huntOn && t < huntUntil) || (t < huntUntil && huntTarget && bfOn));

  // pet detection (cursor resting on the head, slow, not hunting/grabbing)
  const headBox = { x: pos.x - SW / 2, y: pos.y - SH, w: SW, h: SH * 0.42 };
  const inHead = cursor.x >= headBox.x && cursor.x <= headBox.x + headBox.w && cursor.y >= headBox.y && cursor.y <= headBox.y + headBox.h;
  const petting = FORCED_STATE === 'pet' || t < petBurstUntil || (!grabbing && !hunting && !startleActive && inHead && velEMA < 0.25);
  if (petting) addEnergy(0.6 * step);   // affection nudges mood up toward calm/playful
  if (petting && inHead && !grabbing) { leanTarget = clamp((cursor.x - pos.x) / 90, -0.10, 0.10); leanUntil = t + 200; }   // tilt the head into your hand

  // body touch (not the head): the cat leans/arches into your hand, tail up, looks
  // at you, and trills now and then - a different reaction than the head-pet purr.
  const bodyBox = { x: pos.x - SW / 2, y: pos.y - SH * 0.58, w: SW, h: SH * 0.58 };
  const inBody = cursor.x >= bodyBox.x && cursor.x <= bodyBox.x + bodyBox.w && cursor.y >= bodyBox.y && cursor.y <= bodyBox.y + bodyBox.h;
  const bodyPet = !FORCED_STATE && !petting && !grabbing && !hunting && !startleActive && inBody && velEMA < 0.25;
  if (bodyPet) {
    addEnergy(0.5 * step);
    leanTarget = clamp((cursor.x - pos.x) / 70, -0.13, 0.13); leanUntil = t + 200;   // arch toward the hand
    if (t - lastBodyTrill > 1500) { lastBodyTrill = t; tailFlickT0 = t; if (config && config.soundOn) playChirp(); }
  }

  // purr while petted (only when sound is on); start/stop once on the edge
  const wantPurr = petting && !SHOT && !!(config && config.soundOn);
  if (wantPurr && !purring) { startPurr(); purring = true; }
  else if (!wantPurr && purring) { stopPurr(); purring = false; }

  let typing, overheat, heatT;
  if (FORCED_STATE === 'overheat') { typing = true; overheat = true; heatT = 1; }
  else if (FORCED_STATE === 'typing') { typing = true; overheat = false; heatT = 0; }
  else { typing = !grabbing && !hunting && !startleActive && (t - lastKeyAt) < 350; overheat = heat > 0.7; heatT = overheat ? (heat - 0.7) / 0.3 : 0; }
  // rear-up bat: reach a butterfly overhead - its own top-level pose (like typing)
  const batting = FORCED_STATE === 'rearup' || (bfOn && bfMode !== 'out' && t < bfSwatUntil && !hunting && !typing && !petting && !bodyPet && !grabbing && !startleActive && !paperActive && roamUntil < t);

  // A real cat abandons its stroll the instant you interact. Cancel any active roam
  // so it never slides while petted/typing, and never resumes from a stale path
  // anchor after a hunt/startle/grab interrupts it (which would snap it back).
  if (roamUntil > t && (grabbing || hunting || startleActive || typing || petting || bodyPet)) {
    roamUntil = 0; roamFrom = null; roamTo = null;
  }

  const P = PATTERNS[patternIndex];
  const catSprite = sprites[patternIndex];   // this coat's body build (slender/stocky/fluffy/standard)
  const loafSprite = loafSprites[patternIndex] || catSprite;   // compact resting (loaf) body for the same coat
  let palRGB, pal;
  if (heatT) {                              // overheat tint is transient - rebuild fresh while it lasts
    palRGB = {
      O: toRgb(lerpHex(P.outline, HOT_OUTLINE, heatT)),
      C: toRgb(lerpHex(P.coat, HOT_BODY, heatT)),
      K: toRgb(lerpHex(P.mark, HOT_BODY, heatT)),
      W: toRgb(lerpHex(P.white, HOT_BODY, heatT * 0.5)),
      X: toRgb(lerpHex(P.patch, HOT_BODY, heatT)),
      I: toRgb(P.inner), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO),
    };
    pal = { O: rgbStr(palRGB.O), C: rgbStr(palRGB.C), W: rgbStr(palRGB.W), N: rgbStr(palRGB.N) };
  } else {                                  // common case: reuse the cached cold palette for this coat
    if (_palKey !== patternIndex) {
      _coldPalRGB = {
        O: toRgb(P.outline), C: toRgb(P.coat), K: toRgb(P.mark), W: toRgb(P.white), X: toRgb(P.patch),
        I: toRgb(P.inner), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO),
      };
      _coldPal = { O: rgbStr(_coldPalRGB.O), C: rgbStr(_coldPalRGB.C), W: rgbStr(_coldPalRGB.W), N: rgbStr(_coldPalRGB.N) };
      _palKey = patternIndex;
    }
    palRGB = _coldPalRGB; pal = _coldPal;
  }

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
    pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
    restSprings();
    const oy = Math.round(pos.y - SH);
    drawShadow(pos.x, pos.y, 0.16);
    octx.clearRect(0, 0, oc.width, oc.height);
    drawCat(octx, catSprite, t, palRGB, { bob: 0, blinking, look: { x: 0, y: -0.25 }, eyeMode: 'open', dilate: 1.5 - Math.min(se, 1) * 0.25 });   // fright blows the pupils wide, easing as it recovers
    ctx.save();
    ctx.translate(pos.x + jit, pos.y);
    ctx.scale(puff, puff);
    ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
    ctx.restore();
    drawDoneSpark(pos.x + 2, oy - 4, t);   // a startled "!" pops over the head
    sendHot(pos.x - SW / 2 - 6, oy - 6, SW + 12, SH + 12, false);
  } else if (hunting) {
    // ---- MOUSE HUNT: stalk toward the cursor, then pounce -------------------
    const _raw = huntTarget || cursor; const _ht = { x: zoneClampX(_raw.x), y: zoneClampY(_raw.y) }; const dx = _ht.x - pos.x, dy = _ht.y - pos.y, d = Math.hypot(dx, dy) || 1;   // aim ONLY inside the play area, so a pounce (incl. chasing a butterfly) never leaps to screen center
    let leap = 0, stretchY = 1, coil = 0, wiggle = 0;
    // the wind-up coil completes -> spring into the pounce
    if (windingUp && t - windupT0 >= POUNCE_WINDUP_MS) { windingUp = false; pouncing = true; pounceT0 = t; pounceTarget = { x: _ht.x, y: _ht.y }; }
    if (pouncing) {
      const e = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const ease = 1 - Math.pow(1 - e, 2);
      const tgt = pounceTarget || cursor;
      pos.x = pounceFrom.x + (tgt.x - pounceFrom.x) * ease;
      pos.y = pounceFrom.y + (tgt.y - pounceFrom.y) * ease;
      leap = Math.sin(e * Math.PI) * 32; stretchY = 1 + Math.sin(e * Math.PI) * 0.26;   // a big, paws-up leap
      // the catch: if the leap reaches a real butterfly, the cat bats it between its paws -> a happy
      // burst of stars + a heart, and the bug flutters up and away (escapes the paws).
      if (bfOn && huntTarget && bfMode !== 'out' && e > 0.4 && Math.hypot(bfX - pos.x, bfY - (pos.y - leap - HH * 0.55)) < 44) {
        const cx = pos.x, cy = pos.y - leap - HH * 0.6;
        for (let i = 0; i < 6; i++) idleSparkles.push({ x: cx + (Math.random() - 0.5) * 24, y: cy + (Math.random() - 0.5) * 16, t0: t });
        popLove(t, cx, cy - 6, 1.4, 10);
        bfMode = 'out'; bfVy = -11; bfVx = (bfX < cx ? -1 : 1) * 4; bfFlap += 3; addEnergy(22); tailFlickT0 = t;
      }
      if (e >= 1) { pouncing = false; huntUntil = 0; huntTarget = null; persistPos(); tailFlickT0 = t; idleSparkles.push({ x: pos.x, y: pos.y - HH * 0.7, t0: t }); }   // "got it!" beat
    } else if (windingUp) {
      // anticipation: hold position, crouch + butt-wiggle to telegraph the pounce ("it's about to do it")
      const wu = clamp((t - windupT0) / POUNCE_WINDUP_MS, 0, 1);
      coil = Math.sin(wu * Math.PI * 0.5);     // ease into the crouch
      stretchY = 1 - coil * 0.14;              // squash down (feet stay planted; see the ox/oy render below)
      wiggle = Math.sin(t / 55) * 2.4 * coil;  // side-to-side butt-wiggle (render-only offset)
    } else if (FORCED_STATE !== 'hunt' && d < POUNCE_RANGE) {
      // the butterfly pounce telegraphs with a wind-up coil first; the cursor hunt stays snappy
      if (bfOn && huntTarget) { windingUp = true; windupT0 = t; pounceFrom = { x: pos.x, y: pos.y }; }
      else { pouncing = true; pounceT0 = t; pounceFrom = { x: pos.x, y: pos.y }; pounceTarget = { x: _ht.x, y: _ht.y }; }   // leap toward the zone-clamped target (stays in the play area)
    } else if (FORCED_STATE !== 'hunt') {
      const mv = Math.min(Math.max(0, d - STANDOFF), HUNT_SPEED * step);
      pos.x += dx / d * mv; pos.y += dy / d * mv;
    }
    pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
    restSprings();
    const creep = Math.round(Math.sin(t / 90) * 1.5);
    const ox = Math.round(pos.x - HW / 2 + wiggle), oy = Math.round(pos.y - (windingUp ? HH * stretchY : HH)) - Math.round(leap);
    const facingLeft = FORCED_STATE !== 'hunt' && (huntTarget || cursor).x < pos.x;
    if (pouncing && pounceFrom && pounceTarget) {
      const pe = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const pdx = pounceTarget.x - pounceFrom.x, pdy = pounceTarget.y - pounceFrom.y, plen = Math.hypot(pdx, pdy) || 1;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = (0.28 - i * 0.07) * Math.sin(pe * Math.PI);
        ctx.fillStyle = pal.C;
        ctx.fillRect(Math.round(pos.x - pdx / plen * i * 7 - 2), Math.round(pos.y - leap - HH * 0.5 - pdy / plen * i * 7 - 3), 4, 6);
      }
      // two front paws reaching out toward the butterfly at the apex of the leap
      const reach = Math.sin(pe * Math.PI) * 17, ux = pdx / plen, uy = pdy / plen;
      const hx = pos.x + ux * reach, hy = pos.y - leap - HH * 0.5 + uy * reach, pa = Math.atan2(uy, ux);
      ctx.globalAlpha = Math.sin(pe * Math.PI);
      ctx.fillStyle = pal.C;
      for (const so of [-4.5, 4.5]) { ctx.beginPath(); ctx.ellipse(hx + so, hy, 3.4, 2.5, pa, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#f3d2e2';
      for (const so of [-4.5, 4.5]) ctx.fillRect(Math.round(hx + so - 1), Math.round(hy - 1), 2, 2);   // toe beans
      ctx.globalAlpha = 1;
    }
    drawShadow(pos.x, pos.y, 0.18, 26);
    octx.clearRect(0, 0, oc.width, oc.height);
    drawCat(octx, spriteHunt, t, palRGB, { bob: creep, blinking, look, eyeMode: 'open', dilate: pouncing ? 1.5 : (windingUp ? 1.32 + coil * 0.2 : 1.32) });
    ctx.save();
    if (facingLeft) { ctx.translate(ox + HW, oy); ctx.scale(-1, stretchY); ctx.drawImage(oc, 0, 0, HW, HH, 0, 0, HW, HH); }
    else { ctx.translate(ox, oy); ctx.scale(1, stretchY); ctx.drawImage(oc, 0, 0, HW, HH, 0, 0, HW, HH); }
    ctx.restore();
    sendHot(0, 0, 0, 0, false); // non-interactive while hunting -> clicks pass through
  } else {
    if (windingUp) windingUp = false;   // hunt ended mid-wind-up -> drop the stale coil
    // ---- not hunting: keep mochi springs settling toward pos ---------------
    const restTop = { x: pos.x, y: pos.y - SH };
    if (FORCED_STATE === 'mochi') {
      head.x = pos.x; head.y = pos.y - SH * 1.7; head.vx = head.vy = 0; feet.x = pos.x; feet.y = pos.y; feet.vx = feet.vy = 0;
    } else {
      const ht = grabbing ? { x: clamp(cursor.x, EDGE_L, viewW - EDGE_R), y: clamp(cursor.y, 8, viewH - 8) } : restTop;   // keep body/tail on-screen while dragged to an edge
      const HK = grabbing ? 0.45 : 0.14, HD = grabbing ? 0.45 : 0.16;
      head.vx += ((ht.x - head.x) * HK - head.vx * HD) * step; head.vy += ((ht.y - head.y) * HK - head.vy * HD) * step;
      head.x += head.vx * step; head.y += head.vy * step;
      const ftx = grabbing ? head.x : pos.x, fty = grabbing ? head.y + SH : pos.y, FK = 0.07, FD = 0.12;
      feet.vx += ((ftx - feet.x) * FK - feet.vx * FD) * step; feet.vy += ((fty - feet.y) * FK - feet.vy * FD) * step;
      if (grabbing) feet.vy += 2.2 * step;
      feet.x += feet.vx * step; feet.y += feet.vy * step;
    }
    // --- autonomous roaming: a real cat wanders. When calm (not busy), now
    // and then stroll to a random spot inside the play area with a little hop-walk.
    if (nextRoam === 0) nextRoam = t + 8000 + Math.random() * 9000;
    const roamIdle = !grabbing && !hunting && !startleActive && !typing && !petting && !bodyPet && !FORCED_STATE && t > groomUntil && t >= playUntil && agentState === 'idle' && !(config && config.roamOn === false) && !((config && config.reducedMotion) || lowPower);
    // the chase: when a butterfly is drifting far off (and the cursor is idle), creep toward it
    const cursorIdleNow = (t - lastCursorMove) > BF_PLAY_IDLE;
    const bugStalkOn = roamIdle && follow && cursorIdleNow && bfOn && bfMode !== 'out' &&
      Math.hypot(bfX - pos.x, bfY - (pos.y - SH * 0.5)) > BUG_INTEREST_MIN;
    if (bugStalkOn) {
      const side = Math.sign(bfX - pos.x) || 1;
      const tgX = zoneClampX(bfX - side * BUG_STANDOFF);
      if (roamUntil < t || !roamTo || Math.abs(roamTo.x - tgX) > BUG_RETARGET_DIST) {   // (re)aim as the bug drifts
        roamFrom = { x: pos.x, y: pos.y }; roamTo = { x: tgX, y: pos.y };               // walk horizontally toward it
        roamDur = BUG_CREEP_MS; roamUntil = t + roamDur; nextRoam = t + 20000;          // pause random roam during the chase
      }
    } else if (roamIdle && roamUntil < t && t > nextRoam) {
      roamFrom = { x: pos.x, y: pos.y };
      // Bias the wander target toward the home corner (restSide): r*r clusters near 0,
      // so the cat tends to hang out on its preferred side while still roaming widely.
      const skew = Math.random() * Math.random();
      const frac = restSideLeft() ? skew : 1 - skew;
      const rx = playArea ? (playArea.x + frac * playArea.w) * viewW : frac * viewW;
      // Floor-lock keeps strolls on the ground line (left/right only); otherwise pick
      // a vertical target inside the play area / lower screen.
      const ry = floorLockOn() ? restingY() : (playArea ? (playArea.y + Math.random() * playArea.h) * viewH : viewH * 0.45 + Math.random() * viewH * 0.5);
      roamTo = { x: zoneClampX(rx), y: floorLockOn() ? ry : zoneClampY(ry) };
      roamDur = 1500; roamUntil = t + roamDur; nextRoam = t + 11000 + Math.random() * 13000; tailFlickT0 = t; loafUntil = 0;
    }
    if (roamUntil > t && roamFrom && roamTo) {
      const e = clamp((t - (roamUntil - roamDur)) / roamDur, 0, 1);
      const ease = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;   // easeInOut
      pos.x = roamFrom.x + (roamTo.x - roamFrom.x) * ease;
      pos.y = roamFrom.y + (roamTo.y - roamFrom.y) * ease - Math.abs(Math.sin(e * Math.PI * 5)) * (bugStalkOn ? 1 : 3);   // low creep while stalking, hop-walk otherwise
      restSprings();
      if (e >= 1) persistPos();
      wantHighFps = true;
    }
    const axX = feet.x - head.x, axY = feet.y - head.y, len = Math.hypot(axX, axY) || 1, ang = Math.atan2(axY, axX), ratio = len / SH;
    const speed = Math.hypot(head.vx, head.vy) + Math.hypot(feet.vx, feet.vy);
    const calm = !grabbing && FORCED_STATE !== 'mochi' && Math.abs(ratio - 1) < 0.02 && speed < 0.45 && Math.abs(ang - Math.PI / 2) < 0.03;
    const jamming = !!(config && config.lobbyJam && config.lobbyJam.on) || FORCED_STATE === 'jam';
    const jamMotion = jamming && !((config && config.reducedMotion) || lowPower);
    const jamPhase = (jamMotion && window.jamBeatPhase) ? window.jamBeatPhase() : 0;
    const bob = Math.round(Math.sin(t / (typing ? 220 : 700)) * 3) + (jamMotion ? Math.round(Math.sin(jamPhase * Math.PI * 2) * 2) : 0);

    // --- mouse-idle stare: after 10s of a still cursor the cat fixates on it, then
    // roams its eyes (mostly small wanders near the cursor, some glances around).
    // Only while following + seated/idle; any cursor move drops it (handled above).
    const canStare = follow && !hunting && !startleActive && !grabbing && !typing && !petting && !bodyPet && !paperActive && !FORCED_STATE && agentState === 'idle';
    const staring = canStare && (t - lastCursorMove > 10000);
    if (staring) {
      if (staringT0 < 0) { staringT0 = t; nextStareLook = 0; lookTarget = null; }   // engage: fixate on the cursor
      if (t - staringT0 >= 1800 && t > nextStareLook) {                              // after the fixate hold, roam
        nextStareLook = t + 700 + Math.random() * 900;
        if (Math.random() < 0.6) {                                                   // wander near the cursor
          lookTarget = { x: clamp(look.x + (Math.random() * 2 - 1) * 0.35, -1, 1), y: clamp(look.y + (Math.random() * 2 - 1) * 0.3, -1, 1) };
        } else {                                                                     // glance around the screen
          lookTarget = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.5 };
        }
        lookTargetUntil = nextStareLook + 250;
      }
    } else { staringT0 = -1; }

    // --- liveliness: eased gaze + periodic idle micro-actions ---------------
    const restIdle = calm && !petting && !bodyPet && !typing && !grabbing && !FORCED_STATE && roamUntil < t && agentState === 'idle';
    if (restIdle && !staring) {
      const idleScale = (2 - intensity) * (config && config.reducedMotion ? 2 : 1);   // zoomies -> frequent darts; calm -> rarer; Calm mode -> rarer still
      if (nextIdleAt === 0) nextIdleAt = t + (1600 + Math.random() * 2600) * idleScale;
      if (t > nextIdleAt && t >= playUntil && t >= yawnUntil) {   // don't start a new idle action mid-play/yawn
        nextIdleAt = t + (2000 + Math.random() * 3600) * idleScale;
        const roll = Math.random();
        const motionOK = !((config && config.reducedMotion) || lowPower);
        if (roll < 0.26) { lookTarget = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.5 }; lookTargetUntil = t + 800 + Math.random() * 1100; }
        else if (roll < 0.42 && !(config && config.reducedMotion)) { tailFlickT0 = t; }   // skip frequent tail-flicks in Calm mode (falls through to a gentle loaf/blink)
        else if (roll < 0.54 && !(config && config.reducedMotion)) { leanTarget = (Math.random() < 0.5 ? -1 : 1) * 0.045; leanUntil = t + 700; }   // weight shift (skipped in Calm mode)
        else if (roll < 0.70 && band !== 'calm' && motionOK) { startPlay(t); }   // bat a drifting leaf with a paw (self-play; never grabs the cursor)
        else if (roll < 0.80) { loafUntil = t + 4000 + Math.random() * 4000; }   // settle into a content loaf
        else if (roll < 0.90 && band !== 'zoomies') { groomUntil = t + 2600 + Math.random() * 1400; }   // wash its face (paw to muzzle)
        else if (roll < 0.95 && band !== 'calm' && motionOK) { doneHopPending = true; tailFlickT0 = t; }   // an occasional perk-up bounce (rare now)
        else if (band === 'calm' && Math.random() < 0.5) { yawnUntil = t + 1000; }   // a big sleepy yawn
        else { blinkUntil = t + 230; nextBlink = t + 380; }   // sleepy double-blink
        if (band === 'zoomies' && Math.random() < 0.45 && motionOK) startPlay(t);   // hyper: more likely to break into play
        if (band === 'zoomies' && Math.random() < 0.22 && motionOK) spinUntil = t + 650;   // tail-chase pirouette
      }
    } else { nextIdleAt = 0; }
    if (lookTarget && t > lookTargetUntil) lookTarget = null;
    if (t > leanUntil) leanTarget = 0;
    lean += (leanTarget - lean) * 0.09 * step;
    updateButterflyDesk(t, dt, step, { follow, grabbing, hunting, typing, petting, startleActive, calm });
    updateTreat(t, { grabbing, hunting, typing, startleActive });
    const gaze = lookTarget || look;
    smoothLook.x += (gaze.x - smoothLook.x) * 0.18 * step;   // snappier cursor tracking
    smoothLook.y += (gaze.y - smoothLook.y) * 0.18 * step;
    // continuous subtle body-lean toward the cursor (the cat "watches" it), only
    // when following and idle-ish - never fights a grab/throw/typing pose.
    const leanWant = (follow && !grabbing && !typing && !startleActive) ? clamp((cursor.x - pos.x) / 200, -0.08, 0.08) : 0;
    cursorLean += (leanWant - cursorLean) * 0.06 * step;

    // --- idle reactions: periodic stretch + AI-agent thinking/done ----------
    if (nextStretch === 0) nextStretch = t + STRETCH_INTERVAL;
    const idleNow = calm && !petting && !typing && agentState === 'idle';
    if (FORCED_STATE !== 'stretch' && idleNow && t > nextStretch) { stretchT0 = t; nextStretch = t + STRETCH_INTERVAL; }
    const stretching = FORCED_STATE === 'stretch' || (stretchT0 >= 0 && t - stretchT0 < STRETCH_MS);
    const thinking = FORCED_STATE === 'think' || agentState === 'thinking';
    const working = FORCED_STATE === 'work' || agentState === 'working';
    if (doneHopPending) {
      doneHopT0 = t; doneHopPending = false;
      if (config && config.soundOn) { if (doneIsAgent) playMeow(); else playChirp(); }   // agent done meows; playful bounce chirps
      doneIsAgent = false;
    }
    let hop = 0, hopActive = false;
    if (FORCED_STATE === 'done') { hop = Math.sin(((t % DONE_MS) / DONE_MS) * Math.PI) * 22 * intensity; hopActive = true; }
    else if (doneHopT0 >= 0 && t - doneHopT0 < DONE_MS) { hop = Math.sin(((t - doneHopT0) / DONE_MS) * Math.PI) * 22 * intensity; hopActive = true; }

    if (typing || FORCED_STATE === 'typing' || FORCED_STATE === 'overheat') {
      // Front-facing "keyboard kneading": the cat leans forward over two big
      // keycaps and kneads them with alternating paws (Comnyang-style).
      renderTypeFront(t, palRGB, pal, overheat, blinking, look);
      sendHot(pos.x - TW / 2 - 16, pos.y - TH - 8, TW + 32, TH + 16, false);
    } else if (batting) {
      // rear up on the haunches and bat at the butterfly overhead with both paws
      renderRearBat(t, palRGB, blinking);
      sendHot(pos.x - SW / 2 - 12, pos.y - SH - 46, SW + 24, SH + 46, false);
    } else if (!grabbing && (calm || petting || stretching || thinking || working || hopActive || paperActive || FORCED_STATE === 'loaf' || FORCED_STATE === 'groom' || FORCED_STATE === 'play' || FORCED_STATE === 'yawn')) {
      const idleSway = Math.round(Math.sin(t / 2600));                 // slow weight shift ±1
      const grooming = FORCED_STATE === 'groom' || (calm && !petting && !bodyPet && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && roamUntil < t && t < groomUntil);
      const playing = !grooming && (FORCED_STATE === 'play' || (calm && !petting && !bodyPet && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && roamUntil < t && t < playUntil));
      const loafing = !grooming && !playing && (FORCED_STATE === 'loaf' || (calm && !petting && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && t < loafUntil));
      const yawning = FORCED_STATE === 'yawn' || (calm && !petting && !bodyPet && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && !grooming && !playing && !loafing && t < yawnUntil);
      const wig = idleSway;   // calm "normal" patting - no fast side-to-side jitter while petted
      const emode = (petting || stretching || loafing || grooming || hopActive || yawning) ? 'happy' : 'open';   // celebrate the done/playful hop with a happy squint; squint on a yawn
      const eLook = (thinking || working) ? { x: 0, y: -0.5 } : paperActive ? { x: -0.35, y: clamp(climbDir, -1, 1) * 0.6 }
        : (playing && mote) ? { x: clamp((mote.x - pos.x) / 70, -1, 1), y: clamp((mote.y - (pos.y - SH * 0.72)) / 70, -1, 1) }   // watch the leaf
        : smoothLook;   // look the way it climbs the rope
      const climbRaster = paperActive && !petting && !stretching && coatHasFrames(coatSlug(P.name));   // painted climb for THIS coat?
      const breath = Math.sin(t / 2200);                              // gentle, slow breathing (calmer cadence)
      let sx = 1 - breath * 0.012, sy = 1 + breath * 0.020;
      if (settleSquash) { sy *= 1 - settleSquash; sx *= 1 + settleSquash * 0.5; }   // tiny squash as it lands on the floor
      if (stretching) {
        const se = FORCED_STATE === 'stretch' ? ((t % STRETCH_MS) / STRETCH_MS) : clamp((t - stretchT0) / STRETCH_MS, 0, 1);
        // squash-and-stretch: a brief anticipation crouch, then a TALL + NARROW reach
        // (it pinches in as it rises, instead of just inflating bigger), then settles.
        let k;   // -ve = crouched/wider, +ve = tall/narrow
        if (se < 0.16) k = -Math.sin(se / 0.16 * Math.PI) * 0.5;
        else { const r = (se - 0.16) / 0.84; k = Math.sin(r * Math.PI); }
        sy = 1 + k * 0.42; sx = 1 - k * 0.14;
      }
      // head-pet "nuzzle": the cat rises to meet your hand each stroke - a soft push-up
      // with a tiny squash at the peak, as if pressing its head up into the palm.
      const petPress = petting ? Math.max(0, Math.sin(t / 320)) : 0;
      const petPush = petPress * 4;
      if (petPress) { sy *= 1 - petPress * 0.05; sx *= 1 + petPress * 0.04; }
      const ox = Math.round(pos.x - SW / 2) + wig, oy = Math.round(pos.y - SH) - Math.round(hop) - Math.round(petPush);
      const shadowA = (petting || bodyPet) ? 0.14 + Math.sin(t / 800) * 0.05 : 0.18;
      drawShadow(pos.x + wig, pos.y, shadowA);
      if (!stretching && !thinking && !working && !loafing && !climbRaster) drawTail(pos.x + wig, pos.y, t, pal, tailFlickT0, petting);   // loaf has a baked, wrapped tail; the climb frame has its own tail
      if (!lowPower && restIdle && band === 'calm' && !paperActive && t > nextIdleSparkle) {   // ambient sparkles off in low power (they pin the loop at 60fps)
        idleSparkles.push({ x: pos.x + (Math.random() - 0.5) * 8, y: oy, t0: t });
        nextIdleSparkle = t + 5000 + Math.random() * 4000;
      }
      if (!lowPower && loafing && calm && t > nextLoafZ) {   // sleep Z's off in low power
        loafZZZ.push({ x: pos.x + 10 + Math.random() * 8, y: oy + 8, t0: t, sz: Math.random() < 0.4 ? 2 : 1 });
        nextLoafZ = t + 1800 + Math.random() * 1600;
      }
      if (climbRaster) {
        // painterly raster climb: the tuxedo sprite frame grips the procedural rope
        // (the seated procedural cat is skipped entirely while climbing).
        drawClimbFrame(pos, t, climbing, climbDir, coatSlug(P.name), climbBob);
      } else {
      octx.clearRect(0, 0, oc.width, oc.height);
      const stareDilate = (staring && t - staringT0 < 1800) ? 1.12 : 1;   // subtle wide-eyed fixate
      drawCat(octx, loafing ? loafSprite : catSprite, t, palRGB, { bob, blinking, look: eLook, eyeMode: emode, blush: petting || bodyPet, dilate: stareDilate });
      if (paperActive && !petting && !stretching) {
        // both front paws lift off the ground to grip the rope, so paint over the
        // baked planted front legs+paws on the offscreen sprite (so it scales/flips
        // with the cat) - otherwise they read as extra limbs behind the climbing arms.
        octx.fillStyle = rgbStr(palRGB.C); octx.fillRect(28, 95 + bob, 64, 25);
      } else if (grooming || playing || thinking || working) {
        octx.fillStyle = rgbStr(palRGB.C); octx.fillRect(34, 100 + bob, 18, 22);   // hide left paw -> one raised (washing / batting / pondering / tapping) + one planted
      }
      if (yawning || stretching) {   // open mouth + tongue, drawn into the sprite buffer so it scales/leans with the cat (cats yawn as they stretch)
        const sprog = FORCED_STATE === 'stretch' ? (t % STRETCH_MS) / STRETCH_MS : clamp((t - stretchT0) / STRETCH_MS, 0, 1);
        const yp = stretching ? Math.sin(clamp((sprog - 0.08) / 0.84, 0, 1) * Math.PI) * 0.85
          : FORCED_STATE === 'yawn' ? Math.sin((t % 1600) / 1600 * Math.PI) : Math.sin((1 - clamp((yawnUntil - t) / 1000, 0, 1)) * Math.PI);
        drawYawn(octx, catSprite, bob, yp);
      }
      ctx.save();
      const purrJit = purring ? Math.sin(t / 46) * 0.7 : 0;   // faint purr buzz while petted
      ctx.translate(Math.round(pos.x + wig + climbSway + purrJit), Math.round(pos.y - hop - climbBob - petPush));   // round to whole CSS px for crisp pixels; nuzzle push + purr buzz ride on the rest pose
      if (lean || cursorLean) ctx.rotate(lean + cursorLean);   // idle lean + watch-the-cursor tilt
      if (spinUntil > t) ctx.rotate((1 - (spinUntil - t) / 650) * Math.PI * 2);   // tail-chase spin
      const faceLeft = roamUntil > t && roamFrom && roamTo && roamTo.x < roamFrom.x;   // face where it walks
      ctx.scale(faceLeft ? -sx : sx, sy);
      ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
      ctx.restore();
      if (jamming) drawGuitar(pos.x + wig + 2, oy + SH * 0.62, jamPhase);   // the cat plays a tiny guitar while the Lobby Jam loops
      if (overheat) drawSteam(t, ox + SW / 2, oy + CELL);   // red+steam cooldown after typing
      if (petting && t - lastHeart > 520) { popLove(t, pos.x, oy - 4, 2.1, 14); lastHeart = t; }   // big love hearts rising from the head
      else if (bodyPet && t - lastHeart > 950) { popLove(t, pos.x, oy + 6, 1.5, 22); lastHeart = t; }
      if (thinking) {
        drawThinkBubble(pos.x + SW * 0.32, oy + 4, t);
        const py = oy + SH * 0.34 + Math.sin(t / 700) * 1.4;   // a paw raised to the chin: "hmm…"
        drawGripPaw(palRGB, pos.x - 8, oy + SH * 0.60, pos.x - 1, py, false);
      } else if (working) {
        drawWorkBubble(pos.x + SW * 0.32, oy + 2, t);
        const tap = Math.abs(Math.sin(t / 150));               // a front paw tapping along while the agent works
        drawGripPaw(palRGB, pos.x - 8, oy + SH * 0.56, pos.x - 6, oy + SH * 0.78 - tap * 9, tap > 0.55);
      }
      if (hopActive) drawDoneSpark(pos.x, oy - 4, t);
      if (paperActive && !petting && !stretching) {
        drawRopeClimb(palRGB, pos, t, climbing, climbDir, Math.round(paperLen), climbBob, climbSway);
      }
      }
      if (grooming && !paperActive) drawGroom(palRGB, pos.x + wig, oy + SH * 0.30, t);   // raise a paw, wash its face
      if (playing && !paperActive) renderPlay(palRGB, oy, t, step);                       // bat the drifting leaf with a paw
      else if (mote && t > playUntil) mote = null;                                        // play over -> drop the leaf
      if (t < labelUntil) {
        ctx.globalAlpha = Math.min(1, (labelUntil - t) / 300); ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const name = P.name, w = ctx.measureText(name).width + 10, bx = pos.x, by = oy + SH + 14;
        ctx.fillStyle = 'rgba(20,20,24,0.82)'; ctx.fillRect(bx - w / 2, by - 13, w, 13); ctx.fillStyle = '#fff'; ctx.fillText(name, bx, by); ctx.globalAlpha = 1;
      }
      // fully idle (only breathing/tail)? let the governor drop to ~33fps
      if (calm && !petting && !stretching && !thinking && !working && !hopActive && !paperActive && !grooming && !playing && !yawning && !blinking
          && !lookTarget && t > lookTargetUntil && hearts.length === 0 && idleSparkles.length === 0 && loafZZZ.length === 0 && musicNotes.length === 0 && !jamMotion && t >= bubbleUntil
          && (tailFlickT0 < 0 || t - tailFlickT0 > 700) && Math.abs(lean) < 0.004) wantHighFps = false;
      sendHot(ox - 6, oy - 6, SW + 12, SH + 12, false);
    } else if (grabbing || FORCED_STATE === 'mochi' || ratio > 1.06) {
      drawShadow(feet.x, feet.y, 0.10);
      octx.clearRect(0, 0, oc.width, oc.height); drawCat(octx, catSprite, t, palRGB, { bob: 0, blinking, look });
      const midDestH = Math.max(2, len - HEAD_SRC - FEET_SRC), midSX = clamp(Math.sqrt(MID_SRC / midDestH), 0.28, 1);
      // shake-wobble: a fast decaying side-to-side sway around the grip point
      const wob = t < wobbleUntil ? Math.sin(t / 60) * 0.22 * ((wobbleUntil - t) / 850) : 0;
      ctx.save(); ctx.translate(head.x, head.y); ctx.rotate(ang - Math.PI / 2 + wob);
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

  if (bfOn && !lowPower) {
    for (const s of bfTrail) { const a = 1 - (t - s.t0) / 480; if (a > 0) { ctx.globalAlpha = a * 0.45; ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); } }
    ctx.globalAlpha = 1;
    drawButterfly(ctx, bfX, bfY, BF_SCALE, BFLY_STYLES[bfPal], bfFlap, t, clamp(bfVx / 44, -0.22, 0.22));
  }
  drawTreat();   // the fish sits on the floor line, under the hearts
  // floating hearts (update + draw; persist after petting ends)
  if (hearts.length) hearts = hearts.filter((h) => t - h.t0 < (h.life || 1100));
  for (const h of hearts) {
    const life = h.life || 1100, a = (t - h.t0) / life;
    const dx = Math.round(h.x + Math.sin(a * (h.wobF || 6) + (h.ph || 0)) * (h.wobA != null ? h.wobA : 4));
    const dy = Math.round(h.y - a * (h.vy || 30));
    const alpha = (1 - a) * 0.95;
    if (h.kind === 'spark') drawSparkle(dx, dy, alpha, h.s || 1);
    else drawHeart(dx, dy, a < 0.5 ? '#ff5a6e' : '#ff8a98', alpha, h.s || 1);
  }
  if (idleSparkles.length) idleSparkles = idleSparkles.filter((s) => t - s.t0 < 400);
  for (const s of idleSparkles) { const a = (t - s.t0) / 400; ctx.globalAlpha = (1 - a) * 0.9; ctx.fillStyle = '#fff6d6'; ctx.fillRect(Math.round(s.x), Math.round(s.y - a * 12), 2, 2); ctx.fillRect(Math.round(s.x + 3), Math.round(s.y - a * 12 - 3), 1, 1); ctx.globalAlpha = 1; }
  if (loafZZZ.length) loafZZZ = loafZZZ.filter((z) => t - z.t0 < 1100);
  for (const z of loafZZZ) { const a = (t - z.t0) / 1100, yOff = a * 14, fade = a < 0.15 ? a / 0.15 : a > 0.75 ? (1 - a) / 0.25 : 1; ctx.globalAlpha = fade * 0.65; ctx.fillStyle = '#8ab4cc'; const zx = Math.round(z.x), zy = Math.round(z.y - yOff), s = z.sz; ctx.fillRect(zx, zy, s * 4, s); ctx.fillRect(zx + s * 2, zy + s, s * 2, s); ctx.fillRect(zx + s, zy + s * 2, s * 2, s); ctx.fillRect(zx, zy + s * 3, s * 4, s); ctx.globalAlpha = 1; }
  // floating music notes while the Lobby Jam plays (outside the pose branches so they show in any pose)
  const jamNotesOn = !!(config && config.lobbyJam && config.lobbyJam.on) && !((config && config.reducedMotion) || lowPower);
  if (jamNotesOn && t > nextMusicNote) { musicNotes.push({ x: pos.x + (Math.random() - 0.5) * 24, y: pos.y - SH * 0.45, t0: t, vx: (Math.random() - 0.5) * 1.6, k: Math.random() < 0.4 ? 1 : 0 }); nextMusicNote = t + 320 + Math.random() * 220; }
  if (musicNotes.length) musicNotes = musicNotes.filter((m) => t - m.t0 < 1300);
  for (const m of musicNotes) { const a = (t - m.t0) / 1300, fade = a < 0.12 ? a / 0.12 : a > 0.8 ? (1 - a) / 0.2 : 1; drawNote(m.x + m.vx * a * 34, m.y - a * 30 + Math.sin(a * 8) * 3, fade * 0.85, m.k); }

  // reminder/break speech bubble - drawn here (outside the pose branches) so it's
  // visible even if a reminder fires mid-hunt or mid-type. A transient bubble
  // outranks the pinned note so reminders never get masked.
  if (t < bubbleUntil && bubbleText) drawBubble(pos.x, pos.y - SH - 6, bubbleText, Math.min(1, (bubbleUntil - t) / 400));
  else if (config && config.pinnedNote) drawBubble(pos.x, pos.y - SH - 6, '📌 ' + template(config.pinnedNote), 0.95);

  // pomodoro pixel timer - floats beside the cat in every pose; main owns the
  // clock (phase + endsAt), we just count it down locally.
  if (pomo && pomo.on) drawPomoTimer(pos.x + SW / 2 + 10, pos.y - SH + 6, t);

  // natural blinking: varied timing with occasional slow/sleepy + double blinks
  if (t > nextBlink && t > blinkUntil) {
    const calmB = !!(config && config.reducedMotion);
    const sleepy = Math.random() < (calmB ? 0.5 : 0.22);   // slower, lingering "slow blink" in Calm mode
    blinkUntil = t + (sleepy ? 230 : 120);
    nextBlink = (Math.random() < 0.18) ? t + 360 : t + (calmB ? 2600 : 2000) + Math.random() * (calmB ? 3400 : 2800);
  }
  if (settingArea) drawSetArea();
}
function resumeRaf() { if (rafPaused) { rafPaused = false; lastDrawn = 0; requestAnimationFrame(draw); } }
function rectOf(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
function finishSetArea(cancel) {
  let area = null;
  if (!cancel && areaRect && areaRect.w > 40 && areaRect.h > 40) {
    area = { x: areaRect.x / viewW, y: areaRect.y / viewH, w: areaRect.w / viewW, h: areaRect.h / viewH };
  }
  settingArea = false; areaDragStart = null; areaRect = null;
  if (window.cat && window.cat.setAreaDone) window.cat.setAreaDone(area);
}
function drawSetArea() {
  ctx.save();
  ctx.fillStyle = 'rgba(10,12,18,0.30)'; ctx.fillRect(0, 0, viewW, viewH);
  if (areaRect && areaRect.w > 2 && areaRect.h > 2) {
    ctx.clearRect(areaRect.x, areaRect.y, areaRect.w, areaRect.h);
    ctx.strokeStyle = '#e8943c'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
    ctx.strokeRect(areaRect.x, areaRect.y, areaRect.w, areaRect.h); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText("Drag to set the cat's play area  -  Esc or right-click to cancel", viewW / 2, 42);
  ctx.restore();
  wantHighFps = true;
}
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
  if (pose === 'typing') return typeSprites[i] || typeSprites[0];
  if (pose === 'hunt') return spriteHunt;
  if (pose === 'loaf') return loafSprites[i] || loafSprites[0];
  return sprites[i] || sprites[0];   // sit
}
function renderSheet() {
  const poses = ['sit', 'typing', 'hunt', 'loaf'];
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
      const cx = labelW + i * cellW, sp = sheetSprite(pose, i), palRGB = sheetPal(P);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, sp, 0, palRGB, { bob: 0, blinking: false, look: { x: 0, y: 0 }, eyeMode: 'open' });
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
window.addEventListener('mousemove', (e) => {
  cursor.x = e.clientX; cursor.y = e.clientY;
  if (settingArea && areaDragStart) areaRect = rectOf(areaDragStart, { x: e.clientX, y: e.clientY });
});
window.addEventListener('mousedown', (e) => {
  if (settingArea) { if (e.button !== 0) { finishSetArea(true); return; } areaDragStart = { x: e.clientX, y: e.clientY }; areaRect = null; resumeRaf(); return; }
  if (e.button !== 0) return;
  cursor.x = e.clientX; cursor.y = e.clientY;
  audio();                                // real gesture: unlock WebAudio for later meows
  huntUntil = 0; pouncing = false;        // grabbing cancels a hunt
  grabbing = true;
  downAt = performance.now(); downX = cursor.x; downY = cursor.y;
  sendHot(cursor.x - SW, cursor.y - SH, SW * 2, SH * 2, true);
});
window.addEventListener('mouseup', () => {
  if (settingArea) { if (areaDragStart) finishSetArea(false); return; }
  if (!grabbing) return;
  grabbing = false;
  const tap = performance.now() - downAt < 220 && Math.hypot(cursor.x - downX, cursor.y - downY) < 6;
  if (tap) {
    petBurstUntil = performance.now() + 1200;   // happy eyes + hearts + chirp, stay put
    addEnergy(15);
    if (config && config.soundOn) playChirp();
    restSprings();
  } else {
    pos.x = zoneClampX(head.x); pos.y = restingY();   // land on the resting line (honours floor-lock + play area)
    persistPos();
  }
  resumeRaf();
});
// Double-click opens Settings (Quit lives in the tray now).
window.addEventListener('dblclick', () => { audio(); if (window.cat && window.cat.openSettings) window.cat.openSettings(); });
window.addEventListener('keydown', (e) => { if (settingArea && e.key === 'Escape') finishSetArea(true); });
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  audio();
  patternIndex = (patternIndex + 1) % PATTERNS.length;
  localStorage.setItem('pattern', patternIndex);            // fast local fallback
  if (window.cat && window.cat.setPattern) window.cat.setPattern(patternIndex); // sync tray + settings.json
  labelUntil = performance.now() + 1500;
});
