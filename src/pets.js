// Species registry - the single source of truth for which pets exist and what
// each one's coats are called. Mirrors patterns.js (which stays the cat's list so
// nothing that already imports it breaks) and is consumed by the main process for
// the tray menu, by the settings window for its dropdowns, and by the renderer to
// decide which sprite composers to build with.
//
// Coat NAMES only. The full palettes live in cat-sprite.js / dog-sprite.js so
// colour data is never duplicated.

const CAT_COATS = [
  'Orange Tabby', 'Mackerel Tabby', 'Brown Tabby', 'Siamese',
  'Tuxedo', 'Black', 'Gray', 'White',
  'Cream', 'Tortoiseshell', 'Calico', 'Slate',
  'Chocolate', 'Russian Blue',
];

const DOG_COATS = [
  'Black Lab',
];

const SPECIES = {
  cat: {
    id: 'cat',
    label: 'Cat',
    emoji: '🐱',
    coats: CAT_COATS,
    coatNoun: 'Coat',
    defaultCoat: 'Mackerel Tabby',
    // The tray's single "give" slot: what it is called AND which payload it sends.
    // They live together so the menu can never say "treat" at a dog that is actually
    // being handed a ball, which is precisely what happened while the label and the
    // channel were chosen in two different files.
    giveLabel: 'Give a treat 🐟',
    giveChannel: 'treat',
    // The companion the pet plays with on its own once you step away.
    playNoun: 'butterfly',
    playToggleLabel: 'Butterfly visits',
    // Vocabulary the settings window writes into SETTINGS_TEXT below.
    noun: 'cat',
    voice: 'meow',
    voiceLine: 'meow & purr',
    chase: 'pounces',
    playArrival: 'drops by',
    customCoatNote: 'Design your own and pick it from Coat above.',
  },
  dog: {
    id: 'dog',
    label: 'Dog',
    emoji: '🐶',
    coats: DOG_COATS,
    coatNoun: 'Breed',
    defaultCoat: 'Black Lab',
    giveLabel: 'Throw the ball 🎾',
    giveChannel: 'ball',
    playNoun: 'ball',
    playToggleLabel: 'Ball to chase',
    noun: 'dog',
    voice: 'bark',
    voiceLine: 'bark & pant',
    chase: 'chases',
    playArrival: 'rolls in',
    // Custom coats are built from the cat's geometry (see populateCoats), so a dog
    // owner needs to be told that rather than left staring at a list that never grows.
    customCoatNote: 'Custom coats are cat-only for now. Switch to Cat to use one.',
  },
};

// Every string in the settings window whose wording depends on the pet, keyed by
// the element id that displays it. The window used to hard-code the cat's nouns in
// its markup, so a dog owner read "the cat calls you by it" on rows the TRAY had
// already learned to call "Ball to chase" - two UIs disagreeing about one toggle.
//
// %token% is looked up on the species entry. The braces in the reminders hint are a
// DIFFERENT substitution (fillPlaceholders expands {name}/{time}/{date} at meow time)
// and must survive this pass untouched, which is why these use percent signs.
const SETTINGS_TEXT = {
  petCardTitle: 'your %noun%',
  nameLabel: 'Your name - the %noun% calls you by it',
  coatLabel: '%coatNoun%',
  huntSub: '%chase% when the mouse moves fast',
  playTitle: '%playToggleLabel%',
  playSub: 'a %playNoun% %playArrival% and the %noun% plays with it',
  workModeSub: 'parks the %noun% in its rest corner on the taskbar & hides the %playNoun% while you work',
  onTopSub: 'keep the %noun% above other windows',
  soundSub: '%voiceLine% (synthesized)',
  pomoSub: 'a pixel timer floats next to the %noun%; it stretches with you on breaks',
  emailSub: 'the %noun% tells you when new mail arrives (IMAP)',
  calSub: 'the %noun% reminds you before calendar events (.ics)',
  remindersHint: 'The %noun% %voice%s your message at a set time. Placeholders: {name} {time} {date}',
  pinnedNoteLabel: "Pinned note - stays above the %noun%'s head (leave empty to hide)",
  coatsHint: '%customCoatNote%',
  testSound: '🔊 Test %voice%',
};

// Resolve SETTINGS_TEXT for one species: { elementId: finalString }. An unknown
// %token% is left alone rather than blanked, so a typo shows up in the window as
// literal "%typo%" instead of silently deleting half a sentence.
function settingsText(species) {
  const sp = speciesOf(species);
  const out = {};
  for (const [id, tpl] of Object.entries(SETTINGS_TEXT)) {
    out[id] = tpl.replace(/%(\w+)%/g, (m, k) => (typeof sp[k] === 'string' ? sp[k] : m));
  }
  return out;
}

const SPECIES_IDS = Object.keys(SPECIES);
const isSpecies = (s) => Object.prototype.hasOwnProperty.call(SPECIES, s);
const speciesOf = (s) => SPECIES[isSpecies(s) ? s : 'cat'];
const coatsFor = (s) => speciesOf(s).coats;
const defaultCoatIndex = (s) => {
  const sp = speciesOf(s);
  return Math.max(0, sp.coats.indexOf(sp.defaultCoat));
};

const api = { SPECIES, SPECIES_IDS, CAT_COATS, DOG_COATS, isSpecies, speciesOf, coatsFor, defaultCoatIndex, SETTINGS_TEXT, settingsText };

if (typeof module !== 'undefined' && module.exports) module.exports = api;
else if (typeof window !== 'undefined') Object.assign(window, api, { PET_SPECIES: SPECIES });
