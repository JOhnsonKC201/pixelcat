// How the cat PLAYS with the butterfly once it is here: the swat cadence, the
// catch, the whiff, and the beats around them. tests/butterfly.test.js covers
// arrival and departure; this file covers everything in between.
//
// Everything here drives the real renderer through scripts/overlay-vm.js with a
// seeded PRNG, so the same script of draw() calls plays out the same way on every
// run. Time is advanced by hand (60ms frames); performance.now() is pinned at 0.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;
const RENDERER = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');

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

// The 2026-08-26 quiet fix. A 600ms swat that re-armed 100ms later threw a whoosh
// roughly every 350ms for a whole 22-30s visit: the app's loudest source of "it
// never stops". The paw now rests 2.6-4.0s between swats (jittered, so it reads as
// a cat losing interest rather than a machine keeping time) and the whoosh has a
// 900ms floor of its own. Nothing pinned either number until this test: the only
// other whoosh test drives the scroll LEAF with the butterfly switched off.
test('the swat rests between swipes and never turns back into a metronome', () => {
  const h = playing({ soundOn: true, roamOn: false });
  h.run('var __swipes = 0, __str = []; playSwipe = function (s) { __swipes++; __str.push(s); };');
  const arms = [], whooshes = [];
  let lastArm = h.run('bfSwatT0'), lastCount = 0;
  for (let t = 1000 + STEP; t <= 40000 && h.run('bfOn'); t += STEP) {
    // Park the bug where the swat gate (62 < dh < 150 from the head) is open every
    // frame, but the pounce (dh < 87) and the dodge (dh < 60) never are. roamOn:false
    // keeps the stalk-walk off, so roamUntil stays 0 and nothing else moves the cat.
    h.run('bfX = pos.x + 100; bfY = pos.y - SH - 20;');
    step(h, t);
    const arm = h.run('bfSwatT0');
    if (arm !== lastArm) { arms.push(arm); lastArm = arm; }
    const n = h.run('__swipes');
    if (n !== lastCount) { whooshes.push(t); lastCount = n; }
  }
  assert.ok(arms.length >= 3, `the gate barely opened (${arms.length} swats in a full visit)`);
  assert.strictEqual(whooshes.length, arms.length, `${whooshes.length} whooshes for ${arms.length} swats: a second stroke inside one swat is sounding again`);
  for (let i = 1; i < arms.length; i++) {
    assert.ok(arms[i] - arms[i - 1] >= 2600, `swats ${i - 1} and ${i} were only ${arms[i] - arms[i - 1]}ms apart; the rest between them has shrunk`);
  }
  for (let i = 1; i < whooshes.length; i++) {
    assert.ok(whooshes[i] - whooshes[i - 1] >= 900, `whooshes ${i - 1} and ${i} were ${whooshes[i] - whooshes[i - 1]}ms apart; the 900ms floor is gone`);
  }
  assert.ok(arms.length <= Math.ceil(30000 / 2600) + 2, `${arms.length} swats in one visit is the old cadence`);
  const strengths = h.run('__str');
  assert.ok(strengths.every((s) => s >= 0 && s <= 1), `a swipe strength left 0..1: ${strengths.join(', ')}`);
});

// The behavioural test above would still pass with the numbers nudged a little,
// so pin them by name as well (the way tests/reel-spec.test.js pins --state ids).
test('the quiet constants are still spelled the way the fix left them', () => {
  assert.match(RENDERER, /const BF_SWAT_RANGE = 150, BF_SWAT_MS = 600;/, 'BF_SWAT_MS moved or changed');
  assert.match(RENDERER, /bfSwatCool = t \+ 2600 \+ Math\.random\(\) \* 1400;/, 'the jittered rest between swats changed');
  assert.match(RENDERER, /nextSwipeSound = t \+ 900;/, 'the whoosh time budget changed');
  assert.match(RENDERER, /const stroke = Math\.floor\(swing \/ Math\.PI\);/, 'the one-whoosh-per-stroke clock changed');
});

// Force the wind-up the way the dive path does, aimed IN PLACE so the leap goes
// straight up and lands where it started, with the bug parked at (bugDx, bugDy)
// from the feet. At (0, -60) it sits inside the catch radius for every frame past
// e = 0.4; at (120, -60) the leap can never reach it.
function armPounce(h, t, bugDx, bugDy) {
  h.run(`bfMode = 'dive'; bfX = pos.x + ${bugDx}; bfY = pos.y + ${bugDy};
    huntUntil = ${t} + 1400; huntTarget = { x: pos.x, y: pos.y }; windingUp = true; windupT0 = ${t}; pounceFrom = { x: pos.x, y: pos.y };`);
}
// With armPounce(h, 1060, ...): the coil runs 1060..1300, the leap starts at 1360,
// the catch test first passes at 1540 (e = 0.6) and the cat lands at 1660.
const ARM = 1060, CATCH = 1540, LAND = 1660;

// Record every eyeMode drawCat is asked for, the way tests/petting.test.js does.
const watchEyes = (h) => h.run(`
  var __eyes = [];
  var __realDrawCat = drawCat;
  drawCat = function (g, sp, t, pal, o) { __eyes.push([t, o && o.eyeMode]); return __realDrawCat(g, sp, t, pal, o); };
`);

test('a catch: pink sparks at the paws, happy eyes on the bounce, and exactly one trill', () => {
  for (const soundOn of [true, false]) {
    const h = playing({ soundOn });
    h.run('var __chirps = 0; playChirp = function () { __chirps++; };');
    watchEyes(h);
    armPounce(h, ARM, 0, -60);
    let sparks = -1;
    for (let t = ARM; t <= 4000; t += STEP) {
      step(h, t);
      if (t === CATCH + STEP) sparks = h.run("hearts.filter((x) => x.kind === 'spark').length");
    }
    const tag = soundOn ? 'sound on' : 'sound off';
    assert.strictEqual(h.run('__chirps'), soundOn ? 1 : 0, `${tag}: expected ${soundOn ? 'one trill' : 'silence'} for one catch`);
    assert.ok(sparks >= 4, `${tag}: only ${sparks} pink sparks a frame after the catch`);
    const eyes = h.run('__eyes');
    const after = eyes.filter((e) => e[0] > LAND).map((e) => e[1]);
    assert.ok(after.includes('happy'), `${tag}: the eyes never squeezed shut on the victory bounce`);
    assert.strictEqual(eyes[eyes.length - 1][1], 'open', `${tag}: the happy eyes stuck after the beat was over`);
  }
});

test('a whiff gets no sparkle, no trill and no bounce; the cat just watches it go', () => {
  const h = playing({ soundOn: true });
  h.run('var __chirps = 0; playChirp = function () { __chirps++; };');
  armPounce(h, ARM, 120, -60);
  for (let t = ARM; t <= LAND; t += STEP) step(h, t);
  assert.strictEqual(h.run('__chirps'), 0, 'a miss trilled');
  assert.strictEqual(h.run('hearts.length'), 0, 'a miss threw sparks or a heart');
  assert.strictEqual(h.run('idleSparkles.length'), 0, 'a miss still got the "got it!" sparkle');
  assert.ok(h.run('bfJoyT0') < 0, 'a miss opened the victory window');
  assert.strictEqual(h.run('lookTargetUntil'), LAND + 400, 'the cat should look after the bug it missed');
  assert.ok(h.run('lookTarget.y') < 0, 'the look after a miss should be UP, where the bug is');
  assert.ok(h.run('pouncing') === false && h.run('huntUntil') === 0, 'the pounce should be over');
});

// The hold: the bug sits in the paws for BF_HELD_MS after the catch, then slips out
// and climbs away, and only then does the victory window open. While it is held,
// nothing else may react to it: it is 50px under the head, inside both the dodge
// radius and the swat's reach, and either firing would snatch it out of the paws.
const HELD_MS = 550;

test('a pet set to stay put does not move a pixel through a catch, the hold and the bounce after it', () => {
  const h = playing({ roamOn: false });
  armPounce(h, ARM, 0, -60);
  for (let t = ARM; t <= LAND; t += STEP) step(h, t);
  assert.strictEqual(h.run('bfMode'), 'held', 'the leap should have connected and the bug should be in the paws');
  const x0 = h.run('pos.x'), y0 = h.run('pos.y');
  const swat0 = h.run('bfSwatUntil'), dodge0 = h.run('bfDodgeUntil');
  let worst = 0, released = -1, farthest = 0;
  for (let t = LAND + STEP; t <= 4000; t += STEP) {
    step(h, t);
    worst = Math.max(worst, Math.abs(h.run('pos.x') - x0), Math.abs(h.run('pos.y') - y0));
    assert.strictEqual(h.run('roamUntil'), 0, `a wander was armed at ${t}ms`);
    const mode = h.run('bfMode');
    if (mode === 'held') {
      assert.ok(t <= CATCH + HELD_MS, `still held at ${t}ms, ${t - CATCH}ms after the catch`);
      farthest = Math.max(farthest, Math.abs(h.run('bfX') - x0));
      assert.strictEqual(h.run('bfSwatUntil'), swat0, `a swat was armed at the bug in its own paws (${t}ms)`);
      assert.strictEqual(h.run('bfDodgeUntil'), dodge0, `the held bug was kicked into a dodge (${t}ms)`);
    } else if (released < 0) {
      released = t;
      assert.strictEqual(mode, 'out', `the bug left the paws into '${mode}', not 'out'`);
      assert.ok(h.run('bfVy') < 0, 'the release should climb, not drop');
      assert.ok(h.run('bfJoyT0') >= 0, 'the victory window should open as the bug gets away');
    }
  }
  assert.ok(released > CATCH + HELD_MS && released <= CATCH + HELD_MS + STEP, `released at ${released}ms, expected the first frame after ${CATCH + HELD_MS}ms`);
  assert.ok(farthest < 3, `the held bug wandered ${farthest.toFixed(1)}px from the paws`);
  assert.strictEqual(worst, 0, `the catch moved a stay-put pet ${worst.toFixed(2)}px`);
});

test('a Focus Guard busy signal sends a flying butterfly home', () => {
  const h = playing();
  step(h, 1000 + STEP);
  assert.notStrictEqual(h.run('bfMode'), 'out', 'the visit should be under way before the meeting starts');
  h.ipc('onFocus', { busy: true, reason: 'meeting' });
  step(h, 1000 + STEP * 2);
  assert.strictEqual(h.run('bfMode'), 'out', 'a meeting starting mid-visit should send the butterfly off, the way the work-mode toggle does');
});
