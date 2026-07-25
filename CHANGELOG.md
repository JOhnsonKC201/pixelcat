# Changelog

Notable changes to **pixelcat**. All art and sound are original/procedural (no asset files).

## [0.2.0] - 2026-07-25

### Stay on track
- **Pomodoro focus timer** - focus/break loops with a pixel timer floating next to the cat, plus a **pinned note** that stays in a bubble above its head.
- **IMAP unread-mail alerts** - point the cat at any IMAP inbox; the app-password is stored encrypted at rest and the connection runs in an isolated worker.
- **Calendar nudges** - paste a secret `.ics` URL and the cat nudges you a few minutes before each event.
- **Notify the cat** - `scripts/notify.js` pushes any message from a script, CI, or cron job as a speech bubble + Windows toast + meow, with a tray **recap of recent notifications**.
- **Work mode** - park the cat in its corner and hide the butterfly while you focus.

### Cat & behavior
- **Butterfly overhaul** - it comes out on its own when you step away, plays near the cat, and the cat winds up, leaps, and bats it out of the air; toggle via **Butterfly visits**.
- **Welcome-back greeting** - return after being away and the cat perks up with happy eyes, a heart, and a friendly chirp.
- **Give a treat** - tray → **Give a treat 🐟** drops a little fish; the cat trots over and noms it with hearts.
- **Rest corner** - choose bottom-left or bottom-right as home; the cat drifts back to that side.
- **Night-time sleepiness** - after 23:00 the cat winds down faster, so it loafs and dozes more.
- **Cursor gaze** - the cat stares at a still cursor and roams its eyes after a while.

### Sound
- **Lobby Jam** - live-synthesized lo-fi study music the cat plays on a little guitar, in six moods (Cozy café, Dreamy, Upbeat lounge, Deep focus, Rainy study, Sleepy night). No audio files.
- **More lifelike meow** - a gliding two-formant "me-ow" with per-species voices and a rolled chirrup/trill; drop `assets/meow.(ogg|mp3|wav)` to use a real recording instead (still 100% synth by default).
- **Warmer purr** and an **output safety limiter** (compressor + tanh soft-clip) so the mix can never clip or distort.

### Art & coats
- **Chocolate** (solid warm-brown Havana, green eyes) and **Russian Blue** (cool blue-grey, green eyes) - 14 built-in coats total.
- **3D glossy app + tray icons** on a high-contrast tile.

### Security
- **IPC sender validation** on all main-process handlers.
- **Calendar fetch pinned to a vetted IP** (DNS-rebinding guard), SSRF guard, and Electron/CSP hardening.
- **STARTTLS hardening** on the mail worker.

### Fixes & performance
- The cat now sits flush on the taskbar line (DPI-correct floor, HiDPI-crisp rendering).
- The butterfly no longer gets stuck at the screen edge, and stays away while you use the mouse.
- Fixed a double-meow, scroll waking the cat from sleep, and a `drawCat` render hot path.

### Site & docs
- **Live demo site** - a landing page with a playable cat and a footage gallery at [pixelcat-jet.vercel.app](https://pixelcat-jet.vercel.app).
- **README v2** - animated hero banner, interaction gallery, and coat carousel, all rendered from the app's own sprite code.

## [0.1.0] - 2026-06-08

### Cat & behavior
- **Mood/energy model** - sleepy → calm → playful → zoomies (with a hard crash from zoomies), tunable; off via tray/Settings.
- **Autonomous roaming** - the cat wanders to new spots inside its play area (toggle: tray → **Wander**).
- **Distinct touch reactions** - **tap** = a quick pet; **head**-pet = purr + hearts; **body**-touch = lean/arch into your hand, tail up, trills.
- **Startle** - a sudden cursor jolt makes it flinch/puff, freeze, then bolt or creep back.
- **Idle life** - blink, look-around, tail flicks, content loaf, and a curled sleep with `z z z` + snore puff.
- **Liveliness** - typing (screen glow, faster paw taps), sleeping (belly breathing, tail wag), scrolling (a paw bats the paper).

### Poses & art
- Redesigned **sleep** (curled ball, tail wrapped over the face) and **typing** (sprawled "keyboard cat" on a laptop).
- **Unique pixel-art logo** - the sit-cat sprite as crisp blocks on an indigo tile.
- **12 built-in coats** + **custom coats** (color / build / tabby) with **import/export** and a **live preview** in Settings.

### Sound
- **Synthesized meow, purr, chirp, and startled mrrp** - all Web Audio generated in code, no audio assets to ship.

### Overlay & windows
- **Always on top** - re-asserts top-most (over fullscreen apps too).
- **Play area** - confine the cat to a region via tray **presets** or **drag-to-draw** ("Set play area (drag)…").
- Stretch break timer, timed reminders, calls you by name.

### AI agent reactions
- Work-status reactions (thinking / working / error / done) for **Claude Code, Codex, Cursor, Antigravity, Kiro** - ready configs in `integrations/`, or `npm run hook -- <agent>`.

### Developer
- Contact-sheet QA harness (`npm run sheet`), smoke tests (`npm test`), and electron-builder packaging (`npm run pack` / `npm run dist`).
