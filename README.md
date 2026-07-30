<div align="center">

<img src="assets/logo-mark.png" alt="pixelpets logo" width="112" />

# pixelpets

### A pixel cat or dog that lives on your desktop.

It sits in the corner, watches your cursor, kneads the keyboard when you type,
purrs when you pet it, and stretches like mochi when you drag it. Prefer a dog?
Switch species from the tray and you get a real one: 14 breeds, a wagging tail
that reads your pet's mood, a play bow instead of a hunting crouch, and a tennis
ball it will actually chase down and bring back. A desktop pet built from
scratch: nearly every sprite, animation, and sound is original and procedural.

<br />

[![CI](https://img.shields.io/github/actions/workflow/status/JOhnsonKC201/pixelcat/ci.yml?style=flat-square&labelColor=15161d&label=CI)](https://github.com/JOhnsonKC201/pixelcat/actions/workflows/ci.yml)
&nbsp;[![release](https://img.shields.io/github/v/release/JOhnsonKC201/pixelcat?style=flat-square&labelColor=15161d&color=E8930C)](https://github.com/JOhnsonKC201/pixelcat/releases/latest)
&nbsp;![platform](https://img.shields.io/badge/platform-Windows%20%C2%B7%20macOS%20(beta)-4C566A?style=flat-square&labelColor=15161d)
&nbsp;[![license](https://img.shields.io/github/license/JOhnsonKC201/pixelcat?style=flat-square&labelColor=15161d&color=22C55E)](LICENSE)

<br />

<img src="assets/hero-banner.gif" alt="pixelcat on your desktop: it sits and watches your cursor, kneads the keyboard when you type, and purrs when you pet it" width="880" />

<sub>Every frame above is rendered from code, not screen capture. <a href="assets/hero-banner.mp4">MP4 version</a>.</sub>

<br />
<br />

[![Download for Windows](https://img.shields.io/badge/Download_for_Windows-E8930C?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/JOhnsonKC201/pixelcat/releases/latest)
&nbsp;
[![Play in your browser](https://img.shields.io/badge/Play_in_your_browser-15161d?style=for-the-badge)](https://pixelcat-jet.vercel.app)

<sub>The browser demo runs the real renderer: pet it, type at it, scroll to climb, and wait for the butterfly.</sub>

</div>

## Two pets, one app

Pick your species from the tray (**Pet → Cat / Dog**). Each one keeps its own
coat choice, so switching back and forth never loses your pick.

|  | Cat | Dog |
|---|---|---|
| Coats | 14 coats, from Orange Tabby to Russian Blue | 14 breeds, from Golden Retriever to Chihuahua |
| Resting | loafs into a "cat bread" | curls nose-to-tail into a ring |
| Excited | hunting crouch, ears back | **play bow**: chest down, rump up, tail flagged |
| Tail | slow rolling S-curve, tip flicks | fast wag from the base, shaped per breed (curl / plume / feather / stub / straight) |
| Play | bats a butterfly | **fetch**: chases the thrown ball, carries it home, drops it |
| After exertion | grooms | pants, tongue out |
| Scroll | climbs the yarn rope hand over hand | hauls itself up the same rope, ears and snout intact |
| Reward | a fish treat | a tennis ball |

The dog is not a recoloured cat. It has its own sprite module with a muzzle that
protrudes past the skull line, ears that hang or perk per breed, a broader chest,
and short legs on the dwarf breeds. Markings are coat *structures*, not palette
swaps: the Dalmatian is spotted, the shepherd wears a saddle, the beagle is
tricolour, the husky has a mask, and the Aussie is merle.

```bash
npm run poses:dog   # previews/dog-poses.png - every breed x every ACTIVITY
npm run poses:cat   # previews/cat-poses.png - 14 coats x 11 activities
npm run sheet:dog   # previews/dog-sheet.png - the five base poses only
```

## See it in action

<table align="center">
<tr>
<td align="center"><img src="assets/gallery/climb.gif" width="240" alt="the Tuxedo cat climbs a yarn rope when you scroll" /><br /><sub><b>Climbs when you scroll</b></sub></td>
<td align="center"><img src="assets/gallery/type.gif" width="240" alt="the cat kneads the keyboard when you type" /><br /><sub><b>Kneads when you type</b></sub></td>
<td align="center"><img src="assets/gallery/butterfly.gif" width="240" alt="the cat tracks and plays with a butterfly" /><br /><sub><b>Plays with a butterfly</b></sub></td>
</tr>
<tr>
<td align="center"><img src="assets/gallery/eat.gif" width="240" alt="the cat noms a fish treat with hearts" /><br /><sub><b>Noms a treat</b></sub></td>
<td align="center"><img src="assets/gallery/sing.gif" width="240" alt="the cat sings, with floating music notes" /><br /><sub><b>Sings and meows</b></sub></td>
<td align="center"><img src="assets/gallery/pet.gif" width="240" alt="the cat purrs and floats hearts when you pet it" /><br /><sub><b>Purrs when you pet it</b></sub></td>
</tr>
<tr>
<td align="center"><img src="assets/gallery/mochi.gif" width="240" alt="the cat stretches like mochi when you drag it" /><br /><sub><b>Stretches like mochi</b></sub></td>
<td align="center"><img src="assets/gallery/hunt.gif" width="240" alt="the cat crouches and pounces to hunt the cursor" /><br /><sub><b>Pounces on the cursor</b></sub></td>
<td align="center"><img src="assets/coat-carousel.gif" width="172" alt="all 14 coats cycling on one sitting cat" /><br /><sub><b>14 coats, plus your own</b></sub></td>
</tr>
</table>

<div align="center">
<sub>The climb clip uses the app's own hand-painted Tuxedo frames. Coats without painted art climb the same
rope from a composed pose in their own colours, dogs included. Everything here is rendered from the sprite the
pet draws with, generated headlessly by one script. Nothing is a screen recording.</sub>
</div>

## What it actually does

- It reacts to you. Petting, dragging, typing, scrolling, and cursor play each get their own response, gated by an internal mood model that runs from calm up to zoomies and back.
- 14 coat patterns ship built in, all recolored at draw time from one role-coded sprite, and you can design, import, and export your own.
- Every animation is composed into that sprite, limbs included, so all 28 coats across both species get every pose in their own colours without shipping a single extra frame.
- Every sound is synthesized live with Web Audio: the meow, the purr, the chirp, and an endlessly improvising lo-fi jam. The app ships zero audio files.
- It keeps you on track. Break and Pomodoro timers, repeating reminders, a pinned note, IMAP unread-mail alerts, and calendar nudges, all delivered by the cat.
- It knows when your coding agent is thinking, working, or done, and reacts with its paws. Hook configs ship for five agents.
- The whole thing is a transparent, click-through overlay that stays above every window. Only the cat is clickable.

<div align="center">

<img src="assets/showcase.png" alt="all 14 coats across the sit, typing, hunt, and loaf poses" width="100%" />

<sub><b>Fourteen breeds, one shape.</b> Every pose in every coat, recolored from a single role-coded sprite at draw time.</sub>

</div>

## Quick start

The Windows installer is the easy path. No git, no Node, just run it:

### [Download for Windows](https://github.com/JOhnsonKC201/pixelcat/releases/latest)

You can also [play with the cat in your browser](https://pixelcat-jet.vercel.app) before installing anything.

To run from source (for development, or on macOS) you need git and Node 20 or newer:

```powershell
git clone https://github.com/JOhnsonKC201/pixelcat.git
cd pixelcat
npm install
npm start
```

Either way the cat appears in the corner and registers itself to start at login.
`npm run autostart:off` turns that off, and the installed version uninstalls like
any other program, from Windows Settings > Apps.

> **macOS (beta):** same commands. On first run, grant Accessibility permission
> (System Settings > Privacy & Security > Accessibility) so the cat can react to your
> typing and cursor. Input is only detected, never logged or sent anywhere. The mac
> port is code-complete but not yet smoke-tested on real hardware; see the
> [build checklist](#build-a-standalone-app). Issues welcome.

## Contents

- [Meet the cat](#meet-the-cat)
- [Stay on track](#stay-on-track)
- [Controls](#controls)
- [AI agent reactions](#ai-agent-reactions)
- [Custom coats](#custom-coats)
- [Build a standalone app](#build-a-standalone-app)
- [How it works](#how-it-works)
- [Privacy](#privacy)
- [Development](#development)
- [Contributing](#contributing)

---

## Meet the cat

The whole point: a pet that *feels* alive on your desktop. It reacts to touch,
to your cursor, to your typing, and to its own internal mood.

| Interaction | What the cat does |
|-------------|-------------------|
| **Drag it** | Stretches like mochi (head and feet stay solid while the body thins), then squashes and bounces back. Shake it side to side and it wobbles like jello with a startled mrrp. It stays where you drop it. |
| **Pet its head** | Squeezes its eyes shut, wiggles, floats little hearts, and purrs. The squint holds through the whole stroke, not just when your hand stops moving. |
| **Touch its body** | Squints just as happily, leans and arches into your hand, tail up, trilling. |
| **Tap it** | A quick pet: happy eyes, hearts, a chirp. |
| **Move your cursor** | The cat watches it and blinks now and then. Flick the cursor fast and it crouches, stalks, and pounces. A sudden jolt startles it: it puffs up, freezes, then bolts or creeps back. |
| **Type in any app** | It leans onto two big keys and kneads them with its paws. Type fast enough and it overheats, turning red with steam, then cools down. |
| **Scroll anywhere** | Grabs a yarn rope and climbs it hand over hand, up when you scroll up and down when you scroll down, with a ball of yarn anchored on the floor. |
| **Wait for a visitor** | Once in a while a butterfly flutters in. The cat tracks it, swats at it, and occasionally pounces and catches it between its paws before it flutters off. Step away from the keyboard and a butterfly comes out on its own, so the cat always has something to play with. |
| **Leave it be** | Left alone it keeps itself busy: it bats a drifting leaf with a paw, washes its face, loafs, and its whiskers twitch. Lively without ever getting in your way. |
| **Come back** | Return after being away and the cat notices you: happy eyes, a little heart, and a friendly chirp hello. |
| **Give it a treat** | Pick "Give a treat" from the tray and a little fish drops in. The cat trots over and noms it with hearts and a happy chirp. |
| **Late at night** | After 23:00 the cat winds down. It settles to calm faster and loafs or dozes more, though a nudge still rouses it. |

<details>
<summary><b>Coats and pixel art</b>: 14 built-in patterns, custom coats, a polished sticker look</summary>

- 14 coat patterns: Orange, Mackerel, and Brown tabby, Siamese, Tuxedo, Black,
  Gray, White, Cream, Tortoiseshell, Calico, Slate, Chocolate (a solid warm-brown
  Havana with green eyes), and Russian Blue (cool blue-grey with green eyes). It
  ships as Tuxedo; right-click the cat to cycle, and your choice is remembered.
- Custom coats: design your own (see [Custom coats](#custom-coats)).
- The pixel art has a white sticker outline that pops on any wallpaper, soft
  top-lit shading, whiskers, a ground shadow, and sparkly eyes.
- The cat is one role-coded sprite recolored per pattern at draw time, so a
  dozen cats come from one shape, and shading, outline, and the overheat tint
  apply to every coat for free.

</details>

<details>
<summary><b>Moods and energy</b>: calm, playful, or zoomies, driven by what you do</summary>

The cat tracks an internal energy value (0 to 100) that decays over time and is
bumped by stimuli: typing, scrolling, fast-mouse play, petting, an AI agent
finishing. Energy maps to three mood bands that gate and scale every reaction:

| Band | Energy | Behaviour |
|------|--------|-----------|
| **Calm** | 0-50 | Mellow, with small and infrequent idle moves (loafs, grooms) |
| **Playful** | 51-80 | Full reactions (the original feel) |
| **Zoomies** | 81-100 | Frantic and fast, then a hard crash back toward calm |

Keep it busy and it gets the zoomies, then settles back down. Startle fires on
an abrupt cursor jump (no microphone, fully local). The whole system turns off
with the Mood reactions toggle (Settings or tray) for the classic always-playful
behaviour, and the tray Mood submenu has "Zoomies!" and "Calm down" to drive the
model on demand.

</details>

<details>
<summary><b>Sound</b>: synthesized meow, purr, chirp, and mrrp, with no audio files</summary>

The meow is a voiced sawtooth shaped by a moving mouth formant (it opens into
the "ee" and closes through the "ow"), with a breath of air on the onset and
gentle vibrato. Each meow randomly comes out as a short mew, a two-syllable
meow, or a drawn-out meeow, so it never sounds canned, and pitch and length
also vary by cat species. There is also a purr, a rolled chirrup trill (the
flutter cats greet you with), and a startled mrrp. All of it is synthesized
with Web Audio in code, so there are no audio assets to ship. Toggle it in
Settings.

</details>

<details>
<summary><b>Desktop-pet overlay</b>: floats over everything, never blocks your clicks</summary>

A full-screen, transparent, click-through layer: the cat floats over everything
but only the cat itself is interactive. It stays on top of every app (it
re-asserts top-most, even over fullscreen windows), and you can confine it to a
play area by picking a tray preset or drawing one with the mouse (tray > Set
play area). It starts at login by registering itself in Windows startup.

</details>

## Stay on track

pixelcat doubles as a quiet productivity companion. Every alert comes through
the cat, as a meow and a speech bubble, with an optional real desktop notification.

<details open>
<summary><b>Timers</b>: break reminders and Pomodoro</summary>

- Break timer: pick an interval and the cat grows big to stretch with you and
  meows, on a schedule. Or "Start break now."
- Pomodoro timer: set focus and break loops, and a pixel timer floats next to
  the cat (a tomato dot for focus, green for break). At the end of each focus
  block the cat stretches with you; when the break ends it meows "Back to
  focus!". Toggle in Settings or the tray.

</details>

<details>
<summary><b>Lobby Jam</b>: synthesized lo-fi study music the cat plays live</summary>

Flip on Lobby Jam (Settings or the tray submenu) and the cat picks up a little
guitar and plays an endlessly improvising lo-fi loop: plucked Karplus-Strong
guitar over lazy jazz voicings, soft bass, brushed percussion, and tape warmth.
It is all Web Audio, generated live, with no audio files. Pick a mood:

| Mood | For |
|------|-----|
| **Cozy café** | A warm, easy background loop |
| **Dreamy** | Slow and washed out, with lots of reverb |
| **Upbeat lounge** | Brighter and a touch faster |
| **Deep focus** | Steady and minimal, almost no flourishes, so it stays out of the way while you work |
| **Rainy study** | A cozy loop over a soft, gusting rain bed |
| **Sleepy night** | Very slow, warm, and dark, for late-night wind-down |

The music mixes through the same Volume control as the meow and purr, and the
floating notes and the cat's strumming bob along in time with the beat.

</details>

<details>
<summary><b>Reminders and notes</b>: timed, repeating, snoozable</summary>

- Reminders: set a time and a message and the cat meows and shows a speech
  bubble. Reminders can repeat (daily, weekdays, specific weekdays, or once),
  can be snoozed from the tray, and support `{name}`, `{time}`, and `{date}`
  placeholders.
- Pinned note: pin an important message and it stays in a bubble above the
  cat's head until you clear it. Reminders briefly take over, then it returns.
- It calls you by name: tell the cat your name in Settings (or use `{name}`)
  and it greets you with it.
- Desktop alerts: every reminder can also raise a real Windows notification and
  a sound, so you never miss one when you are not looking at the cat.

</details>

<details>
<summary><b>Mail and calendar</b>: IMAP unread alerts and <code>.ics</code> event nudges</summary>

- Unread-mail alerts: point the cat at your IMAP inbox (Gmail, Outlook, anything
  IMAP) and it tells you when new mail arrives. Your app password is stored
  encrypted at rest (Electron `safeStorage`, which is DPAPI on Windows), never
  in `settings.json`, and the IMAP connection runs in an isolated worker process.
- Calendar nudges: paste your calendar's secret `.ics` URL (Google and Outlook
  both provide one) and the cat nudges you a few minutes before each event. The
  feed is fetched and parsed in an isolated worker.

</details>

<details>
<summary><b>Notify the cat</b>: push any message from a script, CI, or cron job</summary>

Any script or tool can make the cat deliver an arbitrary message: a speech
bubble, a Windows toast, and a meow.

```bash
node scripts/notify.js "Build finished" --title CI --level success
node scripts/notify.js "Coffee break ☕" --ttl 8000
echo "anything" | node scripts/notify.js "Deploy done"   # hook-safe (drains stdin)
```

Flags: `--title <T>`, `--level info|success|warn|alert`, `--ttl <ms>`,
`--no-sound`. The script appends one JSON line to `%TEMP%/pixelcat-notify.jsonl`
and the running cat tails the file. Lines written before the cat launched are
ignored (no backlog replay), and calling it while the cat is closed is harmless.

</details>

## Controls

| Action | What it does |
|--------|--------------|
| **Drag** the cat (hold left) | Stretches it like mochi; it drops where you release |
| **Right-click** the cat | Cycles to the next coat pattern |
| **Tap** the cat | A quick pet: happy eyes, hearts, a chirp |
| **Rest cursor on its head** | Happy eyes, floating hearts, and a purr |
| **Rest cursor on its body** | Leans and arches into your hand, tail up, trilling |
| **Type** (any app) | Front-paw kneading; fast typing overheats it |
| **Scroll** (any app) | Climbs a yarn rope, up or down with your scroll |
| **Double-click** the cat | Opens Settings (name, timers, reminders, coat) |
| **Tray icon** | Settings, Start break now, coat picker, play area, sound and hunt and mood toggles, Quit |

Settings persist to `settings.json` in your per-user app-data folder
(`%APPDATA%/pixelcat/` on Windows). Timers and reminders only fire while
pixelcat is running, and reminder times use your local clock.

## AI agent reactions

The cat reacts to a coding agent's work status, and it uses its paws to do it.
It raises a paw to its chin to ponder (with a "…" bubble) while an agent like
Claude Code, Codex, or Cursor thinks, taps a paw along with a spinner while it
works, and does a happy hop and meow when it finishes. Any tool can signal it by
running the bundled helper, which writes a tiny status file the cat watches
(`%TEMP%/pixelcat-agent.state`):

```bash
node agent-hook.js thinking   # ponders, paw to chin + "…" bubble
node agent-hook.js editing    # taps a paw + "working" spinner (also: writing/testing/building/running)
node agent-hook.js error      # the cat startles (flinch)
node agent-hook.js done       # happy hop + meow
node agent-hook.js idle       # back to normal
```

Ready-to-use hook configs for five agents live in [`integrations/`](integrations/).
Copy the one for your agent and replace the path with your checkout:

| Agent | Setup |
|-------|-------|
| **Claude Code** | merge [`integrations/claude-code/settings.hooks.json`](integrations/claude-code/) into `~/.claude/settings.json` |
| **Codex CLI** | merge [`integrations/codex/config.toml`](integrations/codex/) into `~/.codex/config.toml` |
| **Cursor** | copy [`integrations/cursor/hooks.json`](integrations/cursor/) to `<project>/.cursor/hooks.json` |
| **Antigravity** | add hooks to `.agents/hooks.json`, per [`integrations/antigravity/`](integrations/antigravity/) |
| **Kiro** | add hooks via the Agent Hooks UI, per [`integrations/kiro/`](integrations/kiro/) |

The mapping: prompt and submit events signal `thinking`, tool calls and file
edits signal `working`, and stop or complete signals `done`. Use the absolute
path to `agent-hook.js`, since hooks run from varying directories (forward
slashes work on Windows too). The helper is hook-safe: it drains stdin and
replies `{"continue": true}`, so it never blocks or alters your agent.

> Tip: `node scripts/install-hook.js <agent>` (or `npm run hook -- <agent>`)
> prints the config with the absolute path already filled in.

<sub>The richer status reactions were inspired by the open-source AI desktop pets
[openpets](https://github.com/alvinunreal/openpets) (MIT) and
[clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk) (AGPL-3.0).
Ideas only; all code here is original to pixelcat.</sub>

## Custom coats

Design your own under Settings > Custom coats > "+ Add a custom coat": pick a
name, a body build (standard, slender, stocky, or fluffy), optional tabby
stripes, and eight colours (coat, marks, white, patch, eyes, nose, inner ear,
outline). Your coat shows up in the Coat dropdown and the tray menu next to the
14 built-ins.

Custom coats live in `themes.json` in your app-data folder
(`%APPDATA%/pixelcat/themes.json`) and can be hand-edited too:

```json
{ "themes": [
  { "name": "Galaxy", "build": "fluffy", "tabby": false,
    "coat": "#3b2f63", "mark": "#2a2147", "white": "#c9c0e8", "patch": "#7a5cc0",
    "eye": "#7fd6ff", "nose": "#e0a0c0", "inner": "#9a7ad0", "outline": "#15101f" } ] }
```

Every colour role is required and must be a `#rrggbb` hex (invalid themes are
skipped). Preview one without the overlay: `npx electron . --shot --pattern=galaxy`.
Share coats with Export and Import in the same panel; they write and read a JSON
file, and imported coats merge into your set by name.

## Build a standalone app

```powershell
npm run pack    # portable build -> dist/win-unpacked/pixelcat.exe (no installer)
npm run dist    # Windows installer -> dist/pixelcat Setup <version>.exe
```

`pack` works out of the box. `dist` (the NSIS installer) needs permission to
create symlinks while electron-builder unpacks its bundled signing tools:
enable Windows Developer Mode (Settings > Privacy & security > For developers)
or run the build once from an Administrator terminal. The native `uiohook-napi`
module ships N-API prebuilds, so `npmRebuild` is disabled in the build config
and no Visual Studio is needed. `npm run icon` regenerates the procedural app
and tray icons.

**macOS:** `npm run dist:mac` (on a Mac) builds a dmg and zip for Apple Silicon
and Intel; the release workflow also builds them in CI on every version tag.
Builds are unsigned (right-click and choose Open the first time). The mac port
is code-complete but not yet smoke-tested on real hardware. If you have a Mac,
the checklist is: the overlay shows over all apps and Spaces (including
fullscreen), clicks pass through except on the cat, the typing reaction works
after granting Accessibility, the cat rests on the Dock edge (not the menu
bar), the tray menu works in the menu bar, and login launch works.

## How it works

- The cat is one role-coded sprite (outline, coat, markings, white, patch, eye,
  nose, inner ear) built procedurally, then recolored per pattern at draw time,
  so a dozen cats come from one shape.
- Every pose is composed into that same grid, including the limbs. A raised paw
  is made of the same cells as the rest of the pet, so it picks up the coat's
  shading, outline halo, markings and breathing scale for free. Nothing is
  painted on top afterwards. That is why washing, pondering, batting a leaf,
  boxing at the butterfly and climbing the yarn rope all work in all 28 coats
  and both species without a single extra sprite asset.
- Poses that vary continuously (how high a paw is raised, how far it reaches,
  which paw has the rope) are quantised to a handful of steps and memoised, and
  built only for the coat currently on screen. Pixel art wants stepped limbs
  anyway, so the cheap thing and the right-looking thing are the same thing.
- Rendering happens on an HTML canvas in a full-screen transparent Electron
  window. Ordinary screenshots cannot capture it (it is GPU-composited), so
  previews use a self-capture:
  `electron . --shot --pattern=<name> [--species=cat|dog] [--state=<pose>] [--at=<ms>]`.
- The mochi drag is a spring system (a pinned handle plus a trailing body
  point) with a three-band stretch that keeps the head and feet rigid.
- Break timers and reminders are scheduled in the main process (the renderer
  throttles and pauses when idle), which pushes fire events to the cat over
  IPC. Sound is synthesized with Web Audio in the renderer, so there are no
  audio assets to ship. Optionally, drop in an `assets/meow.ogg`, `.mp3`, or
  `.wav` (your own recording, or a clip you have rights to) and it replaces the
  synth meow.

### Project layout

```
pixelcat/
  src/
    main.js                # overlay window, global hooks, tray + menu, settings,
                           #  break/reminder scheduler, config IPC
    config.js              # settings.json load/save/normalize (per-user app data)
    patterns.js            # shared coat-name list (renderer + main + settings UI)
    renderer.js            # the cat: sprites, palettes, physics, reactions, sound
    mail.js / mail-worker.js   # IMAP unread-mail checks (isolated worker)
    cal.js  / cal-worker.js    # .ics calendar feed (isolated worker)
    themes.js              # custom-coat load/validate
    settings*.{html,js}    # settings window + its IPC bridge
    preload.js             # safe IPC bridge for the overlay
  scripts/                 # icon + demo/GIF generators, notify.js, install-hook.js
  integrations/            # ready-made agent hook configs (5 agents)
  assets/                  # generated icons, showcase, hero + gallery clips
```

## Privacy

The cat reacts to your typing and scrolling, which means it listens to global
input events, so here is the plain statement: input is used only to trigger
animations, in the moment, on your machine. Keystrokes are never logged,
stored, or sent anywhere. There is no telemetry and no auto-update. The app
makes no network connections at all unless you set up the optional mail or
calendar alerts, and those talk only to the servers you point them at, from
isolated worker processes. Your IMAP app password is stored encrypted at rest
(Electron `safeStorage`) and never written to `settings.json`.

## Development

```powershell
npm start                 # run the cat
npm test                  # 52 tests: config, poses, petting, audio, site drift
npm run poses:cat         # previews/cat-poses.png (every activity x every coat)
npm run poses:dog         # the same for all 14 breeds
npm run demo:all          # regenerate the README media (hero, gallery, carousel)
npm run hook -- cursor    # print a path-filled agent hook config
npm run icon              # regenerate the tray + app-tile icons
```

**Visual QA.** The overlay is GPU-composited, so ordinary screenshots cannot
capture it. Poses are reviewed with a one-command contact sheet instead:
`npm run poses:cat` renders **every activity across every coat** into one image,
bottom-aligned on a shared floor line so silhouettes can be compared down a
column. It runs headlessly, with no Electron and no GPU, by loading the overlay's
script stack in a vm (`scripts/overlay-vm.js`) and reading the pose grids back
out. That is also what the pose tests drive, so the sheet and the suite are
looking at exactly the same sprites.

**README media.** The hero banner, the gallery above, and the coat carousel are
all rendered from the same sprite geometry by `scripts/make-demo-gif.js`, in
pure Node with no browser or GPU. Regenerate any one with
`node scripts/make-demo-gif.js <hero|gallery|carousel> [mp4]`, or all of them
with `npm run demo:all`.

Single poses preview via
`npx electron . --shot --state=<sit|typing|hunt|loaf|groom|paper|overheat|pet|startle|work> --pattern=<coat>`.
Add `--at=<ms>` to capture an animated pose at a chosen phase (a typing
key-press, say): `npx electron . --shot --state=typing --at=760`.

### Tech

Electron · HTML canvas · Web Audio · [`uiohook-napi`](https://github.com/SnosMe/uiohook-napi)
(system-wide keyboard hook) · [`imapflow`](https://github.com/postalsys/imapflow) ·
[`node-ical`](https://github.com/jens-maus/node-ical).

## Contributing

Bug reports, ideas, and PRs are all welcome. Start with the
[contributing guide](CONTRIBUTING.md); the [security policy](SECURITY.md)
covers reporting a vulnerability privately. If you own a Mac, running the
[beta checklist](#build-a-standalone-app) and reporting back on
[the mac testers issue](https://github.com/JOhnsonKC201/pixelcat/issues/20) is
the single most useful contribution right now. Custom coats and desk setups
belong in [Discussions](https://github.com/JOhnsonKC201/pixelcat/discussions),
and release history lives in the [changelog](CHANGELOG.md).

---

<div align="center">

Made for fun. All art, code, and sound are original; the meow and purr are
synthesized in code, with no audio files. pixelcat is inspired by, not copied
from, Comnyang: no Comnyang assets, sprites, audio, or branding are used.

[**MIT**](LICENSE) © [JOhnsonKC201](https://github.com/JOhnsonKC201)

</div>
