#!/usr/bin/env node
// Signal the desktop cat about AI-agent work status.
//   node agent-hook.js thinking   -> cat shows a thinking "..." bubble
//   node agent-hook.js done       -> cat does a happy hop
//   node agent-hook.js idle       -> back to normal
//
// Wire it to Claude Code hooks (in ~/.claude/settings.json), e.g.:
//   UserPromptSubmit / PreToolUse -> node <path>/agent-hook.js thinking
//   Stop                          -> node <path>/agent-hook.js done
const fs = require('fs');
const os = require('os');
const path = require('path');
const state = (process.argv[2] || 'idle').trim();
try { fs.writeFileSync(path.join(os.tmpdir(), 'pixelcat-agent.state'), state); }
catch (e) { /* ignore */ }
