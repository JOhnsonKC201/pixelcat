// Self-contained sit-cat renderer for the Settings "live coat preview". It mirrors
// the SIT sprite + drawCat from renderer.js (the stable part) so the settings
// window can show a coat without loading the whole overlay. Exposes
// window.PixelcatPreview = { PATTERNS, PATTERN_BUILD, TABBY, BUILDS, draw }.
//
// KEEP IN SYNC with renderer.js: PATTERNS / PATTERN_BUILD / TABBY / BUILDS /
// composeSit / drawCat. (Only the sit pose is mirrored here.)
(function () {
  const CELL = 5;
  let G, GC, GR;
  const inb = (c, r) => c >= 0 && c < GC && r >= 0 && r < GR;
  function setCell(c, r, role) { if (inb(c, r)) G[r][c] = role; }
  function ellipse(cx, cy, rx, ry, role, onlyOn) {
    for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) {
      for (let c = Math.floor(cx - rx); c <= Math.ceil(cx + rx); c++) {
        const dx = (c - cx) / rx, dy = (r - cy) / ry;
        if (dx * dx + dy * dy <= 1 && inb(c, r)) { if (!onlyOn || onlyOn.includes(G[r][c])) G[r][c] = role; }
      }
    }
  }
  function triangle(ax, ay, bx, by, cx2, cy2, role) {
    const minc = Math.floor(Math.min(ax, bx, cx2)), maxc = Math.ceil(Math.max(ax, bx, cx2));
    const minr = Math.floor(Math.min(ay, by, cy2)), maxr = Math.ceil(Math.max(ay, by, cy2));
    const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    for (let r = minr; r <= maxr; r++) for (let c = minc; c <= maxc; c++) {
      const d1 = sign(c, r, ax, ay, bx, by), d2 = sign(c, r, bx, by, cx2, cy2), d3 = sign(c, r, cx2, cy2, ax, ay);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) setCell(c, r, role);
    }
  }
  function outlineHalo() {
    const solid = (c, r) => inb(c, r) && G[r][c] !== '.' && G[r][c] !== 'O' && G[r][c] !== 'H';
    for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { if (G[r][c] !== '.') continue; if (solid(c - 1, r) || solid(c + 1, r) || solid(c, r - 1) || solid(c, r + 1)) G[r][c] = 'O'; }
    const isO = (c, r) => inb(c, r) && G[r][c] === 'O';
    for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { if (G[r][c] !== '.') continue; if (isO(c - 1, r) || isO(c + 1, r) || isO(c, r - 1) || isO(c, r + 1)) G[r][c] = 'H'; }
  }
  function eyeBox(side) {
    let minC = 999, maxC = -1, minR = 999, maxR = -1;
    for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) { if (G[r][c] !== 'E') continue; if (side === 'L' ? c >= GC / 2 : c < GC / 2) continue; minC = Math.min(minC, c); maxC = Math.max(maxC, c); minR = Math.min(minR, r); maxR = Math.max(maxR, r); }
    return { cx: ((minC + maxC + 1) / 2) * CELL, cy: ((minR + maxR + 1) / 2) * CELL, w: (maxC - minC + 1) * CELL, h: (maxR - minR + 1) * CELL };
  }
  function muzzlePt() {
    let sx = 0, sy = 0, n = 0;
    for (let r = 0; r < GR; r++) for (let c = 0; c < GC; c++) if (G[r][c] === 'N') { sx += c; sy += r; n++; }
    n = n || 1; return { x: (sx / n + 0.5) * CELL, y: (sy / n + 0.5) * CELL };
  }
  function buildSprite(cols, rows, compose) {
    G = Array.from({ length: rows }, () => Array(cols).fill('.')); GC = cols; GR = rows;
    compose(); outlineHalo();
    return { grid: G, COLS: cols, ROWS: rows, SW: cols * CELL, SH: rows * CELL, eyes: [eyeBox('L'), eyeBox('R')], muzzle: muzzlePt() };
  }
  function composeSit(B) {
    B = B || {};
    const CX = 12, bw = B.bodyW || 1;
    const headRx = B.headRx || 6.3, headRy = B.headRy || 5.8;
    const earY = B.earApexY == null ? 1 : B.earApexY, ew = B.earW || 2.4, eo = B.earOut || 4;
    const eRx = B.eyeRx || 2, eRy = B.eyeRy || 2.4, fluff = !!B.fluff, cheek = B.cheek || 0;
    ellipse(CX, 24, 7.6 * bw, 5 + (fluff ? 0.4 : 0), 'C');
    ellipse(CX, 16, 5.2 * bw, 7.5, 'C');
    ellipse(CX, 8, headRx, headRy, 'C');
    if (cheek) { ellipse(CX - headRx * 0.7, 9.6, 1.7, 2.2, 'C'); ellipse(CX + headRx * 0.7, 9.6, 1.7, 2.2, 'C'); }
    if (fluff) { ellipse(5.4, 10.4, 1.9, 2.4, 'C'); ellipse(18.6, 10.4, 1.9, 2.4, 'C'); }
    triangle(CX - eo - 0.5, earY, CX - eo - ew, 7.6, CX - eo + ew, 6.4, 'K');
    triangle(CX + eo + 0.5, earY, CX + eo + ew, 7.6, CX + eo - ew, 6.4, 'K');
    const iw = ew * 0.55;
    triangle(CX - eo - 0.3, earY + 2, CX - eo - iw, 7.2, CX - eo + iw, 6.6, 'I');
    triangle(CX + eo + 0.3, earY + 2, CX + eo + iw, 7.2, CX + eo - iw, 6.6, 'I');
    if (fluff) { ellipse(CX - eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); ellipse(CX + eo, 6.0, 0.9, 1.4, 'W', ['C', 'K']); }
    ellipse(CX, 12, 3, 2, 'W', ['C']); ellipse(CX, 17, fluff ? 3.4 : 2.7, 7, 'W', ['C']);
    ellipse(10, 23, 1.6, 5.2, 'C'); ellipse(14, 23, 1.6, 5.2, 'C');
    ellipse(10, 27.4, 2, 1.7, 'W', ['C']); ellipse(14, 27.4, 2, 1.7, 'W', ['C']);
    ellipse(9, 8.2, eRx, eRy, 'E'); ellipse(15, 8.2, eRx, eRy, 'E');
    setCell(12, 11, 'N'); setCell(11, 11, 'N');
    if (B.tabby) {
      [[11, 6], [12, 7], [13, 6]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); });
      for (let r = 0; r < GR; r++) for (let c = 17; c < GC; c++) if (G[r][c] === 'C' && r % 2 === 0) G[r][c] = 'K';
      [8, 10, 14, 16].forEach((sc) => { for (let r = 13; r < 26; r += 2) { if (G[r][sc] === 'C') setCell(sc, r, 'K'); } });
    }
    ellipse(8, 19, 2.2, 3, 'X', ['C', 'K']); ellipse(15, 23, 2.2, 2.3, 'X', ['C', 'K']);
    for (let r = 19; r <= 28; r++) setCell(12, r, '.');
    for (let r = 22; r <= 28; r++) { setCell(8, r, '.'); setCell(16, r, '.'); }
  }
  const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toRgb = (s) => { if (s[0] === '#') return hexToRgb(s); const m = s.match(/\d+/g); return [+m[0], +m[1], +m[2]]; };
  const rgbStr = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const shadeStr = (rgb, f) => { const c = (v) => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(rgb[0])},${c(rgb[1])},${c(rgb[2])})`; };
  const HALO = '#fbfdff';
  const BODY = new Set(['C', 'K', 'W', 'X', 'I']);

  function drawCat(g, sp, palRGB) {
    const grid = sp.grid, COLS = sp.COLS, ROWS = sp.ROWS;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c]; if (ch === '.') continue;
      const base = ch === 'E' ? palRGB.E : palRGB[ch]; if (!base) continue;
      const f = BODY.has(ch) ? 1.12 - (r / ROWS) * 0.34 : 1;
      g.fillStyle = f === 1 ? rgbStr(base) : shadeStr(base, f);
      g.fillRect(c * CELL, r * CELL, CELL, CELL);
    }
    g.strokeStyle = 'rgba(245,245,245,0.6)'; g.lineWidth = 1; g.lineCap = 'round';
    const my = sp.muzzle.y, cl = sp.muzzle.x - 4.5 * CELL, cr = sp.muzzle.x + 4.5 * CELL;
    for (const [sx, dir] of [[cl, -1], [cr, 1]]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sx, my + i * 3 - 2); g.lineTo(sx + dir * 13, my + i * 5 - 1); g.stroke(); }
    for (const e of sp.eyes) {
      if (!isFinite(e.cx) || e.w <= 0) continue;
      const pw = Math.max(4, Math.round(e.w * 0.46)), ph = Math.max(5, Math.round(e.h * 0.7));
      const px = Math.round(e.cx - pw / 2), py = Math.round(e.cy - ph / 2);
      g.fillStyle = '#22242b'; g.fillRect(px, py + 1, pw, ph - 2); g.fillRect(px + 1, py, pw - 2, ph);
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(px + pw - 3, py + 1, 2, 2);
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(px + 1, py + ph - 3, 2, 2);
    }
  }

  const PATTERNS = [
    { name: 'Orange Tabby', coat: '#e8943c', mark: '#b5641d', white: '#f7f1e6', patch: '#e8943c', eye: '#8bbf5a', nose: '#e0888f', inner: '#f0b6a0', outline: '#5a3514' },
    { name: 'Mackerel Tabby', coat: '#9aa3b0', mark: '#5c6470', white: '#f2f4f7', patch: '#9aa3b0', eye: '#9ccf6a', nose: '#e3a0a6', inner: '#f0c4c4', outline: '#2f343d' },
    { name: 'Brown Tabby', coat: '#a07d52', mark: '#5f4528', white: '#efe6d4', patch: '#a07d52', eye: '#c9a23c', nose: '#c98b85', inner: '#e6bda6', outline: '#352718' },
    { name: 'Siamese', coat: '#e8dcc4', mark: '#5a4636', white: '#f3ecdd', patch: '#e8dcc4', eye: '#6db4d6', nose: '#d6a3a8', inner: '#e3b9bd', outline: '#3a2f26' },
    { name: 'Tuxedo', coat: '#2b2d33', mark: '#2b2d33', white: '#f4f5f7', patch: '#2b2d33', eye: '#8bbf5a', nose: '#e6a6ac', inner: '#caa0a6', outline: '#141519' },
    { name: 'Black', coat: '#2b2d33', mark: '#212329', white: '#2b2d33', patch: '#2b2d33', eye: '#d8b13a', nose: '#b06b72', inner: '#6b4a52', outline: '#141519' },
    { name: 'Gray', coat: '#8b94a3', mark: '#8b94a3', white: '#8b94a3', patch: '#8b94a3', eye: '#c9a23c', nose: '#d99fa5', inner: '#e9c2c2', outline: '#2f343d' },
    { name: 'White', coat: '#f2f1ec', mark: '#f2f1ec', white: '#ffffff', patch: '#f2f1ec', eye: '#6db4d6', nose: '#f0b4ba', inner: '#f7d4d4', outline: '#9b948a' },
    { name: 'Cream', coat: '#ecd6ab', mark: '#ecd6ab', white: '#f7eed6', patch: '#ecd6ab', eye: '#c9a23c', nose: '#e2a7ab', inner: '#f2cbcb', outline: '#b59a6a' },
    { name: 'Tortoiseshell', coat: '#2b2d33', mark: '#1f2024', white: '#2b2d33', patch: '#c9762a', eye: '#c9a23c', nose: '#b06b72', inner: '#7a5560', outline: '#141519' },
    { name: 'Calico', coat: '#f3f1ec', mark: '#2b2d33', white: '#ffffff', patch: '#d6802f', eye: '#c9a23c', nose: '#d98f95', inner: '#f0cccc', outline: '#6f6a62' },
    { name: 'Slate', coat: '#8d97ac', mark: '#6f7892', white: '#8d97ac', patch: '#8d97ac', eye: '#ffffff', nose: '#ff9aa2', inner: '#ff9aa2', outline: '#2e323d' },
  ];
  const BUILDS = {
    standard: { earApexY: 1, earW: 2.4, earOut: 4 },
    slender: { bodyW: 0.85, headRx: 5.7, headRy: 5.4, earApexY: -1, earW: 2.3, earOut: 4.2, eyeRx: 2.1, eyeRy: 2.0 },
    stocky: { bodyW: 1.16, headRx: 6.8, headRy: 6.0, earApexY: 1.4, earW: 2.7, earOut: 3.9, cheek: 1, eyeRx: 2.0, eyeRy: 2.2 },
    fluffy: { bodyW: 1.08, headRx: 6.4, headRy: 5.9, earApexY: 0.8, earW: 2.5, earOut: 4, fluff: true, eyeRx: 2.0, eyeRy: 2.3 },
  };
  const PATTERN_BUILD = ['standard', 'slender', 'fluffy', 'slender', 'standard', 'slender', 'stocky', 'fluffy', 'stocky', 'fluffy', 'fluffy', 'slender'];
  const TABBY = [true, true, true, false, false, false, false, false, false, false, false, false];

  function draw(canvas, pal, build, tabby) {
    if (!canvas || !pal) return;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const B = Object.assign({}, BUILDS[build] || BUILDS.standard, { tabby: !!tabby });
    const sp = buildSprite(24, 30, () => composeSit(B));
    const palRGB = { O: toRgb(pal.outline), C: toRgb(pal.coat), K: toRgb(pal.mark), W: toRgb(pal.white), X: toRgb(pal.patch), I: toRgb(pal.inner), N: toRgb(pal.nose), E: toRgb(pal.eye), H: toRgb(HALO) };
    const oc = document.createElement('canvas'); oc.width = sp.SW; oc.height = sp.SH;
    const octx = oc.getContext('2d'); octx.imageSmoothingEnabled = false;
    drawCat(octx, sp, palRGB);
    const scale = Math.min((canvas.width - 8) / sp.SW, (canvas.height - 8) / sp.SH);
    const dw = sp.SW * scale, dh = sp.SH * scale;
    ctx.drawImage(oc, 0, 0, sp.SW, sp.SH, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }

  window.PixelcatPreview = { PATTERNS, PATTERN_BUILD, TABBY, BUILDS, draw };
})();
