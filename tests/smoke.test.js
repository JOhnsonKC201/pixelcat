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

test('config.normalize fills defaults and clamps', () => {
  const { normalize, DEFAULTS } = require(path.join(ROOT, 'src', 'config.js'));
  const c = normalize({});
  assert.strictEqual(c.moodOn, true);
  assert.strictEqual(c.soundOn, true);
  assert.strictEqual(c.pattern, 0);
  assert.ok(Array.isArray(c.reminders));
  assert.strictEqual(normalize({ pattern: 999 }).pattern <= (DEFAULTS ? 11 : 11), true);
  assert.strictEqual(normalize({ moodOn: false }).moodOn, false);
  assert.strictEqual(normalize({}).playArea, null);
  const pa = normalize({ playArea: { x: 0.5, y: 0.6, w: 0.5, h: 0.4 } }).playArea;
  assert.ok(pa && pa.x === 0.5 && pa.w === 0.5, "valid play area kept");
  assert.strictEqual(normalize({ playArea: { x: 0.5 } }).playArea, null, "incomplete play area dropped");
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
