const js = require('@eslint/js');
const globals = require('globals');

// Names that cat-sprite.js / template.js / climb-frames.js put in the shared global
// scope and that the *consumer* overlay scripts (renderer/settings-renderer/cat-preview)
// reference as bare identifiers. cat-sprite.js itself DEFINES them, so it gets its own
// block below (listing them here too would trip no-redeclare).
const sharedOverlay = {
  CELL: 'readonly', setCell: 'readonly', ellipse: 'readonly', triangle: 'readonly',
  outlineHalo: 'readonly', eyeBox: 'readonly', muzzlePt: 'readonly', buildSprite: 'readonly',
  composeSit: 'readonly', PATTERNS: 'readonly', PATTERN_NAMES: 'readonly',
  BUILDS: 'readonly', TABBY: 'readonly', PATTERN_BUILD: 'readonly',
  BODY: 'readonly', G: 'readonly', GC: 'readonly', GR: 'readonly', HALO: 'readonly',
  rgbStr: 'readonly', toRgb: 'readonly', shadeStr: 'readonly', lerpHex: 'readonly',
  fillPlaceholders: 'readonly', CLIMB_FRAMES: 'readonly',
  // audio.js (loaded before renderer.js) provides these:
  audio: 'readonly', volNow: 'readonly', master: 'readonly', playMeow: 'readonly',
  startPurr: 'readonly', stopPurr: 'readonly', playChirp: 'readonly', playMrrp: 'readonly',
  // effects.js provides these:
  drawThinkBubble: 'readonly', drawWorkBubble: 'readonly', drawDoneSpark: 'readonly', drawHeart: 'readonly',
  drawGuitar: 'readonly', drawNote: 'readonly',
};

const CONSUMER_OVERLAY = ['src/renderer.js', 'src/settings-renderer.js', 'src/cat-preview.js'];

module.exports = [
  { ignores: ['node_modules/**', 'dist/**', 'site/**', 'src/climb-frames.js', '_*/**'] },

  js.configs.recommended,

  {
    // Node / CommonJS: main process, workers, scripts, tests, configs, template.js
    files: ['**/*.js'],
    ignores: [...CONSUMER_OVERLAY, 'src/cat-sprite.js', 'src/patterns.js', 'src/audio.js', 'src/effects.js', 'src/jam.js'],
    languageOptions: { sourceType: 'commonjs', ecmaVersion: 2023, globals: { ...globals.node } },
  },
  {
    // audio.js: classic overlay <script> that DEFINES the audio fns and reads
    // config / patternIndex / PATTERN_BUILD from the shared scope.
    files: ['src/audio.js'],
    languageOptions: {
      sourceType: 'script', ecmaVersion: 2023,
      globals: { ...globals.browser, config: 'readonly', patternIndex: 'readonly', PATTERN_BUILD: 'readonly' },
    },
  },
  {
    // effects.js: classic overlay <script> that DEFINES the status-indicator draws
    // and uses the shared canvas context `ctx`.
    files: ['src/effects.js'],
    languageOptions: { sourceType: 'script', ecmaVersion: 2023, globals: { ...globals.browser, ctx: 'readonly' } },
  },
  {
    // jam.js: classic overlay <script> ("Lobby Jam" synth) that REUSES audio.js's shared
    // AudioContext (audio()) and routes through the shared `master` gain.
    files: ['src/jam.js'],
    languageOptions: { sourceType: 'script', ecmaVersion: 2023, globals: { ...globals.browser, audio: 'readonly', master: 'readonly' } },
  },
  {
    // cat-sprite.js / patterns.js are dual-loaded: classic <script> in the overlay AND
    // CommonJS modules in Node (make-app-icon.js / main.js). They DEFINE shared globals.
    files: ['src/cat-sprite.js', 'src/patterns.js'],
    languageOptions: { sourceType: 'commonjs', ecmaVersion: 2023, globals: { ...globals.node, ...globals.browser } },
  },
  {
    // Consumer overlay scripts (classic scripts sharing one global scope)
    files: CONSUMER_OVERLAY,
    languageOptions: { sourceType: 'script', ecmaVersion: 2023, globals: { ...globals.browser, ...sharedOverlay } },
  },
  {
    // Keep real-bug rules as errors; soften stylistic/noisy ones so signal stays high.
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-useless-assignment': 'warn',
      // a ﻿ in a regex is intentional here (config loaders strip a BOM) - allow it
      // inside regexes/strings/comments while still catching stray invisible whitespace in code
      'no-irregular-whitespace': ['error', { skipRegExps: true, skipStrings: true, skipComments: true, skipTemplates: true }],
    },
  },
];
