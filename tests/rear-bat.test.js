// Rear-up butterfly bat tests.
//
// The reared body filled a 24x30 grid to its top row, so a paw thrown ABOVE the
// head had nowhere to live - which is why these arms were drawn in screen space,
// and why at rest they showed up as a detached white square on the chest with a
// 4px stub of forearm. The pose owns a taller grid now. These pin the properties
// that make it work: the strike clears the skull, the arm stays off the face, and
// the whole thing composes for every coat and both species.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

// Topmost row carrying any body cell, and the topmost row carrying a paw mitt.
function extents(h, expr) {
  return h.run(`(() => {
    const g = ${expr}.grid;
    let topBody = 99, topMitt = 99, headTop = 99;
    for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) {
      const ch = g[r][c];
      if (ch === '.' || ch === 'O' || ch === 'H') continue;
      if (r < topBody) topBody = r;
      if ((ch === 'W' || ch === 'I') && r < topMitt) topMitt = r;
      if ((ch === 'K' || ch === 'C') && r < headTop) headTop = r;
    }
    return { topBody, topMitt, headTop };
  })()`);
}

test('every coat and breed composes a bat pose with a body and two eyes', () => {
  const h = loadOverlay();
  for (const sp of ['cat', 'dog']) {
    h.run(`setSpecies(${JSON.stringify(sp)})`);
    const names = h.run('PATTERNS.map((p) => p.name)');
    for (let i = 0; i < names.length; i++) {
      for (const up of [-1, 1]) {
        const label = `${sp}/${names[i]}/up=${up}`;
        const eyes = h.run(`batSpriteFor(${i}, ${up}, 1).eyes`);
        assert.ok(eyes[0].w > 0 && eyes[1].w > 0, `${label} has an empty eye box - an arm is covering an eye`);
        assert.ok(eyes[0].cx < eyes[1].cx, `${label} eye boxes are not left-then-right`);
        const n = h.run(`(() => {
          const g = batSpriteFor(${i}, ${up}, 1).grid, n = {};
          for (const row of g) for (const ch of row) n[ch] = (n[ch] || 0) + 1;
          return n;
        })()`);
        assert.ok(n.E > 0, `${label} has no eye`);
        assert.ok((n.C || 0) + (n.W || 0) + (n.K || 0) > 200, `${label} barely drew a body`);
      }
    }
  }
});

test('the thrown paw clears the top of the head', () => {
  // The whole reason this pose needed a taller grid. If the mitt is not ABOVE the
  // topmost coat cell, the strike is landing beside the ears again.
  const h = loadOverlay();
  const e = extents(h, 'batSpriteFor(0, -1, 1)');
  assert.ok(e.topMitt < 6, `the strike should reach the top rows, highest mitt row was ${e.topMitt}`);
  assert.strictEqual(e.topBody, e.topMitt, 'the highest thing in the sprite should be the raised paw');
});

test('the pose is stepped by reach and mirrored by which paw is thrown', () => {
  const h = loadOverlay();
  const flat = (up, ph) => h.run(`batSpriteFor(0, ${up}, ${ph}).grid.map((r) => r.join('')).join('|')`);
  assert.notStrictEqual(flat(-1, 1), flat(-1, 0), 'a full strike must not look like a loaded paw');
  assert.notStrictEqual(flat(-1, 1), flat(1, 1), 'throwing the other paw must change the frame');
  assert.strictEqual(flat(-1, 1), flat(-1, 1), 'the same frame is stable (memoised)');
});

test('a loaded paw stays tucked, a thrown paw does not', () => {
  const h = loadOverlay();
  const low = extents(h, 'batSpriteFor(0, -1, 0)');
  const high = extents(h, 'batSpriteFor(0, -1, 1)');
  assert.ok(low.topMitt > high.topMitt, 'at reach 0 both paws should be down near the chest');
});
