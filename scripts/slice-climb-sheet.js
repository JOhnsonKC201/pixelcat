// Slice a 5-panel climb CONTACT SHEET (idle | up | up | down | down) into the five
// frames in assets/climb/, removing the dark background by flood-filling inward from
// each panel's borders (stops at the cats' brighter rim-light/fur). Works when the
// sheet's background is clearly DARKER than the fur; tune the threshold otherwise.
//
//   node scripts/slice-climb-sheet.js <sheet.png> <coat-slug> [bgThreshold]
//   npm run climb-frames        # then embed the sliced frames for the renderer
//
// coat-slug: which coat these frames belong to, e.g. tuxedo, orange-tabby, calico
//   (matches a PATTERNS name lowercased with spaces->hyphens). Frames are written to
//   assets/climb/<coat-slug>/. 'tuxedo' is the default set every other coat falls back to.
// bgThreshold: a pixel whose brightest channel is below this, reachable from a panel
// border, is treated as background. Raise it if dark fur leaves halos; lower it if
// the body gets eaten.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const { decodePng } = require('./logo-source.js');

const SRC = process.argv[2];
if (!SRC) { console.error('usage: node scripts/slice-climb-sheet.js <sheet.png> <coat-slug> [bgThreshold]'); process.exit(1); }
const COAT = (process.argv[3] || 'tuxedo').toLowerCase();
const BG_MAX = Number(process.argv[4]) || 30;
const full = decodePng(fs.readFileSync(SRC));
const W = full.width, H = full.height;

const names = ['idle', 'up1', 'up2', 'down1', 'down2'];
const colW = W / 5;
const yTop = 16, yBot = Math.round(H * 0.94);     // exclude the label bar at the very bottom

function encodePng(buf, w, h) {
  const crc = (b) => { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0); const b = Buffer.concat([Buffer.from(t), d]); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0); return Buffer.concat([l, b, cc]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = buf[y * w * 4 + x]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, '..', 'assets', 'climb', COAT);
fs.mkdirSync(dir, { recursive: true });
console.log(`slicing ${path.basename(SRC)} -> assets/climb/${COAT}/ (bg<${BG_MAX})`);

names.forEach((n, i) => {
  // crop this panel (small inset to skip dividers)
  const x0 = Math.round(i * colW) + 7, x1 = Math.round((i + 1) * colW) - 7;
  const cw = x1 - x0, ch = yBot - yTop;
  const buf = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const s = ((yTop + y) * W + (x0 + x)) * 4, d = (y * cw + x) * 4;
    buf[d] = full.rgba[s]; buf[d + 1] = full.rgba[s + 1]; buf[d + 2] = full.rgba[s + 2]; buf[d + 3] = 255;
  }
  // flood-fill dark background from this panel's borders
  const bright = (p) => Math.max(buf[p], buf[p + 1], buf[p + 2]) >= BG_MAX;
  const seen = new Uint8Array(cw * ch), st = [];
  const push = (x, y) => { if (x < 0 || y < 0 || x >= cw || y >= ch) return; const q = y * cw + x; if (seen[q] || bright(q * 4)) return; seen[q] = 1; st.push(q); };
  for (let x = 0; x < cw; x++) { push(x, 0); push(x, ch - 1); }
  for (let y = 0; y < ch; y++) { push(0, y); push(cw - 1, y); }
  while (st.length) { const q = st.pop(), x = q % cw, y = (q / cw) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  for (let q = 0; q < cw * ch; q++) if (seen[q]) buf[q * 4 + 3] = 0;
  // strip near-full-height vertical lines hugging the left/right edges — these are
  // leftover panel-divider/border lines the key missed. The real climbing rope is
  // central (never in the outer columns), so it's safe; debris flecks are preserved.
  {
    const colFrac = (x) => { let c = 0; for (let y = 0; y < ch; y++) if (buf[(y * cw + x) * 4 + 3] > 16) c++; return c / ch; };
    const EDGE = 7, FULL = 0.85;
    for (let x = 0; x < EDGE; x++) if (colFrac(x) > FULL) for (let y = 0; y < ch; y++) buf[(y * cw + x) * 4 + 3] = 0;
    for (let x = cw - 1; x >= cw - EDGE; x--) if (colFrac(x) > FULL) for (let y = 0; y < ch; y++) buf[(y * cw + x) * 4 + 3] = 0;
  }
  // tight-trim to non-transparent bounds
  let mnX = cw, mnY = ch, mxX = 0, mxY = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) if (buf[(y * cw + x) * 4 + 3] > 16) { if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y; }
  const tw = mxX - mnX + 1, th = mxY - mnY + 1, out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const s = ((mnY + y) * cw + (mnX + x)) * 4, d = (y * tw + x) * 4; out[d] = buf[s]; out[d + 1] = buf[s + 1]; out[d + 2] = buf[s + 2]; out[d + 3] = buf[s + 3]; }
  fs.writeFileSync(path.join(dir, n + '.png'), encodePng(out, tw, th));
  console.log(`wrote ${n}.png ${tw}x${th}`);
});
