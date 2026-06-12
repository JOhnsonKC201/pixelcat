// Generates assets/tray.png (16px) and assets/tray@2x.png (32px) - the "pixelcat"
// logo mark: a bold ORANGE cat face with a dark outline and light halo, so it stays
// visible on a dark Windows taskbar (the previous dark cat-head was invisible there).
// Artwork comes from the shared scripts/logo-glyph.js. Run: node scripts/make-tray-icon.js
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const { renderCatFace } = require('./logo-glyph.js');

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

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'tray.png'), encodePng(renderCatFace(16, { halo: true }), 16));
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), encodePng(renderCatFace(32, { halo: true }), 32));
console.log('wrote assets/tray.png (16) and assets/tray@2x.png (32)');
