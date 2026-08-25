// Rope-climb (scroll reaction) tests.
//
// Scrolling makes the pet grab a yarn rope and climb it - UP when you scroll up,
// DOWN when you scroll down. Coats that ship painted art use raster frames; every
// other coat (and every dog) falls back to the procedural climb in its own colours.
//
// The painted frames decode ONCE at startup and there is no reloader, so anything
// that empties the cache silently downgrades the cat to the procedural climb for
// the rest of the session - a regression you only notice by scrolling after a
// species swap. These tests pin both the direction behaviour and the cache lifetime.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

// Drive the real rAF loop by hand. Steps are >48ms so the idle-fps throttle in
// draw() never skips a frame we are counting on.
function advance(h, ms = 600, step = 60) {
  const from = h.run('typeof __t === "undefined" ? 0 : __t');
  let t = from;
  for (const end = from + ms; t < end; t += step) h.run(`draw(${t + step})`);
  h.run(`var __t = ${t}`);
  return t;
}

// Which named frame did the picker return for this coat? (compares the decoded
// Image back to the data URLs in CLIMB_FRAMES)
function pickedFrame(h, { climbing, dir, coat, anim = 0 }) {
  return h.run(`(() => {
    climbAnim = ${anim};
    const img = pickClimbImg(0, ${climbing}, ${dir}, ${JSON.stringify(coat)});
    if (!img) return null;
    const set = CLIMB_FRAMES[${JSON.stringify(coat)}] || {};
    return Object.keys(set).find((k) => set[k] === img.src) || 'unknown';
  })()`);
}

// Force the painted set into the cache, so the picker and the cache-lifetime
// regression below are covered by their own fixture rather than by whatever
// loadClimbFrames() happened to decode. That keeps them meaningful whichever way
// PAINTED_CLIMB is set.
function primePaintedFrames(h, coat = 'tuxedo') {
  h.run(`(() => {
    const set = CLIMB_FRAMES[${JSON.stringify(coat)}] || {};
    climbImgs[${JSON.stringify(coat)}] = {};
    for (const k of Object.keys(set)) climbImgs[${JSON.stringify(coat)}][k] = { src: set[k], complete: true };
  })()`);
}

test('painted climb art is on, and decodes for the coats that ship it', () => {
  const h = loadOverlay();
  assert.strictEqual(h.run('PAINTED_CLIMB'), true, 'the painted climb should be enabled');
  const coats = h.run('Object.keys(climbImgs).sort()');
  assert.ok(coats.includes('tuxedo'), 'tuxedo is the default coat and must have painted art');
  assert.ok(coats.length >= 2, `expected several painted coats, got ${JSON.stringify(coats)}`);
  assert.ok(!coats.includes('gray'),
    "'gray' art is a mismatched repaint - it must stay on the procedural climb");
  assert.strictEqual(h.run('coatHasFrames("tuxedo")'), true);
  // Coverage is partial on purpose: only 3 coats are painted, the rest fall back.
  assert.strictEqual(h.run('coatHasFrames("siamese")'), false, 'a coat with no art has no painted set');
});

test('scrolling starts the climb and the heading follows the wheel direction', () => {
  const h = loadOverlay();
  assert.ok(h.run('paperLen') <= 1, 'no rope before any scrolling');

  h.ipc('onScroll', -1);              // wheel up
  advance(h, 300);
  assert.ok(h.run('paperLen') > 1, 'scrolling builds climb energy (the rope appears)');
  assert.ok(h.run('climbDir') < -0.5, 'scrolling up heads up the rope');

  for (let i = 0; i < 6; i++) h.ipc('onScroll', 1);   // wheel down
  advance(h, 300);
  assert.ok(h.run('climbDir') > 0.5, 'scrolling down turns the climb around');

  // ...and it lets go on its own once you stop scrolling.
  advance(h, 3000);
  assert.ok(h.run('paperLen') <= 1, 'climb energy bleeds off after the scrolling stops');
});

test('the painted frame picker maps heading to the right frame', () => {
  const h = loadOverlay();
  primePaintedFrames(h);
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: -1, coat: 'tuxedo', anim: 0 }), 'up1');
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: -1, coat: 'tuxedo', anim: 1 }), 'up2');
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: 1, coat: 'tuxedo', anim: 0 }), 'down1');
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: 1, coat: 'tuxedo', anim: 1 }), 'down2');
  // hanging (not actively scrolling) rests on the idle pose regardless of heading
  assert.strictEqual(pickedFrame(h, { climbing: false, dir: -1, coat: 'tuxedo' }), 'idle');
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: 0.1, coat: 'tuxedo' }), 'idle');
});

test('a species round-trip does not clear the painted cache (regression)', () => {
  // The frames decode ONCE at startup with no reloader, so anything that empties
  // climbImgs silently downgrades the cat to the procedural climb for the rest of
  // the session, and you only notice by scrolling after a species swap. Primed by
  // hand so this keeps guarding setSpecies() regardless of how PAINTED_CLIMB is set.
  const h = loadOverlay();
  primePaintedFrames(h);
  assert.strictEqual(h.run('coatHasFrames("tuxedo")'), true, 'primed cache should read as painted');

  h.run('setSpecies("dog")');
  h.run('setSpecies("cat")');

  assert.strictEqual(
    h.run('coatHasFrames("tuxedo")'), true,
    'the cat lost its painted rope-climb after a dog round-trip. The frames decode once ' +
    'at startup with no reloader, so setSpecies() must not clear climbImgs.',
  );
  assert.strictEqual(pickedFrame(h, { climbing: true, dir: -1, coat: 'tuxedo', anim: 0 }), 'up1');
});

// ---- the posed climb (every coat, both species) -----------------------------
// Coats without painted art climb with a role-coded POSE instead of the seated
// sprite, so these guard the pose itself: that it composes for every coat, that
// it actually differs frame to frame, and that its paws land on the rope.

// Cell counts by role, for asserting a pose drew a real body rather than a smear.
function roleCounts(h, expr) {
  return h.run(`(() => {
    const g = ${expr}.grid, n = {};
    for (const row of g) for (const ch of row) n[ch] = (n[ch] || 0) + 1;
    return n;
  })()`);
}

test('every cat coat and dog breed composes a climb pose with a body, two eyes and a nose', () => {
  const h = loadOverlay();
  for (const sp of ['cat', 'dog']) {
    h.run(`setSpecies(${JSON.stringify(sp)})`);
    const names = h.run('PATTERNS.map((p) => p.name)');
    for (let i = 0; i < names.length; i++) {
      for (const dir of [-1, 0, 1]) {
        const expr = `climbSpriteFor(${i}, 0, ${dir})`;
        const n = roleCounts(h, expr);
        const label = `${sp}/${names[i]}/dir=${dir}`;
        const body = (n.C || 0) + (n.K || 0) + (n.W || 0) + (n.X || 0) + (n.I || 0);
        assert.ok(body > 150, `${label} drew only ${body} body cells`);
        assert.ok(n.E > 0, `${label} has no eye`);
        assert.ok(n.N > 0, `${label} has no nose`);
        assert.ok(n.O > 0, `${label} has no outline`);
      }
    }
  }
});

test('both climb eye boxes resolve, so neither pupil smears across the face', () => {
  // eyeBox() splits the grid at column 12 to separate the eyes. A face composed
  // off-centre puts one eye in BOTH halves: its box swells to span most of the
  // head and drawCat paints the pupil as a bar across the muzzle. Caught in the
  // wild on both species, so it is pinned for every coat here.
  const h = loadOverlay();
  for (const sp of ['cat', 'dog']) {
    h.run(`setSpecies(${JSON.stringify(sp)})`);
    const names = h.run('PATTERNS.map((p) => p.name)');
    for (let i = 0; i < names.length; i++) {
      const eyes = h.run(`climbSpriteFor(${i}, 0, -1).eyes`);
      const label = `${sp}/${names[i]}`;
      assert.strictEqual(eyes.length, 2, `${label} lost an eye box`);
      for (const [side, e] of [['left', eyes[0]], ['right', eyes[1]]]) {
        assert.ok(e.w > 0, `${label} has an empty ${side} eye box`);
        assert.ok(e.w <= 24, `${label} ${side} eye box is ${e.w}px wide - it has swallowed the other eye`);
      }
      assert.ok(eyes[0].cx < eyes[1].cx, `${label} eye boxes are not left-then-right`);
    }
  }
});

test('the climb pose changes with the paw swap and with the heading', () => {
  const h = loadOverlay();
  const flat = (hand, dir) => h.run(`climbSpriteFor(4, ${hand}, ${dir}).grid.map((r) => r.join('')).join('|')`);
  assert.notStrictEqual(flat(0, -1), flat(1, -1), 'hand-over-hand: swapping the high paw must change the frame');
  assert.notStrictEqual(flat(0, -1), flat(0, 1), 'hauling up must not look identical to sliding down');
  assert.strictEqual(flat(0, -1), flat(0, -1), 'the same frame is stable (memoised, not rebuilt differently)');
});

test('the climb pose grips the rope column the renderer draws', () => {
  // The pose bakes its mitts at CLIMB_ROPE_C and ropeGeom() puts the real strand at
  // the matching world x. If either drifts, the pet grabs thin air next to the rope.
  const h = loadOverlay();
  const ropeCol = h.run('CLIMB_ROPE_C');
  const mitt = h.run(`(() => {
    const g = climbSpriteFor(4, 0, -1).grid;
    let minC = 99, maxC = -1;
    for (let r = 0; r < 6; r++) for (let c = 0; c < g[r].length; c++) {
      if (g[r][c] === 'W') { minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
    }
    return { minC, maxC };
  })()`);
  assert.ok(mitt.maxC >= 0, 'the top of the pose has no white mitt closed on the rope');
  assert.ok(mitt.minC <= ropeCol && ropeCol <= mitt.maxC + 1,
    `rope column ${ropeCol} is outside the gripping mitt (cols ${mitt.minC}-${mitt.maxC})`);

  // ropeGeom places the strand relative to the sprite centre using the same constant
  const ropeX = h.run('ropeGeom({ x: 500, y: 400 }, 0, 0).ropeX');
  assert.strictEqual(ropeX, Math.round(500 + (ropeCol - 12) * h.run('CELL')));
});

test('a dog never borrows the painted cat art', () => {
  const h = loadOverlay();
  h.run('setSpecies("dog")');
  assert.strictEqual(h.run('isDog()'), true);
  // Gated by species, not by name: even a coat slug that collides with painted cat
  // art (an imported custom coat could) must fall back to the procedural climb.
  assert.strictEqual(h.run('coatHasFrames("tuxedo")'), false);
  assert.strictEqual(h.run('coatHasFrames("golden-retriever")'), false);
});
