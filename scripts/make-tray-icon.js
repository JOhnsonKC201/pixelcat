// Generates assets/tray.png (16px) and assets/tray@2x.png (32px) — an ORIGINAL
// little cat-head glyph drawn procedurally here. No third-party/Comnyang art.
// Run: node scripts/make-tray-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const BODY = [43, 45, 51];      // #2b2d33
const EAR_IN = [200, 150, 150];
const EYE = [232, 148, 60];     // #e8943c
const OUTLINE = [20, 21, 25];

function sign(px, py, ax, ay, bx, by) { return (px - bx) * (ay - by) - (ax - bx) * (py - by); }
function inTri(px, py, a, b, c) {
  const d1 = sign(px, py, a[0], a[1], b[0], b[1]);
  const d2 = sign(px, py, b[0], b[1], c[0], c[1]);
  const d3 = sign(px, py, c[0], c[1], a[0], a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

// Draw the glyph at native 32px, then downsample for smaller sizes.
function render32() {
  const S = 32, buf = new Uint8ClampedArray(S * S * 4);
  const set = (x, y, c, a = 255) => { const i = (y * S + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a; };
  const earsL = [[5, 11], [11, 1], [15, 12]], earsR = [[27, 11], [21, 1], [17, 12]];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - 16, dy = y - 19, head = (dx * dx) / 121 + (dy * dy) / 100 <= 1;
    const ear = inTri(x, y, earsL[0], earsL[1], earsL[2]) || inTri(x, y, earsR[0], earsR[1], earsR[2]);
    if (head || ear) set(x, y, BODY);
  }
  // inner ears
  for (const [cx, cy] of [[10, 8], [22, 8]]) for (let y = -2; y <= 2; y++) for (let x = -1; x <= 1; x++)
    if (x * x + y * y <= 3) set(cx + x, cy + y, EAR_IN);
  // eyes
  for (const cx of [12, 20]) for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++)
    if ((x * x) / 4 + (y * y) / 4 <= 1) set(cx + x, 19 + y, EYE);
  // nose
  set(16, 22, OUTLINE); set(15, 22, OUTLINE); set(17, 22, OUTLINE);
  return buf;
}

function downsample(src32, size) {
  if (size === 32) return src32;
  const out = new Uint8ClampedArray(size * size * 4), ratio = 32 / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) {
      const px = Math.floor(x * ratio + sx), py = Math.floor(y * ratio + sy), i = (py * 32 + px) * 4;
      r += src32[i]; g += src32[i + 1]; b += src32[i + 2]; a += src32[i + 3]; n++;
    }
    const o = (y * size + x) * 4;
    out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
  }
  return out;
}

// Minimal PNG encoder (truecolor + alpha).
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii'), body = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = rgba[y * size * 4 + x];
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const src = render32();
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePng(downsample(src, 16), 16));
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePng(src, 32));
console.log('wrote assets/tray.png (16) and assets/tray@2x.png (32)');
