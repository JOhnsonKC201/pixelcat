// Generates assets/pixelcat-demo.gif — a short looping clip that shows what the
// desktop pet DOES: it sits and follows your cursor, naps when idle, taps its
// paws when you type, pounces to hunt, and purrs when you pet it. Pure JS, no
// browser / no native deps: the sprite geometry comes from src/cat-sprite.js
// (single source of truth) plus the pose composers copied from renderer.js, all
// rasterised by hand into RGBA frames and encoded with gifenc.
//   Run:  node scripts/make-demo-gif.js
const fs = require('fs');
const path = require('path');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');
const S = require('../src/cat-sprite.js');

// ---- grid machinery (own copy so the renderer poses share ONE grid) ---------
const CELL = S.CELL;
let G, GC, GR;
const inb = (c, r) => c >= 0 && c < GC && r >= 0 && r < GR;
function setCell(c, r, role) { if (inb(c, r)) G[r][c] = role; }
function ellipse(cx, cy, rx, ry, role, onlyOn) {
  for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++)
    for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1 && inb(c, r)) { if (!onlyOn || onlyOn.includes(G[r][c])) G[r][c] = role; }
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
  if (maxC < 0) return { c: -1 };
  return { c: (minC + maxC + 1) / 2, r: (minR + maxR + 1) / 2, w: maxC - minC + 1, h: maxR - minR + 1 };
}
function muzzlePt() {
  let sx = 0, sy = 0, n = 0;
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) if (G[r][c] === 'N') { sx += c; sy += r; n++; }
  n = n || 1; return { c: sx / n + 0.5, r: sy / n + 0.5 };
}
function buildSprite(cols, rows, compose) {
  G = Array.from({ length: rows }, () => Array(cols).fill('.')); GC = cols; GR = rows;
  compose(); outlineHalo();
  return { grid: G, COLS: cols, ROWS: rows, eyes: [eyeBox('L'), eyeBox('R')], muzzle: muzzlePt() };
}

// ---- pose composers (sit from cat-sprite; the rest copied from renderer.js) --
function composeSit(B) {
  B = B || {};
  const CX = 12, bw = B.bodyW || 1;
  const headRx = B.headRx || 6.3, headRy = B.headRy || 5.8;
  const earY = B.earApexY == null ? 1 : B.earApexY, ew = B.earW || 2.4, eo = B.earOut || 4;
  const eRx = B.eyeRx || 2, eRy = B.eyeRy || 2.4, fluff = !!B.fluff, cheek = B.cheek || 0;
  ellipse(CX, 24, 7.6 * bw, 5 + (fluff ? 0.4 : 0), 'C');
  ellipse(CX, 16, 5.2 * bw, 7.5, 'C');
  ellipse(CX, 8, headRx, headRy, 'C');
  if (cheek) { ellipse(CX - headRx * 0.7, 9.6, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6, 1.7, 2.2, 'C'); }
  if (fluff) { ellipse(5.4, 10.4, 1.9, 2.4, 'C'); ellipse(18.6, 10.4, 1.9, 2.4, 'C'); }
  triangle(CX - eo - 0.5, earY, CX - eo - ew, 7.6, CX - eo + ew, 6.4, 'K');
  triangle(CX + eo + 0.5, earY, CX + eo + ew, 7.6, CX + eo - ew, 6.4, 'K');
  const iw = ew * 0.55;
  triangle(CX - eo - 0.3, earY + 2, CX - eo - iw, 7.2, CX - eo + iw, 6.6, 'I');
  triangle(CX + eo + 0.3, earY + 2, CX + eo + iw, 7.2, CX + eo - iw, 6.6, 'I');
  if (fluff) { ellipse(CX - eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); ellipse(CX + eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); }
  ellipse(CX, 12, 3, 2, 'W', ['C']); ellipse(CX, 17, fluff ? 3.4 : 2.7, 7, 'W', ['C']);
  ellipse(10, 23, 1.6, 5.2, 'C'); ellipse(14, 23, 1.6, 5.2, 'C');
  ellipse(10, 27.4, 2, 1.7, 'W', ['C']); ellipse(14, 27.4, 2, 1.7, 'W', ['C']);
  ellipse(9, 8.2, eRx, eRy, 'E'); ellipse(15, 8.2, eRx, eRy, 'E');
  setCell(12, 11, 'N'); setCell(11, 11, 'N');
  if (B.tabby) {
    [[11, 6], [12, 7], [13, 6]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); });
    for (let r = 0; r < GR; r++) for (let c = 17; c < GC; c++) if (G[r][c] === 'C' && r % 2 === 0) G[r][c] = 'K';
    [8, 10, 14, 16].forEach((sc) => { for (let r = 13; r < 26; r += 2) { if (G[r][sc] === 'C') setCell(sc, r, 'K'); } });
  }
  ellipse(8, 19, 2.2, 3, 'X', ['C', 'K']); ellipse(15, 23, 2.2, 2.3, 'X', ['C', 'K']);
  for (let r = 19; r <= 28; r++) setCell(12, r, '.');
  for (let r = 22; r <= 28; r++) { setCell(8, r, '.'); setCell(16, r, '.'); }
}
function composeHunt() {
  const CX = 15;
  ellipse(CX, 12, 11, 5.4, 'C');
  ellipse(CX, 8, 6.2, 5, 'C');
  triangle(9, 4, 6, 8, 13, 7, 'K'); triangle(21, 4, 17, 7, 24, 8, 'K');
  triangle(9, 5, 8, 8, 12, 7, 'I'); triangle(21, 5, 18, 7, 22, 8, 'I');
  [[26, 13], [27, 11]].forEach(([c, r]) => ellipse(c, r, 1.6, 1.6, 'C'));
  ellipse(CX, 12, 2.6, 1.7, 'W', ['C']);
  ellipse(CX, 15, 3.2, 2.4, 'W', ['C']);
  ellipse(13, 17, 1.8, 1.5, 'W', ['C']); ellipse(17, 17, 1.8, 1.5, 'W', ['C']);
  ellipse(27, 11, 1.2, 1.2, 'W', ['C']);
  ellipse(12, 8, 2.2, 2.4, 'E'); ellipse(18, 8, 2.2, 2.4, 'E');
  setCell(15, 11, 'N'); setCell(14, 11, 'N');
  [[13, 5], [14, 6], [15, 5], [16, 6], [17, 5]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); });
  for (let r = 10; r < 16; r += 2) for (let c = 4; c < GC; c++) if (G[r][c] === 'C' && c % 2 === 0) G[r][c] = 'K';
  ellipse(9, 12, 2.4, 2.4, 'X', ['C', 'K']); ellipse(21, 13, 2.2, 2.2, 'X', ['C', 'K']);
}
function composeTypeSprawl(B) {
  B = B || {};
  const fluff = !!B.fluff;
  ellipse(17, 12.8, 12.5, 4.4, 'C');
  ellipse(8.5, 12, 3.6, 3.8, 'C'); ellipse(25.5, 12, 3.6, 3.8, 'C');
  ellipse(17, 7.2, 6, 5.4, 'C');
  triangle(12.5, 0.6, 10, 5.6, 15, 5.2, 'K'); triangle(21.5, 0.6, 19, 5.2, 24, 5.6, 'K');
  triangle(12.6, 2.4, 11, 5.4, 14, 5.2, 'I'); triangle(21.4, 2.4, 20, 5.2, 23, 5.4, 'I');
  if (fluff) { ellipse(11, 5, 0.9, 1.4, 'W', ['C', 'K']); ellipse(23, 5, 0.9, 1.4, 'W', ['C', 'K']); }
  ellipse(14.5, 7.4, 2, 2.2, 'E'); ellipse(19.5, 7.4, 2, 2.2, 'E');
  ellipse(17, 10.2, 2.3, 1.6, 'W', ['C']); setCell(17, 10, 'N'); setCell(16, 10, 'N');
  ellipse(17, 13, 2.6, 2.4, 'W', ['C']);
  ellipse(13, 15.6, 2.3, 1.7, 'W', ['C']); ellipse(21, 15.6, 2.3, 1.7, 'W', ['C']);
  [[29, 10.5], [31, 8.5], [30.5, 6]].forEach(([c, r]) => ellipse(c, r, 1.4, 1.4, 'C'));
  ellipse(30.5, 6, 1.0, 1.0, 'W', ['C']);
  if (B.tabby) {
    [[15, 2.8], [17, 2.4], [19, 2.8]].forEach(([c, r]) => { const rr = Math.round(r), cc = Math.round(c); if (G[rr] && G[rr][cc] === 'C') setCell(cc, rr, 'K'); });
    for (let r = 11; r < 15; r += 2) for (let c = 6; c < 29; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
  }
  ellipse(11, 13, 2.2, 2.0, 'X', ['C', 'K']); ellipse(23, 13, 2.2, 2.0, 'X', ['C', 'K']);
}
function composeSleepCurl() {
  ellipse(13, 11, 9.6, 8, 'C');
  ellipse(6.6, 13.6, 4.5, 3.9, 'C');
  triangle(3.6, 10.6, 2.3, 13.2, 5.5, 12.7, 'K');
  triangle(8.4, 10.4, 7.0, 13.0, 10.0, 12.8, 'K');
  triangle(3.8, 11.2, 3.0, 12.9, 4.9, 12.6, 'I');
  triangle(8.3, 11.0, 7.5, 12.7, 9.2, 12.6, 'I');
  // wrapped tail sweeping around the front, resting by the nose
  [[20, 18], [17, 19], [13, 19.4], [9, 19], [6, 18], [4, 16], [3.4, 14]].forEach(([c, r]) => ellipse(c, r, 1.5, 1.4, 'K', ['C', '.']));
  ellipse(5.2, 15.2, 2.0, 1.5, 'W', ['C']);
  ellipse(5.9, 13.3, 1.1, 0.9, 'E');
  setCell(4, 14, 'N');
  ellipse(15, 11.5, 2.6, 2.4, 'X', ['C']);
}

// ---- palette ----------------------------------------------------------------
const P = S.PATTERNS[0];                // Orange Tabby — the default "my cat"
const rgb = (h) => S.hexToRgb(h);
const PAL = { O: rgb(P.outline), C: rgb(P.coat), K: rgb(P.mark), W: rgb(P.white),
  X: rgb(P.patch), I: rgb(P.inner), N: rgb(P.nose), E: rgb(P.eye), H: rgb(S.HALO) };
const BODY = new Set(['C', 'K', 'W', 'X', 'I']);

// pre-build the four pose sprites (orange tabby is a "standard" tabby build)
const B = { tabby: true };
const SP = {
  sit: buildSprite(24, 30, () => composeSit(B)),
  sleep: buildSprite(24, 20, composeSleepCurl),
  hunt: buildSprite(30, 20, composeHunt),
  type: buildSprite(34, 18, () => composeTypeSprawl(B)),
};

// ---- canvas + raster helpers ------------------------------------------------
const W = 480, H = 340, PX = 6;          // output size; PX = output px per grid cell
const BG_TOP = [34, 37, 48], BG_BOT = [22, 24, 32];
function newFrame() {
  const buf = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const t = y / H, r = BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t, g = BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t, b = BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t;
    for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255; }
  }
  return buf;
}
function blend(buf, x, y, c, a) {
  x = x | 0; y = y | 0; if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4, ia = 1 - a;
  buf[i] = c[0] * a + buf[i] * ia; buf[i + 1] = c[1] * a + buf[i + 1] * ia; buf[i + 2] = c[2] * a + buf[i + 2] * ia;
}
function fillRect(buf, x, y, w, h, c, a = 1) { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) blend(buf, x + xx, y + yy, c, a); }
function fillEllipse(buf, cx, cy, rx, ry, c, a) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) blend(buf, x, y, c, a);
  }
}
function shade(c, f) { return [Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f)]; }

// draw a sprite's grid (cells) at output origin ox,oy. eyeFill=false renders the
// 'E' cells as coat (for closed/happy eyes) instead of the eye colour.
function drawCells(buf, sp, ox, oy, eyeFill) {
  const grid = sp.grid, ROWS = sp.ROWS, COLS = sp.COLS;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let ch = grid[r][c]; if (ch === '.') continue;
    if (ch === 'E' && !eyeFill) ch = 'C';
    const base = PAL[ch]; if (!base) continue;
    const col = BODY.has(ch) ? shade(base, 1.12 - (r / ROWS) * 0.34) : base;
    fillRect(buf, ox + c * PX, oy + r * PX, PX, PX, col);
  }
}
function drawWhiskers(buf, sp, ox, oy) {
  const m = sp.muzzle, my = oy + m.r * PX;
  const cl = ox + (m.c - 4.0) * PX, cr = ox + (m.c + 4.0) * PX, col = [245, 245, 245];
  for (const [sx, dir] of [[cl, -1], [cr, 1]]) for (let i = 0; i < 3; i++) {
    const y0 = my + (i - 1) * 4;
    for (let t = 0; t <= 14; t++) blend(buf, sx + dir * t, y0 + (i - 1) * t * 0.18, col, 0.5);
  }
}
// eyes overlay. mode: open | blink | happy ; look = pupil offset in output px
function drawEyes(buf, sp, ox, oy, mode, look) {
  for (const e of sp.eyes) {
    if (e.c < 0) continue;
    const cx = ox + e.c * PX, cy = oy + e.r * PX, ew = e.w * PX, eh = e.h * PX;
    if (mode === 'blink') { fillRect(buf, cx - ew / 2, cy - 1, ew, 2, [40, 42, 50]); continue; }
    if (mode === 'happy') { // ^_^ closed-arc
      for (let t = -3; t <= 3; t++) blend(buf, cx + t, cy - Math.abs(t) * 0.7 + 1, [40, 42, 50], 0.9);
      continue;
    }
    const pw = Math.max(4, ew * 0.5), ph = Math.max(5, eh * 0.72);
    const px = cx - pw / 2 + look, py = cy - ph / 2;
    fillRect(buf, px, py + 1, pw, ph - 2, [34, 36, 43]);
    fillRect(buf, px + 1, py, pw - 2, ph, [34, 36, 43]);
    fillRect(buf, px + pw - 2, py + 1, 2, 2, [255, 255, 255]); // sparkle
  }
}
function shadowAndPlace(buf, sp, baseY, dx, dy, opts) {
  const w = sp.COLS * PX, h = sp.ROWS * PX;
  const ox = Math.round((W - w) / 2 + dx), oy = Math.round(baseY - h + dy);
  fillEllipse(buf, W / 2 + dx, baseY + 4, w * 0.42, 7, [0, 0, 0], 0.22); // ground shadow
  drawCells(buf, sp, ox, oy, opts.eyeFill);
  drawWhiskers(buf, sp, ox, oy);
  drawEyes(buf, sp, ox, oy, opts.eyeMode, opts.look || 0);
  return { ox, oy, w, h };
}

// ---- tiny 3x5 caption font --------------------------------------------------
const FONT = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 6, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [5, 7, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4],
  Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7], ' ': [0, 0, 0, 0, 0],
};
function drawText(buf, text, cy, scale, col) {
  const adv = 4 * scale, total = text.length * adv - scale;
  let x = Math.round((W - total) / 2), y = Math.round(cy);
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r] & (1 << (2 - c))) fillRect(buf, x + c * scale, y + r * scale, scale, scale, col);
    x += adv;
  }
}

// ---- floating effects (z's, hearts, key taps) -------------------------------
function drawZ(buf, x, y, s, col, a) {
  for (let i = 0; i <= s; i++) { blend(buf, x + i, y, col, a); blend(buf, x + s - i, y + i, col, a); blend(buf, x + i, y + s, col, a); }
}
function drawHeart(buf, x, y, s, col, a) {
  for (let yy = 0; yy < s; yy++) for (let xx = -s; xx <= s; xx++) {
    const fx = Math.abs(xx) / s, fy = yy / s;
    if (yy < s * 0.55 ? (Math.abs(Math.abs(xx) - s * 0.45) < s * 0.45) : (fx + fy < 1.05)) blend(buf, x + xx, y + yy, col, a);
  }
}

// ---- timeline ---------------------------------------------------------------
const BASE_Y = 250;          // ground line
const frames = [];
const push = (buf, delay) => frames.push({ buf, delay });
function blinkAt(i, period, openMode) { return (i % period) < 2 ? 'blink' : openMode; }

// 1) intro — sits and watches you (pupils sweep to "follow the cursor")
for (let i = 0; i < 26; i++) {
  const buf = newFrame();
  drawText(buf, 'PIXELCAT', 40, 5, [255, 196, 92]);
  drawText(buf, 'A CAT THAT LIVES ON YOUR DESKTOP', 300, 2, [150, 156, 170]);
  const bob = Math.round(Math.sin(i / 4) * 2);
  const look = Math.round(Math.sin(i / 5) * 3);
  shadowAndPlace(buf, SP.sit, BASE_Y, 0, bob, { eyeFill: true, eyeMode: blinkAt(i, 13, 'open'), look });
  push(buf, 95);
}
// 2) naps when idle
for (let i = 0; i < 24; i++) {
  const buf = newFrame();
  drawText(buf, 'NAPS WHEN IDLE', 300, 3, [150, 156, 170]);
  const bob = Math.round(Math.sin(i / 6) * 1.5);
  const p = shadowAndPlace(buf, SP.sleep, BASE_Y, 0, bob, { eyeFill: false, eyeMode: 'happy' });
  for (let k = 0; k < 3; k++) { const ph = (i / 24 + k / 3) % 1; drawZ(buf, p.ox + p.w - 8 + k * 9, p.oy - 6 - ph * 34, 4 + k, [220, 224, 235], 1 - ph * 0.8); }
  push(buf, 110);
}
// 3) reacts when you type (paws tap; little key presses)
for (let i = 0; i < 24; i++) {
  const buf = newFrame();
  drawText(buf, 'TAPS ITS PAWS WHEN YOU TYPE', 300, 2, [150, 156, 170]);
  const tap = (i % 4) < 2 ? 0 : 2;
  const p = shadowAndPlace(buf, SP.type, BASE_Y, 0, 0, { eyeFill: true, eyeMode: blinkAt(i, 17, 'open') });
  // alternating paw-tap dots under the two forepaws
  const lit = (i % 2 === 0);
  fillEllipse(buf, p.ox + 13 * PX, BASE_Y + 2, 6, 3, lit ? [120, 200, 255] : [70, 80, 100], 0.9);
  fillEllipse(buf, p.ox + 21 * PX, BASE_Y + 2, 6, 3, !lit ? [120, 200, 255] : [70, 80, 100], 0.9);
  push(buf, 90);
}
// 4) pounces to hunt the cursor
for (let i = 0; i < 24; i++) {
  const buf = newFrame();
  drawText(buf, 'POUNCES TO HUNT', 300, 3, [150, 156, 170]);
  const wig = Math.round(Math.sin(i / 2) * 3);            // crouch-wiggle, then lunge
  const lunge = (i % 12) >= 9 ? (i % 12 - 8) * 6 : 0;
  const p = shadowAndPlace(buf, SP.hunt, BASE_Y, wig + lunge, 0, { eyeFill: true, eyeMode: 'open', look: 2 });
  fillEllipse(buf, p.ox + p.w + 16 + lunge, BASE_Y - 6, 3, 3, [120, 200, 255], 0.9); // the "cursor" target
  push(buf, 85);
}
// 5) purrs when you pet it
for (let i = 0; i < 26; i++) {
  const buf = newFrame();
  drawText(buf, 'PURRS WHEN YOU PET IT', 300, 2, [150, 156, 170]);
  const bob = Math.round(Math.sin(i / 3) * 2);
  const p = shadowAndPlace(buf, SP.sit, BASE_Y, 0, bob, { eyeFill: false, eyeMode: 'happy' });
  for (let k = 0; k < 3; k++) { const ph = (i / 26 + k / 3) % 1; drawHeart(buf, p.ox + p.w * 0.5 - 10 + k * 14, p.oy - 4 - ph * 40, 4, [255, 110, 140], 1 - ph * 0.85); }
  push(buf, 95);
}

// ---- encode -----------------------------------------------------------------
const gif = GIFEncoder();
frames.forEach((f, idx) => {
  const palette = quantize(f.buf, 256);
  const index = applyPalette(f.buf, palette);
  gif.writeFrame(index, W, H, { palette, delay: f.delay, repeat: 0, first: idx === 0 });
});
gif.finish();
if (process.env.DUMP) {
  const zlib = require('zlib');
  const crc = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0); return Buffer.concat([l, b, cc]); };
  const png = (rgba) => { const ih = Buffer.alloc(13); ih.writeUInt32BE(W, 0); ih.writeUInt32BE(H, 4); ih[8] = 8; ih[9] = 6; const raw = Buffer.alloc(H * (W * 4 + 1)); for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; for (let x = 0; x < W * 4; x++) raw[y * (W * 4 + 1) + 1 + x] = rgba[y * W * 4 + x]; } return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); };
  [0, 30, 55, 80, 105].forEach((i) => fs.writeFileSync(`/tmp/f${i}.png`, png(frames[i].buf)));
  console.log('dumped frames to /tmp');
}
const out = path.join(__dirname, '..', 'assets', 'pixelcat-demo.gif');
fs.writeFileSync(out, Buffer.from(gif.bytes()));
console.log(`wrote ${path.relative(path.join(__dirname, '..'), out)} — ${frames.length} frames, ${(gif.bytes().length / 1024).toFixed(0)} KB`);

// ---- optional MP4 (H.264) for phones — `node scripts/make-demo-gif.js mp4` ---
// Re-times the clip to a constant ~12fps (each GIF frame's delay -> repeated
// frames) and pipes raw RGB to a bundled static ffmpeg. yuv420p + even dims so
// it plays everywhere (iOS/Android galleries, Quicktime).
if (process.argv.includes('mp4')) {
  const { spawnSync } = require('child_process');
  const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;
  const FPS = 12, mp4 = path.join(__dirname, '..', 'assets', 'pixelcat-demo.mp4');
  const chunks = [];
  for (const f of frames) {
    const reps = Math.max(1, Math.round((f.delay / 1000) * FPS));   // hold each frame for its delay
    const rgb = Buffer.alloc(W * H * 3);
    for (let p = 0, q = 0; p < f.buf.length; p += 4, q += 3) { rgb[q] = f.buf[p]; rgb[q + 1] = f.buf[p + 1]; rgb[q + 2] = f.buf[p + 2]; }
    for (let k = 0; k < reps; k++) chunks.push(rgb);
  }
  const raw = Buffer.concat(chunks);
  const r = spawnSync(ffmpeg, ['-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS),
    '-i', 'pipe:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-crf', '20', mp4],
    { input: raw, stdio: ['pipe', 'ignore', 'inherit'] });
  if (r.status === 0) console.log(`wrote ${path.relative(path.join(__dirname, '..'), mp4)} — ${(fs.statSync(mp4).size / 1024).toFixed(0)} KB`);
  else console.error('ffmpeg failed', r.status);
}
