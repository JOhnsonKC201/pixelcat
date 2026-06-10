#!/usr/bin/env node
// Push an arbitrary message to the running desktop cat: it shows a speech bubble,
// pops a Windows toast, and meows. ANY script or tool can call this — an email
// checker, CI, cron, a build step — to turn the cat into your notifier.
//
// Usage:
//   node scripts/notify.js "Build finished" --title CI --level success
//   echo "anything" | node scripts/notify.js "Deploy done"        (hook-safe)
//
// Flags:  --title <T>   --level info|success|warn|alert   --ttl <ms>   --no-sound
//
// It appends one JSON line to %TEMP%/pixelcat-notify.jsonl (append-only); the cat
// tails that file. Safe to call when the cat isn't running — the line is just
// ignored (the cat only reads lines written after it started).
const fs = require('fs');
const os = require('os');
const path = require('path');

// Hook-safe: drain any piped stdin (hook runners send JSON then close stdin).
try { fs.readFileSync(0); } catch (e) { /* no stdin — fine */ }

const argv = process.argv.slice(2);
let message = '', title = '', level = 'info', ttl = 5000, sound = true;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--title') title = argv[++i] || '';
  else if (a === '--level') level = argv[++i] || 'info';
  else if (a === '--ttl') ttl = parseInt(argv[++i], 10) || 5000;
  else if (a === '--no-sound') sound = false;
  else if (a === '--sound') sound = true;
  else if (!message) message = a;
}

function reply() { try { process.stdout.write('{"continue": true}\n'); } catch (e) { /* ignore */ } }
if (!message) { reply(); process.exit(0); }

const id = 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const line = JSON.stringify({
  id, ts: Date.now(), message: String(message).slice(0, 200),
  title: String(title).slice(0, 60), level, ttl, sound,
}) + '\n';
try { fs.appendFileSync(path.join(os.tmpdir(), 'pixelcat-notify.jsonl'), line); }
catch (e) { /* best effort; never throw */ }

reply();
