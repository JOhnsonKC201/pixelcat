// Does the global input hook actually work on this Electron?
//
// src/main.js wraps `require('uiohook-napi')` in a try/catch with a retry, which
// is right at runtime (a machine without Accessibility permission should still
// get a pet) and misleading during an upgrade: a native module that fails to load
// under a new Electron ABI leaves an app that boots, renders, passes CI, and has
// quietly stopped reacting to typing and scrolling. `npm run test:boot` cannot see
// that, because a pet that never kneads still draws a perfectly good frame.
//
// So this runs inside the main process, which is the only place the answer counts,
// and asks the three questions in order: does it load, does the API look right,
// does start() survive contact with the OS.
//
//   npm run check:hook
//
// Not wired into CI on purpose. A headless Linux runner has no input to hook, and
// macOS refuses the hook without Accessibility permission a runner cannot grant,
// so it would fail for reasons that say nothing about the upgrade. Run it locally
// when you change the Electron major or touch uiohook-napi.
const { app } = require('electron');

app.disableHardwareAcceleration();

const done = (report, code) => {
  console.log(JSON.stringify(report, null, 2));
  console.log(code === 0 ? '\ninput hook OK' : '\ninput hook FAILED');
  app.exit(code);
};

app.whenReady().then(() => {
  const versions = { electron: process.versions.electron, node: process.versions.node, abi: process.versions.modules };
  let uIOhook;
  try {
    ({ uIOhook } = require('uiohook-napi'));
  } catch (e) {
    return done({ ...versions, loaded: false, error: e.message }, 1);
  }
  if (typeof uIOhook.on !== 'function' || typeof uIOhook.start !== 'function') {
    return done({ ...versions, loaded: true, api: false }, 1);
  }
  try {
    uIOhook.on('keydown', () => {});
    uIOhook.on('wheel', () => {});
    uIOhook.start();
  } catch (e) {
    return done({ ...versions, loaded: true, api: true, started: false, error: e.message }, 1);
  }
  // Give the hook thread a moment to fall over on its own before calling it a pass.
  setTimeout(() => {
    let stopError = null;
    try { uIOhook.stop(); } catch (e) { stopError = e.message; }
    done({ ...versions, loaded: true, api: true, started: true, stopped: !stopError, stopError }, stopError ? 1 : 0);
  }, 700);
});
