// Focus Guard decides you are busy in main.js, but the pet only actually settles
// down if the overlay hears about it. That wiring is easy to get wrong in a way no
// unit test notices: main can broadcast happily into a channel nobody registered,
// and the feature silently does nothing. These drive the REAL renderer through the
// same preload bridge Electron uses.
const test = require('node:test');
const assert = require('node:assert');
const { loadOverlay } = require('../scripts/overlay-vm.js');

function overlay() {
  const h = loadOverlay();
  // A config has to land first: workModeOn() reads it, and the renderer starts null.
  h.ipc('onConfig', { workMode: false, soundOn: true, volume: 100, species: 'cat', pattern: 0 });
  return h;
}

test('the overlay registers a focus handler at all', () => {
  // The failure this catches: main.js sends 'focus' and nothing is listening, so
  // the pet keeps chasing butterflies straight through a meeting.
  const h = overlay();
  assert.doesNotThrow(() => h.ipc('onFocus', { busy: true }),
    'renderer never registered window.cat.onFocus - the focus broadcast goes nowhere');
});

test('being busy puts the pet in work mode, and being free takes it out', () => {
  const h = overlay();
  assert.strictEqual(h.run('workModeOn()'), false, 'a fresh overlay is not in work mode');

  h.ipc('onFocus', { busy: true, reason: 'meeting' });
  assert.strictEqual(h.run('workModeOn()'), true, 'a meeting should park the pet');

  h.ipc('onFocus', { busy: false, reason: '' });
  assert.strictEqual(h.run('workModeOn()'), false, 'the pet should get going again afterwards');
});

test('focus never rewrites the user\'s own work-mode setting', () => {
  // The whole reason this is a separate runtime flag. If it wrote through to
  // config.workMode, one meeting would silently leave work mode switched on
  // forever and the user would never know why their pet stopped playing.
  const h = overlay();
  h.ipc('onFocus', { busy: true, reason: 'meeting' });
  assert.strictEqual(h.run('!!(config && config.workMode)'), false,
    'config.workMode must stay exactly as the user left it');
  assert.strictEqual(h.run('workModeOn()'), true);
});

test('a user who chose work mode stays in it after focus releases', () => {
  const h = loadOverlay();
  h.ipc('onConfig', { workMode: true, soundOn: true, volume: 100, species: 'cat', pattern: 0 });
  assert.strictEqual(h.run('workModeOn()'), true);
  h.ipc('onFocus', { busy: true });
  assert.strictEqual(h.run('workModeOn()'), true);
  h.ipc('onFocus', { busy: false });
  assert.strictEqual(h.run('workModeOn()'), true, 'releasing focus must not cancel a setting the user chose');
});

test('a malformed focus payload is treated as not-busy', () => {
  const h = overlay();
  h.ipc('onFocus', { busy: true });
  assert.strictEqual(h.run('workModeOn()'), true);
  h.ipc('onFocus', undefined);
  assert.strictEqual(h.run('workModeOn()'), false, 'a junk payload should release rather than pin the pet');
  h.ipc('onFocus', { busy: true });
  h.ipc('onFocus', {});
  assert.strictEqual(h.run('workModeOn()'), false);
});
