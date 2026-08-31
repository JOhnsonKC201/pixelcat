# Lobby Jam, standalone

`index.html` is the pet's lo-fi jam generator with the pet taken out: the same
Karplus-Strong guitar, jazz voicings, brushed percussion and tape warmth, in one
self-contained page with no Electron, no build step and no audio files.

Open it directly in a browser:

```powershell
start tools/lobby-jam/index.html      # Windows
open  tools/lobby-jam/index.html      # macOS
```

Useful for tuning the generator without launching the app, and for hearing what
the moods sound like back to back. The version that ships inside pixelpets lives
in [`src/jam.js`](../../src/jam.js) and is toggled from Settings or the tray; see
[docs/features.md](../../docs/features.md#lobby-jam).
