// Loads assets/logo.png (the pixelcat mascot) into RGBA pixels and provides an
// area-averaging resize, so the icon generators can derive every app/tray size
// from one master artwork instead of drawing procedurally.
// Decoder scope: 8-bit, non-interlaced PNG (the format our logo ships in).
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }; // gray, rgb, palette, gray+a, rgba

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

// Decode an 8-bit, non-interlaced PNG buffer into { width, height, rgba }.
function decodePng(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('not a PNG');

  let width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  let palette = null, trns = null;
  const idat = [];

  for (let off = 8; off < buf.length;) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      depth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8) throw new Error(`unsupported bit depth ${depth} (need 8)`);
  if (interlace !== 0) throw new Error('interlaced PNG not supported');

  const ch = CHANNELS[colorType];
  if (!ch) throw new Error(`unsupported color type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const px = Buffer.alloc(height * stride); // unfiltered, native channels
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = px.subarray(y * stride, y * stride + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[i] = v & 0xff;
    }
    prev = cur;
  }

  // Expand to RGBA regardless of source color type.
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * ch, d = i * 4;
    if (colorType === 6) { rgba[d] = px[s]; rgba[d + 1] = px[s + 1]; rgba[d + 2] = px[s + 2]; rgba[d + 3] = px[s + 3]; }
    else if (colorType === 2) { rgba[d] = px[s]; rgba[d + 1] = px[s + 1]; rgba[d + 2] = px[s + 2]; rgba[d + 3] = 255; }
    else if (colorType === 0) { rgba[d] = rgba[d + 1] = rgba[d + 2] = px[s]; rgba[d + 3] = 255; }
    else if (colorType === 4) { rgba[d] = rgba[d + 1] = rgba[d + 2] = px[s]; rgba[d + 3] = px[s + 1]; }
    else if (colorType === 3) { const p = px[s] * 3; rgba[d] = palette[p]; rgba[d + 1] = palette[p + 1]; rgba[d + 2] = palette[p + 2]; rgba[d + 3] = trns && px[s] < trns.length ? trns[px[s]] : 255; }
  }
  return { width, height, rgba };
}

// Area-averaging resize into a square `size`, fitting the whole artwork (no crop)
// and padding the leftover with the artwork's own corner colour so nothing distorts.
function resizeSquare(src, size) {
  const { width: sw, height: sh, rgba } = src;
  const scale = Math.min(size / sw, size / sh);
  const dw = Math.max(1, Math.round(sw * scale)), dh = Math.max(1, Math.round(sh * scale));
  const padX = Math.floor((size - dw) / 2), padY = Math.floor((size - dh) / 2);
  const bg = [rgba[0], rgba[1], rgba[2], rgba[3]]; // top-left pixel = background fill

  const out = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) { const o = i * 4; out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = bg[3]; }

  const rx = sw / dw, ry = sh / dh;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    const sx0 = Math.floor(x * rx), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * rx));
    const sy0 = Math.floor(y * ry), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * ry));
    for (let sy = sy0; sy < sy1 && sy < sh; sy++) for (let sx = sx0; sx < sx1 && sx < sw; sx++) {
      const i = (sy * sw + sx) * 4, af = rgba[i + 3] / 255;
      r += rgba[i] * af; g += rgba[i + 1] * af; b += rgba[i + 2] * af; a += rgba[i + 3]; n++;
    }
    const av = a / n, o = ((padY + y) * size + (padX + x)) * 4;
    out[o] = av ? r / n / (av / 255) : 0; out[o + 1] = av ? g / n / (av / 255) : 0;
    out[o + 2] = av ? b / n / (av / 255) : 0; out[o + 3] = av;
  }
  return out;
}

function loadLogo() {
  return decodePng(fs.readFileSync(path.join(__dirname, '..', 'assets', 'logo.png')));
}

module.exports = { decodePng, resizeSquare, loadLogo };
