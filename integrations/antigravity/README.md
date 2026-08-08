# Antigravity → pixelpets

Antigravity (2.0+) supports event-driven **hooks** that run a local shell command
at points in the agent loop. The hooks file uses a Claude-Code-style schema:

- **Workspace (project):** `.agents/hooks.json`
- **Global:** `~/.gemini/config/hooks.json`

Add the three hooks below, replacing `/ABS/PATH/` with your checkout (forward
slashes on Windows too):

```json
{
  "pixelpets-thinking": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node \"/ABS/PATH/pixelpets/agent-hook.js\" thinking" }] }
    ]
  },
  "pixelpets-working": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node \"/ABS/PATH/pixelpets/agent-hook.js\" working" }] }
    ]
  },
  "pixelpets-done": {
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node \"/ABS/PATH/pixelpets/agent-hook.js\" done" }] }
    ]
  }
}
```

Mapping: `UserPromptSubmit` → thinking · `PreToolUse` → working · `Stop` → done.
The command is observational and hook-safe (drains stdin, replies
`{"continue": true}`), so it never blocks or alters the agent.

> ⚠️ Antigravity's docs are JS-rendered and the schema is still evolving. The
> structure above follows the documented Claude-Code-style format, but if the
> tool hooks don't fire, **verify the exact event-key spellings** at
> <https://antigravity.google/docs/hooks> (some builds use `BeforeTool` /
> `PreToolCall` / `PostToolCall`). `UserPromptSubmit` (thinking) and `Stop`
> (done) are the best-attested events if you want a minimal, reliable setup.
