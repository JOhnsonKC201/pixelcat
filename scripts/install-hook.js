#!/usr/bin/env node
// Print a ready-to-use pixelcat work-status hook config for a given agent, with
// the absolute path to agent-hook.js already filled in (the one manual step in
// integrations/). It only PRINTS — copy the output into the noted location; it
// never edits your agent's config for you.
//
//   node scripts/install-hook.js <claude-code|codex|cursor|antigravity|kiro>
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = root.replace(/\\/g, '/');
const hookAbs = path.join(root, 'agent-hook.js').replace(/\\/g, '/');

const AGENTS = {
  'claude-code': { file: 'integrations/claude-code/settings.hooks.json', target: '~/.claude/settings.json  (merge the "hooks" object)' },
  codex: { file: 'integrations/codex/config.toml', target: '~/.codex/config.toml  (user-level)' },
  cursor: { file: 'integrations/cursor/hooks.json', target: '<your-project>/.cursor/hooks.json' },
  antigravity: { file: 'integrations/antigravity/README.md', target: '.agents/hooks.json  (see notes/caveats below)' },
  kiro: { file: 'integrations/kiro/README.md', target: 'Kiro Agent Hooks UI, or .kiro/agents/*.json' },
};

const agent = (process.argv[2] || '').toLowerCase();
if (!AGENTS[agent]) {
  console.error('Usage: node scripts/install-hook.js <claude-code|codex|cursor|antigravity|kiro>');
  console.error('Agents: ' + Object.keys(AGENTS).join(', '));
  process.exit(1);
}

const { file, target } = AGENTS[agent];
let txt = fs.readFileSync(path.join(root, file), 'utf8');
// Fill the placeholder directory with this checkout (longest variants first).
txt = txt.split('/ABSOLUTE/PATH/TO/pixelcat').join(dir)
  .split('/ABS/PATH/pixelcat').join(dir)
  .split('/ABS/PATH').join(dir);

console.log(`# pixelcat work-status hook — ${agent}`);
console.log(`# agent-hook.js: ${hookAbs}`);
console.log(`# place into:    ${target}`);
console.log('# ' + '-'.repeat(64) + '\n');
console.log(txt.trimEnd() + '\n');
