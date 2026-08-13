// Quiet Hours: the pet's daily do-not-disturb window. Two things are worth
// pinning down and easy to get subtly wrong - the clock maths for a window that
// wraps past midnight, and that the config schema only ever hands main.js a valid
// { on, start, end }. Both are pure, so neither needs Electron.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { inQuietHours, toMinutes } = require(path.join(ROOT, 'src', 'quiet-hours.js'));
const { normalize } = require(path.join(ROOT, 'src', 'config.js'));

// A Date fixed at a given wall-clock time (only the fields inQuietHours reads).
const at = (h, m) => new Date(2020, 0, 1, h, m, 0);

test('toMinutes parses valid HH:MM and rejects the rest', () => {
  assert.strictEqual(toMinutes('00:00'), 0);
  assert.strictEqual(toMinutes('08:30'), 510);
  assert.strictEqual(toMinutes('23:59'), 1439);
  for (const bad of ['24:00', '8:30', '22:60', '', 'nope', null, undefined]) {
    assert.strictEqual(toMinutes(bad), null, `${bad} should not parse`);
  }
});

test('a window that wraps past midnight (22:00 -> 08:00)', () => {
  const q = { on: true, start: '22:00', end: '08:00' };
  assert.strictEqual(inQuietHours(q, at(23, 0)), true);   // late night
  assert.strictEqual(inQuietHours(q, at(3, 0)), true);    // small hours
  assert.strictEqual(inQuietHours(q, at(22, 0)), true);   // closed at the start
  assert.strictEqual(inQuietHours(q, at(8, 0)), false);   // open at the end
  assert.strictEqual(inQuietHours(q, at(7, 59)), true);   // one minute before the end
  assert.strictEqual(inQuietHours(q, at(12, 0)), false);  // midday
});

test('a same-day window (09:00 -> 17:00)', () => {
  const q = { on: true, start: '09:00', end: '17:00' };
  assert.strictEqual(inQuietHours(q, at(12, 0)), true);
  assert.strictEqual(inQuietHours(q, at(9, 0)), true);
  assert.strictEqual(inQuietHours(q, at(17, 0)), false);
  assert.strictEqual(inQuietHours(q, at(8, 59)), false);
  assert.strictEqual(inQuietHours(q, at(23, 0)), false);
});

test('off, and an empty (start === end) window, are never quiet', () => {
  assert.strictEqual(inQuietHours({ on: false, start: '22:00', end: '08:00' }, at(2, 0)), false);
  assert.strictEqual(inQuietHours({ on: true, start: '10:00', end: '10:00' }, at(10, 0)), false);
  assert.strictEqual(inQuietHours({ on: true, start: '10:00', end: '10:00' }, at(3, 0)), false);
  assert.strictEqual(inQuietHours(null, at(2, 0)), false);
});

test('quietHours config normalizes (defaults, on flag, invalid times)', () => {
  assert.deepStrictEqual(normalize({}).quietHours, { on: false, start: '22:00', end: '08:00' });
  assert.deepStrictEqual(
    normalize({ quietHours: { on: true, start: '23:15', end: '06:45' } }).quietHours,
    { on: true, start: '23:15', end: '06:45' });
  // Garbage times fall back to the defaults; a truthy `on` is coerced to a bool.
  assert.deepStrictEqual(
    normalize({ quietHours: { on: 1, start: '9:9', end: 'noon' } }).quietHours,
    { on: true, start: '22:00', end: '08:00' });
  // A non-object quietHours is replaced wholesale, not carried through.
  assert.deepStrictEqual(normalize({ quietHours: 'yes' }).quietHours, { on: false, start: '22:00', end: '08:00' });
});
