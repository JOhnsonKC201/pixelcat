// Regenerates EVERY app + tray icon from the master artwork assets/logo.png, so the
// whole brand (desktop shortcut, taskbar, tray, macOS app) shows one consistent
// mascot. Replaces the old procedural cat-face glyph pipeline. Run: npm run icon
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { loadLogo, resizeSquare } = require('./logo-source.js');

// --- minimal PNG (truecolor + alpha) encoder + PNG-embedded ICO builder ---
function crc(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(t, d) { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0); return Buffer.concat([l, b, cc]); }
function encodePng(rgba, s) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(s, 0); ih.writeUInt32BE(s, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(s * (s * 4 + 1));
  for (let y = 0; y < s; y++) { raw[y * (s * 4 + 1)] = 0; for (let x = 0; x < s * 4; x++) raw[y * (s * 4 + 1) + 1 + x] = rgba[y * s * 4 + x]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function buildIco(pngs) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = 6 + 16 * pngs.length;
  const e = pngs.map((p) => { const b = Buffer.alloc(16); b.writeUInt8(p.size >= 256 ? 0 : p.size, 0); b.writeUInt8(p.size >= 256 ? 0 : p.size, 1); b.writeUInt16LE(1, 4); b.writeUInt16LE(32, 6); b.writeUInt32LE(p.data.length, 8); b.writeUInt32LE(off, 12); off += p.data.length; return b; });
  return Buffer.concat([head, ...e, ...pngs.map((p) => p.data)]);
}

const logo = loadLogo();
const png = (size) => encodePng(resizeSquare(logo, size), size);

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

// Windows app icon: multi-size .ico + a 256 PNG.
const icoSizes = [256, 128, 64, 48, 32, 16];
const icoPngs = icoSizes.map((s) => ({ size: s, data: png(s) }));
fs.writeFileSync(path.join(outDir, 'icon.png'), icoPngs[0].data);
fs.writeFileSync(path.join(outDir, 'icon.ico'), buildIco(icoPngs));

// macOS app icon (electron-builder needs >= 512px).
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png(512));

// Tray glyph (16 + retina 32) and the legacy tray .ico.
const tray16 = png(16), tray32 = png(32);
fs.writeFileSync(path.join(outDir, 'tray.png'), tray16);
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), tray32);
fs.writeFileSync(path.join(outDir, 'pixelcat.ico'), buildIco([{ size: 16, data: tray16 }, { size: 32, data: tray32 }]));

console.log('wrote assets/{icon.png,icon.ico,icon-512.png,tray.png,tray@2x.png,pixelcat.ico} from logo.png');
