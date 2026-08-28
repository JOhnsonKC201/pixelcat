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
//   3. Work mode (and Focus Guard's "you are in a meeting", which routes to the
//      same workModeOn()) parks the pet in its corner by aiming the SAME roam slot
//      the walk to the fish uses, one block earlier in the frame. It re-claimed the
//      slot the instant that walk expired, so the cat was marched home just short of
//      its food and set off again: an endless corner/fish pace with a fish that only
//      eating can clear. Every other config ate the treat fine, which is why it
//      shipped.
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


// --- work mode / Focus Guard vs an explicitly requested treat -----------------

// Walk the treat to its end and report what happened on the way. `reversals`
// counts direction changes: the park bug showed up as ~90 of them per minute (a
// pace), a healthy trek has none.
function walkTreat(h, ms = 30000) {
  const xs = [];
  let cleared = false, clearedAt = 0;
  for (let t = STEP; t <= ms; t += STEP) {
    h.run(`draw(${t})`);
    xs.push(h.run('pos.x'));
    if (!h.run('treat !== null')) { cleared = true; clearedAt = t; break; }
  }
  let reversals = 0, dir = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = Math.sign(xs[i] - xs[i - 1]);
    if (d && dir && d !== dir) reversals++;
    if (d) dir = d;
  }
  return { cleared, clearedAt, reversals, xs };
}

test('a treat still gets eaten in work mode, and the pet parks again after', () => {
  const h = catOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false, workMode: true });
  const home = h.run('homeX()');
  h.run('dropTreat()');

  const { cleared, reversals } = walkTreat(h);
  assert.ok(cleared, 'work mode marched the cat home short of its fish, so the treat was never eaten');
  assert.ok(reversals <= 1, `the cat paced instead of walking to its treat (${reversals} direction changes)`);

  // The park is suppressed for the errand only. Once the fish is gone the pet has
  // to go back to holding its corner, or work mode has quietly been switched off.
  for (let t = 30000; t <= 40000; t += STEP) h.run(`draw(${t})`);
  assert.ok(Math.abs(h.run('pos.x') - home) < 3, 'the pet never returned to its work-mode corner');
});

test('a treat still gets eaten while Focus Guard says you are busy', () => {
  // Same aimer, reached the other way: a calendar event or a busy app sets
  // focusBusy, and workModeOn() is focusBusy || config.workMode.
  const h = catOverlay();
  h.ipc('onFocus', { busy: true });
  h.run('dropTreat()');

  const { cleared, reversals } = walkTreat(h);
  assert.ok(cleared, 'a meeting left the cat pacing between its corner and an uneaten fish');
  assert.ok(reversals <= 1, `the cat paced during a meeting instead of eating (${reversals} direction changes)`);
});

test('the cat eats a treat it is already standing on, whatever the roam is doing', () => {
  // The arrival check runs before the roam gate now, so a roam aimed somewhere
  // else cannot walk the cat off a fish at its feet. This is what made the pace
  // possible: arrival could only be noticed in the one frame the roam slot was
  // free, and the park aimer got there first.
  const h = catOverlay();
  h.run('dropTreat()');
  h.run('pos.x = treatApproachX()');                       // put it right on the spot
  h.run('roamFrom = { x: pos.x, y: pos.y }; roamTo = { x: pos.x - 400, y: pos.y }; roamDur = 1500; roamUntil = 1e9;');
  h.run('draw(1000)');
  assert.strictEqual(h.run('treat.phase'), 'nom', 'the cat walked off a treat it was standing on');
  assert.ok(h.run('roamUntil') <= 1000, 'the in-flight roam must be dropped so nothing drags the cat off its meal');
});

test('the dog still fetches in work mode', () => {
  // The dog escaped the same trap by accident (its FETCH_GRAB check already
  // ignored the roam slot). Pin it, since the park suppression now covers the
  // ball too and a regression here would look identical to the cat's.
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'dog', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false, workMode: true });
  h.run('setSpecies("dog")');
  h.run('throwBall()');
  let delivered = false;
  for (let t = STEP; t <= 30000; t += STEP) {
    h.run(`draw(${t})`);
    if (h.run('!!(ball && ball.delivered)')) { delivered = true; break; }
  }
  assert.ok(delivered, 'work mode stopped the dog bringing its ball back');
});
