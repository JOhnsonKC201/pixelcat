// Generates assets/icon.png (256) and assets/icon.ico (16/32/48/64/128/256) — an
// ORIGINAL "app tile" logo: a white-outlined black cat face on a warm rounded-square
// gradient (no third-party/Comnyang art). Rendered at a high supersample, then
// downsampled. The tray glyph (assets/tray.png) stays transparent and is made by
// make-tray-icon.js. Run: node scripts/make-app-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const COAT_TOP = [52, 55, 64], COAT_BOT = [30, 32, 39];   // top-lit black coat
const EAR_IN = [216, 152, 158];
const EYE = [236, 152, 62];       // warm amber
const PUPIL = [26, 20, 15];
const GLINT = [250, 250, 247];
const NOSE = [232, 140, 148];
const HALO = [250, 250, 247];     // white sticker outline
const TILE_TOP = [255, 196, 140], TILE_BOT = [245, 130, 120];   // warm peach -> coral

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function sign(px, py, ax, ay, bx, by) { return (px - bx) * (ay - by) - (ax - bx) * (py - by); }
function inTri(px, py, a, b, c) {
  const d1 = sign(px, py, a[0], a[1], b[0], b[1]), d2 = sign(px, py, b[0], b[1], c[0], c[1]), d3 = sign(px, py, c[0], c[1], a[0], a[1]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function renderCat(S) {
  const k = S / 32, buf = new Uint8ClampedArray(S * S * 4);
  const set = (x, y, c, a = 255) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= S || y >= S) return; const i = (y * S + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a; };
  const cyH = 17.5, ryH = 11, rxH = 11.8;
  const inHead = (x, y) => { const dx = x - 16 * k, dy = y - cyH * k; return (dx * dx) / ((rxH * k) ** 2) + (dy * dy) / ((ryH * k) ** 2) <= 1; };
  const eL = [[6.5, 12.5], [9.5, 1.5], [15.5, 12]].map((p) => [p[0] * k, p[1] * k]);
  const eR = [[25.5, 12.5], [22.5, 1.5], [16.5, 12]].map((p) => [p[0] * k, p[1] * k]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (inHead(x, y) || inTri(x, y, ...eL) || inTri(x, y, ...eR)) {
      const t = Math.max(0, Math.min(1, (y - (cyH - ryH) * k) / (2 * ryH * k)));
      set(x, y, lerp(COAT_TOP, COAT_BOT, t));
    }
  }
  for (const [cx, cy] of [[10, 8.5], [22, 8.5]]) for (let y = -3.4 * k; y <= 3.4 * k; y++) for (let x = -2.2 * k; x <= 2.2 * k; x++)
    if ((x * x) / ((2.2 * k) ** 2) + (y * y) / ((3.4 * k) ** 2) <= 1) set(cx * k + x, cy * k + y, EAR_IN);
  for (const cx of [11.3, 20.7]) {
    for (let y = -3.2 * k; y <= 3.2 * k; y++) for (let x = -2.5 * k; x <= 2.5 * k; x++)
      if ((x * x) / ((2.5 * k) ** 2) + (y * y) / ((3.2 * k) ** 2) <= 1) set(cx * k + x, 17 * k + y, EYE);
    for (let y = -1.9 * k; y <= 1.9 * k; y++) for (let x = -1.0 * k; x <= 1.0 * k; x++)
      if ((x * x) / ((1.0 * k) ** 2) + (y * y) / ((1.9 * k) ** 2) <= 1) set(cx * k + x, 17 * k + y, PUPIL);
    for (let y = -1.3 * k; y <= 1.3 * k; y++) for (let x = -1.3 * k; x <= 1.3 * k; x++)
      if (x * x + y * y <= (1.3 * k) ** 2) set(cx * k + x + 1.0 * k, 17 * k + y - 1.3 * k, GLINT);
  }
  for (let y = 0; y < 2.2 * k; y++) for (let x = -1.6 * k; x <= 1.6 * k; x++)
    if (Math.abs(x) <= (1.6 * k) * (1 - y / (2.2 * k))) set(16 * k + x, 21 * k + y, NOSE);
  return buf;
}
function dilate(mask, S, r) {
  const tmp = new Uint8Array(S * S), out = new Uint8Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { let v = 0; for (let d = -r; d <= r; d++) { const xx = x + d; if (xx >= 0 && xx < S && mask[y * S + xx]) { v = 1; break; } } tmp[y * S + x] = v; }
  for (let x = 0; x < S; x++) for (let y = 0; y < S; y++) { let v = 0; for (let d = -r; d <= r; d++) { const yy = y + d; if (yy >= 0 && yy < S && tmp[yy * S + x]) { v = 1; break; } } out[y * S + x] = v; }
  return out;
}
function addHalo(buf, S, r) {
  const m = new Uint8Array(S * S);
  for (let i = 0; i < S * S; i++) m[i] = buf[i * 4 + 3] > 60 ? 1 : 0;
  const dil = dilate(m, S, r), out = new Uint8ClampedArray(buf);
  for (let i = 0; i < S * S; i++) if (!m[i] && dil[i]) { out[i * 4] = HALO[0]; out[i * 4 + 1] = HALO[1]; out[i * 4 + 2] = HALO[2]; out[i * 4 + 3] = 255; }
  return out;
}
function tile(S, radius) {
  const buf = new Uint8ClampedArray(S * S * 4);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const rx = Math.max(0, radius - x, x - (S - 1 - radius)), ry = Math.max(0, radius - y, y - (S - 1 - radius));
    if (rx > 0 && ry > 0 && rx * rx + ry * ry > radius * radius) continue;   // rounded corners -> transparent
    const c = lerp(TILE_TOP, TILE_BOT, y / S), i = (y * S + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
  }
  return buf;
}
function over(dst, src, S) { const out = new Uint8ClampedArray(dst); for (let i = 0; i < S * S; i++) { if (src[i * 4 + 3]) { out[i * 4] = src[i * 4]; out[i * 4 + 1] = src[i * 4 + 1]; out[i * 4 + 2] = src[i * 4 + 2]; out[i * 4 + 3] = 255; } } return out; }

function downsample(src, srcSize, size) {
  if (size === srcSize) return src;
  const out = new Uint8ClampedArray(size * size * 4), ratio = srcSize / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) { const px = Math.floor(x * ratio + sx), py = Math.floor(y * ratio + sy), i = (py * srcSize + px) * 4, af = src[i + 3] / 255; r += src[i] * af; g += src[i + 1] * af; b += src[i + 2] * af; a += src[i + 3]; n++; }
    const o = (y * size + x) * 4, av = a / n; out[o] = av ? r / n / (av / 255) : 0; out[o + 1] = av ? g / n / (av / 255) : 0; out[o + 2] = av ? b / n / (av / 255) : 0; out[o + 3] = av;
  }
  return out;
}
function crc32(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const body = Buffer.concat([Buffer.from(type, 'ascii'), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0); return Buffer.concat([len, body, crc]); }
function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = rgba[y * size * 4 + x]; }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function buildIco(pngs) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map((p) => { const e = Buffer.alloc(16); e.writeUInt8(p.size >= 256 ? 0 : p.size, 0); e.writeUInt8(p.size >= 256 ? 0 : p.size, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(p.data.length, 8); e.writeUInt32LE(offset, 12); offset += p.data.length; return e; });
  return Buffer.concat([head, ...entries, ...pngs.map((p) => p.data)]);
}

const SS = 768;
const cat = addHalo(renderCat(SS), SS, Math.round(SS / 32 * 0.8));    // white outline
const logo = over(tile(SS, Math.round(SS * 0.22)), cat, SS);          // cat on the warm tile
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const pngs = [256, 128, 64, 48, 32, 16].map((s) => ({ size: s, data: encodePng(downsample(logo, SS, s), s) }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngs[0].data);
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(pngs));
console.log('wrote assets/icon.png (256) and assets/icon.ico (16-256)');
