// Lightweight smoke tests (run with: npm test -> node --test). No Electron needed:
// config.js/themes.js only destructure `app` at top level (unused by the pure
// functions we test), and agent-hook.js is a standalone Node script.
const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

test('agent-hook.js writes the state file and replies with permissive JSON', () => {
  const out = execFileSync('node', [path.join(ROOT, 'agent-hook.js'), 'working'], { input: '{"event":"x"}', encoding: 'utf8' });
  assert.match(out, /"continue"\s*:\s*true/);
  const state = fs.readFileSync(path.join(os.tmpdir(), 'pixelcat-agent.state'), 'utf8').trim();
  assert.strictEqual(state, 'working');
});

test('agent-hook.js handles each known state', () => {
  for (const s of ['thinking', 'done', 'idle']) {
    execFileSync('node', [path.join(ROOT, 'agent-hook.js'), s], { encoding: 'utf8' });
    const state = fs.readFileSync(path.join(os.tmpdir(), 'pixelcat-agent.state'), 'utf8').trim();
    assert.strictEqual(state, s);
  }
});

test('scripts/notify.js appends a valid JSON line and replies', () => {
  const bridge = path.join(os.tmpdir(), 'pixelcat-notify.jsonl');
  try { fs.unlinkSync(bridge); } catch (e) { /* fresh */ }
  const out = execFileSync('node', [path.join(ROOT, 'scripts', 'notify.js'), 'hello cat', '--title', 'CI', '--level', 'success', '--no-sound'], { input: '{"event":"x"}', encoding: 'utf8' });
  assert.match(out, /"continue"\s*:\s*true/);
  const lines = fs.readFileSync(bridge, 'utf8').trim().split('\n');
  const o = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(o.message, 'hello cat');
  assert.strictEqual(o.title, 'CI');
  assert.strictEqual(o.level, 'success');
  assert.strictEqual(o.sound, false);
  assert.ok(o.id && o.ts, 'has id + ts');
  // empty message -> no throw, still replies, appends nothing new
  const before = fs.readFileSync(bridge, 'utf8');
  const out2 = execFileSync('node', [path.join(ROOT, 'scripts', 'notify.js')], { encoding: 'utf8' });
  assert.match(out2, /"continue"\s*:\s*true/);
  assert.strictEqual(fs.readFileSync(bridge, 'utf8'), before, 'empty message appends nothing');
});

test('config.normalize fills defaults and clamps', () => {
  const { normalize, DEFAULTS } = require(path.join(ROOT, 'src', 'config.js'));
  const c = normalize({});
  assert.strictEqual(c.moodOn, true);
  assert.strictEqual(c.soundOn, true);
  const { PATTERN_NAMES } = require(path.join(ROOT, 'src', 'patterns.js'));
  assert.strictEqual(c.pattern, PATTERN_NAMES.indexOf('Tuxedo'));   // tuxedo is the default coat
  assert.ok(Array.isArray(c.reminders));
  assert.strictEqual(normalize({ pattern: 999 }).pattern <= (DEFAULTS ? 11 : 11), true);
  assert.strictEqual(normalize({ moodOn: false }).moodOn, false);
  assert.strictEqual(normalize({}).onTop, true);
  assert.strictEqual(normalize({ onTop: false }).onTop, false);
  assert.strictEqual(normalize({}).playArea, null);
  const pa = normalize({ playArea: { x: 0.5, y: 0.6, w: 0.5, h: 0.4 } }).playArea;
  assert.ok(pa && pa.x === 0.5 && pa.w === 0.5, "valid play area kept");
  assert.strictEqual(normalize({ playArea: { x: 0.5 } }).playArea, null, "incomplete play area dropped");
  // pomodoro: defaults, clamps, and junk coercion
  assert.deepStrictEqual(normalize({}).pomodoro, { on: false, focusMin: 25, breakMin: 5 });
  assert.deepStrictEqual(normalize({ pomodoro: { on: 1, focusMin: 999, breakMin: 0 } }).pomodoro, { on: true, focusMin: 120, breakMin: 1 });
  assert.deepStrictEqual(normalize({ pomodoro: 'junk' }).pomodoro, { on: false, focusMin: 25, breakMin: 5 });
  // pinned note: trimmed + capped at 80 chars
  assert.strictEqual(normalize({}).pinnedNote, '');
  assert.strictEqual(normalize({ pinnedNote: '  hi  ' }).pinnedNote, 'hi');
  assert.strictEqual(normalize({ pinnedNote: 'x'.repeat(200) }).pinnedNote.length, 80);
  // desktop alerts default on, coerces
  assert.strictEqual(normalize({}).notifyOn, true);
  assert.strictEqual(normalize({ notifyOn: false }).notifyOn, false);
  assert.strictEqual(normalize({ notifyOn: 1 }).notifyOn, true);
  // low power off by default; auto-on-battery on by default; both coerce to bool
  assert.strictEqual(normalize({}).lowPower, false);
  assert.strictEqual(normalize({ lowPower: 1 }).lowPower, true);
  assert.strictEqual(normalize({}).lowPowerOnBattery, true);
  assert.strictEqual(normalize({ lowPowerOnBattery: false }).lowPowerOnBattery, false);
  assert.strictEqual(normalize({ lowPowerOnBattery: 0 }).lowPowerOnBattery, false);
});

test('reminder recurrence normalizes (back-compat + clamps)', () => {
  const { normalize } = require(path.join(ROOT, 'src', 'config.js'));
  // legacy {id,hhmm,message} -> daily, empty days, no lastFired
  const legacy = normalize({ reminders: [{ id: 'a', hhmm: '08:00', message: 'hi' }] }).reminders[0];
  assert.strictEqual(legacy.recur, 'daily');
  assert.deepStrictEqual(legacy.days, []);
  assert.strictEqual(legacy.lastFired, '');
  // invalid recur -> daily
  assert.strictEqual(normalize({ reminders: [{ hhmm: '08:00', message: 'x', recur: 'bogus' }] }).reminders[0].recur, 'daily');
  // weekdays kept
  assert.strictEqual(normalize({ reminders: [{ hhmm: '08:00', message: 'x', recur: 'weekdays' }] }).reminders[0].recur, 'weekdays');
  // weekly days deduped, clamped, sorted; only stored for weekly
  const wk = normalize({ reminders: [{ hhmm: '08:00', message: 'x', recur: 'weekly', days: [6, 1, 1, 9, -2, 3] }] }).reminders[0];
  assert.deepStrictEqual(wk.days, [1, 3, 6]);
  // once: lastFired validated, kept only for once
  const once = normalize({ reminders: [{ hhmm: '08:00', message: 'x', recur: 'once', lastFired: '2026-6-9' }] }).reminders[0];
  assert.strictEqual(once.lastFired, '2026-6-9');
  assert.strictEqual(normalize({ reminders: [{ hhmm: '08:00', message: 'x', recur: 'once', lastFired: 'junk' }] }).reminders[0].lastFired, '');
});

test('email config normalizes + clamps', () => {
  const { normalize } = require(path.join(ROOT, 'src', 'config.js'));
  assert.deepStrictEqual(normalize({}).email, { on: false, host: '', port: 993, user: '', secure: true, intervalMin: 5 });
  const e = normalize({ email: { on: 1, host: '  imap.gmail.com ', port: 99999, user: 'a@b.com', secure: false, intervalMin: 0 } }).email;
  assert.strictEqual(e.on, true);
  assert.strictEqual(e.host, 'imap.gmail.com');
  assert.strictEqual(e.port, 65535);
  assert.strictEqual(e.user, 'a@b.com');
  assert.strictEqual(e.secure, false);
  assert.strictEqual(e.intervalMin, 1);
  assert.deepStrictEqual(normalize({ email: 'junk' }).email, { on: false, host: '', port: 993, user: '', secure: true, intervalMin: 5 });
});

test('calendar config normalizes (url validation + webcal + clamp)', () => {
  const { normalize } = require(path.join(ROOT, 'src', 'config.js'));
  assert.deepStrictEqual(normalize({}).calendar, { on: false, icsUrl: '', leadMin: 10 });
  assert.strictEqual(normalize({ calendar: { icsUrl: 'https://x/basic.ics' } }).calendar.icsUrl, 'https://x/basic.ics');
  assert.strictEqual(normalize({ calendar: { icsUrl: 'webcal://x/basic.ics' } }).calendar.icsUrl, 'https://x/basic.ics');
  assert.strictEqual(normalize({ calendar: { icsUrl: 'ftp://nope' } }).calendar.icsUrl, '', 'non-http url dropped');
  assert.strictEqual(normalize({ calendar: { leadMin: 99999 } }).calendar.leadMin, 1440);
  assert.strictEqual(normalize({ calendar: { on: 1 } }).calendar.on, true);
  assert.deepStrictEqual(normalize({ calendar: 'junk' }).calendar, { on: false, icsUrl: '', leadMin: 10 });
});

test('imapHostFor infers/corrects the IMAP server', () => {
  const { imapHostFor } = require(path.join(ROOT, 'src', 'mail.js'));
  // infer from the email domain when the host is blank
  assert.strictEqual(imapHostFor('me@gmail.com', ''), 'imap.gmail.com');
  assert.strictEqual(imapHostFor('me@outlook.com', ''), 'outlook.office365.com');
  assert.strictEqual(imapHostFor('me@yahoo.com', ''), 'imap.mail.yahoo.com');
  assert.strictEqual(imapHostFor('me@icloud.com', ''), 'imap.mail.me.com');
  // correct the obviously-wrong web host (the reported bug)
  assert.strictEqual(imapHostFor('me@gmail.com', 'www.gmail.com'), 'imap.gmail.com');
  assert.strictEqual(imapHostFor('me@gmail.com', 'mail.google.com'), 'imap.gmail.com');
  // a bare provider domain typed as the host maps to its IMAP host
  assert.strictEqual(imapHostFor('me@gmail.com', 'gmail.com'), 'imap.gmail.com');
  // a real/custom host is left untouched (self-hosted must keep working)
  assert.strictEqual(imapHostFor('me@gmail.com', 'imap.gmail.com'), 'imap.gmail.com');
  assert.strictEqual(imapHostFor('me@corp.example', 'mail.corp.example'), 'mail.corp.example');
  // unknown domain + blank host stays blank (no bad guess)
  assert.strictEqual(imapHostFor('me@corp.example', ''), '');
});

test('fillPlaceholders expands {name}{time}{date}{count} and tidies punctuation', () => {
  const { fillPlaceholders } = require(path.join(ROOT, 'src', 'template.js'));
  const now = new Date(2026, 0, 2, 9, 5); // 2026-01-02 09:05 (local)
  assert.strictEqual(fillPlaceholders('Hi {name}!', { name: 'Jo', now }), 'Hi Jo!');
  assert.strictEqual(fillPlaceholders('Hi {name}!', { name: '', now }), 'Hi!'); // stray space before ! tidied
  assert.strictEqual(fillPlaceholders('It is {time} on {date}', { now }), 'It is 09:05 on 2026-01-02');
  assert.strictEqual(fillPlaceholders('{count} new mail', { count: 3, now }), '3 new mail');
  assert.strictEqual(fillPlaceholders(null, {}), '');
});

test('themes.clean keeps valid coats and drops invalid/dupes', () => {
  const themes = require(path.join(ROOT, 'src', 'themes.js'));
  const valid = { name: 'Galaxy', build: 'fluffy', tabby: false, coat: '#3b2f63', mark: '#2a2147', white: '#c9c0e8', patch: '#7a5cc0', eye: '#7fd6ff', nose: '#e0a0c0', inner: '#9a7ad0', outline: '#15101f' };
  const missingColor = { name: 'Bad', build: 'standard', coat: '#3b2f63' };
  const out = themes.clean([valid, missingColor, { ...valid }]);
  assert.strictEqual(out.length, 1, 'invalid dropped + duplicate name deduped');
  assert.strictEqual(out[0].name, 'Galaxy');
  assert.strictEqual(out[0].build, 'fluffy');
  // bad build falls back to standard
  assert.strictEqual(themes.clean([{ ...valid, name: 'X', build: 'nope' }])[0].build, 'standard');
});

test('shipped integration JSON configs parse', () => {
  for (const f of ['claude-code/settings.hooks.json', 'cursor/hooks.json']) {
    const p = path.join(ROOT, 'integrations', f);
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(p, 'utf8')), `valid JSON: ${f}`);
  }
});

test('install-hook prints a path-filled config for every agent', () => {
  for (const a of ['claude-code', 'codex', 'cursor', 'antigravity', 'kiro']) {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', 'install-hook.js'), a], { encoding: 'utf8' });
    assert.ok(out.includes('agent-hook.js'), `${a}: mentions agent-hook.js`);
    assert.ok(!out.includes('/ABS/PATH') && !out.includes('/ABSOLUTE/PATH'), `${a}: placeholder path replaced`);
  }
});
