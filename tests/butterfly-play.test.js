// How the cat PLAYS with the butterfly once it is here: the swat cadence, the
// catch, the whiff, and the beats around them. tests/butterfly.test.js covers
// arrival and departure; this file covers everything in between.
//
// Everything here drives the real renderer through scripts/overlay-vm.js with a
// seeded PRNG, so the same script of draw() calls plays out the same way on every
// run. Time is advanced by hand (60ms frames); performance.now() is pinned at 0.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;

// A cat with a butterfly already mid-visit and the cursor long idle, so the play
// gates (cursorIdle, mouseQuiet) are all open from the first frame.
function playing(cfg = {}) {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, butterflyOn: true, followCursor: true, floorLock: true, roamOn: true, moodOn: false, ...cfg });
  h.run('startBflyVisit(1000); lastCursorMove = -99999;');
  assert.ok(h.run('bfOn'), 'the visit should have started');
  return h;
}

// One frame, with the idle roll held off: it can fire a perk-up bounce that chirps
// on its own, which would make any chirp count here ambiguous.
const step = (h, t) => { h.run('nextIdleAt = 1e12'); h.run(`draw(${t})`); };

test('a Focus Guard busy signal sends a flying butterfly home', () => {
  const h = playing();
  step(h, 1000 + STEP);
  assert.notStrictEqual(h.run('bfMode'), 'out', 'the visit should be under way before the meeting starts');
  h.ipc('onFocus', { busy: true, reason: 'meeting' });
  step(h, 1000 + STEP * 2);
  assert.strictEqual(h.run('bfMode'), 'out', 'a meeting starting mid-visit should send the butterfly off, the way the work-mode toggle does');
});
