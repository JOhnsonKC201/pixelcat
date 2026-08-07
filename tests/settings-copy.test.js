// The settings window's wording is data (pets.js SETTINGS_TEXT) applied to element
// ids by settings-renderer.js. Nothing here boots Electron: the point is that the
// strings resolve for every species and that the ids they target still exist in the
// markup, which is exactly the pair that drifts apart silently.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const pets = require('../src/pets.js');

const SRC = path.join(__dirname, '..', 'src');
const html = fs.readFileSync(path.join(SRC, 'settings.html'), 'utf8');
const renderer = fs.readFileSync(path.join(SRC, 'settings-renderer.js'), 'utf8');

const idsIn = (s) => new Set([...s.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]));
const HTML_IDS = idsIn(html);

// "is this pattern still in the source" checks have to read the CODE, not the prose
// around it - the comment explaining why window.DOG_PATTERNS was wrong otherwise
// trips the guard against window.DOG_PATTERNS. Whole-line comments only, so a URL
// in a string keeps its line.
const codeOnly = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
const RENDERER_CODE = codeOnly(renderer);

test('every settings string resolves for every species', () => {
  for (const id of pets.SPECIES_IDS) {
    const text = pets.settingsText(id);
    assert.deepEqual(Object.keys(text).sort(), Object.keys(pets.SETTINGS_TEXT).sort(),
      `${id} resolved a different set of keys than the template`);
    for (const [key, s] of Object.entries(text)) {
      assert.ok(s && s.trim(), `${id}.${key} resolved to nothing`);
      assert.doesNotMatch(s, /%\w+%/, `${id}.${key} left an unresolved token: ${s}`);
    }
  }
});

test('every string the window writes has somewhere to be written', () => {
  // applySpeciesText() looks each key up with getElementById and quietly skips a
  // miss, so renaming an id in the markup would blank the species wording on that
  // row with nothing to notice it by.
  for (const key of Object.keys(pets.SETTINGS_TEXT)) {
    assert.ok(HTML_IDS.has(key), `SETTINGS_TEXT.${key} targets an id that settings.html does not have`);
  }
});

test('a dog owner is never told about a cat', () => {
  // Regression: the window hard-coded the cat's nouns, so a dog owner read "the cat
  // calls you by it" and "Butterfly visits" while the TRAY - reading the same
  // registry - already said "Ball to chase".
  const dog = pets.settingsText('dog');
  // coatsHint is the one exception: its whole job is to say the feature is cat-only.
  for (const [key, s] of Object.entries(dog)) {
    if (key === 'coatsHint') continue;
    assert.doesNotMatch(s, /\bcats?\b/i, `dog.${key} mentions a cat: ${s}`);
    assert.doesNotMatch(s, /\b(meow|purr|butterfly)\b/i, `dog.${key} uses the cat's vocabulary: ${s}`);
  }
  assert.match(dog.coatsHint, /cat/i, 'the dog needs telling that custom coats are not for it');
});

test('the play toggle says the same thing here as it does in the tray', () => {
  for (const id of pets.SPECIES_IDS) {
    const sp = pets.speciesOf(id);
    const text = pets.settingsText(id);
    assert.equal(text.playTitle, sp.playToggleLabel, `${id}'s settings row and tray item disagree`);
    assert.match(text.playSub, new RegExp(sp.playNoun, 'i'), `${id}'s play blurb never names the ${sp.playNoun}`);
    assert.equal(text.coatLabel, sp.coatNoun);
  }
});

test('reminder placeholders survive the species pass', () => {
  // Species tokens are %percent% precisely so this hint can keep advertising the
  // {name}/{time}/{date} placeholders that fillPlaceholders expands much later. A
  // resolver that also ate braces would silently delete the documentation for them.
  for (const id of pets.SPECIES_IDS) {
    const hint = pets.settingsText(id).remindersHint;
    for (const ph of ['{name}', '{time}', '{date}']) {
      assert.ok(hint.includes(ph), `${id}'s reminder hint lost ${ph}`);
    }
  }
});

test('an unknown token is left visible rather than blanked', () => {
  const out = pets.settingsText('cat');
  assert.ok(Object.keys(out).length > 0);
  // speciesOf() falls back to the cat, so a bad species must not blank the window.
  assert.deepEqual(pets.settingsText('ferret'), pets.settingsText('cat'));
});

test('every tab points at a panel that exists, and exactly one starts open', () => {
  const tabs = [...html.matchAll(/<button class="tab"[^>]*data-panel="(\w+)"[^>]*>/g)].map((m) => m[0]);
  assert.ok(tabs.length >= 2, 'the section rail vanished');
  const panels = [...html.matchAll(/<section class="panel"[^>]*id="panel-(\w+)"([^>]*)>/g)];
  assert.equal(tabs.length, panels.length, 'a tab has no panel (or a panel has no tab)');

  for (const t of tabs) {
    const key = /data-panel="(\w+)"/.exec(t)[1];
    assert.ok(HTML_IDS.has('panel-' + key), `tab "${key}" controls a panel that does not exist`);
    assert.ok(t.includes(`aria-controls="panel-${key}"`), `tab "${key}" mislabels the panel it controls`);
  }
  // Exactly one panel ships without `hidden`; selectTab() then keeps hidden and
  // aria-selected in step. Two visible panels would stack on first paint.
  const open = panels.filter(([, , attrs]) => !/\bhidden\b/.test(attrs));
  assert.equal(open.length, 1, `expected 1 panel open on load, found ${open.length}`);
});

test('the window no longer calls itself pixelcat', () => {
  // The 0.3.0 rebrand renamed the app, the repo and the docs but left the settings
  // header reading "pixelcat" at people who had just picked a dog.
  const header = /<div class="hdr">[\s\S]*?<\/div>/.exec(html);
  assert.ok(header, 'settings header is gone');
  assert.doesNotMatch(header[0], /pixelcat/i);
  assert.match(header[0], /pixel<\/i>pets/);
});

test('the dog preview reads its sprite tables the only way they exist', () => {
  // Regression: drawPreview asked for window.DOG_PATTERNS. dog-sprite.js is a classic
  // script, so its top-level `const`s are global LEXICAL bindings and never become
  // window properties - the lookup returned undefined, drawPreview bailed, and the
  // settings window showed a cat to anyone who picked a dog. If dog-sprite.js ever
  // grows a window-export branch this guard can relax; until then, bare identifiers.
  const dogSrc = codeOnly(fs.readFileSync(path.join(SRC, 'dog-sprite.js'), 'utf8'));
  assert.doesNotMatch(dogSrc, /window\s*\.\s*DOG_|Object\.assign\(\s*window/,
    'dog-sprite.js now exports to window; the settings renderer may use window.DOG_* again');
  assert.doesNotMatch(RENDERER_CODE, /window\s*\.\s*DOG_(PATTERNS|BUILDS|PATTERN_BUILD|TAILS)\b/,
    'settings-renderer.js is reading dog tables off window, where they do not exist');
});

test('the renderer applies the copy instead of hard-coding it again', () => {
  assert.match(RENDERER_CODE, /settingsText\(/, 'settings-renderer.js stopped using the registry');
  // The two strings that used to be chosen inline, so a revert shows up here.
  assert.doesNotMatch(RENDERER_CODE, /'Breed'|"Breed"/, 'coat label is hard-coded again');
  assert.doesNotMatch(RENDERER_CODE, /meow & purr|bark & pant/, 'voice line is hard-coded again');
});
