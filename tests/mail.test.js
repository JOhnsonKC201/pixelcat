// The unread-mail watcher silently does nothing when it has no usable password, so
// the credential path is where a broken setup hides. These drive src/mail.js's pure
// helpers directly - no Electron, no IMAP socket - because that is where the two
// real defects lived: an app-password mangled on the way in, and a "saved" tick that
// only ever checked whether a file existed.
const test = require('node:test');
const assert = require('node:assert');

const mail = require('../src/mail');

test('a Gmail app-password keeps its four groups but loses the spaces', () => {
  assert.strictEqual(mail.normalizePassword('abcd efgh ijkl mnop'), 'abcdefghijklmnop');
  assert.strictEqual(mail.normalizePassword('  abcd efgh ijkl mnop  '), 'abcdefghijklmnop');
  assert.strictEqual(mail.normalizePassword('ABCD efgh IJKL mnop'), 'ABCDefghIJKLmnop');
});

test('a password already pasted without spaces is left alone', () => {
  assert.strictEqual(mail.normalizePassword('abcdefghijklmnop'), 'abcdefghijklmnop');
});

test('a passphrase that merely contains spaces is not silently rewritten', () => {
  // Only the exact 4x4 Gmail shape gets de-spaced; a custom IMAP server may well
  // want the spaces, and quietly deleting them would break a working login.
  assert.strictEqual(mail.normalizePassword('correct horse battery staple'), 'correct horse battery staple');
  assert.strictEqual(mail.normalizePassword('abcd efgh ijkl'), 'abcd efgh ijkl');
  assert.strictEqual(mail.normalizePassword('abc defg hijk lmno'), 'abc defg hijk lmno');
});

test('empty-ish input normalizes to the empty string that clears the credential', () => {
  assert.strictEqual(mail.normalizePassword(''), '');
  assert.strictEqual(mail.normalizePassword('   '), '');
  assert.strictEqual(mail.normalizePassword(null), '');
  assert.strictEqual(mail.normalizePassword(undefined), '');
});
