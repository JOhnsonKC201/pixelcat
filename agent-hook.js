#!/usr/bin/env node
// Signal the desktop cat about AI-agent work status. The cat maps the word to a
// reaction category, so natural verbs work:
//   thinking | plan | start          -> thinking "..." bubble
//   editing | writing | testing | building | running | tool -> "working" spinner
//   error | failed | denied          -> the cat startles (flinch)
//   done | stop | complete           -> happy hop
//   idle                             -> back to normal
//
// Hook-safe: it drains stdin (so an agent piping a JSON event never blocks on a
// full pipe) and prints a permissive `{"continue": true}` on stdout, so the same
// command works as a hook for Claude Code, Codex, Cursor, Antigravity and Kiro.
// See integrations/<agent>/ for ready-to-use configs.
//
// Usage:  node agent-hook.js <state>
const fs = require('fs');
const os = require('os');
const path = require('path');

// Drain any piped stdin event (hook runners send JSON then close stdin -> EOF;
// when there is no stdin this throws EAGAIN/ENXIO, which we ignore).
try { fs.readFileSync(0); } catch (e) { /* no stdin — fine */ }

const state = (process.argv[2] || 'idle').trim();
try { fs.writeFileSync(path.join(os.tmpdir(), 'pixelcat-agent.state'), state); }
catch (e) { /* best effort; never break the agent */ }

// Reply with a benign, non-blocking decision so hooks that read stdout are happy.
try { process.stdout.write('{"continue": true}\n'); } catch (e) { /* ignore */ }
