// Shared "pixelcat" logo mark — a bold, friendly FRONT-FACING cat face that reads
// at 16px and scales up crisply. Brand orange on a dark outline + light halo so it
// stays visible on a dark Windows taskbar (the old dark cat-head vanished there).
//
// renderCatFace(S, { halo }) returns an S*S RGBA buffer (transparent background).
// The face geometry is normalized (0..1), classified per pixel with supersampling
// for clean edges, then outline/halo are grown around the silhouette. Used by both
// scripts/make-tray-icon.js (tray) and scripts/make-app-icon.js (app tile).

const COL = {
  1: [232, 148, 60],   // coat  — brand orange
  2: [181, 100, 29],   // mark  — tabby stripes
  3: [247, 241, 230],  // cream — muzzle / chin
  4: [240, 170, 165],  // earin — inner ear
  5: [38, 40, 48],     // eye
  6: [255, 255, 255],  // shine — eye sparkle
  7: [224, 136, 143],  // nose
  8: [60, 36, 18],     // line  — dark outline
  9: [255, 252, 246],  // halo  — light contrast ring
};

function sign(px, py, ax, ay, bx, by) { return (px - bx) * (ay - by) - (ax - bx) * (py - by); }
function inTri(px, py, a, b, c) {
  const d1 = sign(px, py, a[0], a[1], b[0], b[1]);
  const d2 = sign(px, py, b[0], b[1], c[0], c[1]);
  const d3 = sign(px, py, c[0], c[1], a[0], a[1]);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

// Classify a normalized point (nx, ny in 0..1) into a role code, or 0 (empty).
function classify(nx, ny) {
  // eyes (+ a bright sparkle in the upper-right of each)
  for (const ex of [0.355, 0.645]) {
    const dx = (nx - ex) / 0.090, dy = (ny - 0.55) / 0.125;
    if (dx * dx + dy * dy <= 1) {
      const sx = (nx - (ex + 0.028)) / 0.028, sy = (ny - (0.55 - 0.040)) / 0.028;
      return (sx * sx + sy * sy <= 1) ? 6 : 5;
    }
  }
  // nose
  { const dx = (nx - 0.5) / 0.045, dy = (ny - 0.665) / 0.036; if (dx * dx + dy * dy <= 1) return 7; }
  // inner ears
  if (inTri(nx, ny, [0.215, 0.15], [0.15, 0.37], [0.33, 0.30])) return 4;
  if (inTri(nx, ny, [0.785, 0.15], [0.85, 0.37], [0.67, 0.30])) return 4;
  const inHead = ((nx - 0.5) / 0.40) ** 2 + ((ny - 0.57) / 0.36) ** 2 <= 1;
  // cream muzzle / chin (lower-centre of the head)
  if (inHead) { const dx = (nx - 0.5) / 0.185, dy = (ny - 0.72) / 0.125; if (dx * dx + dy * dy <= 1) return 3; }
  // forehead "M" tabby stripes on the coat
  if (inHead && ny > 0.27 && ny < 0.40) { for (const mx of [0.415, 0.50, 0.585]) if (Math.abs(nx - mx) < 0.017) return 2; }
  const inEarL = inTri(nx, ny, [0.20, 0.05], [0.07, 0.42], [0.40, 0.30]);
  const inEarR = inTri(nx, ny, [0.80, 0.05], [0.93, 0.42], [0.60, 0.30]);
  return (inHead || inEarL || inEarR) ? 1 : 0;
}

function renderCatFace(S, opts = {}) {
  const halo = opts.halo !== false;
  const ss = S <= 64 ? 4 : 2, W = S * ss;
  const role = new Int8Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) role[y * W + x] = classify((x + 0.5) / W, (y + 0.5) / W);
  // grow a dark outline (ss thick) around the silhouette, then a light halo
  const grow = (from, to, steps) => {
    for (let s = 0; s < steps; s++) {
      const add = [];
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        if (role[y * W + x] !== 0) continue;
        const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < W && yy < W && role[yy * W + xx] >= from && role[yy * W + xx] <= to;
        if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) add.push(y * W + x);
      }
      for (const i of add) role[i] = to + 1;   // 8 (line) when growing 1..7, 9 (halo) when growing 1..8
    }
  };
  grow(1, 7, ss);                   // outline
  if (halo) grow(1, 8, ss);         // halo ring (only useful on transparent/dark backgrounds)
  // hi-res RGBA, then box-downsample (premultiplied) to S for clean alpha edges
  const hi = new Uint8ClampedArray(W * W * 4);
  for (let i = 0; i < W * W; i++) { const c = COL[role[i]]; if (!c) continue; hi[i * 4] = c[0]; hi[i * 4 + 1] = c[1]; hi[i * 4 + 2] = c[2]; hi[i * 4 + 3] = 255; }
  return downsample(hi, W, S);
}

function downsample(src, srcSize, size) {
  if (size === srcSize) return src;
  const out = new Uint8ClampedArray(size * size * 4), ratio = srcSize / size;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = 0; sy < ratio; sy++) for (let sx = 0; sx < ratio; sx++) {
      const px = Math.floor(x * ratio + sx), py = Math.floor(y * ratio + sy), i = (py * srcSize + px) * 4, af = src[i + 3] / 255;
      r += src[i] * af; g += src[i + 1] * af; b += src[i + 2] * af; a += src[i + 3]; n++;
    }
    const o = (y * size + x) * 4, av = a / n;
    out[o] = av ? r / n / (av / 255) : 0; out[o + 1] = av ? g / n / (av / 255) : 0; out[o + 2] = av ? b / n / (av / 255) : 0; out[o + 3] = av;
  }
  return out;
}

module.exports = { renderCatFace, COL };
