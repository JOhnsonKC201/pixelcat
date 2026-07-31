// Baked pose frames: the PNG -> role grid importer, and the renderer hook that
// lets an imported frame win over the composer.
//
// The load-bearing test is the round trip. A composed pose is painted out to a PNG
// with one flat placeholder colour per role, read back through the importer, and
// compared cell for cell against the grid it came from. That exercises the whole
// chain (PNG decode, area majority vote, colour snap) against real sprite shapes
// rather than a hand written fixture, and it fails loudly if any step drifts.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');

const imp = require('../scripts/import-frames.js');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const ROLE_RGB = Object.fromEntries(imp.PALETTE);

// --- a minimal PNG encoder, so the fixtures are real files ------------------
function crc(b) { let c = ~0; for (let i = 0; i < b.length; i++) { c ^= b[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(t, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length, 0);
  const b = Buffer.concat([Buffer.from(t), d]);
  const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(b), 0);
  return Buffer.concat([l, b, cc]);
}
function encodePng(rgba, w, h) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const stride = w * 4, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) for (let x = 0; x < stride; x++) raw[y * (stride + 1) + 1 + x] = rgba[y * stride + x];
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Paint a role grid at `scale` px per cell, flat, transparent where empty. The
// halo is deliberately not painted: outlineHalo() regrows it on import.
function paintGrid(rows, scale) {
  const COLS = rows[0].length, ROWS = rows.length, W = COLS * scale, H = ROWS * scale;
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = rows[r][c];
    const rgb = ROLE_RGB[ch];
    if (!rgb) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
      const o = ((r * scale + dy) * W + c * scale + dx) * 4;
      rgba[o] = rgb[0]; rgba[o + 1] = rgb[1]; rgba[o + 2] = rgb[2]; rgba[o + 3] = 255;
    }
  }
  return encodePng(rgba, W, H);
}

// A composed pose straight out of the overlay, as rows of role letters with the
// halo dropped (that is what a painted frame would contain).
// Array.from re-wraps as a HOST array: values crossing back from the vm carry the
// context's prototypes, so deepStrictEqual fails its prototype check even when the
// contents match exactly.
function composedRows(h, expr) {
  const sp = h.run(`(() => { const s = ${expr}; return { rows: s.grid.map((r) => r.join('')), COLS: s.COLS, ROWS: s.ROWS }; })()`);
  return { rows: Array.from(sp.rows, (r) => r.replace(/H/g, '.')), COLS: sp.COLS, ROWS: sp.ROWS };
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pixelpets-frames-'));
}

test('a painted pose round trips back to the grid it came from', () => {
  const h = loadOverlay();
  const cases = [['cat', 'sit', 'sprites[0]'], ['cat', 'loaf', 'loafSprites[0]'], ['dog', 'sit', 'sprites[0]']];
  for (const [species, pose, expr] of cases) {
    h.run(`setSpecies(${JSON.stringify(species)})`);
    const want = composedRows(h, expr);
    const dir = tmpdir();
    try {
      fs.writeFileSync(path.join(dir, `${species}-${pose}.png`), paintGrid(want.rows, 11));
      const { data, ok, skipped } = imp.importDir(dir, {});
      assert.strictEqual(skipped, 0, `${species}/${pose} was skipped`);
      assert.strictEqual(ok, 1);
      const got = data[species][pose]['*'];
      assert.strictEqual(got.COLS, want.COLS);
      assert.strictEqual(got.ROWS, want.ROWS);
      assert.deepStrictEqual(got.rows, want.rows, `${species}/${pose} did not survive the round trip`);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('a non integer scale still round trips, because generated art never lands on the grid', () => {
  const h = loadOverlay();
  const want = composedRows(h, 'sprites[0]');
  const dir = tmpdir();
  try {
    // 24x30 cells painted at 11px, then the canvas is what a generator would hand
    // back: the same picture at an awkward size. The area vote has to cope.
    const png = paintGrid(want.rows, 17);
    fs.writeFileSync(path.join(dir, 'cat-sit.png'), png);
    const { data } = imp.importDir(dir, {});
    assert.deepStrictEqual(data.cat.sit['*'].rows, want.rows);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('the importer decodes indexed and greyscale PNGs, not just RGBA', () => {
  // 2x2 indexed, 4 bit depth, with a transparent entry.
  const plte = Buffer.from([0xD9, 0xC7, 0xA7, 0x33, 0x30, 0x2E]);
  const trns = Buffer.from([255, 0]);
  const raw = Buffer.from([0, 0x01, 0, 0x10]);          // filter byte + one packed byte per row
  const ih = Buffer.alloc(13); ih.writeUInt32BE(2, 0); ih.writeUInt32BE(2, 4); ih[8] = 4; ih[9] = 3;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ih), chunk('PLTE', plte), chunk('tRNS', trns),
    chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  const img = imp.decodePng(png);
  assert.strictEqual(img.w, 2);
  assert.deepStrictEqual([...img.rgba.slice(0, 4)], [0xD9, 0xC7, 0xA7, 255]);
  assert.strictEqual(img.rgba[7], 0, 'palette index 1 is transparent via tRNS');
});

test('every PNG filter type decodes', () => {
  // Sub / Up / Average / Paeth all have to unfilter correctly or the art arrives
  // sheared. Encode a gradient with a mixed filter per row and check it survives.
  const w = 4, h = 5, stride = w * 4;
  const flat = Buffer.alloc(h * stride);
  for (let i = 0; i < flat.length; i += 4) { flat[i] = i & 255; flat[i + 1] = (i * 3) & 255; flat[i + 2] = (i * 7) & 255; flat[i + 3] = 255; }
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = y;                            // filter types 0..4, one per row
    const cur = flat.subarray(y * stride, (y + 1) * stride);
    const prev = y ? flat.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? cur[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pae = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      const sub = [0, a, b, (a + b) >> 1, pae][y];
      raw[y * (stride + 1) + 1 + x] = (cur[x] - sub) & 255;
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  assert.deepStrictEqual([...imp.decodePng(png).rgba], [...flat]);
});

test('a face drawn off the eyeBox seam is rejected, not shipped', () => {
  // eyeBox() splits at COLS/2. Both eyes on one side means one eye lands in both
  // boxes and drawCat paints the pupil as a bar across the muzzle.
  const spec = imp.poseSpec('sit', 'cat');
  const rows = Array.from({ length: spec.ROWS }, () => '.'.repeat(spec.COLS));
  const put = (r, c, ch) => { rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1); };
  for (let r = 4; r < spec.ROWS; r++) for (let c = 4; c < 20; c++) put(r, c, 'C');
  put(8, 5, 'E'); put(8, 8, 'E');            // both eyes left of the seam
  put(11, 6, 'N');
  const problems = imp.check(rows, spec);
  assert.ok(problems.some((p) => p[0] === 'fail' && /either side of column/.test(p[1])),
    `expected an eye-seam failure, got ${JSON.stringify(problems)}`);
});

test('a frame with no nose is rejected', () => {
  const spec = imp.poseSpec('sit', 'cat');
  const rows = Array.from({ length: spec.ROWS }, () => '.'.repeat(spec.COLS));
  const put = (r, c, ch) => { rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1); };
  for (let r = 4; r < spec.ROWS; r++) for (let c = 4; c < 20; c++) put(r, c, 'C');
  put(8, 8, 'E'); put(8, 15, 'E');
  const problems = imp.check(rows, spec);
  assert.ok(problems.some((p) => p[0] === 'fail' && /nose/.test(p[1])));
});

test('the dog play bow is checked as a profile pose, one eye only', () => {
  assert.strictEqual(imp.poseSpec('hunt', 'dog').eyes, 1);
  assert.strictEqual(imp.poseSpec('hunt', 'cat').eyes, 2);
  assert.strictEqual(imp.poseSpec('hunt', 'dog').ROWS, 22);
  assert.strictEqual(imp.poseSpec('hunt', 'cat').ROWS, 20);
});

test('only the held poses are importable, the animation rigs are refused', () => {
  for (const pose of ['climb', 'groom', 'ponder', 'play', 'bat']) {
    assert.strictEqual(imp.poseSpec(pose, 'cat'), null, `${pose} must not be bakeable`);
  }
  for (const pose of ['sit', 'type', 'loaf', 'rear', 'hunt']) {
    assert.ok(imp.poseSpec(pose, 'cat'), `${pose} must be bakeable`);
  }
});

test('file names map to a species, a pose and a coat key', () => {
  assert.deepStrictEqual(imp.parseName('cat-sit.png'), { species: 'cat', pose: 'sit', key: '*' });
  assert.deepStrictEqual(imp.parseName('cat-sit--Orange Tabby.png'), { species: 'cat', pose: 'sit', key: 'Orange Tabby' });
  assert.deepStrictEqual(imp.parseName('dog-hunt--retriever.png'), { species: 'dog', pose: 'hunt', key: 'retriever' });
  assert.strictEqual(imp.parseName('sit.png'), null);
  assert.strictEqual(imp.parseName('rabbit-sit.png'), null);
});

test('the emitted module parses and round trips through the lookup shape', () => {
  const src = imp.emit({ cat: { sit: { '*': { COLS: 2, ROWS: 2, rows: ['CC', 'WW'] } } }, dog: {} });
  const mod = { exports: {} };
  new Function('module', src)(mod);
  assert.deepStrictEqual(mod.exports.ART_FRAMES.cat.sit['*'].rows, ['CC', 'WW']);
  assert.deepStrictEqual(mod.exports.ART_FRAMES.dog, {});
});

test('a baked frame beats the composer, and an unbaked coat still composes', () => {
  const h = loadOverlay();
  const before = h.run('sprites[0].grid.map((r) => r.join(""))');
  const spec = imp.poseSpec('sit', 'cat');

  // A deliberately unmistakable body: a solid block with a face on the seam.
  const rows = Array.from({ length: spec.ROWS }, () => '.'.repeat(spec.COLS));
  const put = (r, c, ch) => { rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1); };
  for (let r = 6; r < spec.ROWS; r++) for (let c = 6; c < 18; c++) put(r, c, 'C');
  put(9, 9, 'E'); put(9, 14, 'E'); put(12, 11, 'N');

  h.run(`ART_FRAMES.cat.sit = { 'Orange Tabby': { COLS: ${spec.COLS}, ROWS: ${spec.ROWS}, rows: ${JSON.stringify(rows)} } }`);
  h.run("setSpecies('dog'); setSpecies('cat')");        // forces both tables to rebuild

  const baked = h.run('sprites[0].grid.map((r) => r.join(""))');
  const other = h.run('sprites[1].grid.map((r) => r.join(""))');
  assert.notDeepStrictEqual(baked, before, 'the baked frame did not replace the composed one');
  // Every body cell we painted survives; the halo is regrown around it.
  for (let r = 0; r < spec.ROWS; r++) for (let c = 0; c < spec.COLS; c++) {
    if (rows[r][c] !== '.') assert.strictEqual(baked[r][c], rows[r][c], `cell ${c},${r} was not preserved`);
  }
  assert.ok(baked.join('').includes('H'), 'outlineHalo() should still have grown a halo');
  assert.ok(baked.join('').includes('O'), 'outlineHalo() should still have drawn the outline');
  assert.ok(other.join('') !== baked.join(''), 'a coat with no baked frame must keep composing');

  // eyeBox still finds two eyes, which is what drawCat needs to place the pupils.
  const eyes = h.run('sprites[0].eyes.map((e) => e.w)');
  assert.ok(eyes[0] > 0 && eyes[1] > 0, 'both eye boxes must survive a baked frame');
});

test('a baked grid on the wrong canvas is ignored rather than trusted', () => {
  const h = loadOverlay();
  const before = h.run('sprites[0].grid.map((r) => r.join(""))');
  h.run("ART_FRAMES.cat.sit = { '*': { COLS: 8, ROWS: 8, rows: ['CCCCCCCC','CCCCCCCC','CCCCCCCC','CCCCCCCC','CCCCCCCC','CCCCCCCC','CCCCCCCC','CCCCCCCC'] } }");
  h.run("setSpecies('dog'); setSpecies('cat')");
  assert.deepStrictEqual(h.run('sprites[0].grid.map((r) => r.join(""))'), before);
});
