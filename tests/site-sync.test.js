// Drift guards for the website's hand-copied renderer sources.
//
// The marketing site under `site/` is deployed to Vercel on its own (no `../src`
// at runtime), so a couple of files are DUPLICATED out of `src/` by hand. That
// duplication is a known drift surface: if someone changes the desktop sprite in
// `src/` and forgets to mirror it, the website cat silently renders differently
// from the real app - with nothing to catch it. These tests turn that "remember
// to re-copy" convention into a failure.
//
// Parity is compared EOL-normalized (CRLF -> LF) on purpose: the invariant is
// that the site renders the same cat, which is line-ending independent. `site/`
// files are LF today, but an edit made on a CRLF checkout of `src/` must not
// read as "drift" when the code is in fact identical.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const norm = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// First line where two texts diverge, for an actionable failure message.
function firstDivergence(a, b) {
  const al = a.split('\n');
  const bl = b.split('\n');
  const n = Math.max(al.length, bl.length);
  for (let i = 0; i < n; i++) {
    if (al[i] !== bl[i]) {
      return `line ${i + 1}:\n  src : ${JSON.stringify(al[i])}\n  site: ${JSON.stringify(bl[i])}`;
    }
  }
  return '(no line-level difference found)';
}

test('site/cat-sprite.js is a verbatim copy of src/cat-sprite.js', () => {
  const src = norm('src/cat-sprite.js');
  const site = norm('site/cat-sprite.js');
  assert.strictEqual(
    site, src,
    'site/cat-sprite.js has drifted from src/cat-sprite.js - the website cat will ' +
    'not match the desktop app.\nFirst divergence at ' + firstDivergence(src, site) +
    "\nRe-sync with:  node -e \"fs.copyFileSync('src/cat-sprite.js','site/cat-sprite.js')\"",
  );
});

test('site/cat-preview.js shares the code body of src/cat-preview.js (only the header comment may differ)', () => {
  const MARKER = '(function (';
  const src = norm('src/cat-preview.js');
  const site = norm('site/cat-preview.js');

  // Both are an IIFE after a file header comment. Guarding the body from the IIFE
  // onward locks the drawing code while allowing each file its own header (the
  // site copy documents itself as the gallery thumbnail draw). If the wrapper is
  // ever refactored away, fail loudly rather than silently compare whole files.
  const si = src.indexOf(MARKER);
  const ti = site.indexOf(MARKER);
  assert.ok(si >= 0, `src/cat-preview.js no longer contains ${JSON.stringify(MARKER)} - update this drift guard.`);
  assert.ok(ti >= 0, `site/cat-preview.js no longer contains ${JSON.stringify(MARKER)} - update this drift guard.`);

  const srcBody = src.slice(si);
  const siteBody = site.slice(ti);
  assert.strictEqual(
    siteBody, srcBody,
    'site/cat-preview.js code body has drifted from src/cat-preview.js.\n' +
    'First divergence at ' + firstDivergence(srcBody, siteBody) +
    '\nRe-port the body of src/cat-preview.js into site/cat-preview.js (keep the site header comment).',
  );
});
