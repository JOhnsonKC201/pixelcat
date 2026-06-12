# AI agent work-status reactions

pixelcat reacts to a coding agent's work status: a **thinking** bubble while it
plans, a **working** spinner while it edits/tests/builds, a startled **flinch** on
errors, and a happy **hop** when it finishes. Any agent that can run a shell
command on its lifecycle events can drive the cat through the bundled helper:

```
node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" <state>
```

`agent-hook.js` is **hook-safe**: it drains stdin and prints `{"continue": true}`,
so it never blocks or alters your agent - it only nudges the cat.

**Quick setup:** run `node scripts/install-hook.js <agent>` (or `npm run hook -- <agent>`)
to print the config for your agent with the absolute path already filled in - then
copy it into the location noted at the top of the output.

## States (the cat maps natural verbs)

| State word | Cat reaction |
|------------|--------------|
| `thinking` (plan / start) | thinking "…" bubble |
| `working` (editing / testing / building / tool) | working spinner |
| `error` (failed / denied) | startle / flinch |
| `done` (stop / complete) | happy hop |
| `idle` | back to normal |

## Recommended event → state mapping

| Agent event | State |
|-------------|-------|
| prompt submitted / session start | `thinking` |
| before/after a tool runs, file edited | `working` |
| agent stopped / turn complete | `done` |

## Per-agent setup

- **Claude Code** → [`claude-code/`](claude-code/) - merge into `~/.claude/settings.json`
- **Codex CLI** → [`codex/`](codex/) - merge into `~/.codex/config.toml`
- **Cursor** → [`cursor/`](cursor/) - copy to `<project>/.cursor/hooks.json`
- **Antigravity** → [`antigravity/`](antigravity/) - `.agents/hooks.json` (see notes)
- **Kiro** → [`kiro/`](kiro/) - add via the Agent Hooks UI ("Run Command")

> **Replace `/ABSOLUTE/PATH/TO/pixelcat/`** with the real path to your checkout,
> using forward slashes on Windows too, e.g.
> `node "C:/Users/you/pixelcat/agent-hook.js" working`.
> Hooks run from varying working directories, so an **absolute path is required**.
