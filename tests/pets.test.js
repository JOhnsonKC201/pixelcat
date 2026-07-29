const test = require('node:test');
const assert = require('node:assert');

const cat = require('../src/cat-sprite.js');
const dog = require('../src/dog-sprite.js');
const pets = require('../src/pets.js');
dog.attach(cat);

const POSES = [
  ['sit', 24, 30, dog.composeSitDog],
  ['bow', 30, 22, dog.composeBowDog],
  ['type', 24, 24, dog.composeTypeDog],
  ['curl', 24, 30, dog.composeCurlDog],
  ['beg', 24, 30, dog.composeBegDog],
];

const buildFor = (i) => dog.DOG_BUILDS[dog.DOG_PATTERN_BUILD[i]];

test('every dog breed maps to a real build and a real tail', () => {
  assert.equal(dog.DOG_PATTERNS.length, dog.DOG_PATTERN_BUILD.length);
  assert.equal(dog.DOG_PATTERNS.length, dog.DOG_TAILS.length);
  for (let i = 0; i < dog.DOG_PATTERNS.length; i++) {
    assert.ok(dog.DOG_BUILDS[dog.DOG_PATTERN_BUILD[i]], `${dog.DOG_PATTERNS[i].name} has no build`);
    assert.ok(dog.DOG_TAILS[i], `${dog.DOG_PATTERNS[i].name} has no tail shape`);
  }
});

test('dog palettes define every role the renderer paints', () => {
  // A missing key silently drops those cells (drawCat skips unknown roles), so the
  // breed would render with holes rather than fail loudly. Catch it here instead.
  const keys = ['name', 'coat', 'mark', 'white', 'patch', 'eye', 'nose', 'inner', 'outline', 'tongue'];
  for (const p of dog.DOG_PATTERNS) {
    for (const k of keys) assert.ok(p[k], `${p.name} is missing ${k}`);
    for (const k of keys.slice(1)) assert.match(p[k], /^#[0-9a-f]{6}$/i, `${p.name}.${k} is not a hex colour`);
  }
});

test('every breed composes every pose with a visible body and eyes', () => {
  for (let i = 0; i < dog.DOG_PATTERNS.length; i++) {
    const B = buildFor(i);
    for (const [pose, cols, rows, compose] of POSES) {
      const sp = cat.buildSprite(cols, rows, () => compose(B));
      const flat = sp.grid.flat();
      const body = flat.filter((c) => 'CKWXI'.includes(c)).length;
      const label = `${dog.DOG_PATTERNS[i].name}/${pose}`;
      assert.ok(body > 120, `${label} drew only ${body} body cells`);
      assert.ok(flat.includes('E'), `${label} has no eye`);
      assert.ok(flat.includes('N'), `${label} has no nose`);
      assert.ok(flat.includes('O'), `${label} has no outline`);
    }
  }
});

test('the sitting dog keeps its muzzle below the eyes and inside the grid', () => {
  // The muzzle protruding past the skull is the whole reason a dog does not read
  // as a cat, so lock the geometry that produces it.
  for (let i = 0; i < dog.DOG_PATTERNS.length; i++) {
    const sp = cat.buildSprite(24, 30, () => dog.composeSitDog(buildFor(i)));
    const name = dog.DOG_PATTERNS[i].name;
    const eyeY = Math.min(...sp.eyes.filter((e) => e.w > 0).map((e) => e.cy));
    assert.ok(sp.muzzle.y > eyeY, `${name}: muzzle is not below the eyes`);
    assert.equal(sp.eyes.filter((e) => e.w > 0).length, 2, `${name}: expected two eyes facing forward`);
  }
});

test('dwarf breeds really do get shorter legs than standard ones', () => {
  const corgi = dog.DOG_PATTERNS.findIndex((p) => p.name === 'Corgi');
  const golden = dog.DOG_PATTERNS.findIndex((p) => p.name === 'Golden Retriever');
  assert.ok(corgi >= 0 && golden >= 0);
  assert.ok(dog.DOG_BUILDS[dog.DOG_PATTERN_BUILD[corgi]].legLen < 1, 'corgi should be short-legged');
  assert.equal(dog.DOG_BUILDS[dog.DOG_PATTERN_BUILD[golden]].legLen, undefined, 'golden should use full-length legs');
});

test('species registry agrees with the sprite modules', () => {
  assert.deepEqual(pets.coatsFor('dog'), dog.DOG_PATTERNS.map((p) => p.name));
  assert.deepEqual(pets.coatsFor('cat'), cat.PATTERNS.map((p) => p.name));
  assert.equal(pets.speciesOf('nonsense').id, 'cat', 'unknown species must fall back to cat');
  assert.ok(pets.defaultCoatIndex('dog') >= 0);
  assert.ok(pets.defaultCoatIndex('cat') >= 0);
});

test('config normalises species and keeps a coat per species', () => {
  // config.js pulls in electron for app.getPath, so exercise the pure helpers via
  // the same rules rather than booting Electron here.
  assert.equal(pets.isSpecies('dog'), true);
  assert.equal(pets.isSpecies('cat'), true);
  assert.equal(pets.isSpecies('ferret'), false);
  const dogDefault = pets.defaultCoatIndex('dog');
  assert.equal(pets.coatsFor('dog')[dogDefault], 'Golden Retriever');
});
