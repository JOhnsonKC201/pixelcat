// Generates assets/icon.png (256) and assets/icon.ico (16/32/48/64/128/256) — a
// UNIQUE PIXEL-ART logo: the actual sit-cat sprite rendered as crisp blocks (visible
// pixels) on an indigo rounded app-tile. Original art (mirrors the in-app sprite).
// Tray glyph (assets/tray.png) stays separate (make-tray-icon.js). Run:
//   node scripts/make-app-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// --- grid sprite builder (sit pose; mirrors renderer.js / cat-preview.js) -----
let G, GC, GR;
const inb = (c, r) => c >= 0 && c < GC && r >= 0 && r < GR;
const setCell = (c, r, role) => { if (inb(c, r)) G[r][c] = role; };
function ellipse(cx, cy, rx, ry, role, onlyOn) { for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) { const dx = (c - cx) / rx, dy = (r - cy) / ry; if (dx * dx + dy * dy <= 1 && inb(c, r)) { if (!onlyOn || onlyOn.includes(G[r][c])) G[r][c] = role; } } }
function triangle(ax, ay, bx, by, cx2, cy2, role) { const minc = Math.floor(Math.min(ax, bx, cx2)), maxc = Math.ceil(Math.max(ax, bx, cx2)), minr = Math.floor(Math.min(ay, by, cy2)), maxr = Math.ceil(Math.max(ay, by, cy2)); const sg = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry); for (let r = minr; r <= maxr; r++) for (let c = minc; c <= maxc; c++) { const d1 = sg(c, r, ax, ay, bx, by), d2 = sg(c, r, bx, by, cx2, cy2), d3 = sg(c, r, cx2, cy2, ax, ay); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) setCell(c, r, role); } }
function outlineHalo() {
  const solid = (c, r) => inb(c, r) && G[r][c] !== '.' && G[r][c] !== 'O' && G[r][c] !== 'H';
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { if (G[r][c] !== '.') continue; if (solid(c - 1, r) || solid(c + 1, r) || solid(c, r - 1) || solid(c, r + 1)) G[r][c] = 'O'; }
  const isO = (c, r) => inb(c, r) && G[r][c] === 'O';
  for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { if (G[r][c] !== '.') continue; if (isO(c - 1, r) || isO(c + 1, r) || isO(c, r - 1) || isO(c, r + 1)) G[r][c] = 'H'; }
}
function composeSit() {
  const CX = 12;
  ellipse(CX, 24, 7.6, 5, 'C'); ellipse(CX, 16, 5.2, 7.5, 'C'); ellipse(CX, 8, 6.3, 5.8, 'C');
  triangle(CX - 4.5, 1, CX - 6.4, 7.6, CX - 1.6, 6.4, 'K'); triangle(CX + 4.5, 1, CX + 6.4, 7.6, CX + 1.6, 6.4, 'K');
  triangle(CX - 4.3, 3, CX - 5.32, 7.2, CX - 2.68, 6.6, 'I'); triangle(CX + 4.3, 3, CX + 5.32, 7.2, CX + 2.68, 6.6, 'I');
  ellipse(CX, 12, 3, 2, 'W', ['C']); ellipse(CX, 17, 2.7, 7, 'W', ['C']);
  ellipse(10, 23, 1.6, 5.2, 'C'); ellipse(14, 23, 1.6, 5.2, 'C'); ellipse(10, 27.4, 2, 1.7, 'W', ['C']); ellipse(14, 27.4, 2, 1.7, 'W', ['C']);
  ellipse(9, 8.2, 2, 2.4, 'E'); ellipse(15, 8.2, 2, 2.4, 'E'); setCell(12, 11, 'N'); setCell(11, 11, 'N');
  for (let r = 19; r <= 28; r++) setCell(12, r, '.'); for (let r = 22; r <= 28; r++) { setCell(8, r, '.'); setCell(16, r, '.'); }
}
function buildGrid() { G = Array.from({ length: 30 }, () => Array(24).fill('.')); GC = 24; GR = 30; composeSit(); outlineHalo(); return G; }

// tuxedo-ish palette: black coat, white chest, green eyes, pink ears/nose, white halo
const COL = { O: [21, 22, 26], C: [43, 45, 51], K: [35, 36, 41], W: [244, 245, 247], E: [143, 209, 74], N: [230, 166, 172], I: [202, 160, 166], H: [248, 248, 245] };
const TILE_TOP = [120, 80, 200], TILE_BOT = [70, 50, 150];
const lerp = (a, b, t) => Math.round(a + (b - a) * t);

function render(S, grid) {
  const buf = new Uint8ClampedArray(S * S * 4);
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= S || y >= S) return; const i = (y * S + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; };
  const radius = Math.round(S * 0.22);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const rx = Math.max(0, radius - x, x - (S - 1 - radius)), ry = Math.max(0, radius - y, y - (S - 1 - radius)); if (rx > 0 && ry > 0 && rx * rx + ry * ry > radius * radius) continue; put(x, y, [lerp(TILE_TOP[0], TILE_BOT[0], y / S), lerp(TILE_TOP[1], TILE_BOT[1], y / S), lerp(TILE_TOP[2], TILE_BOT[2], y / S)]); }
  const rows = grid.length, cols = grid[0].length, margin = Math.round(S * 0.10);
  const px = Math.max(1, Math.floor(Math.min((S - margin * 2) / cols, (S - margin * 2) / rows)));
  const ox = Math.floor((S - cols * px) / 2), oy = Math.floor((S - rows * px) / 2);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const role = grid[r][c]; if (role === '.') continue; const col = COL[role]; if (!col) continue; for (let yy = 0; yy < px; yy++) for (let xx = 0; xx < px; xx++) put(ox + c * px + xx, oy + r * px + yy, col); }
  return buf;
}
function downsample(src, srcSize, size) {
  if (size === srcSize) return src;
  const out = new Uint8ClampedArray(size * size * 4), ratio = srcSize / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let r = 0, g = 0, b = 0, a = 0, n = 0; for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) { const pxn = Math.floor(x * ratio + sx), py = Math.floor(y * ratio + sy), i = (py * srcSize + pxn) * 4, af = src[i + 3] / 255; r += src[i] * af; g += src[i + 1] * af; b += src[i + 2] * af; a += src[i + 3]; n++; } const o = (y * size + x) * 4, av = a / n; out[o] = av ? r / n / (av / 255) : 0; out[o + 1] = av ? g / n / (av / 255) : 0; out[o + 2] = av ? b / n / (av / 255) : 0; out[o + 3] = av; }
  return out;
}
function crc(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0); return Buffer.concat([l, b, cc]); }
function encodePng(rgba, s) { const ih = Buffer.alloc(13); ih.writeUInt32BE(s, 0); ih.writeUInt32BE(s, 4); ih[8] = 8; ih[9] = 6; const raw = Buffer.alloc(s * (s * 4 + 1)); for (let y = 0; y < s; y++) { raw[y * (s * 4 + 1)] = 0; for (let x = 0; x < s * 4; x++) raw[y * (s * 4 + 1) + 1 + x] = rgba[y * s * 4 + x]; } return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]); }
function buildIco(pngs) { const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4); let off = 6 + 16 * pngs.length; const e = pngs.map((p) => { const b = Buffer.alloc(16); b.writeUInt8(p.size >= 256 ? 0 : p.size, 0); b.writeUInt8(p.size >= 256 ? 0 : p.size, 1); b.writeUInt16LE(1, 4); b.writeUInt16LE(32, 6); b.writeUInt32LE(p.data.length, 8); b.writeUInt32LE(off, 12); off += p.data.length; return b; }); return Buffer.concat([head, ...e, ...pngs.map((p) => p.data)]); }

const grid = buildGrid();
const hi = render(512, grid);
const big = render(256, grid);   // crisp blocks at icon size
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const pngs = [256, 128, 64, 48, 32, 16].map((s) => ({ size: s, data: encodePng(s === 256 ? big : downsample(hi, 512, s), s) }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngs[0].data);
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(pngs));
console.log('wrote assets/icon.png (256) and assets/icon.ico (16-256)');
