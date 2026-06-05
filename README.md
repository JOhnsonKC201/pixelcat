# 🐈 pixelcat

A cute pixel cat that lives on your Windows desktop — a from-scratch desktop pet
inspired by Comnyang. Built with Electron. The cat sits in the corner, follows
your cursor, reacts when you type, purrs when you pet it, and stretches like mochi
when you drag it.

![cat](https://img.shields.io/badge/platform-Windows-blue) ![electron](https://img.shields.io/badge/built%20with-Electron-47848F)

## Features

- **12 coat patterns** — Orange / Mackerel / Brown tabby, Siamese, Tuxedo, Black,
  Gray, White, Cream, Tortoiseshell, Calico, Slate. **Right-click** the cat to
  cycle; your choice is remembered.
- **Eye-follow & blink** — the cat watches your cursor and blinks now and then.
- **Mochi-drag** — **grab and pull** the cat and it stretches like taffy (head and
  feet stay solid, the body thins), then **squashes and bounces** back when you
  drop it. It stays where you put it.
- **Purring pets** — **rest the cursor on its head** and it closes its eyes
  happily, wiggles, and floats little hearts.
- **Typing reaction** — when you type (in *any* app), the cat **taps its front
  paws**; type fast and it **overheats** (turns red with steam), then cools down.
  Powered by a system-wide keyboard hook (`uiohook-napi`).
- **Stretch reminder** — every so often the cat does a big, happy **stretch**.
- **AI agent reactions** — shows a thinking "…" bubble while a coding agent
  (Claude Code, Codex, Cursor, …) is working, and does a happy **hop** when it
  finishes. See [AI agent reactions](#ai-agent-reactions) for setup.
- **Polished pixel art** — white sticker outline (pops on any wallpaper), soft
  top-lit shading, whiskers, ground shadow, sparkly eyes.
- **Desktop-pet overlay** — a full-screen, transparent, click-through layer, so
  the cat floats over everything but never blocks your clicks (only the cat itself
  is interactive).
- **Starts at login** — registers itself in Windows startup.

## Controls

| Action | What it does |
|--------|--------------|
| **Drag** the cat (hold left) | Stretches it like mochi; drops where you release |
| **Right-click** the cat | Cycles to the next coat pattern |
| **Rest cursor on its head** | Happy eyes + floating hearts (purr) |
| **Type** (any app) | Front-paw tapping; fast typing → overheat |
| **Double-click** the cat | Closes the app |

## Run

```powershell
cd pixelcat
npm install
npm start
```

To stop it launching at login: `npm run autostart:off`.

## Project layout

```
pixelcat/
├─ package.json
├─ src/
│  ├─ main.js       # full-display click-through overlay window, global cursor +
│  │                #  keyboard hook, click-through toggle, autostart
│  ├─ preload.js    # safe IPC bridge to the renderer
│  ├─ index.html
│  └─ renderer.js   # the cat: role-coded sprites, palettes, physics, all reactions
```

## How it works

- The cat is **one role-coded sprite** (outline / coat / markings / white / patch /
  eye / nose / inner-ear) built procedurally, then **recolored per pattern** at
  draw time — so a dozen cats come from one shape, and shading + outline + overheat
  tint apply for free.
- Rendering is on an HTML canvas in a full-screen transparent Electron window.
  Ordinary screenshots can't capture it (GPU-composited), so previews use a
  self-capture: `electron . --shot --pattern=<name> [--state=typing|overheat|mochi|pet]`.
- Mochi-drag is a spring system (a pinned handle + a trailing body point) with a
  3-band stretch that keeps the head and feet rigid.

## AI agent reactions

The cat can react to a coding agent's work status. Any tool can signal it by
running the bundled helper, which writes a tiny status file the cat watches
(`%TEMP%/comnyang-agent.state`):

```bash
node agent-hook.js thinking   # cat shows a thinking "…" bubble
node agent-hook.js done       # cat does a happy hop
node agent-hook.js idle       # back to normal
```

To wire it to **Claude Code**, add hooks to `~/.claude/settings.json` (use the
full path to `agent-hook.js`):

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node C:/Users/johns/pixelcat/agent-hook.js thinking" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node C:/Users/johns/pixelcat/agent-hook.js done" }] }
    ]
  }
}
```

Other tools (Codex, Cursor, custom scripts) can call the same helper from their
own start/finish hooks.

## Tech

Electron · HTML canvas · [`uiohook-napi`](https://github.com/SnosMe/uiohook-napi)
(system-wide keyboard hook).

## Notes / roadmap

- A **mouse-hunt** mode (cat crouches and chases the cursor) is implemented but
  currently disabled; re-enable via the velocity trigger in `renderer.js`.
- Future: Pomodoro timer, stretch/break scheduling UI, pinned messages,
  paper-unroll on scroll, tray-menu pattern picker, sound, multi-monitor roaming.

---

Made for fun. Original pixel art — inspired by, not copied from, Comnyang.
