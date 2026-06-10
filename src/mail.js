// IMAP unread-mail watcher (main process). The actual IMAP connection runs in a
// short-lived forked worker (mail-worker.js) so a hung socket can never freeze the
// overlay. Main owns the app-password: it is stored encrypted-at-rest via Electron
// safeStorage (DPAPI on Windows) in userData/email.cred — never in settings.json —
// and decrypted only in-memory before being handed to the worker.
//
// The first poll after launch only establishes a baseline, so we never announce
// the inbox you already had; later polls announce when the unseen count rises.
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app, safeStorage } = require('electron');

let timer = null;
let lastUnread = null;   // null = not yet baselined
let running = false;     // a poll worker is in flight
let notifyFn = null;
let getCfg = null;

function credPath() { return path.join(app.getPath('userData'), 'email.cred'); }

function hasPassword() {
  try { return fs.existsSync(credPath()); } catch (e) { return false; }
}
function setPassword(plain) {
  if (plain == null || plain === '') {
    try { fs.unlinkSync(credPath()); } catch (e) { /* already gone */ }
    return { ok: true };
  }
  if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: 'Secure storage is unavailable on this system; cannot save the password.' };
  try {
    const enc = safeStorage.encryptString(String(plain));
    const fp = credPath();
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const tmp = fp + '.tmp';
    fs.writeFileSync(tmp, enc);
    fs.renameSync(tmp, fp);
    return { ok: true };
  } catch (e) { return { ok: false, error: 'Could not save the password.' }; }
}
function readPassword() {
  try {
    if (!safeStorage.isEncryptionAvailable()) return '';
    return safeStorage.decryptString(fs.readFileSync(credPath()));
  } catch (e) { return ''; }
}

function credsFromCfg(cfg, plainOverride) {
  const e = (cfg && cfg.email) || {};
  return {
    host: e.host, port: e.port, user: e.user, secure: e.secure !== false,
    pass: plainOverride != null ? plainOverride : readPassword(),
  };
}

// Spawn the worker, feed it creds, resolve with its single result (or a timeout).
function spawnWorker(creds, timeoutMs, cb) {
  let done = false;
  const finish = (res) => { if (done) return; done = true; clearTimeout(watchdog); try { child.kill(); } catch (e) { /* gone */ } cb(res); };
  let child;
  try {
    child = fork(path.join(__dirname, 'mail-worker.js'), [], {
      stdio: 'ignore',
      env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }),
    });
  } catch (e) { cb({ ok: false, error: 'Could not start the mail worker.' }); return; }
  const watchdog = setTimeout(() => finish({ ok: false, error: 'Timed out connecting.' }), timeoutMs || 20000);
  child.on('message', (msg) => finish(msg));
  child.on('error', () => finish({ ok: false, error: 'Mail worker failed.' }));
  child.on('exit', () => finish({ ok: false, error: 'Mail worker exited.' }));
  try { child.send(creds); } catch (e) { finish({ ok: false, error: 'Could not reach the mail worker.' }); }
}

function poll() {
  if (running) return;
  const cfg = getCfg && getCfg();
  if (!cfg || !cfg.email || !cfg.email.on) return;
  const creds = credsFromCfg(cfg);
  if (!creds.host || !creds.user || !creds.pass) return;   // not fully configured: stay quiet
  running = true;
  spawnWorker(creds, 25000, (res) => {
    running = false;
    if (!res || !res.ok) return;          // transient error: don't nag the user
    const count = res.unread | 0;
    if (lastUnread == null) { lastUnread = count; return; }   // first poll = baseline only
    if (count > lastUnread && notifyFn) {
      const delta = count - lastUnread;
      notifyFn(delta === 1 ? 'You have {count} new email.' : 'You have {count} new emails.',
        { source: 'email', dedupeKey: 'mail', count: delta, title: 'New mail' });
    }
    lastUnread = count;
  });
}

// (Re)start or stop the poll loop whenever the email config changes.
function sync(cfg) {
  if (timer) { clearInterval(timer); timer = null; }
  lastUnread = null;   // re-baseline so a settings change never floods on first tick
  if (cfg && cfg.email && cfg.email.on) {
    const min = Math.max(1, Math.min(60, (cfg.email.intervalMin | 0) || 5));
    poll();                                   // immediate baseline
    timer = setInterval(poll, min * 60000);
  }
}

// One-shot connection test (Settings "Test"). plainOverride lets the user test a
// password they just typed without saving it first.
function test(cfg, plainOverride) {
  return new Promise((resolve) => {
    const creds = credsFromCfg(cfg, plainOverride);
    if (!creds.host || !creds.user || !creds.pass) { resolve({ ok: false, error: 'Fill in server, email, and password first.' }); return; }
    spawnWorker(creds, 20000, (res) => resolve(res && res.ok ? { ok: true, unread: res.unread | 0 } : { ok: false, error: (res && res.error) || 'Connection failed.' }));
  });
}

function init(notify_, getCfg_) { notifyFn = notify_; getCfg = getCfg_; }
function stop() { if (timer) { clearInterval(timer); timer = null; } }

module.exports = { init, sync, test, setPassword, hasPassword, stop };
