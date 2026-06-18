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
// Tray glyph treatment: the mascot is dark, so on a dark Windows system tray a fully
// transparent icon disappears. Wrap the cat in a crisp light "sticker" outline (the same
// look as the in-app cat) so it reads on dark AND light taskbars. On macOS the tray image
// is used as a template (silhouette), so the outline just slightly fattens that silhouette.
function withHalo(size) {
  const cat = rgbaAt(size);
  const r = Math.max(1, Math.round(size / 14));
  const alphaAt = (x, y) => (x < 0 || y < 0 || x >= size || y >= size) ? 0 : cat[(y * size + x) * 4 + 3];
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const o = (y * size + x) * 4;
    if (cat[o + 3] > 60) { out[o] = cat[o]; out[o + 1] = cat[o + 1]; out[o + 2] = cat[o + 2]; out[o + 3] = cat[o + 3]; continue; }
    let near = false;
    for (let dy = -r; dy <= r && !near; dy++) for (let dx = -r; dx <= r; dx++) { if (alphaAt(x + dx, y + dy) > 120) { near = true; break; } }
    if (near) { out[o] = 245; out[o + 1] = 246; out[o + 2] = 250; out[o + 3] = 255; }   // soft white outline
  }
  return out;
}
const haloEntry = (size) => ({ size, data: size >= 256 ? encodePng(withHalo(size), size) : encodeBmp(withHalo(size), size) });

// App-icon tile. The mascot is dark, so a transparent icon turns into a dark blob at
// 16-48px on dark taskbars/wallpapers. Composite the cat onto a bold, rounded, warm
// gradient tile (cream -> soft orange, echoing the spikes) so the desktop/taskbar icon
// stays clearly visible on ANY background. Tray glyphs stay transparent (they live in
// the system tray and must adapt to it), so only the app icons get the tile.
const TILE_TOP = [255, 234, 200];   // warm cream (top)
const TILE_BOT = [255, 170, 104];   // soft orange (bottom)
const CAT_SCALE = 0.84;             // cat occupies 84% of the tile, leaving a clean frame
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
function onTile(size) {
  const catSz = Math.round(size * CAT_SCALE);
  const cat = rgbaAt(catSz);
  const off = Math.floor((size - catSz) / 2);
  const radius = Math.round(size * 0.22);
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {           // rounded gradient tile
    const o = (y * size + x) * 4;
    const rx = Math.max(0, radius - x, x - (size - 1 - radius));
    const ry = Math.max(0, radius - y, y - (size - 1 - radius));
    if (rx > 0 && ry > 0 && rx * rx + ry * ry > radius * radius) continue;  // outside rounded corner -> transparent
    const t = y / (size - 1);
    out[o] = lerp(TILE_TOP[0], TILE_BOT[0], t); out[o + 1] = lerp(TILE_TOP[1], TILE_BOT[1], t);
    out[o + 2] = lerp(TILE_TOP[2], TILE_BOT[2], t); out[o + 3] = 255;
  }
  for (let y = 0; y < catSz; y++) for (let x = 0; x < catSz; x++) {          // alpha-over composite of the cat
    const s = (y * catSz + x) * 4, a = cat[s + 3] / 255; if (!a) continue;
    const X = off + x, Y = off + y; if (X < 0 || Y < 0 || X >= size || Y >= size) continue;
    const o = (Y * size + X) * 4; if (out[o + 3] === 0) continue;           // keep the rounded corners clean
    out[o] = Math.round(cat[s] * a + out[o] * (1 - a)); out[o + 1] = Math.round(cat[s + 1] * a + out[o + 1] * (1 - a));
    out[o + 2] = Math.round(cat[s + 2] * a + out[o + 2] * (1 - a));
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

// Tray glyph (16 + retina 32) and the legacy tray .ico — light "sticker" outline so the
// dark mascot stays visible on a dark system tray (and on light taskbars too).
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePng(withHalo(16), 16));
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePng(withHalo(32), 32));
fs.writeFileSync(path.join(outDir, 'pixelcat.ico'), buildIco([32, 16].map(haloEntry)));

console.log('wrote assets/{icon.png,icon.ico,icon-512.png} on tile + tray glyphs from logo.png (BMP small ICO entries)');
