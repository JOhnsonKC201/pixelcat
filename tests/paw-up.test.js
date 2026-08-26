// Raised-paw pose tests (grooming / pondering / tapping / batting).
//
// These four activities used to draw the lifted limb as axis-aligned rectangles
// over the finished sprite. That ignored the coat's shading, outline halo,
// markings and breathing scale, so it read as a pale domino pasted on the chest.
// The limb is composed into the grid now, and these pin the properties that make
// that worth doing: it exists for every coat, it actually leaves the floor, and
// the face survives having a paw held in front of it.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const grid = (h, expr) => h.run(`${expr}.grid.map((r) => r.join(''))`);

function roleCounts(h, expr) {
  return h.run(`(() => {
    const g = ${expr}.grid, n = {};
    for (const row of g) for (const ch of row) n[ch] = (n[ch] || 0) + 1;
    return n;
  })()`);
}

test('every coat and breed composes a raised-paw pose with a body, eyes and a nose', () => {
  const h = loadOverlay();
  for (const sp of ['cat', 'dog']) {
    h.run(`setSpecies(${JSON.stringify(sp)})`);
    const names = h.run('PATTERNS.map((p) => p.name)');
    for (let i = 0; i < names.length; i++) {
      for (const [lift, out] of [[1, 0], [0.75, 0.1], [0.6, 0.7], [0, 0]]) {
        const label = `${sp}/${names[i]}/lift=${lift}`;
        const n = roleCounts(h, `pawSpriteFor(${i}, ${lift}, ${out})`);
        const body = (n.C || 0) + (n.K || 0) + (n.W || 0) + (n.X || 0) + (n.I || 0);
        assert.ok(body > 200, `${label} drew only ${body} body cells`);
        assert.ok(n.E > 0, `${label} has no eye`);
        assert.ok(n.N > 0, `${label} has no nose`);
      }
    }
  }
});

test('both eye boxes still resolve with a paw held up in front of the face', () => {
  const h = loadOverlay();
  for (const sp of ['cat', 'dog']) {
    h.run(`setSpecies(${JSON.stringify(sp)})`);
    const names = h.run('PATTERNS.map((p) => p.name)');
    for (let i = 0; i < names.length; i++) {
      const eyes = h.run(`pawSpriteFor(${i}, 1, ${h.run('GROOM_OUT')}).eyes`);
      const label = `${sp}/${names[i]}`;
      assert.strictEqual(eyes.length, 2, `${label} lost an eye box`);
      assert.ok(eyes[0].w > 0 && eyes[1].w > 0, `${label} has an empty eye box`);
      assert.ok(eyes[0].cx < eyes[1].cx, `${label} eye boxes are not left-then-right`);
    }
  }
});

// The eye-box test above passed all the way through the bug it was supposed to
// catch. The washing paw never touches an 'E' cell, so "both eye boxes resolve"
// stayed true while the face was unreadable: at out = 0 the forearm ran dead
// vertical up the centre-left of the chest, INSIDE the head's own column span and
// in the same coat role, so it merged into the chin and painted over the white bib
// that gives the face its contrast. These assert the things that actually changed.
test('the washing paw reaches clear of the chest instead of straight up it', () => {
  const h = loadOverlay();
  const out = h.run('GROOM_OUT');
  assert.ok(out > 0.2, `grooming asked for out=${out}; 0 is what put the forearm up the middle of the face`);

  const stat = (o) => h.run(`(() => {
    const g = pawSpriteFor(0, 1, ${o}).grid;
    let bib = 0, leftmostMitt = 99;
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) {
      if (g[r][c] !== 'W') continue;
      if (r >= 12 && r <= 19 && c >= 9 && c <= 15) bib++;
      if (r >= 10 && r <= 16) leftmostMitt = Math.min(leftmostMitt, c);
    }
    return { bib, leftmostMitt };
  })()`);

  const tucked = stat(0);          // the old behaviour
  const reaching = stat(out);      // what grooming asks for now

  assert.ok(reaching.leftmostMitt < tucked.leftmostMitt - 1,
    `the paw should sit further out than a tucked one (out=${out} gave col ${reaching.leftmostMitt}, tucked gave ${tucked.leftmostMitt})`);
  assert.ok(reaching.leftmostMitt <= 7,
    `the paw should clear the head's column span, leftmost mitt cell was ${reaching.leftmostMitt}`);
  assert.ok(reaching.bib > tucked.bib,
    `reaching out should spare the white bib (${reaching.bib} cells vs ${tucked.bib} tucked)`);
});

test('raising the paw actually takes it off the floor', () => {
  // The whole point: the left foreleg leaves the ground. The haunch still rests
  // there either way (the cat is sitting), so the marker is the white MITT - the
  // paw itself - which should vanish from the floor line once the limb is raised.
  const h = loadOverlay();
  const mittOnFloor = (lift) => h.run(`(() => {
    const g = pawSpriteFor(4, ${lift}, 0).grid;
    let n = 0;
    for (let r = 26; r <= 29; r++) for (let c = 8; c <= 12; c++) if (g[r] && g[r][c] === 'W') n++;
    return n;
  })()`);
  const planted = mittOnFloor(0), raised = mittOnFloor(1);
  assert.ok(planted > 0, 'at lift=0 the left paw should still be planted on the floor');
  assert.strictEqual(raised, 0, `raising the paw should lift the mitt clear of the floor (still ${raised} cells)`);
});

test('the pose changes with lift and with reach', () => {
  const h = loadOverlay();
  const flat = (lift, out) => grid(h, `pawSpriteFor(4, ${lift}, ${out})`).join('|');
  assert.notStrictEqual(flat(1, 0), flat(0, 0), 'a raised paw must not look identical to a planted one');
  assert.notStrictEqual(flat(0.6, 0), flat(0.6, 1), 'reaching out must not look identical to tucked in');
  assert.strictEqual(flat(1, 0), flat(1, 0), 'the same frame is stable (memoised)');
});

test('toe beans show only when the paw is up near the face', () => {
  // 'I' is the inner-ear role, reused for the pads so they stay palette-correct on
  // every coat. Low down the paw is edge-on, so they should not be painted.
  const h = loadOverlay();
  const beansBelowHead = (lift) => h.run(`(() => {
    const g = pawSpriteFor(4, ${lift}, 0).grid;
    let n = 0;
    for (let r = 11; r < 30; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === 'I') n++;
    return n;
  })()`);
  assert.ok(beansBelowHead(1) > 0, 'a paw held at the muzzle should show its pads');
  assert.strictEqual(beansBelowHead(0.25), 0, 'a low paw should not show pads');
});

test('the batting reach drives the same swipe the leaf is knocked on', () => {
  // The paw's height and the leaf's knock both read battingReach(), so a change to
  // the cycle can never leave the strike landing at a different time than the hit.
  const h = loadOverlay();
  h.run('playT0 = 0');
  const peak = h.run(`battingReach(${540 / 2})`);
  const start = h.run('battingReach(0)');
  assert.ok(peak > 0.9, `mid-swipe should be near full reach, got ${peak}`);
  assert.ok(start < 0.1, `the swipe should start retracted, got ${start}`);
});
