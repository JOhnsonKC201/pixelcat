# Kiro → pixelcat

Kiro's agent hooks are created through the **Agent Hooks UI**, not a config file.

1. Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **"Kiro: Open
   Kiro Hook UI"** (or the **Agent Hooks** section in the Kiro panel).
2. Click **+** → **Manually create a hook**.
3. Create three hooks, each with **Action = "Run Command"** and the command set to
   the matching line (replace the path with your checkout; forward slashes on
   Windows too):

   | Trigger / event | Command |
   |-----------------|---------|
   | User prompt submitted | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" thinking` |
   | After tool invocation | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" working` |
   | Agent turn completed   | `node "/ABSOLUTE/PATH/TO/pixelcat/agent-hook.js" done` |

4. **Create Hook** for each.

If your Kiro version only exposes file-save / on-demand triggers, a single
"agent turn completed → done" hook still gives you the happy hop. Docs:
<https://kiro.dev/docs/hooks/>.
