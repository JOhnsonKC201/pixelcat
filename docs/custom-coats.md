# Custom coats

Design your own coat under **Settings > Pet > Custom coats > "+ Add a custom
coat"**: pick a name, a body build (standard, slender, stocky, or fluffy),
optional tabby stripes, and eight colours (coat, marks, white, patch, eyes, nose,
inner ear, outline). Your coat shows up in the Coat dropdown and the tray menu
next to the 14 built-ins.

Custom coats are built from the cat's geometry, so they apply to cats only. The
Pet tab says so when a dog is selected.

## Where they live

`themes.json` in your app-data folder, which you can hand-edit too:

| Platform | Path |
|---|---|
| Windows | `%APPDATA%/pixelpets/themes.json` |
| macOS | `~/Library/Application Support/pixelpets/themes.json` |

```json
{ "themes": [
  { "name": "Galaxy", "build": "fluffy", "tabby": false,
    "coat": "#3b2f63", "mark": "#2a2147", "white": "#c9c0e8", "patch": "#7a5cc0",
    "eye": "#7fd6ff", "nose": "#e0a0c0", "inner": "#9a7ad0", "outline": "#15101f" } ] }
```

Every colour role is required and must be a `#rrggbb` hex. Invalid themes are
skipped rather than crashing the app.

## Preview one without the overlay

```powershell
npx electron . --shot --pattern=galaxy
```

## Share them

Export and Import live in the same Settings panel. They write and read a plain
JSON file, and imported coats merge into your set by name, so sharing a coat is
sending one small file.

Great coats can become built-ins. Open a
[Discussion](https://github.com/JOhnsonKC201/pixelpets/discussions) with the
export and a screenshot.

## Painting a pose instead

Custom coats change *colour*. Changing the pet's *shape* for a given pose is a
different job, and it has its own escape hatch: paint the pose, import it, and it
wins over the composer for exactly the coats you name. See
[frame-pack.md](frame-pack.md).
