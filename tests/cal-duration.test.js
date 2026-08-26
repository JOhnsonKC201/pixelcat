// Focus Guard asks "am I in a meeting right now?", which needs an END time on every
// event. The .ics feed does not always carry one, and a recurring event carries it
// only on the master - each occurrence from the rrule expansion is a bare start.
// durationOf is what fills that gap, so the edges worth pinning are the ones where
// a wrong answer silences the pet for far too long or not at all.
const test = require('node:test');
const assert = require('node:assert');

const { durationOf, DEFAULT_EVENT_MS, MAX_EVENT_MS } = require('../src/cal-worker.js');

const MIN = 60 * 1000;
const d = (iso) => new Date(iso);

test('a normal event reports its real length', () => {
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z'), end: d('2026-01-05T10:30:00Z') }), 30 * MIN);
  assert.strictEqual(durationOf({ start: d('2026-01-05T09:00:00Z'), end: d('2026-01-05T11:00:00Z') }), 120 * MIN);
});

test('a missing DTEND falls back to half an hour', () => {
  // The overwhelmingly common default meeting length, and short enough that a
  // wrong guess stops hushing the pet quickly rather than for the rest of the day.
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z') }), DEFAULT_EVENT_MS);
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z'), end: null }), DEFAULT_EVENT_MS);
});

test('nonsense dates fall back rather than producing a negative window', () => {
  // A negative or zero length would make meetingNow() skip the event entirely,
  // which is a silent "you are never busy" - worse than a slightly wrong guess.
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z'), end: d('2026-01-05T09:00:00Z') }), DEFAULT_EVENT_MS);
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z'), end: d('2026-01-05T10:00:00Z') }), DEFAULT_EVENT_MS);
  assert.strictEqual(durationOf({ start: 'not a date', end: 'also not' }), DEFAULT_EVENT_MS);
  assert.strictEqual(durationOf({}), DEFAULT_EVENT_MS);
  assert.strictEqual(durationOf(null), DEFAULT_EVENT_MS);
});

test('a runaway length is clamped to a day', () => {
  // One broken feed entry must not claim to run for a decade.
  assert.strictEqual(durationOf({ start: d('2026-01-05T10:00:00Z'), end: d('2036-01-05T10:00:00Z') }), MAX_EVENT_MS);
  assert.strictEqual(MAX_EVENT_MS, 24 * 60 * MIN);
});

test('an all-day event keeps its real 24h length', () => {
  // durationOf must NOT special-case this: reporting it honestly is what lets
  // focus.js recognise it as "not a meeting" and ignore it. Shortening it here
  // would make an all-day block look like a real meeting instead.
  const allDay = durationOf({ start: d('2026-01-05T00:00:00Z'), end: d('2026-01-06T00:00:00Z') });
  assert.strictEqual(allDay, 24 * 60 * MIN);
});
