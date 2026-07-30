// Petting tests.
//
// Patting the pet should squeeze its eyes shut. That is one line of state
// (eyeMode: 'happy') fed to drawCat, but getting there depends on pet detection,
// which is easy to break in ways a screenshot at one instant will not show:
//   - a stroke is a MOVING hand, so gating affection on a near-still cursor made
//     the eyes snap open in the middle of every pat
//   - a hand that overshoots the sprite for a frame should not end the pat
//   - stroking the back should squint too, not just scratching the head
// These drive the real rAF loop with a scripted cursor and read back the eyeMode
// drawCat was actually called with.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('./helpers/renderer-vm.js');

// Load the overlay with drawCat wrapped so every frame's eyeMode is recorded, and
// the ambient idle behaviours (loaf / groom / play / yawn) disarmed - those also
// squint, and letting them fire would make a passing test meaningless.
function loadPettable() {
  const h = loadOverlay();
  h.run(`
    var __eyes = [];
    var __realDrawCat = drawCat;
    drawCat = function (g, sp, t, pal, o) { __eyes.push(o && o.eyeMode); return __realDrawCat(g, sp, t, pal, o); };
  `);
  return h;
}

const quiet = (h) => h.run('loafUntil = 0; groomUntil = 0; playUntil = 0; yawnUntil = 0; doneHopT0 = -1; petBurstUntil = 0; 1');
const pos = (h) => h.run('({ x: pos.x, y: pos.y, SW, SH })');

// Teleport the pointer without the pet noticing. A real cursor arrives by moving,
// but a test that assigns `cursor` directly jumps ~1900px in one frame, which trips
// the startle reflex (moved > STARTLE_JUMP) and sends the cat bolting - so seed
// prevCursor too and the frame reads as "already there, not moving".
function place(h, x, y) { h.run(`cursor.x = ${x}; cursor.y = ${y}; prevCursor.x = ${x}; prevCursor.y = ${y}; velEMA = 0`); }

// Drive `frames` frames, moving the cursor to cursorAt(i) before each one.
function run(h, frames, cursorAt, t0 = 5000, step = 60) {
  h.run('__eyes.length = 0');
  let t = t0;
  for (let i = 0; i < frames; i++) {
    const c = cursorAt(i);
    quiet(h);
    if (i === 0) place(h, c.x, c.y);
    else h.run(`cursor.x = ${c.x}; cursor.y = ${c.y}`);
    h.run(`draw(${t})`);
    t += step;
  }
  return h.run('__eyes.slice()');
}

test('a hand resting on the head shuts the eyes', () => {
  const h = loadPettable();
  const p = pos(h);
  const eyes = run(h, 6, () => ({ x: p.x, y: p.y - p.SH * 0.8 }));
  assert.ok(eyes.length > 0, 'drawCat never ran - the harness is not exercising the idle path');
  assert.strictEqual(eyes[eyes.length - 1], 'happy', 'resting on the head should squint');
});

test('the eyes stay shut through the stroke, not just when the hand stops', () => {
  // The regression: velEMA climbs the moment you actually move, and the old
  // "cursor must be nearly still" rule dropped petting mid-stroke, so the eyes
  // flickered open exactly while you were patting.
  const h = loadPettable();
  const p = pos(h);
  // sweep back and forth across the head at ~0.6 px/ms, a normal deliberate stroke
  const eyes = run(h, 10, (i) => ({
    x: p.x + (i % 2 ? 18 : -18),
    y: p.y - p.SH * 0.8,
  }));
  assert.ok(eyes.length >= 8, 'expected a frame per stroke step');
  const open = eyes.filter((e) => e !== 'happy').length;
  assert.strictEqual(open, 0, `eyes popped open on ${open}/${eyes.length} stroke frames`);
});

test('a stroke that overshoots the sprite for a frame does not end the pat', () => {
  const h = loadPettable();
  const p = pos(h);
  // on, on, briefly off the right edge, back on
  const track = [0, 0, 1, 0].map((off) => ({ x: p.x + (off ? p.SW : 0), y: p.y - p.SH * 0.8 }));
  const eyes = run(h, track.length, (i) => track[i]);
  assert.deepStrictEqual(eyes, ['happy', 'happy', 'happy', 'happy'],
    'a one-frame overshoot should ride the grace window, not restart the pat');
});

test('stroking the back squints too, not only the head', () => {
  const h = loadPettable();
  const p = pos(h);
  const eyes = run(h, 6, () => ({ x: p.x, y: p.y - p.SH * 0.25 }));   // low on the body, clear of the head box
  assert.strictEqual(eyes[eyes.length - 1], 'happy', 'a body pat should squint as well');
});

test('the eyes open again once the hand leaves', () => {
  const h = loadPettable();
  const p = pos(h);
  run(h, 4, () => ({ x: p.x, y: p.y - p.SH * 0.8 }));               // pat first
  const eyes = run(h, 8, () => ({ x: p.x + 600, y: p.y - 400 }), 9000);   // then well away
  assert.strictEqual(eyes[eyes.length - 1], 'open', 'the squint should not stick after the hand leaves');
});

test('flicking the cursor straight past the pet is not a pat', () => {
  const h = loadPettable();
  const p = pos(h);
  // ~3 px/ms: crossing the screen, not stroking the cat
  const eyes = run(h, 6, (i) => ({ x: p.x - 600 + i * 240, y: p.y - p.SH * 0.5 }));
  assert.ok(!eyes.includes('happy'), 'a fast flyby should not read as petting');
});
