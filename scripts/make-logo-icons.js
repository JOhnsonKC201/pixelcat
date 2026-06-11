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
const { loadLogo, resizeSquare } = require('./logo-source.js');

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

const logo = loadLogo();
const rgbaAt = (size) => resizeSquare(logo, size);
const icoEntry = (size) => ({ size, data: size >= 256 ? encodePng(rgbaAt(size), size) : encodeBmp(rgbaAt(size), size) });

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

// Windows app icon: multi-size .ico (BMP small + PNG 256) and a 256 PNG.
fs.writeFileSync(path.join(outDir, 'icon.png'), encodePng(rgbaAt(256), 256));
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco([256, 128, 64, 48, 32, 16].map(icoEntry)));

// macOS app icon (electron-builder needs >= 512px).
fs.writeFileSync(path.join(outDir, 'icon-512.png'), encodePng(rgbaAt(512), 512));

// Tray glyph (16 + retina 32) and the legacy tray .ico.
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePng(rgbaAt(16), 16));
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePng(rgbaAt(32), 32));
fs.writeFileSync(path.join(outDir, 'pixelcat.ico'), buildIco([32, 16].map(icoEntry)));

console.log('wrote assets/{icon.png,icon.ico,icon-512.png,tray.png,tray@2x.png,pixelcat.ico} from logo.png (BMP small ICO entries)');
