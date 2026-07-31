// Turns painted PNGs into baked pose grids for src/art-frames.js.
//
//   node scripts/import-frames.js <dir> [--out src/art-frames.js] [--dry] [--force]
//
// Input files are named   <species>-<pose>.png            -> applies to every coat
//                  or     <species>-<pose>--<key>.png     -> applies to one coat or build
// e.g. cat-sit.png, cat-sit--Orange Tabby.png, dog-hunt--retriever.png
//
// The pet is drawn from a grid of ROLE letters, not colours, which is the whole
// reason one pose covers 28 coats. So importing is a colour-to-role problem: snap
// every source pixel to the nearest palette placeholder, take a majority vote per
// cell, and write the letters out. Majority vote rather than point sampling on
// purpose, because generated art never lands exactly on the cell grid and a single
// sampled pixel turns one stray edge pixel into a whole wrong cell.
//
// Nothing here trusts its input. Every frame is checked against what the renderer
// needs (canvas size, two eye clusters either side of the seam eyeBox() splits on,
// a nose to anchor the whiskers, a floor row to stand on) and a frame that fails is
// reported and dropped instead of quietly shipping a broken pose.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');

// The placeholder palette every prompt in the frame pack generates against. These
// are never seen: the engine swaps in the real coat. They are chosen to sit far
// apart in RGB so a nearest-colour match cannot confuse two roles.
const PALETTE = [
  ['C', [0xD9, 0xC7, 0xA7]],   // coat
  ['K', [0x33, 0x30, 0x2E]],   // markings
  ['W', [0xFB, 0xFB, 0xF7]],   // bib, muzzle, toes
  ['X', [0xD2, 0x76, 0x2B]],   // tortie / calico patch, brows
  ['I', [0xEF, 0xA9, 0xB8]],   // inner ear
  ['N', [0xB0, 0x4A, 0x57]],   // nose pad
  ['E', [0x4F, 0xBF, 0x7A]],   // flat eye block
  ['O', [0x5C, 0x53, 0x4A]],   // outline
];

// Only the held poses. The raised-limb activities are parameterised rigs, so a
// still frame would freeze them (see the comment in src/art-frames.js).
const POSES = {
  sit: { COLS: 24, ROWS: 30, floor: true, eyes: 2 },
  type: { COLS: 24, ROWS: 24, floor: true, eyes: 2 },
  loaf: { COLS: 24, ROWS: 30, floor: true, eyes: 2 },
  rear: { COLS: 24, ROWS: 30, floor: true, eyes: 2 },
  // The crouch and the play bow are the exception: both are drawn clear of the
  // bottom of their own canvas and the renderer places them by their own height,
  // so a floor check there would fire on perfectly good art.
  hunt: { cat: { COLS: 30, ROWS: 20 }, dog: { COLS: 30, ROWS: 22 }, floor: false, eyes: { cat: 2, dog: 1 } },
};

const ALPHA_MIN = 128;       // below this a source pixel counts as empty
const SNAP_WARN = 70;        // euclidean RGB distance that means "this was not a palette colour"

function poseSpec(pose, species) {
  const p = POSES[pose];
  if (!p) return null;
  const dims = p[species] || p;
  const eyes = typeof p.eyes === 'object' ? p.eyes[species] : p.eyes;
  return { COLS: dims.COLS, ROWS: dims.ROWS, floor: p.floor, eyes };
}

// ---------------------------------------------------------------- PNG decoding
// A small decoder rather than a dependency: this repo ships no image libraries on
// purpose (scripts/pet-sheet.js hand-rolls the encoder for the same reason), and
// every byte of it is exercised by tests/art-frames.test.js.
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
}

function decodePng(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('not a PNG');
  let p = 8, ihdr = null, plte = null, trns = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      ihdr = { w: data.readUInt32BE(0), h: data.readUInt32BE(4), depth: data[8], color: data[9], interlace: data[12] };
    } else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (!ihdr) throw new Error('no IHDR');
  if (ihdr.interlace) throw new Error('interlaced PNGs are not supported, re-save without Adam7 interlacing');
  const { w, h, depth, color } = ihdr;
  const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const ch = CHANNELS[color];
  if (!ch) throw new Error(`unsupported PNG colour type ${color}`);
  if (color !== 3 && depth !== 8 && depth !== 16) throw new Error(`unsupported bit depth ${depth}`);
  if (color === 3 && ![1, 2, 4, 8].includes(depth)) throw new Error(`unsupported indexed bit depth ${depth}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = Math.max(1, Math.ceil(ch * depth / 8));
  const stride = Math.ceil(w * ch * depth / 8);
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev ? prev[x] : 0, c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      const v = src[x];
      cur[x] = (ft === 0 ? v : ft === 1 ? v + a : ft === 2 ? v + b : ft === 3 ? v + ((a + b) >> 1) : v + paeth(a, b, c)) & 255;
    }
  }

  // Normalise everything to RGBA8 so the caller only ever sees one layout.
  const rgba = new Uint8ClampedArray(w * h * 4);
  const sample = (row, x, i) => {          // channel i of pixel x, as 8 bits
    if (depth === 16) return out[row * stride + (x * ch + i) * 2];
    if (depth === 8) return out[row * stride + x * ch + i];
    const bit = x * depth, byte = out[row * stride + (bit >> 3)];
    return (byte >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    if (color === 3) {
      const idx = sample(y, x, 0);
      rgba[o] = plte[idx * 3]; rgba[o + 1] = plte[idx * 3 + 1]; rgba[o + 2] = plte[idx * 3 + 2];
      rgba[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
    } else if (color === 0 || color === 4) {
      const g = sample(y, x, 0);
      rgba[o] = rgba[o + 1] = rgba[o + 2] = g;
      rgba[o + 3] = color === 4 ? sample(y, x, 1) : 255;
    } else {
      rgba[o] = sample(y, x, 0); rgba[o + 1] = sample(y, x, 1); rgba[o + 2] = sample(y, x, 2);
      rgba[o + 3] = color === 6 ? sample(y, x, 3) : 255;
    }
  }
  return { w, h, rgba };
}

// ---------------------------------------------------------------- colour to role
function snap(r, g, b) {
  let best = null, bestD = Infinity;
  for (const [role, c] of PALETTE) {
    const d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2;
    if (d < bestD) { bestD = d; best = role; }
  }
  return { role: best, dist: Math.sqrt(bestD) };
}

// Area majority vote: every source pixel inside a cell snaps to a role, and the
// role with the most pixels wins. Ties break toward the rarer role so a one pixel
// eye or nose is not swallowed by the coat around it.
const TIE_RANK = { N: 0, E: 1, I: 2, X: 3, W: 4, K: 5, O: 6, C: 7 };

function toGrid(img, COLS, ROWS) {
  const rows = [];
  let far = 0, total = 0;
  for (let r = 0; r < ROWS; r++) {
    let line = '';
    for (let c = 0; c < COLS; c++) {
      const x0 = Math.floor(c * img.w / COLS), x1 = Math.max(x0 + 1, Math.floor((c + 1) * img.w / COLS));
      const y0 = Math.floor(r * img.h / ROWS), y1 = Math.max(y0 + 1, Math.floor((r + 1) * img.h / ROWS));
      const tally = {};
      let solid = 0, cells = 0;
      for (let y = y0; y < y1 && y < img.h; y++) for (let x = x0; x < x1 && x < img.w; x++) {
        cells++;
        const o = (y * img.w + x) * 4;
        if (img.rgba[o + 3] < ALPHA_MIN) continue;
        solid++;
        const s = snap(img.rgba[o], img.rgba[o + 1], img.rgba[o + 2]);
        total++; if (s.dist > SNAP_WARN) far++;
        tally[s.role] = (tally[s.role] || 0) + 1;
      }
      if (!cells || solid * 2 < cells) { line += '.'; continue; }
      let win = '.', wn = 0;
      for (const [role, n] of Object.entries(tally)) {
        if (n > wn || (n === wn && TIE_RANK[role] < TIE_RANK[win])) { win = role; wn = n; }
      }
      line += win;
    }
    rows.push(line);
  }
  return { rows, snapQuality: total ? 1 - far / total : 1 };
}

// ---------------------------------------------------------------- checks
// eyeBox() in cat-sprite.js splits the grid at COLS/2 to tell the two eyes apart.
// A face drawn off centre puts one eye in BOTH boxes, the box swells to span the
// head, and drawCat paints the pupil as a bar across the muzzle. It has bitten this
// project twice, so it is the first thing checked.
function check(rows, spec) {
  const problems = [];
  const COLS = spec.COLS, ROWS = spec.ROWS;
  const at = (r, c) => rows[r][c];
  let filled = 0, eyeL = 0, eyeR = 0, nose = 0, floor = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const ch = at(r, c);
    if (ch === '.') continue;
    filled++;
    if (ch === 'E') { if (c < COLS / 2) eyeL++; else eyeR++; }
    if (ch === 'N') nose++;
    // Bottom TWO rows: the dog's curl rests its lowest paw one row up and still
    // stands on the same line, so a strict last-row test would flag it.
    if (r >= ROWS - 2) floor++;
  }
  if (filled < COLS * ROWS * 0.08) problems.push(['fail', `only ${filled} filled cells, the sprite is nearly empty`]);
  const eyes = (eyeL ? 1 : 0) + (eyeR ? 1 : 0);
  if (spec.eyes === 2 && eyes < 2) {
    problems.push(['fail', `needs an eye block either side of column ${COLS / 2}, found ${eyeL} left and ${eyeR} right`]);
  }
  if (spec.eyes === 1 && eyes !== 1) {
    problems.push(['fail', `profile pose needs exactly one eye block, found ${eyeL} left and ${eyeR} right`]);
  }
  if (!nose) problems.push(['fail', 'no nose cells, the whiskers and tongue have nothing to anchor to']);
  if (spec.floor && !floor) problems.push(['warn', 'nothing in the bottom two rows, this pose will float above the floor line']);
  if (nose > COLS) problems.push(['warn', `${nose} nose cells looks like a painted muzzle rather than a nose pad`]);
  return problems;
}

// ---------------------------------------------------------------- emit
const HEADER = `// Baked pose frames. GENERATED by scripts/import-frames.js from painted PNGs;
// safe to regenerate at any time, and safe to leave empty (this is the default).
//
// Everything the pet does is composed procedurally from grid primitives, which is
// what makes one pose cover 28 coats. This file is the escape hatch: drop a hand
// drawn or generated frame in here and it wins over the composer for that pose,
// for the coats you name, and nothing else changes.
//
// Shape:
//   ART_FRAMES[species][pose][key] = { COLS, ROWS, rows: ['..CC..', ...] }
//
// \`key\` is looked up in this order, so you can be as specific as you like:
//   1. a coat name exactly as it appears in PATTERNS  ('Orange Tabby')
//   2. a build name from PATTERN_BUILD                ('slender', 'retriever')
//   3. '*'                                            every coat of that species
// Anything with no match falls back to the composer, so a half finished pack still
// runs. \`rows\` holds one ROLE letter per cell (C K W X I N E O, '.' for empty), not
// colours: the palette is applied per coat at draw time.
//
// Do NOT bake the halo ('H'). buildSprite runs outlineHalo() over whatever lands
// here, which fills any gap in the outline and grows the halo, exactly as it does
// for a composed pose.
//
// Only the five HELD poses are read: sit, type, loaf, rear, hunt. The other six
// activities (both rope climbs, groom, ponder, play, bat) are animation rigs whose
// limbs move with a quantised parameter, so a single still would freeze them. See
// docs/frame-pack.md.`;

function emit(data) {
  const q = (s) => `'${s.replace(/'/g, "\\'")}'`;
  const species = ['cat', 'dog'].map((sp) => {
    const poses = Object.keys(data[sp] || {}).sort();
    if (!poses.length) return `  ${sp}: {},`;
    const body = poses.map((pose) => {
      const keys = Object.keys(data[sp][pose]).sort();
      const entries = keys.map((k) => {
        const g = data[sp][pose][k];
        const rows = g.rows.map((r) => `        ${q(r)},`).join('\n');
        return `      ${q(k)}: { COLS: ${g.COLS}, ROWS: ${g.ROWS}, rows: [\n${rows}\n      ] },`;
      }).join('\n');
      return `    ${pose}: {\n${entries}\n    },`;
    }).join('\n');
    return `  ${sp}: {\n${body}\n  },`;
  }).join('\n');
  return `${HEADER}\nconst ART_FRAMES = {\n${species}\n};\n\nif (typeof module !== 'undefined' && module.exports) module.exports = { ART_FRAMES };\nelse if (typeof window !== 'undefined') window.ART_FRAMES = ART_FRAMES;\n`;
}

// ---------------------------------------------------------------- driver
function parseName(file) {
  const m = /^(cat|dog)-([a-z]+)(?:--(.+))?\.png$/i.exec(file);
  if (!m) return null;
  return { species: m[1].toLowerCase(), pose: m[2].toLowerCase(), key: m[3] || '*' };
}

function importDir(dir, opts) {
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png')).sort();
  const data = { cat: {}, dog: {} };
  const report = [];
  let ok = 0, skipped = 0;

  for (const file of files) {
    const id = parseName(file);
    if (!id) { report.push(['skip', file, `name must be <species>-<pose>.png or <species>-<pose>--<key>.png`]); skipped++; continue; }
    const spec = poseSpec(id.pose, id.species);
    if (!spec) {
      report.push(['skip', file, `"${id.pose}" is not a bakeable pose (${Object.keys(POSES).join(', ')})`]);
      skipped++; continue;
    }
    let img;
    try {
      img = decodePng(fs.readFileSync(path.join(dir, file)));
    } catch (e) {
      report.push(['fail', file, e.message]); skipped++; continue;
    }
    const { rows, snapQuality } = toGrid(img, spec.COLS, spec.ROWS);
    const problems = check(rows, spec);
    if (snapQuality < 0.9) {
      problems.push(['warn', `${Math.round((1 - snapQuality) * 100)} percent of pixels were not a palette colour, so this was anti aliased or shaded`]);
    }
    const fatal = problems.filter((p) => p[0] === 'fail');
    if (fatal.length && !opts.force) {
      report.push(['fail', file, fatal.map((p) => p[1]).join('; ')]); skipped++; continue;
    }
    (data[id.species][id.pose] = data[id.species][id.pose] || {})[id.key] =
      { COLS: spec.COLS, ROWS: spec.ROWS, rows };
    const warns = problems.filter((p) => p[0] === 'warn').map((p) => p[1]);
    report.push([warns.length ? 'warn' : 'ok', file,
      `${spec.COLS}x${spec.ROWS} -> ${id.species}.${id.pose}[${id.key}]${warns.length ? '  ' + warns.join('; ') : ''}`]);
    ok++;
  }
  return { data, report, ok, skipped };
}

function main() {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--'));
  const opts = {
    out: (args.find((a) => a.startsWith('--out=')) || '').slice(6) || path.join(ROOT, 'src', 'art-frames.js'),
    dry: args.includes('--dry'),
    force: args.includes('--force'),
  };
  if (!dir) {
    console.error('usage: node scripts/import-frames.js <dir-of-pngs> [--out=path] [--dry] [--force]');
    process.exit(1);
  }
  if (!fs.existsSync(dir)) { console.error(`no such directory: ${dir}`); process.exit(1); }

  const { data, report, ok, skipped } = importDir(dir, opts);
  const mark = { ok: '  ok  ', warn: ' warn ', fail: ' FAIL ', skip: ' skip ' };
  for (const [level, file, msg] of report) console.log(`${mark[level]}${file.padEnd(30)} ${msg}`);
  console.log(`\n${ok} frame${ok === 1 ? '' : 's'} imported, ${skipped} skipped`);
  if (!ok) { console.log('nothing to write'); return; }
  if (opts.dry) { console.log('--dry: not writing'); return; }
  fs.writeFileSync(opts.out, emit(data));
  console.log(`wrote ${path.relative(ROOT, opts.out)}`);
  console.log('next: npm test, then npm run poses:cat / npm run poses:dog and look at the sheets');
}

if (require.main === module) main();

module.exports = { decodePng, snap, toGrid, check, emit, poseSpec, parseName, importDir, PALETTE, POSES };
