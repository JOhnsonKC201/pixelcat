#!/usr/bin/env node
// Renders assets/social-card.png (1280x640, GitHub's social-preview size):
// the showcase strip (every coat x pose) along the bottom, with a pixel
// wordmark on top. Pure Node like the other generators - no browser, no GPU.
// Usage: node scripts/make-social-card.js  (or: npm run social)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 1280, H = 640;
const ORANGE = [232, 148, 60];   // --orange, the cat/brand accent
const MUTED = [154, 160, 173];   // --muted body text on the site
const PINK = [224, 136, 143];    // --pink, the nose/hearts

// ---- tiny PNG decode/encode (same approach as make-demo-gif / make-logo-icons)
function decodePng(file) {
  const b = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, colorType = 6; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), data = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 1, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4);
  let cur = Buffer.alloc(stride), prev = Buffer.alloc(stride), rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[rp++], a = x >= ch ? cur[x - ch] : 0, bb = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v;
      if (f === 1) v = rb + a; else if (f === 2) v = rb + bb; else if (f === 3) v = rb + ((a + bb) >> 1);
      else if (f === 4) { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c); }
      else v = rb;
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) {
      const si = x * ch, di = (y * w + x) * 4;
      out[di] = cur[si]; out[di + 1] = ch >= 3 ? cur[si + 1] : cur[si]; out[di + 2] = ch >= 3 ? cur[si + 2] : cur[si]; out[di + 3] = ch === 4 ? cur[si + 3] : 255;
    }
    const tmp = prev; prev = cur; cur = tmp;
  }
  return { width: w, height: h, data: out };
}

function encodePng(rgba, w, h) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcTable = encodePng._t || (encodePng._t = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })());
    let crc = -1; for (const byte of body) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    const crcB = Buffer.alloc(4); crcB.writeInt32BE((crc ^ -1) | 0);
    return Buffer.concat([len, body, crcB]);
  };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = rgba[y * w * 4 + x]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- drawing helpers
function px(buf, x, y, c) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; }
function fillRect(buf, x, y, w, h, c) { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(buf, x + xx, y + yy, c); }

// 3x5 caps font, same glyph set as make-demo-gif.js
const FONT = {
  A: [2, 5, 7, 5, 5], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7],
  H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], K: [5, 6, 6, 5, 5], L: [4, 4, 4, 4, 7],
  N: [5, 7, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], R: [6, 5, 6, 5, 5],
  S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2],
  X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], ' ': [0, 0, 0, 0, 0],
};
function textWidth(text, scale) { return text.length * 4 * scale - scale; }
function drawText(buf, text, cx, cy, scale, col) {
  let x = Math.round(cx - textWidth(text, scale) / 2);
  for (const ch of text.toUpperCase()) {
    const g = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r] & (1 << (2 - c))) fillRect(buf, x + c * scale, cy + r * scale, scale, scale, col);
    x += 4 * scale;
  }
}

const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
function drawHeart(buf, x, y, s, col) {
  for (let r = 0; r < HEART.length; r++) for (let c = 0; c < 7; c++) if (HEART[r][c] === '1') fillRect(buf, x + c * s, y + r * s, s, s, col);
}

// ---- compose
const root = path.join(__dirname, '..');
const showcase = decodePng(path.join(root, 'assets', 'showcase.png'));
if (showcase.height !== 398) throw new Error(`showcase.png is ${showcase.width}x${showcase.height}; expected height 398 - update the layout below`);

const buf = new Uint8ClampedArray(W * H * 4);
// Background: sample the showcase's own corner pixel so the seam is invisible.
const bg = [showcase.data[0], showcase.data[1], showcase.data[2]];
fillRect(buf, 0, 0, W, H, bg);

// Showcase strip along the bottom, center-cropped from 1410 to 1280 wide.
const cropX = Math.floor((showcase.width - W) / 2), top = H - showcase.height;
for (let y = 0; y < showcase.height; y++) for (let x = 0; x < W; x++) {
  const si = (y * showcase.width + (x + cropX)) * 4, di = ((y + top) * W + x) * 4;
  buf[di] = showcase.data[si]; buf[di + 1] = showcase.data[si + 1]; buf[di + 2] = showcase.data[si + 2]; buf[di + 3] = 255;
}

// Fade the strip's side edges into the background so the crop reads as a
// deliberate carousel peek instead of a mid-cat slice.
const FADE = 90;
for (let y = top; y < H; y++) for (let x = 0; x < FADE; x++) {
  for (const xx of [x, W - 1 - x]) {
    const f = x / FADE, i = (y * W + xx) * 4;
    buf[i] = buf[i] * f + bg[0] * (1 - f); buf[i + 1] = buf[i + 1] * f + bg[1] * (1 - f); buf[i + 2] = buf[i + 2] * f + bg[2] * (1 - f);
  }
}

// Wordmark + tagline + flanking hearts in the clear band on top.
drawText(buf, 'PIXELPETS', W / 2, 62, 18, ORANGE);
// Species-neutral since 0.3.0, when the app became a cat OR a dog. Not "CAT OR DOG"
// because FONT here is a minimal subset with no G in it.
drawText(buf, 'A PET THAT LIVES ON YOUR DESKTOP', W / 2, 182, 5, MUTED);
const wm = textWidth('PIXELPETS', 18);
drawHeart(buf, Math.round(W / 2 - wm / 2 - 78), 88, 6, PINK);
drawHeart(buf, Math.round(W / 2 + wm / 2 + 36), 88, 6, PINK);

const out = path.join(root, 'assets', 'social-card.png');
fs.writeFileSync(out, encodePng(buf, W, H));
console.log(`wrote ${path.relative(root, out)} (${W}x${H})`);
