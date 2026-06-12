# Kiro → pixelcat

Kiro has two surfaces - the **IDE** (UI hooks) and the **CLI** (config file).

## Kiro IDE (Agent Hooks UI)

1. Open the **Agent Hooks** panel (or Command Palette `Ctrl/Cmd+Shift+P` →
   "Kiro: Open Kiro Hook UI").
2. Click **+** → **Manually create a hook**.
3. Create three hooks, each with **Action = "Run Command"** (not "Ask Kiro"):

   | Trigger | Command |
   |---------|---------|
   | **Prompt Submit** | `node "/ABS/PATH/pixelcat/agent-hook.js" thinking` |
   | **Pre Tool Use** | `node "/ABS/PATH/pixelcat/agent-hook.js" working` |
   | **Agent Stop** | `node "/ABS/PATH/pixelcat/agent-hook.js" done` |

4. **Create Hook** for each. (Timeout defaults to 60s.)

## Kiro CLI (config file)

CLI hooks live in an agent JSON file - local `.kiro/agents/<name>.json` or global
`~/.kiro/agents/<name>.json`. Add a `hooks` block:

```json
"hooks": {
  "userPromptSubmit": [
    { "command": "node \"/ABS/PATH/pixelcat/agent-hook.js\" thinking" }
  ],
  "preToolUse": [
    { "matcher": "*", "command": "node \"/ABS/PATH/pixelcat/agent-hook.js\" working" }
  ],
  "stop": [
    { "command": "node \"/ABS/PATH/pixelcat/agent-hook.js\" done" }
  ]
}
```

CLI trigger keys: `agentSpawn`, `userPromptSubmit`, `preToolUse`, `postToolUse`,
`stop` (there is no model-call hook). `matcher` applies to `preToolUse`/`postToolUse`
(canonical tool names `fs_read`/`fs_write`/`execute_bash`/`use_aws`, or aliases
`read`/`write`/`shell`/`aws`). Replace `/ABS/PATH/` with your checkout (forward
slashes on Windows too). Docs: <https://kiro.dev/docs/hooks/> · <https://kiro.dev/docs/cli/hooks/>.
