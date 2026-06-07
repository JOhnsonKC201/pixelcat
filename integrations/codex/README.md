# Codex CLI → pixelcat

Merge [`config.toml`](config.toml) into your `~/.codex/config.toml`, replacing
`/ABSOLUTE/PATH/TO/pixelcat/` with your checkout path (forward slashes on Windows
too).

Mapping: `UserPromptSubmit` → thinking · `PreToolUse` → working · `Stop` → done.

Codex supports lifecycle **hooks** (used here) and a `notify` command (commented
alternative). Docs: <https://developers.openai.com/codex/hooks>.
Note: Codex ignores `notify`/hook overrides from project-local `.codex/config.toml`
— put these in your **user-level** `~/.codex/config.toml`.
