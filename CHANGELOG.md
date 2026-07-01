# Changelog

Notable changes to **pixelcat**. All art and sound are original/procedural (no asset files).

## [Unreleased]

### Cat & behavior
- **Mood/energy model** - sleepy → calm → playful → zoomies (with a hard crash from zoomies), tunable; off via tray/Settings.
- **Autonomous roaming** - the cat wanders to new spots inside its play area (toggle: tray → **Wander**).
- **Distinct touch reactions** - **tap** = a quick pet; **head**-pet = purr + hearts; **body**-touch = lean/arch into your hand, tail up, trills.
- **Startle** - a sudden cursor jolt makes it flinch/puff, freeze, then bolt or creep back.
- **Idle life** - blink, look-around, tail flicks, content loaf, and a curled sleep with `z z z` + snore puff.
- **Liveliness** - typing (screen glow, faster paw taps), sleeping (belly breathing, tail wag), scrolling (a paw bats the paper).
- **Idle butterfly play** - step away and a butterfly comes out on its own so the cat always has something to play with (tray/Settings **Butterfly visits**).
- **Welcome-back greeting** - return after being away and the cat perks up with happy eyes, a heart, and a friendly chirp.
- **Rest corner** - pick whether the cat calls bottom-**left** or bottom-**right** home (tray → **Rest corner**, or Settings); it drifts back to that side.

### Poses & art
- Redesigned **sleep** (curled ball, tail wrapped over the face) and **typing** (sprawled "keyboard cat" on a laptop).
- **Unique pixel-art logo** - the sit-cat sprite as crisp blocks on an indigo tile.
- **14 built-in coats** (incl. **Chocolate** - a solid warm-brown Havana with green eyes - and **Russian Blue** - cool blue-grey with green eyes) + **custom coats** (color / build / tabby) with **import/export** and a **live preview** in Settings.

### Sound
- **Realistic synthesized meow** - a **two-formant** "mee-ow" glide with vibrato; **per-species voices** (pitch/length by breed). Plus chirp and a startled mrrp.
- **Warmer purr** - layered fundamental + soft overtone, a rumble tremolo, and a slow inhale/exhale swell; fades in/out so it never clicks.

### Overlay & windows
- **Always on top** - re-asserts top-most (over fullscreen apps too).
- **Play area** - confine the cat to a region via tray **presets** or **drag-to-draw** ("Set play area (drag)…").
- Stretch/Pomodoro break timer, timed reminders, calls you by name.

### AI agent reactions
- Work-status reactions (thinking / working / error / done) for **Claude Code, Codex, Cursor, Antigravity, Kiro** - ready configs in `integrations/`, or `npm run hook -- <agent>`.

### Developer
- Contact-sheet QA harness (`npm run sheet`), smoke tests (`npm test`), and electron-builder packaging (`npm run pack` / `npm run dist`).
