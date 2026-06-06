// Shared coat-pattern names, in order. The renderer's PATTERNS array (renderer.js)
// holds the full palettes; this is just the names/order so main.js (tray menu)
// and the settings window can label coats without duplicating colour data.
// KEEP IN SYNC with the PATTERNS array order in renderer.js.
const PATTERN_NAMES = [
  'Orange Tabby', 'Mackerel Tabby', 'Brown Tabby', 'Siamese',
  'Tuxedo', 'Black', 'Gray', 'White',
  'Cream', 'Tortoiseshell', 'Calico', 'Slate',
];

// Usable from both the main process (require) and a renderer (window global).
if (typeof module !== 'undefined' && module.exports) module.exports = { PATTERN_NAMES };
else if (typeof window !== 'undefined') window.PATTERN_NAMES = PATTERN_NAMES;
