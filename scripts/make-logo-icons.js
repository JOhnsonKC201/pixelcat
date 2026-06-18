// Regenerates EVERY app + tray icon from the master artwork assets/logo.png, so the
// whole brand (desktop shortcut, taskbar, tray, macOS app) shows one consistent
// mascot. Replaces the old procedural cat-face glyph pipeline. Run: npm run icon
//
// ICO format note: small icon sizes (<=128) are stored as UNCOMPRESSED 32-bit BMP
// (DIB) entries, not PNG. Windows Explorer reliably renders BMP entries at desktop/
// taskbar sizes, whereas PNG-compressed small entries are often dropped (you get a
// stale or blank icon). Only the 256px entry stays PNG (the standard for that size).
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { loadLogo, resizeSquare, stripBackground } = require('./logo-source.js');

// --- minimal PNG (truecolor + alpha) encoder, for the 256 entry + the .png files ---
function crc(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0); return Buffer.concat([l, b, cc]); }
function encodePng(rgba, s) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(s, 0); ih.writeUInt32BE(s, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(s * (s * 4 + 1));
  for (let y = 0; y < s; y++) { raw[y * (s * 4 + 1)] = 0; for (let x = 0; x < s * 4; x++) raw[y * (s * 4 + 1) + 1 + x] = rgba[y * s * 4 + x]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// --- uncompressed 32-bit BMP/DIB icon entry (BITMAPINFOHEADER + bottom-up BGRA + AND mask) ---
function encodeBmp(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);            // biSize
  header.writeInt32LE(size, 4);           // biWidth
  header.writeInt32LE(size * 2, 8);       // biHeight = XOR + AND
  header.writeUInt16LE(1, 12);            // biPlanes
  header.writeUInt16LE(32, 14);           // biBitCount
  header.writeUInt32LE(0, 16);            // biCompression = BI_RGB
  const xor = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {        // bottom-up rows, BGRA
    const sy = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const s = (sy * size + x) * 4, d = (y * size + x) * 4;
      xor[d] = rgba[s + 2]; xor[d + 1] = rgba[s + 1]; xor[d + 2] = rgba[s]; xor[d + 3] = rgba[s + 3];
    }
  }
  const maskStride = Math.ceil(size / 32) * 4;   // 1bpp AND mask, all-opaque (zeros)
  const mask = Buffer.alloc(size * maskStride);
  return Buffer.concat([header, xor, mask]);
}

function buildIco(entries) {  // entries: [{ size, data }]
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(entries.length, 4);
  let off = 6 + 16 * entries.length;
  const dir = entries.map((e) => {
    const b = Buffer.alloc(16);
    b.writeUInt8(e.size >= 256 ? 0 : e.size, 0); b.writeUInt8(e.size >= 256 ? 0 : e.size, 1);
    b.writeUInt16LE(1, 4); b.writeUInt16LE(32, 6);
    b.writeUInt32LE(e.data.length, 8); b.writeUInt32LE(off, 12); off += e.data.length;
    return b;
  });
  return Buffer.concat([head, ...dir, ...entries.map((e) => e.data)]);
}

const logo = stripBackground(loadLogo());   // transparent cat only (no scene background)
const rgbaAt = (size) => resizeSquare(logo, size);
// App + tray icon tile. The mascot is dark, so a transparent icon turns into a dark blob
// at 16-48px on dark taskbars/wallpapers/system tray. Composite the cat onto a bold,
// rounded, warm gradient tile (cream -> soft orange, echoing the spikes) so the icon stays
// clearly visible on ANY background. Both the app icons AND the tray glyph use this tile.
const TILE_TOP = [255, 234, 200];   // warm cream (top)
const TILE_BOT = [255, 170, 104];   // soft orange (bottom)
const CAT_SCALE = 0.84;             // cat occupies 84% of the tile, leaving a clean frame
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
// 3D-ish glossy treatment: a domed light gradient + a glassy top sheen + a soft drop
// shadow under the cat, so the icon reads like a dimensional button instead of a flat tile.
function boxBlur(src, size, r) {
  if (r < 1) return src;
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let acc = 0, n = 0;
    for (let d = -r; d <= r; d++) { const xx = x + d; if (xx < 0 || xx >= size) continue; acc += src[y * size + xx]; n++; }
    h[y * size + x] = acc / n;
  }
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let acc = 0, n = 0;
    for (let d = -r; d <= r; d++) { const yy = y + d; if (yy < 0 || yy >= size) continue; acc += h[yy * size + x]; n++; }
    out[y * size + x] = acc / n;
  }
  return out;
}
function onTile(size) {
  const catSz = Math.round(size * CAT_SCALE);
  const cat = rgbaAt(catSz);
  const off = Math.floor((size - catSz) / 2);
  const radius = Math.round(size * 0.22);
  const out = new Uint8ClampedArray(size * size * 4);
  const inside = (x, y) => {
    const rx = Math.max(0, radius - x, x - (size - 1 - radius));
    const ry = Math.max(0, radius - y, y - (size - 1 - radius));
    return !(rx > 0 && ry > 0 && rx * rx + ry * ry > radius * radius);
  };
  // 1) Domed base — warm vertical gradient shaded by a light source in the upper-left,
  //    so the surface looks curved (bright near the light, darker toward the far corner).
  const lx = size * 0.36, ly = size * 0.28, maxd = Math.hypot(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inside(x, y)) continue;
    const o = (y * size + x) * 4, t = y / (size - 1);
    const dome = 1 - (Math.hypot(x - lx, y - ly) / maxd) * 1.45;
    const k = 0.58 + 0.64 * dome;
    out[o] = lerp(TILE_TOP[0], TILE_BOT[0], t) * k; out[o + 1] = lerp(TILE_TOP[1], TILE_BOT[1], t) * k;
    out[o + 2] = lerp(TILE_TOP[2], TILE_BOT[2], t) * k; out[o + 3] = 255;
  }
  // 2) Glassy specular sheen — a soft bright ellipse across the top.
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inside(x, y)) continue;
    const ex = (x - size * 0.5) / (size * 0.46), ey = (y - size * 0.24) / (size * 0.26);
    const e = ex * ex + ey * ey; if (e >= 1) continue;
    const a = (1 - e) * (1 - e) * 0.66;
    const o = (y * size + x) * 4;
    out[o] += (255 - out[o]) * a; out[o + 1] += (255 - out[o + 1]) * a; out[o + 2] += (255 - out[o + 2]) * a;
  }
  // 2b) Beveled rim — bright on top-facing edges, dark on bottom-facing edges (raised-button look).
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inside(x, y)) continue;
    const top = !inside(x, y - 1) || !inside(x, y - 2), bot = !inside(x, y + 1) || !inside(x, y + 2);
    if (!top && !bot) continue;
    const o = (y * size + x) * 4;
    if (top) { out[o] += (255 - out[o]) * 0.6; out[o + 1] += (255 - out[o + 1]) * 0.6; out[o + 2] += (255 - out[o + 2]) * 0.6; }
    else { out[o] *= 0.68; out[o + 1] *= 0.68; out[o + 2] *= 0.68; }
  }
  // 3) Soft drop shadow under the cat — blurred, offset down, so the cat lifts off the tile.
  const shadow = new Float32Array(size * size), dyShadow = Math.round(size * 0.06);
  for (let y = 0; y < catSz; y++) for (let x = 0; x < catSz; x++) {
    if (cat[(y * catSz + x) * 4 + 3] < 40) continue;
    const X = off + x, Y = off + y + dyShadow;
    if (X >= 0 && Y >= 0 && X < size && Y < size) shadow[Y * size + X] = 1;
  }
  const blur = boxBlur(shadow, size, Math.max(1, Math.round(size / 22)));
  for (let i = 0; i < size * size; i++) {
    const s = blur[i] * 0.6; if (s <= 0.002) continue;
    const x = i % size, y = (i / size) | 0; if (!inside(x, y)) continue;
    const o = i * 4, m = 1 - s;
    out[o] *= m; out[o + 1] *= m; out[o + 2] *= m;
  }
  // 4) Composite the cat on top.
  for (let y = 0; y < catSz; y++) for (let x = 0; x < catSz; x++) {
    const s = (y * catSz + x) * 4, a = cat[s + 3] / 255; if (!a) continue;
    const X = off + x, Y = off + y; if (X < 0 || Y < 0 || X >= size || Y >= size) continue;
    const o = (Y * size + X) * 4; if (out[o + 3] === 0) continue;
    out[o] = cat[s] * a + out[o] * (1 - a); out[o + 1] = cat[s + 1] * a + out[o + 1] * (1 - a);
    out[o + 2] = cat[s + 2] * a + out[o + 2] * (1 - a);
  }
  return out;
}
const tileEntry = (size) => ({ size, data: size >= 256 ? encodePng(onTile(size), size) : encodeBmp(onTile(size), size) });

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

// Windows app icon: multi-size .ico (BMP small + PNG 256) and a 256 PNG, on the tile.
fs.writeFileSync(path.join(outDir, 'icon.png'), encodePng(onTile(256), 256));
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco([256, 128, 64, 48, 32, 16].map(tileEntry)));

// macOS app icon (electron-builder needs >= 512px), on the tile.
fs.writeFileSync(path.join(outDir, 'icon-512.png'), encodePng(onTile(512), 512));

// Transparent 512 mascot mark for the README hero (no tile).
fs.writeFileSync(path.join(outDir, 'logo-mark.png'), encodePng(rgbaAt(512), 512));

// Tray glyph (16 + retina 32) and the legacy tray .ico — on the same warm tile as the app
// icon so the dark mascot is clearly visible on a dark system tray.
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePng(onTile(16), 16));
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePng(onTile(32), 32));
fs.writeFileSync(path.join(outDir, 'pixelcat.ico'), buildIco([32, 16].map(tileEntry)));

console.log('wrote assets/{icon.png,icon.ico,icon-512.png} on tile + tray glyphs from logo.png (BMP small ICO entries)');
