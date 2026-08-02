// Self-play tests: what the pet does with itself once you step away.
//
// A cat gets a butterfly to stalk. A dog gets a game of fetch, because it already
// knows how to chase a ball down and carry it home and a dog stalking a butterfly
// reads as a recoloured cat. Both hang off the same idle gates and the same tray
// toggle, so these tests check the ROUTING (right species, right companion) and
// the gating (off means off), not the flight or fetch mechanics themselves.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;

function petOverlay(species, cfg = {}) {
  const h = loadOverlay();
  h.run(`setSpecies(${JSON.stringify(species)})`);
  h.ipc('onConfig', { species, soundOn: false, followCursor: true, floorLock: true, ...cfg });
  return h;
}

// Idle the pet (no cursor or key events) and report when each companion first appeared.
function idle(h, ms, from = 0) {
  let ball = null, bfly = null;
  for (let t = from + STEP; t <= from + ms; t += STEP) {
    h.run(`draw(${t})`);
    if (ball === null && h.run('!!ball')) ball = t;
    if (bfly === null && h.run('!!bfOn')) bfly = t;
  }
  return { ball, bfly };
}

// Idle the same way, but stop as soon as `expr` reads true and report how long that
// took. Returns null if it never did inside `cap`, so a caller still gets a failure.
function idleUntil(h, expr, cap, from = 0) {
  for (let t = from + STEP; t <= from + cap; t += STEP) {
    h.run(`draw(${t})`);
    if (h.run(expr)) return t - from;
  }
  return null;
}

test('a dog left alone starts its own game of fetch', () => {
  const { ball, bfly } = idle(petOverlay('dog'), 30000);
  assert.ok(ball, 'an idle dog should nose a ball out on its own');
  assert.equal(bfly, null, 'a dog should never be sent a butterfly');
});

test('a cat left alone still gets a butterfly and never a ball', () => {
  const { ball, bfly } = idle(petOverlay('cat'), 30000);
  assert.ok(bfly, 'an idle cat should still get its butterfly visit');
  assert.equal(ball, null, 'a cat has no use for a tennis ball');
});

test('both species reach for their companion on the same idle schedule', () => {
  // The dog path reuses the butterfly timers deliberately. If they ever drift
  // apart, one species starts feeling noticeably livelier than the other.
  const dog = idle(petOverlay('dog'), 30000);
  const cat = idle(petOverlay('cat'), 30000);
  assert.equal(dog.ball, cat.bfly, `dog played at ${dog.ball}ms but cat played at ${cat.bfly}ms`);
});

test('turning play off silences both species', () => {
  // One toggle ("Butterfly visits" / "Ball to chase") governs both.
  const dog = idle(petOverlay('dog', { butterflyOn: false }), 30000);
  const cat = idle(petOverlay('cat', { butterflyOn: false }), 30000);
  assert.equal(dog.ball, null, 'play is off, the dog should not fetch');
  assert.equal(cat.bfly, null, 'play is off, the cat should get no butterfly');
});

test('work mode and reduced motion both stop a dog starting a game', () => {
  assert.equal(idle(petOverlay('dog', { workMode: true }), 30000).ball, null, 'work mode means stay put');
  assert.equal(idle(petOverlay('dog', { reducedMotion: true }), 30000).ball, null, 'reduced motion means no self-play');
});

test('a butterfly in flight leaves properly when the pet becomes a dog', () => {
  // The butterfly is DRAWN for as long as bfOn is set. Routing dogs straight to
  // fetch without flying it off would freeze it mid-air on screen forever.
  const SWAP_AT = 9000;
  // How long the flight out takes is geometry, not a constant: a butterfly on the far
  // side of a cat that is itself parked against a screen edge has the whole 1920px to
  // cross at its leaving speed (~4.5s), while a near-edge exit is done inside a second.
  // So drive the frames and record WHEN it left rather than sampling one fixed moment.
  // The cap stays well under renderer.js's bfUntil + 6000ms despawn failsafe, so
  // passing here means it actually flew off, not that a safety net swept it up.
  const LEAVE_CAP = 12000;

  const h = petOverlay('cat');
  idle(h, SWAP_AT);
  assert.strictEqual(h.run('bfOn'), true, 'expected a butterfly mid-visit before the swap');

  h.run('setSpecies("dog")');
  h.ipc('onConfig', { species: 'dog', soundOn: false, followCursor: true, floorLock: true });

  // Clearing bfOn is reachable from exactly one place in renderer.js, and only under
  // bfMode 'out', so leaving inside the cap IS the graceful departure. Abandoning the
  // butterfly instead leaves bfOn set forever and this fails.
  const leftAfter = idleUntil(h, '!bfOn', LEAVE_CAP, SWAP_AT);
  assert.ok(leftAfter !== null, `the butterfly should fly off, not freeze on screen (still up ${LEAVE_CAP}ms after the swap)`);
});
