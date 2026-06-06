// ===== Desktop pixel cat: 12 patterns, mochi-drag, typing, hunt, purr ========
// Role-coded sprites recolored per pattern, on a full-screen click-through overlay.
// Roles:  . transparent  O outline  H white halo  C coat  K markings  W white
//         X patch (tortie/calico)   E eye   N nose   I inner-ear

const CELL = 5;
const canvas = document.getElementById('cat');
const ctx = canvas.getContext('2d');
const qp = new URLSearchParams(location.search);
const SHOT = qp.get('shot') === '1';
const FORCED_STATE = qp.get('state');
function resize() {
  if (SHOT) { canvas.width = 260; canvas.height = 320; }
  else { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  ctx.imageSmoothingEnabled = false;
}
resize();
if (!SHOT) window.addEventListener('resize', resize);

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
function composeSit() {
  const CX = 12;
  ellipse(CX, 24, 7.5, 4.6, 'C'); ellipse(CX, 16, 5.2, 7.5, 'C'); ellipse(CX, 8, 6.3, 5.8, 'C');
  ellipse(10.5, 23, 1.7, 5.6, 'C'); ellipse(13.5, 23, 1.7, 5.6, 'C');
  // tail is drawn procedurally in the renderer (animated sway) — not baked here
  for (let r = 17; r <= 28; r++) setCell(12, r, '.');
  for (let r = 27; r <= 28; r++) { setCell(11, r, '.'); setCell(13, r, '.'); }
  triangle(7, 1, 5, 7, 9, 7, 'K'); triangle(17, 1, 15, 7, 19, 7, 'K');
  triangle(7, 3, 6, 7, 8, 7, 'I'); triangle(17, 3, 16, 7, 18, 7, 'I');
  ellipse(CX, 12, 3, 2, 'W', ['C']); ellipse(CX, 17, 2.7, 7.5, 'W', ['C']);
  ellipse(10.5, 27, 2, 1.6, 'W', ['C']); ellipse(13.5, 27, 2, 1.6, 'W', ['C']);
  ellipse(9, 8.2, 2, 2.4, 'E'); ellipse(15, 8.2, 2, 2.4, 'E');
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  [[11, 6], [12, 7], [13, 6]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); }); // subtle brow
  for (let r = 0; r < GR; r++) for (let c = 17; c < GC; c++) if (G[r][c] === 'C' && r % 2 === 0) G[r][c] = 'K';
  [8, 10.5, 13.5, 16].forEach((sc) => { for (let r = 13; r < 26; r += 2) { const c = Math.round(sc); if (G[r][c] === 'C') setCell(c, r, 'K'); } });
  ellipse(8, 19, 2.2, 3, 'X', ['C', 'K']); ellipse(15, 23, 2.2, 2.3, 'X', ['C', 'K']);
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

const spriteSit = buildSprite(24, 30, composeSit);
const spriteHunt = buildSprite(30, 20, composeHunt);
const SW = spriteSit.SW, SH = spriteSit.SH;     // sit dims (mochi uses these)
const HW = spriteHunt.SW, HH = spriteHunt.SH;   // hunt dims

// offscreen buffer big enough for either sprite
const oc = document.createElement('canvas');
oc.width = Math.max(SW, HW); oc.height = Math.max(SH, HH);
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
let patternIndex = Number(localStorage.getItem('pattern') || 0);
if (!(patternIndex >= 0 && patternIndex < PATTERNS.length)) patternIndex = 0;
const forcedPattern = qp.get('pattern');
if (forcedPattern) { const i = PATTERNS.findIndex((p) => p.name.toLowerCase().includes(forcedPattern.toLowerCase())); if (i >= 0) patternIndex = i; }

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
// A small front paw with toe beans, for the sit-and-tap typing motion.
function drawTapPaw(x, y, pal) {
  ctx.fillStyle = pal.O; ctx.fillRect(x - 5, y - 4, 10, 8);
  ctx.fillStyle = pal.W; ctx.fillRect(x - 4, y - 3, 8, 6);
  ctx.fillStyle = pal.N; ctx.fillRect(x - 2, y + 1, 2, 2); ctx.fillRect(x + 1, y + 1, 2, 2);
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
let huntUntil = 0, pouncing = false, pounceT0 = 0, pounceFrom = null;
let hearts = [], lastHeart = 0;
// stretch reminder (08) + AI-agent thinking/done (10/11)
let stretchT0 = -1, nextStretch = 0;
let agentState = 'idle', doneHopT0 = -1, doneHopPending = false;
const STRETCH_INTERVAL = 1000 * 60 * 20, STRETCH_MS = 1700, DONE_MS = 760;
// paper unroll (09)
let paperLen = 0, paperUntil = 0, scrollPulses = 0;
// liveliness: eased gaze, idle micro-actions, animated tail + frame governor
let smoothLook = { x: 0, y: 0 };
let lookTarget = null, lookTargetUntil = 0;
let nextIdleAt = 0, leanTarget = 0, lean = 0, leanUntil = 0, tailFlickT0 = -1;
let lastDrawn = 0, wantHighFps = true, rafPaused = false;
// Comnyang-style productivity layer: settings from main + reminder/break bubble
let config = null;
let bubbleText = '', bubbleUntil = 0;
let purring = false;

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
    if (s === 'done') { doneHopPending = true; agentState = 'idle'; }
    else agentState = s === 'thinking' ? 'thinking' : 'idle';
  });
  if (window.cat.onScroll) window.cat.onScroll(() => { scrollPulses++; });
  if (window.cat.onConfig) window.cat.onConfig((c) => {
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
  for (const [type, detune] of [['triangle', 0], ['sine', 6]]) {
    const o = ac.createOscillator(); o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(620, t0);
    o.frequency.linearRampToValueAtTime(720, t0 + 0.10);
    o.frequency.linearRampToValueAtTime(520, t0 + 0.28);
    o.connect(g); o.start(t0); o.stop(t0 + 0.32);
  }
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
  purrNodes = { carrier, lfo, amp };
}
function stopPurr() {
  if (!purrNodes) return;
  try { purrNodes.carrier.stop(); purrNodes.lfo.stop(); } catch (e) { /* ignore */ }
  purrNodes = null;
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

  // cursor velocity (px/ms, smoothed)
  const inst = Math.hypot(cursor.x - prevCursor.x, cursor.y - prevCursor.y) / Math.max(1, dt);
  velEMA = velEMA * 0.5 + inst * 0.5; prevCursor = { x: cursor.x, y: cursor.y };

  if (keyPulse) { lastKeyAt = t; heat = Math.min(1, heat + 0.12); keyPulse = false; }
  heat = Math.max(0, heat - dt * 0.0009);

  // paper unroll: scrolling grows the paper; it retracts when you stop.
  if (scrollPulses > 0) { paperUntil = t + 700; paperLen = Math.min(70, paperLen + scrollPulses * 7); scrollPulses = 0; }
  if (FORCED_STATE === 'paper') paperLen = 50;
  else if (t > paperUntil) paperLen = Math.max(0, paperLen - dt * 0.06);
  const paperActive = FORCED_STATE === 'paper' || paperLen > 1;

  // Mouse-hunt: when enabled in settings, a fast cursor flick (far enough away)
  // makes the cat crouch, stalk, and pounce. Off by config -> the cat stays put.
  const huntOn = !!(config && config.huntOn);
  const dCur = Math.hypot(cursor.x - pos.x, cursor.y - (pos.y - SH * 0.5));
  if (huntOn && !grabbing && !SHOT && velEMA > HUNT_TRIGGER && dCur > 70) huntUntil = t + 1400;
  const hunting = FORCED_STATE === 'hunt' || (huntOn && t < huntUntil);

  // pet detection (cursor resting on the head, slow, not hunting/grabbing)
  const headBox = { x: pos.x - SW / 2, y: pos.y - SH, w: SW, h: SH * 0.42 };
  const inHead = cursor.x >= headBox.x && cursor.x <= headBox.x + headBox.w && cursor.y >= headBox.y && cursor.y <= headBox.y + headBox.h;
  const petting = FORCED_STATE === 'pet' || (!grabbing && !hunting && inHead && velEMA < 0.25);

  // purr while petted (only when sound is on); start/stop once on the edge
  const wantPurr = petting && !SHOT && !!(config && config.soundOn);
  if (wantPurr && !purring) { startPurr(); purring = true; }
  else if (!wantPurr && purring) { stopPurr(); purring = false; }

  let typing, overheat, heatT;
  if (FORCED_STATE === 'overheat') { typing = true; overheat = true; heatT = 1; }
  else if (FORCED_STATE === 'typing') { typing = true; overheat = false; heatT = 0; }
  else { typing = !grabbing && !hunting && (t - lastKeyAt) < 350; overheat = heat > 0.7; heatT = overheat ? (heat - 0.7) / 0.3 : 0; }

  const P = PATTERNS[patternIndex];
  const palRGB = {
    O: toRgb(heatT ? lerpHex(P.outline, HOT_OUTLINE, heatT) : P.outline),
    C: toRgb(heatT ? lerpHex(P.coat, HOT_BODY, heatT) : P.coat),
    K: toRgb(heatT ? lerpHex(P.mark, HOT_BODY, heatT) : P.mark),
    W: toRgb(heatT ? lerpHex(P.white, HOT_BODY, heatT * 0.5) : P.white),
    X: toRgb(heatT ? lerpHex(P.patch, HOT_BODY, heatT) : P.patch),
    I: toRgb(P.inner), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO),
  };
  const pal = { O: rgbStr(palRGB.O), C: rgbStr(palRGB.C), W: rgbStr(palRGB.W), N: rgbStr(palRGB.N) };

  const look = (() => { const fx = pos.x, fy = pos.y - SH * 0.72, vx = cursor.x - fx, vy = cursor.y - fy, l = Math.hypot(vx, vy) || 1; return { x: vx / l, y: vy / l }; })();
  const blinking = t < blinkUntil;

  if (hunting) {
    // ---- MOUSE HUNT: stalk toward the cursor, then pounce -------------------
    const dx = cursor.x - pos.x, dy = cursor.y - pos.y, d = Math.hypot(dx, dy) || 1;
    let leap = 0, stretchY = 1;
    if (pouncing) {
      const e = clamp((t - pounceT0) / POUNCE_MS, 0, 1);
      const ease = 1 - Math.pow(1 - e, 2);
      pos.x = pounceFrom.x + (cursor.x - pounceFrom.x) * ease;
      pos.y = pounceFrom.y + (cursor.y - pounceFrom.y) * ease;
      leap = Math.sin(e * Math.PI) * 18; stretchY = 1 + Math.sin(e * Math.PI) * 0.18;
      if (e >= 1) { pouncing = false; huntUntil = 0; persistPos(); }
    } else if (FORCED_STATE !== 'hunt' && d < POUNCE_RANGE) {
      pouncing = true; pounceT0 = t; pounceFrom = { x: pos.x, y: pos.y };
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
      if (nextIdleAt === 0) nextIdleAt = t + 4000 + Math.random() * 6000;
      if (t > nextIdleAt) {
        nextIdleAt = t + 5000 + Math.random() * 9000;
        const roll = Math.random();
        if (roll < 0.45) { lookTarget = { x: Math.random() * 2 - 1, y: (Math.random() * 2 - 1) * 0.5 }; lookTargetUntil = t + 800 + Math.random() * 1100; }
        else if (roll < 0.72) { tailFlickT0 = t; }
        else if (roll < 0.90) { leanTarget = (Math.random() < 0.5 ? -1 : 1) * 0.035; leanUntil = t + 750; }
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
    if (doneHopPending) { doneHopT0 = t; doneHopPending = false; }
    let hop = 0, hopActive = false;
    if (FORCED_STATE === 'done') { hop = Math.sin(((t % DONE_MS) / DONE_MS) * Math.PI) * 22; hopActive = true; }
    else if (doneHopT0 >= 0 && t - doneHopT0 < DONE_MS) { hop = Math.sin(((t - doneHopT0) / DONE_MS) * Math.PI) * 22; hopActive = true; }

    if (typing || FORCED_STATE === 'typing' || FORCED_STATE === 'overheat') {
      // Simple: stay sitting and tap the front paws up/down (small motion).
      const tb = Math.round(Math.sin(t / 240) * 2);
      const ox = Math.round(pos.x - SW / 2), oy = Math.round(pos.y - SH);
      drawShadow(ox + SW / 2, oy + SH, 0.18);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, spriteSit, t, palRGB, { bob: tb, blinking, look, eyeMode: 'open' });
      ctx.drawImage(oc, 0, 0, SW, SH, ox, oy + tb, SW, SH);
      const sp = overheat ? 50 : 95;
      const lp = Math.max(0, Math.sin(t / sp)), rp = Math.max(0, Math.sin(t / sp + Math.PI)), amp = 4;
      const py = oy + 27 * CELL + tb;
      drawTapPaw(ox + 10.3 * CELL, py - lp * amp, pal);
      drawTapPaw(ox + 13.7 * CELL, py - rp * amp, pal);
      if (overheat) drawSteam(t, ox + SW / 2, oy + CELL + tb);
      sendHot(ox - 6, oy - 6, SW + 12, SH + 12, false);
    } else if (!grabbing && (calm || petting || stretching || thinking || hopActive || paperActive)) {
      const idleSway = Math.round(Math.sin(t / 2600));                 // slow weight shift ±1
      const wig = (petting ? Math.round(Math.sin(t / 55)) : 0) + idleSway;
      const emode = (petting || stretching) ? 'happy' : 'open';
      const eLook = thinking ? { x: 0, y: -0.5 } : smoothLook;
      const breath = Math.sin(t / 1500);                              // gentle breathing
      let sx = 1 - breath * 0.012, sy = 1 + breath * 0.020;
      if (stretching) {
        const se = clamp((t - (FORCED_STATE === 'stretch' ? t - STRETCH_MS / 2 : stretchT0)) / STRETCH_MS, 0, 1);
        const k = Math.sin(se * Math.PI); sy = 1 + k * 0.32; sx = 1 + k * 0.10;
      }
      const ox = Math.round(pos.x - SW / 2) + wig, oy = Math.round(pos.y - SH) - Math.round(hop);
      drawShadow(pos.x + wig, pos.y, 0.18);
      if (!stretching && !thinking) drawTail(pos.x + wig, pos.y, t, pal, tailFlickT0, petting);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, spriteSit, t, palRGB, { bob, blinking, look: eLook, eyeMode: emode });
      ctx.save();
      ctx.translate(pos.x + wig, pos.y - hop);
      if (lean) ctx.rotate(lean);
      ctx.scale(sx, sy);
      ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH);
      ctx.restore();
      if (overheat) drawSteam(t, ox + SW / 2, oy + CELL);   // red+steam cooldown after typing
      if (petting && t - lastHeart > 430) { hearts.push({ x: pos.x + (Math.random() - 0.5) * 18, y: oy - 2, t0: t }); lastHeart = t; }
      if (thinking) drawThinkBubble(pos.x + SW * 0.32, oy + 4, t);
      if (hopActive) drawDoneSpark(pos.x, oy - 4, t);
      if (paperActive && !petting && !stretching) drawPaper(pos.x, pos.y - 36, Math.round(paperLen), t);
      if (t < labelUntil) {
        ctx.globalAlpha = Math.min(1, (labelUntil - t) / 300); ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const name = P.name, w = ctx.measureText(name).width + 10, bx = pos.x, by = oy + SH + 14;
        ctx.fillStyle = 'rgba(20,20,24,0.82)'; ctx.fillRect(bx - w / 2, by - 13, w, 13); ctx.fillStyle = '#fff'; ctx.fillText(name, bx, by); ctx.globalAlpha = 1;
      }
      if (t < bubbleUntil && bubbleText) drawBubble(pos.x, oy - 6, bubbleText, Math.min(1, (bubbleUntil - t) / 400));
      // fully idle (only breathing/tail)? let the governor drop to ~33fps
      if (calm && !petting && !stretching && !thinking && !hopActive && !paperActive && !blinking
          && !lookTarget && t > lookTargetUntil && hearts.length === 0 && t >= bubbleUntil
          && (tailFlickT0 < 0 || t - tailFlickT0 > 700) && Math.abs(lean) < 0.004) wantHighFps = false;
      sendHot(ox - 6, oy - 6, SW + 12, SH + 12, false);
    } else if (grabbing || FORCED_STATE === 'mochi' || ratio > 1.06) {
      drawShadow(feet.x, feet.y, 0.10);
      octx.clearRect(0, 0, oc.width, oc.height); drawCat(octx, spriteSit, t, palRGB, { bob: 0, blinking, look });
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
      octx.clearRect(0, 0, oc.width, oc.height); drawCat(octx, spriteSit, t, palRGB, { bob: 0, blinking, look });
      const sq = clamp(ratio, 0.65, 1.06), sy = sq, sx = 1 / Math.sqrt(sq);
      ctx.save(); ctx.translate(pos.x, pos.y); ctx.scale(sx, sy); ctx.drawImage(oc, 0, 0, SW, SH, -SW / 2, -SH, SW, SH); ctx.restore();
      sendHot(pos.x - SW / 2 - 6, pos.y - SH - 6, SW + 12, SH + 12, false);
    }
  }

  // floating hearts (update + draw; persist after petting ends)
  hearts = hearts.filter((h) => t - h.t0 < 1100);
  for (const h of hearts) { const a = (t - h.t0) / 1100; drawHeart(Math.round(h.x + Math.sin(a * 6) * 4), Math.round(h.y - a * 26), a < 0.5 ? '#ff5a6e' : '#ff8a98', (1 - a) * 0.95); }

  // natural blinking: varied timing with occasional slow/sleepy + double blinks
  if (t > nextBlink && t > blinkUntil) {
    const sleepy = Math.random() < 0.22;
    blinkUntil = t + (sleepy ? 230 : 120);
    nextBlink = (Math.random() < 0.18) ? t + 360 : t + 2000 + Math.random() * 2800;
  }
}
function resumeRaf() { if (rafPaused) { rafPaused = false; lastDrawn = 0; requestAnimationFrame(draw); } }
document.addEventListener('visibilitychange', () => { if (!document.hidden) resumeRaf(); });
requestAnimationFrame(draw);

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
