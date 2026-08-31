# scripts/

Everything here is a Node or Electron entry point. Nothing in this folder ships
inside the app except `notify.js`, which is bundled deliberately so an installed
copy can still be driven from a shell.

## Public surface (do not move or rename)

These paths appear in other people's config files and shortcuts.

| Script | Run via | What it does |
|---|---|---|
| `notify.js` | `node scripts/notify.js "msg"` | Pushes a message to the running pet: speech bubble, toast, meow. Hook-safe (drains stdin). |
| `install-hook.js` | `npm run hook -- <agent>` | Prints an agent hook config with the absolute path already filled in. |

## Build and release

| Script | Run via | What it does |
|---|---|---|
| `adhoc-sign.js` | electron-builder `afterPack` | Ad-hoc signs the macOS bundle. Without the seal, macOS discards the Accessibility grant and Keychain entry on every update. |
| `bootcheck.js` | `npm run test:boot` | Launches the real app and asserts it renders a frame. Runs in CI on Windows and macOS. |
| `hook-check.js` | `npm run check:hook` | Answers whether the global input hook loads on this Electron build. |

## Art and media generators

All of these render from the same sprite geometry the app draws with, in pure
Node, with no browser and no GPU.

| Script | Run via | Output |
|---|---|---|
| `make-demo-gif.js` | `npm run demo:all` | `assets/hero-banner.*`, `assets/gallery/*`, `assets/coat-carousel.gif`. The `demo` recipe is legacy and is not part of `all`. |
| `make-reel.js` | `npm run reel` | `assets/pixelpets-reel.mp4`, the launch reel. Films the real renderer. |
| `make-social-card.js` | `npm run social` | `assets/social-card.png`, the GitHub and link-preview card. |
| `make-logo-icons.js` | `npm run icon` | Every app and tray icon, from the master `assets/logo.png`. |
| `logo-source.js` | library | Loads and rescales `logo.png`, and decodes PNGs for the climb slicer. |

## Sprite tooling

| Script | Run via | What it does |
|---|---|---|
| `overlay-vm.js` | library | Loads the overlay's script stack in a vm so poses can be read back headlessly. The pose tests and the contact sheets both drive this. |
| `pet-sheet.js` | `npm run poses:cat` / `poses:dog` | Renders every activity across every coat into one contact sheet for visual QA. |
| `import-frames.js` | `npm run frames:import -- <dir>` | Imports hand-painted PNGs as baked poses that win over the composer. See [docs/frame-pack.md](../docs/frame-pack.md). |
| `slice-climb-sheet.js` | `node scripts/slice-climb-sheet.js <sheet> <coat>` | Slices a 5-panel climb contact sheet into per-coat frames. See [assets/climb/](../assets/climb/). |
| `embed-climb-frames.js` | `npm run climb-frames` | Bakes those frames into `src/climb-frames.js`. |
