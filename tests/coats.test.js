// Coat-index tests.
//
// A coat is stored as an INDEX into a list that is assembled in four places - the
// tray submenu (main.js), the settings dropdown (settings-renderer.js), the
// overlay's PATTERNS table (renderer.js) and the clamp in config.js - and every one
// of them has to agree on what number means what. They did not: config.js clamped
// the index at the last BUILT-IN coat while both pickers listed the user's custom
// coats after it, so picking any custom coat was silently rewritten to the last
// built-in one. You could design a coat, see it in both menus, pick it, and watch
// the cat stay exactly as it was. These tests pin the shared numbering down.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { loadOverlay } = require('../scripts/overlay-vm.js');

const ROOT = path.join(__dirname, '..');
const { normalize, coatAfterThemeRemoval } = require(path.join(ROOT, 'src', 'config.js'));
const themes = require(path.join(ROOT, 'src', 'themes.js'));
const { PATTERN_NAMES } = require(path.join(ROOT, 'src', 'patterns.js'));
const { coatsFor } = require(path.join(ROOT, 'src', 'pets.js'));

const BUILTIN = PATTERN_NAMES.length;
const theme = (name) => ({
  name, build: 'standard', tabby: false,
  coat: '#123456', mark: '#123456', white: '#ffffff', patch: '#123456',
  eye: '#8bbf5a', nose: '#e0888f', inner: '#f0b6a0', outline: '#222831',
});

test('every coat index the pickers can offer survives normalize', () => {
  // The tray and the settings dropdown both list the built-in coats and then the
  // custom ones, so the highest index either can hand back is built-ins + the cap
  // themes.clean() enforces. Anything normalize rewrites inside that range is a
  // coat the user picked and did not get.
  for (let i = 0; i < BUILTIN + themes.MAX_THEMES; i++) {
    assert.strictEqual(normalize({ pattern: i }).pattern, i, `coat index ${i} was rewritten`);
  }
});

test('a dog still cannot be given a coat that is not a breed', () => {
  // Custom coats are cat-only, so the dog's index stays bounded by the breed list.
  assert.strictEqual(normalize({ species: 'dog', dogPattern: coatsFor('dog').length }).dogPattern, coatsFor('dog').length - 1);
});

test('themes.clean caps the stored coat list', () => {
  // An imported themes.json is arbitrary user data; the overlay builds a full set
  // of sprites per coat, so an unbounded list is a stall waiting to happen. The cap
  // is also what keeps the config coat ceiling above finite.
  const many = Array.from({ length: themes.MAX_THEMES + 40 }, (_, i) => theme('t' + i));
  assert.strictEqual(themes.clean(many).length, themes.MAX_THEMES);
});

test('deleting a custom coat re-anchors the one the cat is wearing', () => {
  // Custom coats are addressed by position, so removing one shifts every coat after
  // it down a slot. Without re-anchoring, deleting the first of two silently
  // repaints the cat in the second.
  assert.strictEqual(coatAfterThemeRemoval(BUILTIN + 1, 0), BUILTIN, 'a coat below the deleted one should follow it up a slot');
  assert.strictEqual(coatAfterThemeRemoval(BUILTIN, 1), BUILTIN, 'deleting a LATER coat must not move this one');
  assert.strictEqual(coatAfterThemeRemoval(3, 0), 3, 'built-in coats never move');
  // Deleting the coat the cat is actually wearing leaves the index pointing past
  // the end of the list, which shows up as a blank selection in Settings.
  assert.strictEqual(coatAfterThemeRemoval(BUILTIN, 0), normalize({}).pattern, 'the worn coat falls back to the default');
});

// ---- overlay ---------------------------------------------------------------

const overlay = (species, themeList) => {
  const h = loadOverlay();
  if (species) h.run(`setSpecies(${JSON.stringify(species)})`);
  if (themeList) h.ipc('onThemes', themeList);
  return h;
};

test('the overlay offers custom coats to a cat and only breeds to a dog', () => {
  const cat = overlay('cat', [theme('Mine')]);
  assert.strictEqual(cat.run('PATTERNS.length'), BUILTIN + 1);
  assert.strictEqual(cat.run('PATTERNS[PATTERNS.length - 1].name'), 'Mine');

  const dog = overlay('dog', [theme('Mine')]);
  assert.strictEqual(dog.run('PATTERNS.length'), coatsFor('dog').length,
    'custom coats are cat-only, so a dog must not be given indices the tray and config.js will not accept');
});

test('custom coats survive a species round-trip', () => {
  // Main only broadcasts themes when they CHANGE, and a species swap rebuilds the
  // coat tables from the built-ins, so the swap has to replay them itself. It did
  // not: cat -> dog -> cat dropped every custom coat until the next restart.
  const h = overlay('cat', [theme('Mine')]);
  h.run('setSpecies("dog")');
  h.run('setSpecies("cat")');
  assert.strictEqual(h.run('PATTERNS.length'), BUILTIN + 1, 'the custom coat vanished on the way back');
});

test('the coat a config asks for wins whichever order config and themes arrive in', () => {
  // A custom coat's index is only in range once its theme has been built, so a
  // config that lands first used to be clamped down to a built-in coat and stay
  // there - indistinguishable from picking the coat doing nothing.
  const themeList = [theme('Mine')];
  for (const themesFirst of [true, false]) {
    const h = loadOverlay();
    const cfg = { species: 'cat', pattern: BUILTIN, soundOn: false };
    if (themesFirst) { h.ipc('onThemes', themeList); h.ipc('onConfig', cfg); }
    else { h.ipc('onConfig', cfg); h.ipc('onThemes', themeList); }
    assert.strictEqual(h.run('PATTERNS[patternIndex].name'), 'Mine', `themes ${themesFirst ? 'before' : 'after'} config`);
  }
});

test('right-click cycles the coat into the active species own slot', () => {
  // This wrote to the cat's 'pattern' key whatever the pet was, so a dog's breed
  // was lost on the next launch AND stamped over the cat's stored coat.
  // Only Black Lab ships, so cycling wraps 0 -> 0. The point of the test is which
  // KEY the cycle writes to, not which index it lands on.
  const dog = overlay('dog');
  dog.run('patternIndex = 0');
  dog.run('cycleCoat()');
  assert.strictEqual(dog.store.dogPattern, '0', 'a dog must remember its own breed');
  assert.strictEqual(dog.store.pattern, undefined, "cycling a dog's breed must not touch the cat's coat");

  const cat = overlay('cat');
  cat.run('patternIndex = 2');
  cat.run('cycleCoat()');
  assert.strictEqual(cat.store.pattern, '3');
});

test('right-click wraps within the coats the active species actually has', () => {
  // Cycling a dog over the cat's custom coats picked an index main clamped straight
  // back on the echo, so the last breed could never wrap round to the first.
  const dog = overlay('dog', [theme('Mine')]);
  dog.run(`patternIndex = ${coatsFor('dog').length - 1}`);
  dog.run('cycleCoat()');
  assert.strictEqual(dog.run('patternIndex'), 0, 'the last breed should wrap to the first');

  const cat = overlay('cat', [theme('Mine')]);
  cat.run(`patternIndex = ${BUILTIN - 1}`);
  cat.run('cycleCoat()');
  assert.strictEqual(cat.run('PATTERNS[patternIndex].name'), 'Mine', 'a cat should cycle on into its custom coats');
});

test('changing the coat list clears every index-keyed sprite cache', () => {
  // sit/type/loaf/rear are rebuilt wholesale, but the raised-limb poses are built
  // lazily and memoised by coat INDEX - and an index means a different coat after
  // the list changes. batSpriteCache was missed, so the rear-up batting pose kept
  // painting whichever coat used to hold that index.
  const h = overlay('cat');
  h.run('pawSpriteFor(0, 1, 0); batSpriteFor(0, 1, 0)');
  for (const cache of ['pawSpriteCache', 'batSpriteCache']) {
    assert.ok(h.run(`${cache}.size`) > 0, `${cache} should have been populated`);
  }
  h.ipc('onThemes', [theme('Mine')]);
  for (const cache of ['pawSpriteCache', 'batSpriteCache']) {
    assert.strictEqual(h.run(`${cache}.size`), 0, `${cache} was left holding sprites for the old coat order`);
  }
});

test('a coat fallback follows the species that is live now', () => {
  // The default was resolved once at load, so after a swap it still named the
  // launch species' index: a dog falling back landed on coat 4 of the BREED list
  // (a husky) because 4 is where the cat's Tuxedo sits.
  const h = overlay('cat');
  h.run('setSpecies("dog", 999)');   // out-of-range coat -> fall back
  assert.strictEqual(h.run('PATTERNS[patternIndex].name'), 'Black Lab');
  h.run('setSpecies("cat", 999)');
  assert.strictEqual(h.run('PATTERNS[patternIndex].name'), 'Tuxedo');
});
