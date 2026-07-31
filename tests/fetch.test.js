// Fetch (dogs only) tests.
//
// The tray throws a tennis ball, the dog chases it down, carries it home and drops
// it. That whole cycle runs off one `ball` object moving through fly -> rest ->
// carry -> rest, driven entirely by the rAF loop, so it is easy to get a state
// machine that looks right for one throw and then never settles.
//
// It shipped doing exactly that: the dog dropped the ball at its own feet, was
// back inside the grab radius on the next frame, picked it up, "delivered" it
// without moving, and looped forever at frame rate. Over 72 simulated seconds
// that was 511 phase flips and 254 heart-and-chirp bursts, with the pant timer
// refreshed every frame so the dog never stopped panting. These tests pin the
// shape of one complete fetch and the fact that it ENDS.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;   // > the idle-fps throttle in draw(), so no frame gets skipped

// Drive the real loop and record every ball phase change along the way.
function runFetch(h, ms) {
  const flips = [];
  let prev = h.run('ball ? ball.phase : null');
  for (let t = STEP; t <= ms; t += STEP) {
    h.run(`draw(${t})`);
    const phase = h.run('ball ? ball.phase : null');
    if (phase !== prev) { flips.push({ t, from: prev, to: phase }); prev = phase; }
  }
  return flips;
}

function dogOverlay() {
  const h = loadOverlay();
  h.run('setSpecies("dog")');
  h.ipc('onConfig', { species: 'dog', soundOn: false, followCursor: true, floorLock: true });
  // Count the celebration bursts: one per delivery is right, one per frame is the bug.
  h.run('var __love = 0; var __popLove = popLove; popLove = function () { __love++; return __popLove.apply(null, arguments); };');
  return h;
}

test('a thrown ball is chased down, carried home and delivered exactly once', () => {
  const h = dogOverlay();
  h.run('throwBall()');
  assert.strictEqual(h.run('ball.phase'), 'fly', 'the throw should put the ball in the air');
  const flips = runFetch(h, 20000);

  const seq = flips.map((f) => f.to);
  assert.deepEqual(seq.slice(0, 3), ['rest', 'carry', 'rest'],
    `expected land -> pick up -> deliver, got ${JSON.stringify(seq)}`);

  const deliveries = flips.filter((f) => f.from === 'carry' && f.to === 'rest');
  assert.equal(deliveries.length, 1, `the dog delivered ${deliveries.length} times for one throw`);
  assert.equal(h.run('__love'), 1, 'one delivery should be one burst of hearts, not one per frame');
});

test('the dog leaves a delivered ball alone instead of looping on it', () => {
  // The regression itself. The ball lands ~6px from the dog on delivery, well
  // inside FETCH_GRAB (22px), so without a "already brought this back" marker the
  // rest branch re-grabs it immediately and the cycle never terminates.
  const h = dogOverlay();
  h.run('throwBall()');
  const flips = runFetch(h, 40000);

  assert.ok(flips.length <= 6, `one fetch should be a handful of phase changes, got ${flips.length}`);
  assert.ok(h.run('__love') <= 1, `hearts fired ${h.run('__love')} times for a single fetch`);
  assert.strictEqual(h.run('ball && ball.delivered'), true, 'the delivered ball should be marked, not re-chased');
  assert.strictEqual(h.run('ball && ball.phase'), 'rest', 'a delivered ball stays on the floor');
});

test('the pant timer stops being refreshed once the fetch is over', () => {
  // Panting is driven by `pantUntil`, which the delivery branch pushes forward.
  // While the loop ran it was re-armed every frame, so the dog panted permanently.
  const h = dogOverlay();
  h.run('throwBall()');
  runFetch(h, 30000);
  const pantUntil = h.run('pantUntil');
  assert.ok(pantUntil < 30000, `pantUntil (${pantUntil}) is still being pushed forward after the fetch ended`);
});

test('a delivered ball is eventually forgotten so the floor does not stay littered', () => {
  const h = dogOverlay();
  h.run('throwBall()');
  const flips = runFetch(h, 60000);
  const forgotten = flips.find((f) => f.to === null);
  assert.ok(forgotten, 'the ball should be cleared once it has sat untouched');
  assert.ok(forgotten.t > 40000, `forgotten too eagerly at ${forgotten.t}ms`);
  assert.strictEqual(h.run('ball'), null);
});
