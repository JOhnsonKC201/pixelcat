# Cursor → pixelpets

Copy [`hooks.json`](hooks.json) to `<your-project>/.cursor/hooks.json` (create the
`.cursor/` folder if needed), replacing `/ABSOLUTE/PATH/TO/pixelpets/` with your
checkout path (forward slashes on Windows too). Reload Cursor so it picks up the
hooks.

Mapping: `beforeSubmitPrompt` → thinking · `afterFileEdit` / `postToolUse` →
working · `stop` → done.

Cursor pipes a JSON event on stdin and reads JSON on stdout; `agent-hook.js`
handles both (it drains stdin and replies `{"continue": true}`), so these are
observational and never block the agent. Docs: <https://cursor.com/docs/hooks>.
