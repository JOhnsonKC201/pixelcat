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

test('a Focus Guard busy signal sends a flying butterfly home', () => {
  const h = playing();
  step(h, 1000 + STEP);
  assert.notStrictEqual(h.run('bfMode'), 'out', 'the visit should be under way before the meeting starts');
  h.ipc('onFocus', { busy: true, reason: 'meeting' });
  step(h, 1000 + STEP * 2);
  assert.strictEqual(h.run('bfMode'), 'out', 'a meeting starting mid-visit should send the butterfly off, the way the work-mode toggle does');
});
