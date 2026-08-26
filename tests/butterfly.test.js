// The butterfly visit: it drops by when you are idle, the cat rears up and swipes
// at it, and it leaves when you go back to work.
//
// It used to leave on the FIRST cursor movement, and then bolt: 'out' both
// accelerated harder and flew faster than wandering. So a single twitch, a bumped
// desk, or reaching for the mouse to watch the thing ended a 22-30 second visit
// instantly, and it vanished off the edge rather than drifting away. The next visit
// is at least 14 seconds off, so in practice the app's nicest animation was one you
// could only ever glimpse.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

function visiting(t0 = 1000) {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, butterflyOn: true, followCursor: true, floorLock: true });
  h.run(`startBflyVisit(${t0})`);
  assert.ok(h.run('bfOn'), 'the visit should have started');
  return h;
}

// Pretend the mouse moved at time `at`, the way the cursor handler does.
const stir = (h, at) => h.run(`lastCursorMove = ${at}`);

test('a single twitch does not end the visit', () => {
  const h = visiting();
  h.run('draw(1100)');
  stir(h, 1150);                       // one movement, then the hand goes still
  for (let t = 1160; t <= 2600; t += 60) h.run(`draw(${t})`);
  assert.ok(h.run('bfOn'), 'the butterfly left after one stray movement');
  assert.notStrictEqual(h.run('bfMode'), 'out', 'a twitch should not send it home');
});

test('using the mouse properly does end the visit', () => {
  const h = visiting();
  // keep the cursor live past the grace window
  for (let t = 1100; t <= 3200; t += 60) { stir(h, t); h.run(`draw(${t})`); }
  assert.strictEqual(h.run('bfMode'), 'out', 'sustained mouse use should send it home');
});

test('the grace window resets when you go still again', () => {
  const h = visiting();
  const grace = h.run('BF_GRACE_MS');
  // stir for most of the grace window, stop, then stir again from scratch
  for (let t = 1100; t <= 1100 + grace * 0.7; t += 60) { stir(h, t); h.run(`draw(${t})`); }
  for (let t = 1100 + grace; t <= 1100 + grace * 2.5; t += 60) h.run(`draw(${t})`);   // hands off
  assert.ok(h.run('bfOn'), 'a partial nudge should not have banished it');
  assert.strictEqual(h.run('bfNudgeSince'), 0, 'going still should reset the grace window');
});

test('it drifts out rather than bolting, and still despawns', () => {
  // The gentler exit must not strand it on screen: nothing clamps the sprite while
  // leaving, so if it were too slow to reach the edge it would flutter there forever.
  const h = visiting();
  h.run('bfMode = "out"');
  let gone = false, worstSpeed = 0;
  for (let t = 1100; t <= 20000; t += 60) {
    h.run(`draw(${t})`);
    if (!h.run('bfOn')) { gone = true; break; }
    worstSpeed = Math.max(worstSpeed, h.run('Math.hypot(bfVx, bfVy)'));
  }
  assert.ok(gone, 'the butterfly never reached the edge and despawned');
  assert.ok(worstSpeed <= 5.5 + 0.5,
    `leaving should not be faster than wandering (peaked at ${worstSpeed.toFixed(2)})`);
});

test('a pet set to stay put does not bolt after the butterfly', () => {
  // The pounce borrows huntTarget and carries the pet clear across the screen. It
  // was ungated, so "do not wander" pets still launched themselves at every dive -
  // and huntOn does not cover it, because huntOn is about the CURSOR. Measured at
  // ~311px of drift with roaming off before this was gated.
  const drift = (roamOn) => {
    const h = loadOverlay();
    h.ipc('onConfig', { species: 'cat', soundOn: false, followCursor: true, floorLock: true,
      butterflyOn: true, roamOn, reducedMotion: false, workMode: false });
    h.run('startBflyVisit(1000)');
    h.run('lastCursorMove = -99999;');            // cursor idle, so the pounce is eligible
    const x0 = h.run('pos.x');
    let worst = 0, sawBfly = false;
    for (let t = 1060; t <= 12000; t += 60) {
      h.run('bfX = 40; bfY = 200;');              // park it far off, where the stalk would fire
      h.run(`draw(${t})`);
      worst = Math.max(worst, Math.abs(h.run('pos.x') - x0));
      if (h.run('bfOn')) sawBfly = true;
    }
    return { worst, sawBfly };
  };

  const still = drift(false);
  assert.strictEqual(still.worst, 0, `a stay-put pet drifted ${still.worst.toFixed(1)}px chasing the butterfly`);
  assert.ok(still.sawBfly, 'the butterfly should still visit a pet that does not roam');

  // and roaming pets are unaffected: the bug is still worth chasing.
  const roaming = drift(true);
  assert.ok(roaming.worst > 100, `a roaming pet should still give chase (drifted ${roaming.worst.toFixed(1)}px)`);
});
