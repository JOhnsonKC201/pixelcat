# Claude Code → pixelcat

Merge [`settings.hooks.json`](settings.hooks.json) into your `~/.claude/settings.json`
(under the `hooks` key), replacing `/ABSOLUTE/PATH/TO/pixelcat/` with your checkout
path (forward slashes on Windows too).

Mapping: `UserPromptSubmit` → thinking · `PreToolUse` → working · `Stop` → done.

Restart Claude Code (or start a new session). While pixelcat is running it will
show a thinking bubble, a working spinner, and a happy hop as Claude Code works.
