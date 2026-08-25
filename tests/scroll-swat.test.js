// Scroll reaction: a leaf streaks past in the direction you are scrolling and the
// pet rears up and swipes at it.
//
// This replaced a rope climb. The climb failed for a structural reason worth not
// repeating: eyeBox() splits the grid at column 12 so the face must straddle that
// seam, which pinned the body at 11.25 while the rope sat at 18.4, so any grip
// level with the face dragged the arm across it. The pose could only reach ABOVE
// the head, where a 4x3-cell mitt reads as a lump on the skull rather than a grip.
// The swat reuses batSpriteFor instead, whose arm deliberately BOWS outward to
// clear the skull, so the same reach is legible.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const STEP = 60;

function scrollingOverlay(dir) {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, followCursor: true, floorLock: true, butterflyOn: false });
  for (let i = 0; i < 4; i++) h.ipc('onScroll', dir);
  return h;
}

// Drive the loop, keeping the wheel turning, and sample the leaf each frame.
function sample(h, ms, dir, keepScrolling = true) {
  const seen = [];
  for (let t = STEP; t <= ms; t += STEP) {
    if (keepScrolling && t % 240 === 0) h.ipc('onScroll', dir);
    h.run(`draw(${t})`);
    const leaf = h.run('swatLeaf ? { x: swatLeaf.x, y: swatLeaf.y, lane: swatLeaf.lane, hit: swatLeaf.hit } : null');
    seen.push({ t, leaf });
  }
  return seen;
}

test('nothing is flying past until you scroll', () => {
  const h = loadOverlay();
  h.ipc('onConfig', { species: 'cat', soundOn: false, butterflyOn: false });
  for (let t = STEP; t <= 600; t += STEP) h.run(`draw(${t})`);
  assert.strictEqual(h.run('swatLeaf'), null, 'a leaf should only appear once the wheel turns');
});

test('scrolling down sends a leaf falling past the pet', () => {
  const h = scrollingOverlay(1);
  const seen = sample(h, 1200, 1).filter((s) => s.leaf);
  assert.ok(seen.length > 4, 'a leaf should be in flight while scrolling');
  // It travels DOWN with the page. Compare within one leaf, since a leaf that
  // finishes its run is replaced by a fresh one starting back at the top.
  let fell = 0;
  for (let i = 1; i < seen.length; i++) {
    if (seen[i].leaf.lane === seen[i - 1].leaf.lane && seen[i].leaf.y > seen[i - 1].leaf.y) fell++;
  }
  assert.ok(fell > seen.length * 0.6, `the leaf should mostly travel downward (${fell}/${seen.length})`);
});

test('scrolling up sends it the other way', () => {
  const h = scrollingOverlay(-1);
  const seen = sample(h, 1200, -1).filter((s) => s.leaf);
  assert.ok(seen.length > 4);
  let rose = 0;
  for (let i = 1; i < seen.length; i++) {
    if (seen[i].leaf.lane === seen[i - 1].leaf.lane && seen[i].leaf.y < seen[i - 1].leaf.y) rose++;
  }
  assert.ok(rose > seen.length * 0.6, `scrolling up should carry the leaf upward (${rose}/${seen.length})`);
});

test('the leaf holds its lane instead of wandering across the pet', () => {
  // Regression: the wobble was ADDED to x every frame, which is a random walk, so
  // the leaf drifted across the cat's chest instead of falling past it.
  const h = scrollingOverlay(1);
  const posX = h.run('pos.x');
  let worst = 0;
  for (const s of sample(h, 2400, 1)) {
    if (!s.leaf) continue;
    worst = Math.max(worst, Math.abs((s.leaf.x - posX) - s.leaf.lane));
  }
  assert.ok(worst < 12, `the leaf strayed ${worst.toFixed(1)}px from its lane, so it is wandering, not wobbling`);
});

test('the leaf is dropped once the scrolling stops', () => {
  const h = scrollingOverlay(1);
  sample(h, 600, 1);
  // stop feeding the wheel and let the scroll energy bleed off
  for (let t = 700; t <= 40000; t += 200) {
    h.run(`draw(${t})`);
    if (h.run('paperLen') <= 1) break;
  }
  h.run('draw(40200)');
  assert.strictEqual(h.run('swatLeaf'), null, 'no leaf should linger after the scrolling stops');
});

test('a swipe connects at most once per leaf', () => {
  // The strike test runs every frame while a paw is at full stretch, so without a
  // latch one swipe would re-hit the same leaf on every frame it overlapped.
  const h = scrollingOverlay(1);
  let flips = 0, prev = false;
  for (const s of sample(h, 3000, 1)) {
    const hit = !!(s.leaf && s.leaf.hit);
    if (hit && !prev) flips++;
    prev = s.leaf ? hit : false;      // a fresh leaf resets the latch, which is correct
  }
  assert.ok(flips <= 4, `too many strikes (${flips}) - the hit latch is not holding`);
});

test('the swipe whoosh fires once per stroke, not once per frame', () => {
  // The bat pose is re-rendered every frame, so a naive "play it while swiping"
  // would fire the whoosh 16 times a second and turn into a hiss. One stroke is
  // one half-period of the swing, and the sound belongs at the START of a stroke,
  // when the paw is accelerating.
  const h = loadOverlay();
  // sound ON for this one: the whoosh is gated on config.soundOn, and the other
  // tests here run silent.
  h.ipc('onConfig', { species: 'cat', soundOn: true, followCursor: true, floorLock: true, butterflyOn: false });
  h.run('var __swipes = 0; playSwipe = function () { __swipes++; };');
  for (let i = 0; i < 4; i++) h.ipc('onScroll', 1);
  const frames = 40;
  for (let i = 1; i <= frames; i++) {
    if (i % 4 === 0) h.ipc('onScroll', 1);
    h.run(`draw(${i * STEP})`);
  }
  const swipes = h.run('__swipes');
  assert.ok(swipes > 0, 'a swiping pet should make some noise');
  assert.ok(swipes < frames / 2,
    `${swipes} whooshes in ${frames} frames means it is firing per frame, not per stroke`);
});
