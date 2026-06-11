// ===== Desktop pixel cat: 12 patterns, mochi-drag, typing, hunt, purr ========
// Role-coded sprites recolored per pattern, on a full-screen click-through overlay.
// Roles:  . transparent  O outline  H white halo  C coat  K markings  W white
//         X patch (tortie/calico)   E eye   N nose   I inner-ear

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
//     Forelegs are NOT baked — drawn live kneading the keys in renderTypeFront,
//     where the keycaps are drawn too.
function composeTypeFront(B) {
  B = B || {};
  const CX = 12, fluff = !!B.fluff;
  // tail: emerges behind the right haunch and curls up beside the body — kept
  // clear of the torso silhouette so it reads as a tail, with a pale tip.
  [[20.6, 20.0], [22.0, 17.2], [22.4, 14.0], [21.6, 11.2]].forEach(([c, r]) => ellipse(c, r, 1.6, 1.6, 'C'));
  ellipse(21.6, 10.8, 1.0, 1.0, 'W', ['C']);               // tail tip (hooked over)
  // body: leaning forward — chest/shoulder mass under the head, haunches planted
  // wider at the bottom (the rear stays down while the cat reaches for the keys).
  ellipse(CX, 16, 6.0, 5.4, 'C');                          // shoulders / chest
  ellipse(6.6, 20.2, 3.4, 3.2, 'C');                       // left haunch
  ellipse(17.4, 20.2, 3.4, 3.2, 'C');                      // right haunch
  // head front-centre, slightly low (the forward lean)
  ellipse(CX, 8.5, 6.3, 5.6, 'C');
  if (fluff) { ellipse(5.6, 10.8, 1.9, 2.3, 'C'); ellipse(18.4, 10.8, 1.9, 2.3, 'C'); }  // cheek ruff
  // ears — proper cat triangles on top, slight outward tilt
  triangle(CX - 4.5, 1.2, CX - 6.4, 6.8, CX - 1.8, 5.6, 'K');
  triangle(CX + 4.5, 1.2, CX + 6.4, 6.8, CX + 1.8, 5.6, 'K');
  triangle(CX - 4.3, 3.0, CX - 5.4, 6.3, CX - 2.8, 5.6, 'I');
  triangle(CX + 4.3, 3.0, CX + 5.4, 6.3, CX + 2.8, 5.6, 'I');
  if (fluff) { ellipse(CX - 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); ellipse(CX + 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); }  // ear tufts
  // big round eyes (drawCat animates the pupils downward at the keys) + muzzle + nose
  ellipse(9, 8.7, 2.0, 2.4, 'E'); ellipse(15, 8.7, 2.0, 2.4, 'E');
  ellipse(CX, 12.2, 3, 2, 'W', ['C']);
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  // white chest bib — kept narrow so the lifted white paws never vanish against it
  ellipse(CX, 17.8, 2.1, 3.2, 'W', ['C']);
  // forelegs/paws are NOT baked — drawn live in drawKneadPaws (knead the keys)
  if (B.tabby) {
    [[11, 5], [12, 6], [13, 5]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });  // forehead M
    for (let r = 13; r < 22; r += 2) for (let c = 3; c < 21; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
  }
  ellipse(7.5, 17.5, 2.2, 2.6, 'X', ['C', 'K']);           // tortie/calico patches
  ellipse(16.5, 20, 2.0, 2.0, 'X', ['C', 'K']);
}

// --- loafing cat ("cat bread"): a compact, content resting pose. The body is a
//     low rounded mound (no upright legs — paws are tucked under), the head rests
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
  // body: a wide, low loaf mound — base sits on the ground line (row ~29)
  ellipse(CX, 25, 8.9 * bw, 4.7 + (fluff ? 0.4 : 0), 'C'); // broad base
  ellipse(CX, 21, 8.0 * bw, 4.0, 'C');                     // rounded upper mound
  // head resting low and forward on the mound
  ellipse(CX, 8 + EH, headRx, headRy, 'C');
  if (cheek) { ellipse(CX - headRx * 0.7, 9.6 + EH, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6 + EH, 1.7, 2.2, 'C'); }
  if (fluff) { ellipse(5.4, 10.4 + EH, 1.9, 2.4, 'C'); ellipse(18.6, 10.4 + EH, 1.9, 2.4, 'C'); } // cheek ruff
  // ears — same triangles as the sit head, dropped by EH
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

const spriteHunt = buildSprite(30, 20, composeHunt);
const TW = 24 * CELL, TH = 24 * CELL;            // front-facing kneading-cat dims (per-coat sprites built below)
// Sit grid is always 24x30, so SW/SH and the mochi bands stay constant across the
// per-coat body builds (different shapes, same canvas). The sit sprites themselves
// are built per coat below, once PATTERNS + their builds are defined.
const SW = 24 * CELL, SH = 30 * CELL;            // sit dims (mochi uses these)
const HW = spriteHunt.SW, HH = spriteHunt.SH;    // hunt dims
let playArea = null;   // { x,y,w,h } fractions of the screen; the cat stays inside it
// X margins from the cat's CENTER: the body is SW/2 wide each side, and the sit
// tail sweeps a further ~55px to the RIGHT (see drawTail) — so the right margin
// is bigger, ensuring a hard throw at the screen edge never clips the tail.
const EDGE_L = SW / 2 + 8, EDGE_R = SW / 2 + 60;
function zoneClampX(v) {
  if (!playArea) return clamp(v, EDGE_L, canvas.width - EDGE_R);
  const a = playArea.x * canvas.width + EDGE_L, b = (playArea.x + playArea.w) * canvas.width - EDGE_R;
  return clamp(v, Math.min(a, b), Math.max(a, b));
}
function zoneClampY(v) {
  if (!playArea) return clamp(v, SH + 10, canvas.height - 10);
  const a = playArea.y * canvas.height + SH, b = (playArea.y + playArea.h) * canvas.height - 10;
  return clamp(v, Math.min(a, b), Math.max(a, b));
}
// The cat's resting foot line = the top edge of the taskbar/Dock. Derived from
// the BOTTOM work-area inset only — on macOS the menu bar is a TOP inset
// (availTop > 0) and must not raise the cat; the Dock (if at the bottom) is the
// remainder. Falls back to a small margin when there's no bottom inset.
function groundBaselineY() {
  const s = window.screen;
  const topInset = Math.max(0, s.availTop || 0);
  const bottomInset = Math.max(0, (s.height || 0) - (s.availHeight || 0) - topInset);
  return canvas.height - (bottomInset > 0 ? bottomInset : 48);
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
// and a dedicated loaf (resting) body per coat — same 24x30 size as the sit sprite
const loafSprites = PATTERN_BUILD.map((b, i) => buildSprite(24, 30, () => composeLoaf({ ...BUILDS[b], tabby: TABBY[i] })));
const DEFAULT_PATTERN = Math.max(0, PATTERNS.findIndex((p) => p.name === 'Tuxedo'));   // tuxedo is the out-of-box coat
const storedPattern = localStorage.getItem('pattern');
let patternIndex = storedPattern != null ? Number(storedPattern) : DEFAULT_PATTERN;
if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = DEFAULT_PATTERN;
const forcedPattern = qp.get('pattern');
if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }

// Custom coats: layer user-defined palettes (from themes.json, sent by main over
// IPC) on top of the 12 built-ins, building each one's sit + type sprites at
// runtime. Re-applied wholesale on every update so add/delete just work.
const BASE_PATTERNS = PATTERNS.length;
function applyThemes(list) {
  PATTERNS.length = BASE_PATTERNS; PATTERN_BUILD.length = BASE_PATTERNS; TABBY.length = BASE_PATTERNS;
  sprites.length = BASE_PATTERNS; typeSprites.length = BASE_PATTERNS; loafSprites.length = BASE_PATTERNS;
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
  }
  if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = DEFAULT_PATTERN;
  if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const HOT_BODY = '#d9534f', HOT_OUTLINE = '#7a1f1a';

// ---- draw the cat body into context g (local origin 0,0) -------------------
function drawCat(g, sp, t, palRGB, o) {
  const { bob = 0, blinking = false, look = { x: 0, y: 0 }, typing = false, eyeMode = 'open', blush = false, dilate = 1 } = o;
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
// The two forelegs the profile cat taps with — drawn live (NOT baked into the
// sprite) so the paws lift and strike. They reach forward-right from the chest
// (shX, shY) onto the two keys; two-tone (outline + coat) so they read on any coat.
// The cat's forelegs in true PIXEL-SPRITE style (like the Comnyang reference):
// chunky grid-aligned columns with the same dark outline as the body — no smooth
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
    // leg: outline slab + flat fur core — same blocky look as the body sprite
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
  const wag = Math.sin(t / 540) * 0.12 + (petting ? Math.sin(t / 120) * 0.08 : 0);
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
  // Densify with quadratics through segment midpoints (same scheme as
  // strokeSmooth) so the tapered per-piece strokes show no corners.
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
function drawHeart(x, y, color, alpha, s) {
  s = s || 1;
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  const r = (dx, dy, w, h) => ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
  r(-5, -4, 3, 3); r(2, -4, 3, 3);                          // two top bumps
  r(-5, -1, 10, 3);                                         // wide middle
  r(-4, 2, 8, 2); r(-2, 4, 4, 2); r(-1, 6, 2, 1);           // taper to a point
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
let shakeFlips = 0, shakeDir = 0, lastFlipAt = 0, wobbleUntil = 0;   // mochi shake-wobble
let heat = 0, keyPulse = false, lastKeyAt = -9999;
let nextBlink = 1500, blinkUntil = 0, prevT = 0, labelUntil = 0;
let huntUntil = 0, pouncing = false, pounceT0 = 0, pounceFrom = null, pounceTarget = null;
let hearts = [], lastHeart = 0, lastBodyTrill = -9999;
let idleSparkles = [], nextIdleSparkle = 0;
let loafZZZ = [], nextLoafZ = 0;
// stretch reminder (08) + AI-agent thinking/done (10/11)
let stretchT0 = -1, nextStretch = 0;
let agentState = 'idle', doneHopT0 = -1, doneHopPending = false, doneIsAgent = false, errorPending = false;
const STRETCH_INTERVAL = 1000 * 60 * 20, STRETCH_MS = 1700, DONE_MS = 760;
// scroll reaction (09): the cat grabs a vertical yarn rope and climbs it while you
// scroll — hand-over-hand, up when you scroll up and down when you scroll down,
// with a ball of yarn anchored on the floor. `paperLen` is the climb energy (grows
// while scrolling, decays to a gentle hang). `climbDir` is the eased -1..+1 heading.
let paperLen = 0, paperUntil = 0, scrollPulses = 0, scrollDirRaw = -1, climbDir = -1, climbAnim = 0, scrollRate = 0;
// liveliness: eased gaze, idle micro-actions, animated tail + frame governor
let smoothLook = { x: 0, y: 0 };
let lookTarget = null, lookTargetUntil = 0;
let nextIdleAt = 0, leanTarget = 0, lean = 0, cursorLean = 0, leanUntil = 0, tailFlickT0 = -1, loafUntil = 0, groomUntil = 0;
let nextRoam = 0, roamUntil = 0, roamFrom = null, roamTo = null;   // autonomous wandering
let lastDrawn = 0, wantHighFps = true, rafPaused = false;
// Comnyang-style productivity layer: settings from main + reminder/break bubble
let config = null;
let bubbleText = '', bubbleUntil = 0;
let pomo = null;   // { on, phase: 'focus'|'break', endsAt } — main owns the clock
let purring = false;
// Comnyang mood/energy model: 0-100, decays over time, bumped by stimuli. Bands
// (calm/playful/zoomies) gate + scale every behavior; see bandOf()/intensity.
let energy = 62;
let startleT0 = -1, startleUntil = 0, startleMode = 'creep', startleFrom = null, startleTo = null, startleCooldownUntil = -9999;
let zoomiesT0 = -1, prevBand = '', spinUntil = 0;

let pos;
try { pos = JSON.parse(localStorage.getItem('pos')); } catch (e) { /* ignore */ }
if (SHOT) pos = { x: 130, y: 250 };
else if (!pos || typeof pos.x !== 'number') pos = { x: canvas.width - 300, y: canvas.height - 80 };
pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
// Start each launch resting on the taskbar line (keep the remembered X, snap Y to
// the baseline) so the cat always begins the day on the same line, never mid-screen.
if (!SHOT) pos.y = zoneClampY(groundBaselineY());
// Don't let the home spot jam against the clock: when there's no custom play area,
// pull a far-right-parked cat in from the edge on launch (only ever moves it left).
if (!SHOT && !playArea) pos.x = Math.min(pos.x, canvas.width - 300);
let head = { x: pos.x, y: pos.y - SH, vx: 0, vy: 0 };
let feet = { x: pos.x, y: pos.y, vx: 0, vy: 0 };
let grabbing = false;
let settingArea = false, areaDragStart = null, areaRect = null;   // "set play area (drag)" mode
let petBurstUntil = 0, downAt = 0, downX = 0, downY = 0;   // click-to-pet

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
    config = c;
    if (master) master.gain.value = volNow();
    playArea = c.playArea || null;
    pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y); persistPos();
    if (typeof c.pattern === 'number') patternIndex = clamp(c.pattern, 0, PATTERNS.length - 1);
    resumeRaf();
  });
  if (window.cat.onRemind) window.cat.onRemind((d) => triggerReminder(d && d.message));
  if (window.cat.onNotify) window.cat.onNotify((d) => triggerNotify(d));
  if (window.cat.onBreak) window.cat.onBreak(() => triggerBreak());
  if (window.cat.onPomo) window.cat.onPomo((d) => { pomo = d || null; resumeRaf(); });
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

// ---- procedural sound (WebAudio; no asset files) ---------------------------
let actx = null, master = null;
function volNow() { return (config && typeof config.volume === 'number' ? config.volume : 100) / 100; }
function audio() {
  try {
    if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.connect(actx.destination); master.gain.value = volNow(); }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { actx = null; }
  return actx;
}
function voiceFor() {
  const build = (typeof PATTERN_BUILD !== 'undefined' && PATTERN_BUILD[patternIndex]) || 'standard';
  const base = build === 'slender' ? { pitch: 1.22, dur: 1.25, type: 'sawtooth', gain: 0.95 }
    : build === 'stocky' ? { pitch: 0.82, dur: 0.92, type: 'triangle', gain: 1.05 }
    : build === 'fluffy' ? { pitch: 1.0, dur: 1.06, type: 'sine', gain: 0.85 }
    : { pitch: 1.0, dur: 1.0, type: 'triangle', gain: 1.0 };
  base.pitch *= 1 + ((patternIndex * 37) % 7 - 3) * 0.012;   // small per-coat individuality
  return base;
}
function playMeow() {
  // A soft, cute "mew": a gentle triangle tone with a rise-then-fall pitch contour,
  // light vibrato, and a low-pass to keep it warm (not buzzy). Synthesized (no audio
  // files); voiceFor() gives each breed its own pitch/length.
  const ac = audio(); if (!ac) return;
  const v = voiceFor();
  const t0 = ac.currentTime, dur = 0.42 * v.dur, f = (hz) => hz * v.pitch;
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(f(500), t0);
  o.frequency.linearRampToValueAtTime(f(720), t0 + dur * 0.40);   // "mee"
  o.frequency.linearRampToValueAtTime(f(470), t0 + dur);          // "ow"
  const vib = ac.createOscillator(); vib.type = 'sine'; vib.frequency.value = 7;
  const vibGain = ac.createGain(); vibGain.gain.value = f(7);
  vib.connect(vibGain); vibGain.connect(o.frequency);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f(2600); lp.Q.value = 0.6;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
  amp.gain.setValueAtTime(0.18, t0 + dur * 0.55);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.06);
  o.connect(lp); lp.connect(amp); amp.connect(master);
  o.start(t0); vib.start(t0); o.stop(t0 + dur + 0.1); vib.stop(t0 + dur + 0.1);
  o.onended = () => { try { lp.disconnect(); amp.disconnect(); vibGain.disconnect(); } catch (e) { /* ignore */ } };
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
  carrier.connect(lp); lp.connect(amp); amp.connect(master);
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
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  const v = voiceFor();
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(780 * v.pitch, t0);
  o.frequency.linearRampToValueAtTime(1180 * v.pitch, t0 + 0.08);
  o.frequency.linearRampToValueAtTime(1020 * v.pitch, t0 + 0.2);
  o.connect(g); o.start(t0); o.stop(t0 + 0.24);
  o.onended = () => { try { g.disconnect(); } catch (e) { /* ignore */ } };
}
// Startled "mrrp" — a short falling growl (sudden jolt / agent error).
function playMrrp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  const v = voiceFor();
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(520 * v.pitch, t0);
  o.frequency.linearRampToValueAtTime(300 * v.pitch, t0 + 0.16);
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

// Pomodoro pixel timer — a tiny dark panel with a phase dot (tomato = focus,
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

// Ball of yarn — a wound coral disc with wrap-strands and a glint. Shared by the
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

// The coral yarn rope + the floor ball (no cat) — shared by the procedural climb
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
function drawRopeClimb(palRGB, pos, t, climbing, dir, energy) {
  const YARN_OUT = '#c8455a', YARN_LT = '#ff8fa3';
  const g = ropeGeom(pos, t, energy), dirN = clamp(dir, -1, 1);
  drawRope(pos, t, climbing, dir, energy);

  // two gripping paws, hand-over-hand (one holds while the other re-grabs)
  const shX = pos.x - 6, shY = Math.round(pos.y - SH * 0.42);   // shoulders at the chest
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
let climbImgs = {};   // { coat: { idle, up1, up2, down1, down2: Image } }
(function loadClimbFrames() {
  if (typeof CLIMB_FRAMES === 'undefined') return;
  for (const coat of Object.keys(CLIMB_FRAMES)) {
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
function drawClimbFrame(pos, t, climbing, dir, coat) {
  const img = pickClimbImg(t, climbing, dir, coat);
  if (!img || !img.naturalHeight) return;
  const h = Math.round(SH * CLIMB_SCENE_H), w = Math.round(img.naturalWidth * (h / img.naturalHeight));
  const dx = Math.round(pos.x - w * CLIMB_ANCHOR_X);
  const dy = Math.round(pos.y - h + CLIMB_DROP);
  ctx.drawImage(img, dx, dy, w, h);
}
// Grooming: the cat raises a front paw to its muzzle and licks it, washing its face.
// Drawn over the seated sprite (cx = body centre, faceY = muzzle height).
function drawGroom(palRGB, cx, faceY, t) {
  const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const u = (Math.sin(t / 200) + 1) / 2;                          // 0..1 lick cycle
  const shY = faceY + 32;                                          // chest anchor y
  const pawX = cx - 2, pawY = faceY + 11 - u * 11;                // paw rises to the muzzle
  const pwW = 13, pwH = 7;
  const pY = Math.round(pawY - pwH / 2);
  const aw = 10, ax = Math.round(pawX - aw / 2);
  const aTop = pY + pwH;                                           // arm hangs below the paw
  const aH = Math.max(0, Math.round(shY) - aTop);
  if (aH > 0) { rect(ax, aTop, aw, aH, O); rect(ax + 2, aTop, aw - 4, aH, C); }
  rect(pawX - pwW / 2 - 2, pY - 2, pwW + 4, pwH + 4, O);          // paw outline
  rect(pawX - pwW / 2, pY, pwW, pwH, W);                           // white mitt
  if (u > 0.70) {                                                  // paw near face: show toe beans on underside
    rect(pawX - 3, pY + 3.5, 6, 3, '#ff8fa3');
    rect(pawX - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(pawX + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
  } else {
    rect(pawX - 1, pY + 2, 2, pwH - 2, O);                        // contact: toe-split line
  }
  if (u > 0.55) {                                                  // little pink tongue licking the paw
    ctx.globalAlpha = (u - 0.55) / 0.45;
    rect(pawX - 2, pY + pwH, 4, 3, '#ff9aa8'); rect(pawX - 1, pY + pwH + 3, 2, 1, '#ff9aa8');
    ctx.globalAlpha = 1;
  }
  const sp = (t % 1600) / 1600;                                   // occasional "squeaky clean" sparkle
  if (sp < 0.4) { ctx.globalAlpha = (0.4 - sp) * 2; ctx.fillStyle = '#fff6d6';
    const sx = cx + 11, sy = faceY - 5 - sp * 7; ctx.fillRect(sx, sy, 2, 2); ctx.fillRect(sx + 2, sy - 3, 1, 1); ctx.globalAlpha = 1; }
}

// hunt/pet tuning
const HUNT_TRIGGER = 0.4, HUNT_SPEED = 6, STANDOFF = 28, POUNCE_RANGE = 46, POUNCE_MS = 300;

// mood/energy tuning (all tunable). Decay is per-ms; ~1.8/s gives a gentle drift
// back to calm when nothing is happening.
const ENERGY_DECAY = 0.0012;
const CALM_MAX = 50, PLAYFUL_MAX = 80;
const STARTLE_VEL = 3.5, STARTLE_JUMP = 320, STARTLE_MS = 820, ZOOMIES_MS = 2500;
const STARTLE_RANGE = 160;   // only flinch when the cursor lunges NEAR the cat — not on every fast move across the screen
function bandOf(e) { return e <= CALM_MAX ? 'calm' : e <= PLAYFUL_MAX ? 'playful' : 'zoomies'; }
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
  const cursorDx = cursor.x - prevCursor.x;
  velEMA = velEMA * 0.5 + inst * 0.5; prevCursor = { x: cursor.x, y: cursor.y };

  // shake-wobble: while held, fast side-to-side shaking (direction flips) makes
  // the stretched body wobble like jello. Flips expire quickly so a slow waggle
  // doesn't count; reduced motion skips the whole reaction.
  if (grabbing && !(config && config.reducedMotion)) {
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
  if (moodOn) energy = clamp(energy - dt * ENERGY_DECAY, 0, 100);
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
    const left = pos.x < canvas.width / 2;
    startleTo = { x: left ? zoneClampX(60) : zoneClampX(canvas.width - 60), y: zoneClampY(pos.y) };
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
  const petting = FORCED_STATE === 'pet' || t < petBurstUntil || (!grabbing && !hunting && !startleActive && inHead && velEMA < 0.25);
  if (petting) addEnergy(0.6 * step);   // affection nudges mood up toward calm/playful

  // body touch (not the head): the cat leans/arches into your hand, tail up, looks
  // at you, and trills now and then — a different reaction than the head-pet purr.
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

  // A real cat abandons its stroll the instant you interact. Cancel any active roam
  // so it never slides while petted/typing, and never resumes from a stale path
  // anchor after a hunt/startle/grab interrupts it (which would snap it back).
  if (roamUntil > t && (grabbing || hunting || startleActive || typing || petting || bodyPet)) {
    roamUntil = 0; roamFrom = null; roamTo = null;
  }

  const P = PATTERNS[patternIndex];
  const catSprite = sprites[patternIndex];   // this coat's body build (slender/stocky/fluffy/standard)
  const loafSprite = loafSprites[patternIndex] || catSprite;   // compact resting (loaf) body for the same coat
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
    const dx = cursor.x - pos.x, dy = cursor.y - pos.y, d = Math.hypot(dx, dy) || 1;
    let leap = 0, stretchY = 1;
    if (pouncing) {
      const e = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const ease = 1 - Math.pow(1 - e, 2);
      const tgt = pounceTarget || cursor;
      pos.x = pounceFrom.x + (tgt.x - pounceFrom.x) * ease;
      pos.y = pounceFrom.y + (tgt.y - pounceFrom.y) * ease;
      leap = Math.sin(e * Math.PI) * 18; stretchY = 1 + Math.sin(e * Math.PI) * 0.18;
      if (e >= 1) { pouncing = false; huntUntil = 0; persistPos(); tailFlickT0 = t; idleSparkles.push({ x: pos.x, y: pos.y - HH * 0.7, t0: t }); }   // "got it!" beat
    } else if (FORCED_STATE !== 'hunt' && d < POUNCE_RANGE) {
      pouncing = true; pounceT0 = t; pounceFrom = { x: pos.x, y: pos.y }; pounceTarget = { x: cursor.x, y: cursor.y };
    } else if (FORCED_STATE !== 'hunt') {
      const mv = Math.min(Math.max(0, d - STANDOFF), HUNT_SPEED * step);
      pos.x += dx / d * mv; pos.y += dy / d * mv;
    }
    pos.x = zoneClampX(pos.x); pos.y = zoneClampY(pos.y);
    restSprings();
    const creep = Math.round(Math.sin(t / 90) * 1.5);
    const ox = Math.round(pos.x - HW / 2), oy = Math.round(pos.y - HH) - Math.round(leap);
    const facingLeft = FORCED_STATE !== 'hunt' && cursor.x < pos.x;
    if (pouncing && pounceFrom && pounceTarget) {
      const pe = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const pdx = pounceTarget.x - pounceFrom.x, pdy = pounceTarget.y - pounceFrom.y, plen = Math.hypot(pdx, pdy) || 1;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = (0.28 - i * 0.07) * Math.sin(pe * Math.PI);
        ctx.fillStyle = pal.C;
        ctx.fillRect(Math.round(pos.x - pdx / plen * i * 7 - 2), Math.round(pos.y - leap - HH * 0.5 - pdy / plen * i * 7 - 3), 4, 6);
      }
      ctx.globalAlpha = 1;
    }
    drawShadow(pos.x, pos.y, 0.18, 26);
    octx.clearRect(0, 0, oc.width, oc.height);
    drawCat(octx, spriteHunt, t, palRGB, { bob: creep, blinking, look, eyeMode: 'open', dilate: pouncing ? 1.5 : 1.32 });
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
    // --- autonomous roaming: a real cat wanders. When calm (not busy), now
    // and then stroll to a random spot inside the play area with a little hop-walk.
    if (nextRoam === 0) nextRoam = t + 15000 + Math.random() * 15000;
    const roamIdle = !grabbing && !hunting && !startleActive && !typing && !petting && !bodyPet && !FORCED_STATE && t > groomUntil && agentState === 'idle' && !(config && config.roamOn === false) && !(config && config.reducedMotion);
    if (roamIdle && roamUntil < t && t > nextRoam) {
      roamFrom = { x: pos.x, y: pos.y };
      const rx = playArea ? (playArea.x + Math.random() * playArea.w) * canvas.width : Math.random() * canvas.width;
      const ry = playArea ? (playArea.y + Math.random() * playArea.h) * canvas.height : canvas.height * 0.45 + Math.random() * canvas.height * 0.5;
      roamTo = { x: zoneClampX(rx), y: zoneClampY(ry) };
      roamUntil = t + 1500; nextRoam = t + 20000 + Math.random() * 25000; tailFlickT0 = t; loafUntil = 0;
    }
    if (roamUntil > t && roamFrom && roamTo) {
      const e = clamp((t - (roamUntil - 1500)) / 1500, 0, 1);
      const ease = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;   // easeInOut
      pos.x = roamFrom.x + (roamTo.x - roamFrom.x) * ease;
      pos.y = roamFrom.y + (roamTo.y - roamFrom.y) * ease - Math.abs(Math.sin(e * Math.PI * 5)) * 3;   // hop-walk
      restSprings();
      if (e >= 1) persistPos();
      wantHighFps = true;
    }
    const axX = feet.x - head.x, axY = feet.y - head.y, len = Math.hypot(axX, axY) || 1, ang = Math.atan2(axY, axX), ratio = len / SH;
    const speed = Math.hypot(head.vx, head.vy) + Math.hypot(feet.vx, feet.vy);
    const calm = !grabbing && FORCED_STATE !== 'mochi' && Math.abs(ratio - 1) < 0.02 && speed < 0.45 && Math.abs(ang - Math.PI / 2) < 0.03;
    const eyeMode = petting ? 'happy' : 'open';
    const bob = Math.round(Math.sin(t / (typing ? 220 : 700)) * 3);

    // --- liveliness: eased gaze + periodic idle micro-actions ---------------
    const restIdle = calm && !petting && !bodyPet && !typing && !grabbing && !FORCED_STATE && roamUntil < t && agentState === 'idle';
    if (restIdle) {
      const idleScale = 2 - intensity;   // zoomies -> more frequent darts, calm -> rarer
      if (nextIdleAt === 0) nextIdleAt = t + (2600 + Math.random() * 4200) * idleScale;
      if (t > nextIdleAt) {
        nextIdleAt = t + (3200 + Math.random() * 6000) * idleScale;
        const roll = Math.random();
        if (roll < 0.34) { lookTarget = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.5 }; lookTargetUntil = t + 800 + Math.random() * 1100; }
        else if (roll < 0.50) { tailFlickT0 = t; }
        else if (roll < 0.62) { leanTarget = (Math.random() < 0.5 ? -1 : 1) * 0.035; leanUntil = t + 750; }
        else if (roll < 0.78) { loafUntil = t + 4000 + Math.random() * 4000; }   // settle into a content loaf
        else if (roll < 0.92 && band !== 'zoomies') { groomUntil = t + 2600 + Math.random() * 1400; }   // wash its face (not when hyper)
        else { blinkUntil = t + 230; nextBlink = t + 380; }   // sleepy double-blink
        if ((band === 'playful' || band === 'zoomies') && Math.random() < 0.4 && !(config && config.reducedMotion)) { doneHopPending = true; tailFlickT0 = t; }   // spontaneous playful bounce
        if (band === 'zoomies' && Math.random() < 0.3 && !(config && config.reducedMotion)) spinUntil = t + 650;   // tail-chase pirouette
      }
    } else { nextIdleAt = 0; }
    if (lookTarget && t > lookTargetUntil) lookTarget = null;
    if (t > leanUntil) leanTarget = 0;
    lean += (leanTarget - lean) * 0.09 * step;
    const gaze = lookTarget || look;
    smoothLook.x += (gaze.x - smoothLook.x) * 0.18 * step;   // snappier cursor tracking
    smoothLook.y += (gaze.y - smoothLook.y) * 0.18 * step;
    // continuous subtle body-lean toward the cursor (the cat "watches" it), only
    // when following and idle-ish — never fights a grab/throw/typing pose.
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
    } else if (!grabbing && (calm || petting || stretching || thinking || working || hopActive || paperActive || FORCED_STATE === 'loaf' || FORCED_STATE === 'groom')) {
      const idleSway = Math.round(Math.sin(t / 2600));                 // slow weight shift ±1
      const grooming = FORCED_STATE === 'groom' || (calm && !petting && !bodyPet && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && roamUntil < t && t < groomUntil);
      const loafing = !grooming && (FORCED_STATE === 'loaf' || (calm && !petting && !typing && !stretching && !thinking && !working && !hopActive && !paperActive && t < loafUntil));
      const wig = idleSway;   // calm "normal" patting — no fast side-to-side jitter while petted
      const emode = (petting || stretching || loafing || grooming || hopActive) ? 'happy' : 'open';   // celebrate the done/playful hop with a happy squint
      const eLook = (thinking || working) ? { x: 0, y: -0.5 } : paperActive ? { x: -0.35, y: clamp(climbDir, -1, 1) * 0.6 } : smoothLook;   // look the way it climbs the rope
      const climbRaster = paperActive && !petting && !stretching && coatHasFrames(coatSlug(P.name));   // painted climb for THIS coat?
      const breath = Math.sin(t / 1500);                              // gentle breathing
      let sx = 1 - breath * 0.012, sy = 1 + breath * 0.020;
      if (stretching) {
        const se = FORCED_STATE === 'stretch' ? ((t % STRETCH_MS) / STRETCH_MS) : clamp((t - stretchT0) / STRETCH_MS, 0, 1);
        const k = Math.sin(se * Math.PI); sy = 1 + k * 0.32; sx = 1 + k * 0.10;
      }
      const ox = Math.round(pos.x - SW / 2) + wig, oy = Math.round(pos.y - SH) - Math.round(hop);
      const shadowA = (petting || bodyPet) ? 0.14 + Math.sin(t / 800) * 0.05 : 0.18;
      drawShadow(pos.x + wig, pos.y, shadowA);
      if (!stretching && !thinking && !working && !loafing && !climbRaster) drawTail(pos.x + wig, pos.y, t, pal, tailFlickT0, petting);   // loaf has a baked, wrapped tail; the climb frame has its own tail
      if (restIdle && band === 'calm' && !paperActive && t > nextIdleSparkle) {
        idleSparkles.push({ x: pos.x + (Math.random() - 0.5) * 8, y: oy, t0: t });
        nextIdleSparkle = t + 5000 + Math.random() * 4000;
      }
      if (loafing && calm && t > nextLoafZ) {
        loafZZZ.push({ x: pos.x + 10 + Math.random() * 8, y: oy + 8, t0: t, sz: Math.random() < 0.4 ? 2 : 1 });
        nextLoafZ = t + 1800 + Math.random() * 1600;
      }
      if (climbRaster) {
        // painterly raster climb: the tuxedo sprite frame grips the procedural rope
        // (the seated procedural cat is skipped entirely while climbing).
        drawClimbFrame(pos, t, climbing, climbDir, coatSlug(P.name));
      } else {
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, loafing ? loafSprite : catSprite, t, palRGB, { bob, blinking, look: eLook, eyeMode: emode, blush: petting || bodyPet });
      if (paperActive && !petting && !stretching) {
        // both front paws lift off the ground to grip the rope, so paint over the
        // baked planted front legs+paws on the offscreen sprite (so it scales/flips
        // with the cat) — otherwise they read as extra limbs behind the climbing arms.
        octx.fillStyle = rgbStr(palRGB.C); octx.fillRect(28, 95 + bob, 64, 25);
      }
      ctx.save();
      ctx.translate(pos.x + wig, pos.y - hop);
      if (lean || cursorLean) ctx.rotate(lean + cursorLean);   // idle lean + watch-the-cursor tilt
      if (spinUntil > t) ctx.rotate((1 - (spinUntil - t) / 650) * Math.PI * 2);   // tail-chase spin
      const faceLeft = roamUntil > t && roamFrom && roamTo && roamTo.x < roamFrom.x;   // face where it walks
      ctx.scale(faceLeft ? -sx : sx, sy);
      ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
      ctx.restore();
      if (overheat) drawSteam(t, ox + SW / 2, oy + CELL);   // red+steam cooldown after typing
      if (petting && t - lastHeart > 520) { hearts.push({ x: pos.x + (Math.random() - 0.5) * 14, y: oy - 4, t0: t, s: 2.1 }); lastHeart = t; }   // big love hearts rising from the head
      else if (bodyPet && t - lastHeart > 950) { hearts.push({ x: pos.x + (Math.random() - 0.5) * 22, y: oy + 6, t0: t, s: 1.5 }); lastHeart = t; }
      if (thinking) drawThinkBubble(pos.x + SW * 0.32, oy + 4, t);
      else if (working) drawWorkBubble(pos.x + SW * 0.32, oy + 2, t);
      if (hopActive) drawDoneSpark(pos.x, oy - 4, t);
      if (paperActive && !petting && !stretching) {
        drawRopeClimb(palRGB, pos, t, climbing, climbDir, Math.round(paperLen));
      }
      }
      if (grooming && !paperActive) drawGroom(palRGB, pos.x + wig, oy + SH * 0.30, t);   // raise a paw, wash its face
      if (t < labelUntil) {
        ctx.globalAlpha = Math.min(1, (labelUntil - t) / 300); ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const name = P.name, w = ctx.measureText(name).width + 10, bx = pos.x, by = oy + SH + 14;
        ctx.fillStyle = 'rgba(20,20,24,0.82)'; ctx.fillRect(bx - w / 2, by - 13, w, 13); ctx.fillStyle = '#fff'; ctx.fillText(name, bx, by); ctx.globalAlpha = 1;
      }
      // fully idle (only breathing/tail)? let the governor drop to ~33fps
      if (calm && !petting && !stretching && !thinking && !working && !hopActive && !paperActive && !grooming && !blinking
          && !lookTarget && t > lookTargetUntil && hearts.length === 0 && idleSparkles.length === 0 && loafZZZ.length === 0 && t >= bubbleUntil
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

  // floating hearts (update + draw; persist after petting ends)
  hearts = hearts.filter((h) => t - h.t0 < 1100);
  for (const h of hearts) { const a = (t - h.t0) / 1100; drawHeart(Math.round(h.x + Math.sin(a * 6) * 4), Math.round(h.y - a * 30), a < 0.5 ? '#ff5a6e' : '#ff8a98', (1 - a) * 0.95, h.s || 1); }
  idleSparkles = idleSparkles.filter((s) => t - s.t0 < 400);
  for (const s of idleSparkles) { const a = (t - s.t0) / 400; ctx.globalAlpha = (1 - a) * 0.9; ctx.fillStyle = '#fff6d6'; ctx.fillRect(Math.round(s.x), Math.round(s.y - a * 12), 2, 2); ctx.fillRect(Math.round(s.x + 3), Math.round(s.y - a * 12 - 3), 1, 1); ctx.globalAlpha = 1; }
  loafZZZ = loafZZZ.filter((z) => t - z.t0 < 1100);
  for (const z of loafZZZ) { const a = (t - z.t0) / 1100, yOff = a * 14, fade = a < 0.15 ? a / 0.15 : a > 0.75 ? (1 - a) / 0.25 : 1; ctx.globalAlpha = fade * 0.65; ctx.fillStyle = '#8ab4cc'; const zx = Math.round(z.x), zy = Math.round(z.y - yOff), s = z.sz; ctx.fillRect(zx, zy, s * 4, s); ctx.fillRect(zx + s * 2, zy + s, s * 2, s); ctx.fillRect(zx + s, zy + s * 2, s * 2, s); ctx.fillRect(zx, zy + s * 3, s * 4, s); ctx.globalAlpha = 1; }

  // reminder/break speech bubble — drawn here (outside the pose branches) so it's
  // visible even if a reminder fires mid-hunt or mid-type. A transient bubble
  // outranks the pinned note so reminders never get masked.
  if (t < bubbleUntil && bubbleText) drawBubble(pos.x, pos.y - SH - 6, bubbleText, Math.min(1, (bubbleUntil - t) / 400));
  else if (config && config.pinnedNote) drawBubble(pos.x, pos.y - SH - 6, '📌 ' + template(config.pinnedNote), 0.95);

  // pomodoro pixel timer — floats beside the cat in every pose; main owns the
  // clock (phase + endsAt), we just count it down locally.
  if (pomo && pomo.on) drawPomoTimer(pos.x + SW / 2 + 10, pos.y - SH + 6, t);

  // natural blinking: varied timing with occasional slow/sleepy + double blinks
  if (t > nextBlink && t > blinkUntil) {
    const sleepy = Math.random() < 0.22;
    blinkUntil = t + (sleepy ? 230 : 120);
    nextBlink = (Math.random() < 0.18) ? t + 360 : t + 2000 + Math.random() * 2800;
  }
  if (settingArea) drawSetArea();
}
function resumeRaf() { if (rafPaused) { rafPaused = false; lastDrawn = 0; requestAnimationFrame(draw); } }
function rectOf(a, b) { return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }; }
function finishSetArea(cancel) {
  let area = null;
  if (!cancel && areaRect && areaRect.w > 40 && areaRect.h > 40) {
    area = { x: areaRect.x / canvas.width, y: areaRect.y / canvas.height, w: areaRect.w / canvas.width, h: areaRect.h / canvas.height };
  }
  settingArea = false; areaDragStart = null; areaRect = null;
  if (window.cat && window.cat.setAreaDone) window.cat.setAreaDone(area);
}
function drawSetArea() {
  ctx.save();
  ctx.fillStyle = 'rgba(10,12,18,0.30)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (areaRect && areaRect.w > 2 && areaRect.h > 2) {
    ctx.clearRect(areaRect.x, areaRect.y, areaRect.w, areaRect.h);
    ctx.strokeStyle = '#e8943c'; ctx.lineWidth = 2; ctx.setLineDash([8, 5]);
    ctx.strokeRect(areaRect.x, areaRect.y, areaRect.w, areaRect.h); ctx.setLineDash([]);
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText("Drag to set the cat's play area  -  Esc or right-click to cancel", canvas.width / 2, 42);
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
    pos.x = zoneClampX(head.x); pos.y = zoneClampY(groundBaselineY());   // always land on the taskbar line
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
