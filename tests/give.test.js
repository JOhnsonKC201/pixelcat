// The tray's single "give" slot: a fish for the cat, a tennis ball for the dog.
//
// fetch.test.js already pins the dog's ball cycle end to end. These cover the two
// places the give slot leaked outside its own lane, both of which shipped:
//
//   1. setSpecies() cleared the dog's `ball` but never the cat's `treat`, while
//      updateTreat()/drawTreat() run every frame regardless of species. Hand the
//      cat a fish, switch to Dog mid-meal, and the dog inherited the fish and
//      walked over to eat it.
//   2. dropTreat() and the ball's fly-phase bounce clamped to the raw screen
//      edges while the pet's APPROACH point is clamped to the play area. With a
//      constrained play area the food landed outside the zone the pet is allowed
//      into, so the pet stopped at the boundary and the treat sat there forever.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;

function catOverlay() {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false });
  return h;
}

test('a treat does not survive a switch to the dog', () => {
  const h = catOverlay();
  h.run('dropTreat()');
  assert.ok(h.run('treat !== null'), 'the cat should have a treat to begin with');

  h.run('setSpecies("dog")');
  assert.strictEqual(h.run('treat'), null, 'switching species must drop the cat-only treat');

  // And it must stay gone once the dog's loop is actually running: the bug showed
  // up as the dog walking to the inherited fish and entering its 'nom' phase.
  for (let t = STEP; t <= 3000; t += STEP) h.run(`draw(${t})`);
  assert.strictEqual(h.run('treat'), null, 'the dog must never inherit the cat\'s treat');
});

test('a ball does not survive a switch to the cat', () => {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'dog', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false });
  h.run('setSpecies("dog")');
  h.run('throwBall()');
  assert.ok(h.run('ball !== null'), 'the dog should have a ball to begin with');

  h.run('setSpecies("cat")');
  assert.strictEqual(h.run('ball'), null, 'switching species must drop the dog-only ball');
});

// A left third play area, the same shape the tray's "Left third" preset sends.
const LEFT_THIRD = { x: 0, y: 0, w: 1 / 3, h: 1 };

function zoneBounds(h) {
  return {
    lo: h.run('zoneClampX(-99999)'),
    hi: h.run('zoneClampX(99999)'),
  };
}

test('a dropped treat lands inside a constrained play area', () => {
  const h = catOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false, playArea: LEFT_THIRD });
  const { lo, hi } = zoneBounds(h);
  assert.ok(hi > lo, 'the play area should be a real span');

  // Park the cat at the zone's right edge: the drop picks "the roomier side", so
  // this is the case that used to fling the fish clean out of the zone.
  for (let i = 0; i < 30; i++) {
    h.run(`pos.x = ${hi}`);
    h.run('treat = null');
    h.run('dropTreat()');
    const tx = h.run('treat.x');
    assert.ok(tx >= lo - 0.5 && tx <= hi + 0.5,
      `treat landed at ${tx}, outside the play area ${lo}..${hi}`);
  }
});

test('a thrown ball stays inside a constrained play area', () => {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'dog', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false, playArea: LEFT_THIRD });
  h.run('setSpecies("dog")');
  const { lo, hi } = zoneBounds(h);

  h.run(`pos.x = ${hi}`);
  h.run('throwBall()');
  let worst = -Infinity;
  for (let t = STEP; t <= 6000; t += STEP) {
    h.run(`draw(${t})`);
    if (!h.run('ball !== null')) break;
    const bx = h.run('ball.x');
    worst = Math.max(worst, bx);
    assert.ok(bx >= lo - 0.5 && bx <= hi + 0.5,
      `ball reached ${bx}, outside the play area ${lo}..${hi}`);
  }
  assert.ok(worst > -Infinity, 'the ball should have existed for at least one frame');
});

test('with no play area the give slot still respects the screen edges', () => {
  const h = catOverlay();
  const lo = h.run('zoneClampX(-99999)');
  const hi = h.run('zoneClampX(99999)');
  for (let i = 0; i < 20; i++) {
    h.run('treat = null');
    h.run('dropTreat()');
    const tx = h.run('treat.x');
    assert.ok(tx >= lo - 0.5 && tx <= hi + 0.5, `treat at ${tx} escaped the screen bounds ${lo}..${hi}`);
  }
});

test('the cat walks to its treat, eats it, and the treat clears', () => {
  // fetch.test.js pins the dog's whole ball cycle; the cat's side had no
  // equivalent, so a treat that never got eaten (or never got cleared, leaving
  // the cat parked on it forever) would not have failed anything.
  const h = catOverlay();
  const e0 = h.run('energy');
  h.run('dropTreat()');
  assert.strictEqual(h.run('treat.phase'), 'walk', 'a fresh treat starts as a walk target');

  const phases = [];
  let cleared = false;
  for (let t = STEP; t <= 30000; t += STEP) {
    h.run(`draw(${t})`);
    if (!h.run('treat !== null')) { cleared = true; break; }
    const p = h.run('treat.phase');
    if (phases[phases.length - 1] !== p) phases.push(p);
  }

  assert.ok(phases.includes('nom'), `the cat never started eating (phases seen: ${phases.join(' -> ')})`);
  assert.ok(cleared, 'the treat was never cleared, so the cat is parked on it forever');
  assert.ok(h.run('energy') > e0, 'eating a treat should leave the cat more energetic');
});
