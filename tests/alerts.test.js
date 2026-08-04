// Alert delivery tests.
//
// Every "stay on track" feature - reminders, break nudges, calendar events, mail,
// notify.js, the agent's "Task complete!" - reaches you through ONE speech bubble.
// That bubble used to be a single pair of variables that each new alert overwrote
// on arrival, and main.js only suppresses repeats of an IDENTICAL message, so two
// different alerts landing together (two reminders set for the same minute, or a
// reminder arriving during a calendar nudge) meant the first was replaced possibly
// milliseconds after it appeared, and was never read.
//
// These drive the real overlay loop and read back what was actually on screen.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { loadOverlay } = require('../scripts/overlay-vm.js');

// Record every string handed to drawBubble, frame by frame.
function loadWatched() {
  const h = loadOverlay();
  h.run(`
    var __bubbles = [];
    var __realDrawBubble = drawBubble;
    drawBubble = function (cx, topY, text, alpha) { __bubbles.push(text); return __realDrawBubble(cx, topY, text, alpha); };
    config = Object.assign({}, config || {}, { soundOn: false, pinnedNote: '' });
  `);
  return h;
}

// performance.now() is pinned at 0 by the harness, so alerts are stamped from t=0
// while draw() is handed whatever clock we choose. Drive from 0 to match.
function frames(h, from, to, stepMs) {
  for (let t = from; t <= to; t += stepMs) h.run(`draw(${t})`);
}
const shown = (h) => h.run('__bubbles.slice()');
const clear = (h) => h.run('__bubbles.length = 0; 1');

test('a single alert is shown', () => {
  const h = loadWatched();
  h.run(`triggerNotify({ message: 'Stand up', ttl: 1000 })`);
  clear(h);
  frames(h, 0, 400, 100);
  assert.ok(shown(h).includes('Stand up'), 'the alert never reached the bubble');
});

test('two alerts arriving together are both shown, not overwritten', () => {
  const h = loadWatched();
  h.run(`triggerNotify({ message: 'FIRST', ttl: 1000 }); triggerNotify({ message: 'SECOND', ttl: 1000 })`);
  clear(h);
  frames(h, 0, 3000, 50);
  const seen = shown(h);
  assert.ok(seen.includes('FIRST'), 'the first alert was dropped by the second');
  assert.ok(seen.includes('SECOND'), 'the second alert never got its turn');
  assert.ok(seen.indexOf('FIRST') < seen.indexOf('SECOND'), 'alerts should play in the order they arrived');
});

test('the first alert keeps its full time on screen before the second appears', () => {
  const h = loadWatched();
  h.run(`triggerNotify({ message: 'FIRST', ttl: 1000 }); triggerNotify({ message: 'SECOND', ttl: 1000 })`);
  clear(h);
  frames(h, 0, 900, 50);   // still inside the first alert's 1000ms
  const seen = shown(h);
  assert.ok(seen.length > 0, 'nothing drew at all');
  assert.ok(!seen.includes('SECOND'), 'the queued alert cut in front of the one being read');
  assert.strictEqual(seen[seen.length - 1], 'FIRST');
});

test('a burst of alerts is capped rather than queued forever', () => {
  const h = loadWatched();
  h.run(`for (var i = 0; i < 40; i++) triggerNotify({ message: 'msg' + i, ttl: 500 });`);
  const queued = h.run('bubbleQueue.length');
  assert.ok(queued <= h.run('BUBBLE_QUEUE_MAX'), `queue grew to ${queued}`);
});

test('the queue drains through a hunt, which renders in its own pose branch', () => {
  const h = loadWatched();
  h.run(`triggerNotify({ message: 'FIRST', ttl: 600 }); triggerNotify({ message: 'SECOND', ttl: 600 })`);
  clear(h);
  // Force the hunt branch for the whole run: the bubble is drawn outside the pose
  // branches on purpose, and the queue has to keep moving there too.
  for (let t = 0; t <= 2500; t += 50) h.run(`huntUntil = ${t + 1000}; draw(${t})`);
  assert.ok(shown(h).includes('SECOND'), 'the queue stalled while the pet was hunting');
});

test('the pinned note comes back once the alerts have played out', () => {
  const h = loadWatched();
  h.run(`config.pinnedNote = 'ship the release'; triggerNotify({ message: 'ALERT', ttl: 400 })`);
  clear(h);
  frames(h, 0, 2000, 50);
  const seen = shown(h);
  assert.ok(seen.includes('ALERT'), 'the alert never showed');
  assert.ok(seen.some((s) => s && s.includes('ship the release')), 'the pinned note never came back');
});

// --- calendar titles -------------------------------------------------------

test('calendar event titles are length-capped before they become an alert', () => {
  const { eventTitle } = require(path.join(__dirname, '..', 'src', 'cal.js'));
  const long = 'Weekly sync: platform, infra, and the Q3 migration follow-ups, bring your notes and the deck';
  const out = eventTitle(long);
  assert.ok(out.length < long.length, 'an over-long event title was passed through untouched');
  assert.ok(out.endsWith('…'), 'a cut title should show that it was cut');
  assert.strictEqual(eventTitle('Standup'), 'Standup', 'a short title should be untouched');
  assert.strictEqual(eventTitle('  spaced   out  '), 'spaced out', 'whitespace should be collapsed');
  assert.strictEqual(eventTitle(''), 'Event', 'an untitled event still needs something to say');
  assert.strictEqual(eventTitle(null), 'Event');
});
