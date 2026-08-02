# Contributing to pixelpets

Thanks for wanting to make pixelpets better. Issues, mac test reports, coat designs, and PRs are all welcome.

## Quick start

```powershell
git clone https://github.com/JOhnsonKC201/pixelpets.git
cd pixelpets
npm install
npm start        # your pet appears
```

The [Development section of the README](README.md#development) covers the day-to-day commands. The short version:

| Command | What it does |
|---------|--------------|
| `npm test` | Smoke tests (node --test). Must be green before a PR. |
| `npx eslint src/ tests/` | Lint. Lint these folders, not `.` (local scratch dirs are noisy). |
| `npm run sheet` | Renders every pose x coat into `previews/contact-sheet.png` for visual QA. |
| `npm run test:boot` | Boots the app headlessly and renders one frame. |

## Before you open a PR

1. **Tests green:** `npm test` (CI runs the same thing).
2. **Visual changes need visual proof.** If you touch `src/renderer.js`, `src/cat-sprite.js`, or anything that draws, run `npm run sheet` before and after. For pure refactors the sha256 of the contact sheet should not change; for intentional changes, include a before/after crop in the PR.
3. **Keep the site cat in sync.** `site/cat-sprite.js` must stay a byte-identical copy of `src/cat-sprite.js` (a test enforces this). If you change the sprite, re-copy it: `node -e "fs.copyFileSync('src/cat-sprite.js','site/cat-sprite.js')"`.
4. **Respect line endings.** Files in this repo are a mix of LF and CRLF for historical reasons. Do not normalize files you are not otherwise changing; keep each file's existing endings.
5. **Commit style:** conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), imperative mood, like the existing history.

## Good places to start

- **Own a Mac?** The macOS port is code-complete but untested on real hardware. Running the [beta checklist](README.md#build-a-standalone-app) and reporting what happened is the single most useful contribution right now.
- **Design a coat** and share it (Settings → Custom coats → Export). Great ones can become built-ins.
- Anything labeled [good first issue](https://github.com/JOhnsonKC201/pixelpets/labels/good%20first%20issue) or [help wanted](https://github.com/JOhnsonKC201/pixelpets/labels/help%20wanted).

## Ground rules for the art and sound

Everything in pixelpets is original or procedural. Please do not submit sprites, sounds, or assets copied from other desktop pets (Comnyang, Shimeji packs, etc.) or from any copyrighted source. Code that generates things is the whole point here.
