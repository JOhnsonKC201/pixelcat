// Generates assets/icon.png (256) and assets/icon.ico (16/32/48/64/128/256) - the
// "pixelcat" logo: a bold ORANGE cat face (the shared logo mark) centred on a vibrant
// indigo rounded app-tile. The same face is used for the tray glyph (make-tray-icon.js)
// so the brand is consistent and instantly recognizable. Run: node scripts/make-app-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { renderCatFace } = require('./logo-glyph.js');

const TILE_TOP = [126, 86, 214], TILE_BOT = [56, 38, 138];   // vibrant indigo gradient
const lerp = (a, b, t) => Math.round(a + (b - a) * t);

function render(SZ) {
  const buf = new Uint8ClampedArray(SZ * SZ * 4);
  const radius = Math.round(SZ * 0.22);
  for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) {        // rounded gradient tile
    const rx = Math.max(0, radius - x, x - (SZ - 1 - radius)), ry = Math.max(0, radius - y, y - (SZ - 1 - radius));
    if (rx > 0 && ry > 0 && rx * rx + ry * ry > radius * radius) continue;
    const i = (y * SZ + x) * 4;
    buf[i] = lerp(TILE_TOP[0], TILE_BOT[0], y / SZ); buf[i + 1] = lerp(TILE_TOP[1], TILE_BOT[1], y / SZ); buf[i + 2] = lerp(TILE_TOP[2], TILE_BOT[2], y / SZ); buf[i + 3] = 255;
  }
  const fSz = Math.round(SZ * 0.80), face = renderCatFace(fSz, { halo: false });   // cat face centred (~80%)
  const off = Math.floor((SZ - fSz) / 2);
  for (let y = 0; y < fSz; y++) for (let x = 0; x < fSz; x++) {                     // alpha-over composite
    const fi = (y * fSz + x) * 4, a = face[fi + 3] / 255; if (!a) continue;
    const X = off + x, Y = off + y; if (X < 0 || Y < 0 || X >= SZ || Y >= SZ) continue;
    const i = (Y * SZ + X) * 4;
    buf[i] = Math.round(face[fi] * a + buf[i] * (1 - a)); buf[i + 1] = Math.round(face[fi + 1] * a + buf[i + 1] * (1 - a)); buf[i + 2] = Math.round(face[fi + 2] * a + buf[i + 2] * (1 - a)); buf[i + 3] = 255;
  }
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

const hi = render(512);
const big = render(256);
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const pngs = [256, 128, 64, 48, 32, 16].map((s) => ({ size: s, data: encodePng(s === 256 ? big : downsample(hi, 512, s), s) }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngs[0].data);
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(pngs));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), encodePng(hi, 512));   // macOS app icon (electron-builder needs >= 512px)
console.log('wrote assets/icon.png (256), assets/icon.ico (16-256), and assets/icon-512.png (mac)');
