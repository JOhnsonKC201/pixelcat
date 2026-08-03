# Changelog

Notable changes to **pixelpets**. All art and sound are original/procedural (no asset files).

## [0.3.0] - 2026-08-03

### Dogs, and a new name
- **The dog is a first-class pet** - pick Cat or Dog and the whole app follows: sprite, voice, tray wording, and the companion it plays with. 14 breeds (Golden Retriever, Shiba Inu, Corgi, Beagle, Siberian Husky, Dalmatian, German Shepherd, Border Collie, Dachshund, Pug, Black Lab, Poodle, Australian Shepherd, Chihuahua) alongside the 14 cat coats.
- **pixelcat is now pixelpets** - the old name stopped being true the moment it could be a dog. Existing installs keep everything; see the upgrade note under Fixes.
- **A dog sounds like a dog** - its own synthesized voice with bark, pant, whine and huff, switched with the species. A bark is modelled as a plosive rather than a re-pitched meow, and a hound bays instead of yapping.
- **Species picker and breed list** in the settings window, with the coat dropdown relabelled Breed for a dog.
- **Fetch on its own** - step away and a dog starts its own game rather than waiting on a butterfly: it noses a ball out, chases it down and carries it home. Cats still get the butterfly. One toggle governs both, and work mode, reduced motion and low power suppress both.

### Art & poses
- **Every activity is a composed pose** - climbing, paw-up and batting compose real limbs into the sprite grid instead of reusing the sit pose, so an activity finally looks like the thing it is.
- **Painted frames override a composed pose** - hand-paint a frame, import it, and it takes precedence over the procedural one, with a guide covering how to paint and import.
- **Contact sheets for every activity** - `npm run poses:cat` and `npm run poses:dog` render each activity, not just the sit pose.
- **1280x640 social preview card** and a generator for it (`npm run social`).

### Fixes
- **The dog stops re-fetching the ball it just delivered.** It dropped the ball at its own feet, was back inside the grab radius on the next frame, and looped pickup/deliver at frame rate: 254 heart-and-chirp bursts in 72 seconds and a pant timer that never expired. Only the first throw ever looked right.
- **Tray wording matches what the tray actually does.** A dog was offered "Give a treat 🦴" and then thrown a tennis ball; it now reads "Throw the ball 🎾", alongside "Ball to chase" and "Work mode (stay put, no ball)".
- **Upgrading from 0.2.0 keeps your pet, your coats and your mailbox.** Electron derives the per-user data folder from the product name, so renaming pixelcat to pixelpets pointed the app at an empty directory: the next release would have greeted every existing user with an unnamed, default-coat pet, no custom coats, no notification recap, and a silently disconnected inbox, since `email.cred` holds an encrypted app-password that cannot be retyped from memory. First launch under the new name now carries the old files across. It never overwrites a file already saved under the new name, never touches the old folder, and only runs once, so deleting a file on purpose keeps it deleted.
- **`npm run lint` works on a real working copy again** - it was walking local-only paths that `.gitignore` already excludes and reporting ~1.5k errors from code this repo does not own.

### Community
- **Contributing guide, security policy, code of conduct, issue forms and a pull-request template**, so the repo is actually set up to take a contribution.

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
