# Antigravity → pixelcat

Antigravity (2.0+) supports event-driven **hooks** that run a local shell command
at stages of the agent loop (before/after a tool, before/after a model call, and
at agent-stop). Add hooks that run pixelcat's helper:

| Event | Command |
|-------|---------|
| before model call / prompt start | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" thinking` |
| after tool execution | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" working` |
| agent loop stop | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" done` |

Hooks live in `.agents/hooks.json`. A tentative shape (see below) — **verify the
exact event names and schema against your Antigravity version's docs**
(<https://antigravity.google/docs>), as the format is still evolving:

```jsonc
// .agents/hooks.json  (verify keys against current Antigravity docs)
{
  "hooks": [
    { "event": "beforeModelCall", "command": "node \"/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js\" thinking" },
    { "event": "afterToolUse",    "command": "node \"/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js\" working" },
    { "event": "stop",            "command": "node \"/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js\" done" }
  ]
}
```

The command is observational and hook-safe (drains stdin, replies
`{"continue": true}`), so it won't block or alter the agent.
