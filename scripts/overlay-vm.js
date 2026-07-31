// Loads the overlay's classic <script> stack (index.html order) into a vm context
// with a mocked browser, so renderer.js state machines can be driven and inspected
// with no Electron, no GPU and no real canvas.
//
// Two consumers: the pose/interaction tests under tests/, and pet-sheet.js, which
// uses it to reach the pose composers that live inside renderer.js (the dog's live
// in a module, the cat's do not) so the contact sheet can cover every activity.
//
// The mocks are deliberately dumb: the 2D context swallows every draw call and
// Image "decodes" instantly. What this harness is FOR is everything layered on top
// of the drawing - which frame gets picked, what a species swap does to cached
// state, how an IPC event moves the animation vars, what a pose's GRID looks like.
// Actual pixel output is out of scope (the contact sheet and --shot cover that).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

// Same order as src/index.html - these share ONE global scope in the browser, and
// renderer.js reads bare identifiers defined by the files ahead of it.
const SCRIPTS = ['cat-sprite.js', 'dog-sprite.js', 'pets.js', 'art-frames.js', 'template.js',
  'climb-frames.js', 'audio.js', 'effects.js', 'jam.js', 'renderer.js'];

// A canvas 2D context that accepts anything and draws nothing.
function mockCtx2d() {
  return new Proxy({}, {
    get(_t, k) {
      if (k === 'canvas') return { width: 0, height: 0 };
      if (k === 'measureText') return () => ({ width: 8 });
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set() { return true; },
  });
}

function mockEl() {
  return {
    width: 0, height: 0, style: {},
    getContext: () => mockCtx2d(),
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {},
    setAttribute() {}, getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    classList: { add() {}, remove() {}, toggle() {} },
  };
}

// Load the overlay. Returns { run, ipc, images, store }:
//   run(expr)   - evaluate an expression against the overlay's globals
//   ipc(name, payload) - fire a preload bridge event ('onScroll', 'onConfig', ...)
//   images      - every Image the renderer created, in creation order (src recorded)
function loadOverlay() {
  const store = {};
  const images = [];
  const handlers = {};

  class MockImage {
    constructor() {
      this.naturalWidth = 64; this.naturalHeight = 154;   // ~CLIMB_SCENE_H proportions
      this.complete = false; this.onload = null; this._src = '';
      images.push(this);
    }
    set src(v) { this._src = v; this.complete = true; if (this.onload) this.onload(); }
    get src() { return this._src; }
  }

  const sandbox = {
    console, Math, Date, JSON, URLSearchParams,
    Uint8ClampedArray, Uint8Array, Float32Array, Image: MockImage,
    setTimeout, clearTimeout, setInterval, clearInterval,
    performance: { now: () => 0 },
    requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    location: { search: '' },
    innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1,
    screen: { availTop: 0, availLeft: 0, availWidth: 1920, availHeight: 1040, width: 1920, height: 1080 },
    addEventListener() {}, removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    AudioContext: function AudioContext() { return {}; },
    localStorage: {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: {
      getElementById: () => mockEl(), createElement: () => mockEl(),
      querySelector: () => mockEl(), querySelectorAll: () => [],
      addEventListener() {}, body: mockEl(), documentElement: mockEl(),
    },
    // The preload bridge (src/preload.js): onXxx registers a handler we can fire,
    // every command (setHot/quit/...) is a no-op.
    cat: new Proxy({}, {
      get(_t, k) {
        if (typeof k !== 'string') return undefined;
        return k.startsWith('on') ? (cb) => { handlers[k] = cb; } : () => {};
      },
      has() { return true; },
    }),
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);

  for (const file of SCRIPTS) {
    const code = fs.readFileSync(path.join(ROOT, 'src', file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }

  // Objects and arrays cross back from the vm carrying the CONTEXT's prototypes, so
  // assert.deepStrictEqual against a host literal fails its prototype check even
  // when the contents match exactly. Re-wrap arrays as host arrays to spare every
  // caller that trap; scalars and plain objects pass through untouched.
  const host = (v) => (Array.isArray(v) || (v && typeof v === 'object' && typeof v.length === 'number' && vm.runInContext('Array', sandbox).isArray(v))
    ? Array.from(v, host) : v);

  return {
    run: (expr) => host(vm.runInContext(expr, sandbox)),
    ipc: (name, payload) => {
      if (!handlers[name]) throw new Error(`renderer never registered window.cat.${name}`);
      handlers[name](payload);
    },
    images, store, sandbox,
  };
}

module.exports = { loadOverlay, SCRIPTS };
