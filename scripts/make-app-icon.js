// Generates assets/icon.png (256) and assets/icon.ico (16/32/48/64/128/256) — an
// ORIGINAL black-cat-face app icon drawn procedurally (no third-party/Comnyang art).
// Rendered at 4x supersample for smooth edges, then downsampled. Used as the
// packaged-app / installer icon. Run: node scripts/make-app-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const BODY = [43, 45, 51];        // #2b2d33 black cat
const EAR_IN = [200, 150, 150];
const EYE = [232, 148, 60];       // #e8943c warm amber
const PUPIL = [30, 24, 16];
const NOSE = [224, 136, 143];
const WHISK = [236, 238, 243];

function sign(px, py, ax, ay, bx, by) { return (px - bx) * (ay - by) - (ax - bx) * (py - by); }
function inTri(px, py, a, b, c) {
  const d1 = sign(px, py, a[0], a[1], b[0], b[1]);
  const d2 = sign(px, py, b[0], b[1], c[0], c[1]);
  const d3 = sign(px, py, c[0], c[1], a[0], a[1]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

// Render the cat face at resolution S (coordinates scaled from a 32-unit layout).
function render(S) {
  const k = S / 32, buf = new Uint8ClampedArray(S * S * 4);
  const set = (x, y, c, a = 255) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= S || y >= S) return;
    const i = (y * S + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a;
  };
  const eL = [[5, 12], [11, 1], [16, 13]].map((p) => [p[0] * k, p[1] * k]);
  const eR = [[27, 12], [21, 1], [16, 13]].map((p) => [p[0] * k, p[1] * k]);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x - 16 * k, dy = y - 18 * k;
    const head = (dx * dx) / ((12 * k) * (12 * k)) + (dy * dy) / ((11 * k) * (11 * k)) <= 1;
    if (head || inTri(x, y, ...eL) || inTri(x, y, ...eR)) set(x, y, BODY);
  }
  // inner ears
  for (const [cx, cy] of [[10, 8], [22, 8]]) {
    for (let y = -3 * k; y <= 3 * k; y++) for (let x = -2 * k; x <= 2 * k; x++)
      if ((x * x) / ((2 * k) * (2 * k)) + (y * y) / ((3 * k) * (3 * k)) <= 1) set(cx * k + x, cy * k + y, EAR_IN);
  }
  // eyes (amber almond) with a dark pupil + glint
  for (const cx of [11.5, 20.5]) {
    for (let y = -3 * k; y <= 3 * k; y++) for (let x = -2.4 * k; x <= 2.4 * k; x++)
      if ((x * x) / ((2.4 * k) * (2.4 * k)) + (y * y) / ((3 * k) * (3 * k)) <= 1) set(cx * k + x, 17 * k + y, EYE);
    for (let y = -1.6 * k; y <= 1.6 * k; y++) for (let x = -0.9 * k; x <= 0.9 * k; x++)
      if ((x * x) / ((0.9 * k) * (0.9 * k)) + (y * y) / ((1.6 * k) * (1.6 * k)) <= 1) set(cx * k + x, 17 * k + y, PUPIL);
    set(Math.round(cx * k + 0.8 * k), Math.round(17 * k - 1 * k), WHISK);
  }
  // nose
  for (let y = 0; y < 2 * k; y++) for (let x = -1.4 * k; x <= 1.4 * k; x++) if (Math.abs(x) <= (1.4 * k) * (1 - y / (2 * k))) set(16 * k + x, 21 * k + y, NOSE);
  // whiskers
  for (const dir of [-1, 1]) for (let w = 0; w < 3; w++) {
    const y0 = (21 + w * 1.4) * k;
    for (let t = 0; t < 9 * k; t++) set(16 * k + dir * (3 * k + t), y0 + (w - 1) * 0.5 * k + dir * 0, WHISK, 220);
  }
  return buf;
}

function downsample(src, srcSize, size) {
  if (size === srcSize) return src;
  const out = new Uint8ClampedArray(size * size * 4), ratio = srcSize / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) {
      const px = Math.floor(x * ratio + sx), py = Math.floor(y * ratio + sy), i = (py * srcSize + px) * 4;
      r += src[i] * (src[i + 3] / 255); g += src[i + 1] * (src[i + 3] / 255); b += src[i + 2] * (src[i + 3] / 255); a += src[i + 3]; n++;
    }
    const o = (y * size + x) * 4, av = a / n;
    out[o] = av ? r / n / (av / 255) : 0; out[o + 1] = av ? g / n / (av / 255) : 0; out[o + 2] = av ? b / n / (av / 255) : 0; out[o + 3] = av;
  }
  return out;
}

function crc32(buf) { let c = ~0; for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = rgba[y * size * 4 + x]; }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function buildIco(pngs) {  // pngs: [{size, data}]
  const HEADER = 6, ENTRY = 16;
  const head = Buffer.alloc(HEADER); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = HEADER + ENTRY * pngs.length;
  const entries = pngs.map((p) => {
    const e = Buffer.alloc(ENTRY);
    e.writeUInt8(p.size >= 256 ? 0 : p.size, 0); e.writeUInt8(p.size >= 256 ? 0 : p.size, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(p.data.length, 8); e.writeUInt32LE(offset, 12); offset += p.data.length;
    return e;
  });
  return Buffer.concat([head, ...entries, ...pngs.map((p) => p.data)]);
}

const SS = 1024;
const hi = render(SS);
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const sizes = [256, 128, 64, 48, 32, 16];
const pngs = sizes.map((s) => ({ size: s, data: encodePng(downsample(hi, SS, s), s) }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngs[0].data);
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(pngs));
console.log('wrote assets/icon.png (256) and assets/icon.ico (16-256)');
