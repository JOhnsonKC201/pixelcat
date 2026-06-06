// Bundle the generated tray PNGs into assets/pixelcat.ico (PNG-embedded ICO,
// supported on modern Windows). Run after make-tray-icon.js.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets');
const imgs = [
  { size: 16, file: 'tray.png' },
  { size: 32, file: 'tray@2x.png' },
].map((e) => ({ size: e.size, data: fs.readFileSync(path.join(dir, e.file)) }));

const HEADER = 6, ENTRY = 16;
const head = Buffer.alloc(HEADER);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);

let offset = HEADER + ENTRY * imgs.length;
const entries = [];
for (const im of imgs) {
  const e = Buffer.alloc(ENTRY);
  e.writeUInt8(im.size === 256 ? 0 : im.size, 0);
  e.writeUInt8(im.size === 256 ? 0 : im.size, 1);
  e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(im.data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += im.data.length;
  entries.push(e);
}
fs.writeFileSync(path.join(dir, 'pixelcat.ico'), Buffer.concat([head, ...entries, ...imgs.map((i) => i.data)]));
console.log('wrote assets/pixelcat.ico');
