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
  'Golden Retriever', 'Shiba Inu', 'Corgi', 'Beagle',
  'Siberian Husky', 'Dalmatian', 'German Shepherd', 'Border Collie',
  'Dachshund', 'Pug', 'Black Lab', 'Poodle',
  'Australian Shepherd', 'Chihuahua',
];

const SPECIES = {
  cat: {
    id: 'cat',
    label: 'Cat',
    emoji: '🐱',
    coats: CAT_COATS,
    coatNoun: 'Coat',
    defaultCoat: 'Tuxedo',
    // The tray's single "give" slot: what it is called AND which payload it sends.
    // They live together so the menu can never say "treat" at a dog that is actually
    // being handed a ball, which is precisely what happened while the label and the
    // channel were chosen in two different files.
    giveLabel: 'Give a treat 🐟',
    giveChannel: 'treat',
    // The companion the pet plays with on its own once you step away.
    playNoun: 'butterfly',
    playToggleLabel: 'Butterfly visits',
  },
  dog: {
    id: 'dog',
    label: 'Dog',
    emoji: '🐶',
    coats: DOG_COATS,
    coatNoun: 'Breed',
    defaultCoat: 'Golden Retriever',
    giveLabel: 'Throw the ball 🎾',
    giveChannel: 'ball',
    playNoun: 'ball',
    playToggleLabel: 'Ball to chase',
  },
};

const SPECIES_IDS = Object.keys(SPECIES);
const isSpecies = (s) => Object.prototype.hasOwnProperty.call(SPECIES, s);
const speciesOf = (s) => SPECIES[isSpecies(s) ? s : 'cat'];
const coatsFor = (s) => speciesOf(s).coats;
const defaultCoatIndex = (s) => {
  const sp = speciesOf(s);
  return Math.max(0, sp.coats.indexOf(sp.defaultCoat));
};

const api = { SPECIES, SPECIES_IDS, CAT_COATS, DOG_COATS, isSpecies, speciesOf, coatsFor, defaultCoatIndex };

if (typeof module !== 'undefined' && module.exports) module.exports = api;
else if (typeof window !== 'undefined') Object.assign(window, api, { PET_SPECIES: SPECIES });
