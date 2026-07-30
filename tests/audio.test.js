// Audio-path smoke tests: audio.js (meow/chirp/mrrp/purr) and jam.js (Lobby Jam) are
// browser-scope classic scripts that talk to WebAudio. We run them in a vm context with
// a mock AudioContext so wiring mistakes (bad node method, undefined ref, missing param)
// throw HERE instead of going silent in the app. No Electron / no real audio needed.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let clock = 0;   // mock AudioContext.currentTime, advanced by the scheduler test

function param() {
  return { value: 0, setValueAtTime() { return this; }, linearRampToValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; }, setTargetAtTime() { return this; }, cancelScheduledValues() { return this; } };
}
function node() {
  return { frequency: param(), gain: param(), Q: param(), pan: param(), type: '', curve: null, oversample: '',
    buffer: null, loop: false, threshold: param(), ratio: param(), attack: param(), release: param(),
    connect(n) { return n || node(); }, disconnect() {}, start() {}, stop() {}, onended: null };
}
class MockCtx {
  constructor() { this.sampleRate = 44100; this.destination = node(); this.state = 'running'; }
  get currentTime() { return clock; }
  createGain() { return node(); } createOscillator() { return node(); } createBiquadFilter() { return node(); }
  createStereoPanner() { return node(); } createWaveShaper() { return node(); } createDynamicsCompressor() { return node(); }
  createConvolver() { return node(); } createBufferSource() { return node(); }
  createBuffer(ch, len) { const data = new Float32Array(Math.max(1, len)); return { getChannelData: () => data, length: len }; }
  resume() {}
}

// audio.js + jam.js are concatenated into ONE script so jam.js sees audio.js's
// top-level `master`/`audio()` (exactly as classic <script> tags share global scope).
// The mock setInterval captures the jam scheduler so a test can drive it by hand.
function loadAudioJam() {
  clock = 0;
  const sandbox = { window: { AudioContext: MockCtx }, config: { soundOn: true, volume: 100 },
    patternIndex: 0, PATTERN_BUILD: ['standard', 'slender', 'stocky', 'fluffy'], Math, Float32Array, console };
  sandbox.setInterval = (fn) => { sandbox.__sched = fn; return 1; };
  sandbox.clearInterval = () => { sandbox.__sched = null; };
  vm.createContext(sandbox);
  const audioSrc = fs.readFileSync(path.join(ROOT, 'src', 'audio.js'), 'utf8');
  const jamSrc = fs.readFileSync(path.join(ROOT, 'src', 'jam.js'), 'utf8');
  vm.runInContext(audioSrc + '\n' + jamSrc, sandbox, { filename: 'audio+jam.js' });
  return sandbox;
}

test('audio.js synth path runs for every breed + meow variant', () => {
  const s = loadAudioJam();
  for (let i = 0; i < 400; i++) {
    s.patternIndex = i % 4;
    s.audio();
    s.playMeow(); s.playChirp(); s.playMrrp();
    s.startPurr(); s.stopPurr();
  }
  assert.ok(typeof s.playMeow === 'function');
});

// ---- dog voices -------------------------------------------------------------
// audio.js had NO species awareness, so a dog used the cat's meow and purr. It now
// resolves isDog() at call time, which means the harness can flip species just by
// defining it in the sandbox.
const DOG_BUILDS = ['retriever', 'spitz', 'dwarf', 'hound', 'working', 'spotted', 'shepherd',
  'collie', 'longdog', 'brachy', 'labrador', 'poodle', 'merledog', 'toy'];

// Top-level let/const in a classic script live in the vm's global LEXICAL scope, not
// as sandbox properties, so purrNodes/pantNodes must be read through the context.
const peek = (s, expr) => vm.runInContext(expr, s);

function loadAsDog() {
  const s = loadAudioJam();
  s.isDog = () => true;
  s.PATTERN_BUILD = DOG_BUILDS;
  return s;
}

test('every dog breed barks, pants, whines and huffs without throwing', () => {
  const s = loadAsDog();
  for (let i = 0; i < DOG_BUILDS.length * 12; i++) {
    s.patternIndex = i % DOG_BUILDS.length;
    s.audio();
    s.playMeow();                  // dispatches to the bark
    s.playChirp();                 // to the whine
    s.playMrrp();                  // to the huff
    s.startPurr(); s.stopPurr();   // to the pant
  }
  assert.ok(typeof s.playMeow === 'function');
});

test('a dog barks instead of meowing, and pants instead of purring', () => {
  const s = loadAsDog();
  s.audio();
  s.playMeow();
  s.startPurr();
  assert.strictEqual(peek(s, 'purrNodes'), null, 'the dog started the cat purr instead of panting');
  assert.ok(peek(s, 'pantNodes'), 'the dog should be panting');
  s.stopPurr();
  assert.strictEqual(peek(s, 'pantNodes'), null, 'stopPurr should tear the pant down');
});

test('a cat still meows and purrs, unchanged', () => {
  const s = loadAudioJam();   // isDog is not defined at all: the pre-existing cat path
  s.audio();
  s.playMeow();
  s.startPurr();
  assert.ok(peek(s, 'purrNodes'), 'the cat purr should still run');
  assert.strictEqual(peek(s, 'pantNodes'), null, 'a cat must never pant');
  s.stopPurr();
  assert.strictEqual(peek(s, 'purrNodes'), null, 'stopPurr should tear the cat purr down');
});

test('a species swap mid-voice cannot strand the old one looping', () => {
  const s = loadAudioJam();
  s.audio();
  s.isDog = () => true; s.PATTERN_BUILD = DOG_BUILDS;
  s.startPurr();                            // panting
  assert.ok(peek(s, 'pantNodes'));
  s.isDog = () => false; s.PATTERN_BUILD = ['standard'];   // user switches to cat mid-pant
  s.stopPurr();
  assert.strictEqual(peek(s, 'pantNodes'), null, 'the pant kept running after a swap to cat');
  assert.strictEqual(peek(s, 'purrNodes'), null);
});

test('breed size actually changes the voice', () => {
  const s = loadAsDog();
  s.PATTERN_BUILD = DOG_BUILDS;
  const pitchOf = (build) => { s.PATTERN_BUILD = [build]; s.patternIndex = 0; return s.voiceFor().pitch; };
  assert.ok(pitchOf('toy') > pitchOf('shepherd') * 1.8, 'a Chihuahua should yip far higher than a shepherd');
  assert.ok(pitchOf('brachy') > pitchOf('retriever'), 'a pug should sit above a retriever');
});

test('jam.js starts/stops/changes mood for every shipped mood', () => {
  const s = loadAudioJam();
  assert.deepStrictEqual(Array.from(s.window.jamMoods), ['cozy', 'dreamy', 'upbeat', 'focus', 'rain', 'sleepy']);   // Array.from: cross-realm vm array
  for (const mood of s.window.jamMoods) {
    s.window.jamStart(mood);
    s.window.jamSetMood(mood);
    assert.ok(typeof s.window.jamBeatPhase() === 'number');
    s.window.jamStop();
  }
});

test('jam scheduler drives many beats (chord graph + melody) without throwing', () => {
  const s = loadAudioJam();
  s.window.jamStart('cozy');
  assert.ok(typeof s.__sched === 'function', 'scheduler was registered');
  for (let i = 0; i < 160; i++) { clock += 0.05; s.__sched(); }   // ~8s of music: many beats + chord changes
  s.window.jamStop();
  assert.ok(true);
});
