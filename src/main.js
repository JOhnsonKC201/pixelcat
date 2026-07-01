const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, dialog, Notification, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const config = require('./config');
const { fillPlaceholders } = require('./template');
const mail = require('./mail');
const cal = require('./cal');
const themes = require('./themes');
const { PATTERN_NAMES } = require('./patterns');

// Let the overlay auto-resume the Lobby Jam music at launch without a click — Chromium
// otherwise blocks autoplay until a user gesture.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// AI-agent status file: hooks (e.g. Claude Code) write 'thinking' | 'done' here
// and the cat reacts. See README "AI agent reactions".
const AGENT_FILE = path.join(os.tmpdir(), 'pixelcat-agent.state');
// Generic message bridge: any external tool appends JSON lines here (see
// scripts/notify.js) and the cat shows a bubble + toast. README "Notify the cat".
const NOTIFY_FILE = path.join(os.tmpdir(), 'pixelcat-notify.jsonl');

let win;                                               // the overlay (the cat)
let settingsWin = null;                                // settings window (when open)
let tray = null;
let cfg = null;                                        // current settings (main = source of truth)
let themesCache = [];                                  // user-defined custom coats (themes.json)
let cursorTimer;
let topTimer;                                          // re-asserts always-on-top
let settingArea = false, areaTimer = null;             // "set play area (drag)" mode
let agentTimer;
let agentWatcher;
let scheduleTimer;                                     // break-timer + reminder clock
let breakAnchor = 0;                                   // ms timestamp the break countdown started
let lastMinuteKey = '';                                // 'YYYY-M-D-HH:MM' for reminder dedupe
let firedThisMinute = new Set();                       // reminder ids already fired this minute
let lastReminder = null;                                // last reminder fired (tray snooze)
let hookStarted = false;
let ignoring = true;                                   // current click-through state
let onBattery = false;                                 // running unplugged (powerMonitor)
let lowPowerBroadcast = null;                          // last effective low-power state sent to the overlay
let origin = { x: 0, y: 0 };                           // overlay top-left in screen px
let hot = { x: 0, y: 0, w: 0, h: 0, dragging: false }; // cat's interactive region

// Optional `--state=` / `--pattern=` force a pose/coat for --shot previews.
const stateArg = (process.argv.find((a) => a.startsWith('--state=')) || '').split('=')[1] || '';
const patternArg = (process.argv.find((a) => a.startsWith('--pattern=')) || '').split('=')[1] || '';
const dirArg = (process.argv.find((a) => a.startsWith('--dir=')) || '').split('=')[1] || '';   // force climb direction (up|down) for --shot previews
const SHOT = process.argv.includes('--shot');
const SHEET = process.argv.includes('--sheet');   // contact-sheet QA capture
// `--at=<ms>` sets how long to let the scene animate before the --shot capture, so
// animated poses (typing kneads, paper batting) can be QA'd at any phase.
const shotAtMs = Math.max(0, Number((process.argv.find((a) => a.startsWith('--at=')) || '').split('=')[1]) || 700);

// Single-instance: the pet is a singleton (login-launch + a manual start would
// otherwise spawn two overlays, two keyboard hooks, two cursor loops). Preview
// (--shot) runs are allowed to coexist with a running pet.
const isSecondary = !SHOT && !SHEET && !app.requestSingleInstanceLock();
if (isSecondary) app.quit();

// macOS: a desktop pet belongs in the menu bar, not the Dock or the app switcher.
if (process.platform === 'darwin' && app.dock && !SHOT && !SHEET) app.dock.hide();

// Launch-at-login (unpackaged): run `electron.exe <appDir>` on login.
const APP_DIR = path.resolve(__dirname, '..');
function setAutostart(enabled) {
  app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath, args: enabled ? [APP_DIR] : [] });
}

// --- low-power state -------------------------------------------------------
// Effective low power = user toggled it on, OR (auto-on-battery is on AND we're
// unplugged). The overlay and the cursor poll both react to this derived flag.
function effectiveLowPower() {
  return !!(cfg && (cfg.lowPower || (cfg.lowPowerOnBattery && onBattery)));
}
// Push the derived flag to the overlay only when it actually changes, and retune
// the cursor poll to match (slower while sparing power).
function broadcastPower() {
  const low = effectiveLowPower();
  if (low !== lowPowerBroadcast) {
    lowPowerBroadcast = low;
    if (win && !win.isDestroyed()) win.webContents.send('power', { lowPower: low });
    if (cursorTickRef) startCursorTimer(cursorTickRef);
  }
}
let cursorTickRef = null;
function startCursorTimer(tick) {
  cursorTickRef = tick;
  if (cursorTimer) clearInterval(cursorTimer);
  cursorTimer = setInterval(tick, effectiveLowPower() ? 50 : 33);
}

// Defence-in-depth: these windows only ever load local files, so deny any
// navigation or window-open attempt outright (would only fire if renderer content
// were ever compromised).
function hardenNav(w) {
  w.webContents.on('will-navigate', (e) => e.preventDefault());
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

function createWindow() {
  const b = screen.getPrimaryDisplay().bounds; // laptop / primary display only (no extended screen)
  origin = { x: b.x, y: b.y };

  const opts = {
    transparent: true, frame: false, resizable: false, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),   // window/alt-tab icon when run from source (dev)
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  };
  if (SHOT || SHEET) {
    // Small focusable window for previews (no overlay/click-through). The sheet
    // window stays hidden - it exports its canvas via IPC, not a screen capture.
    Object.assign(opts, { x: b.x + 80, y: b.y + 80, width: 240, height: 360, focusable: true, show: !SHEET });
  } else {
    // Full-display, click-through overlay; non-focusable so it never steals keys.
    Object.assign(opts, { x: b.x, y: b.y, width: b.width, height: b.height, focusable: false, enableLargerThanScreen: true });
  }
  win = new BrowserWindow(opts);
  hardenNav(win);
  win.setAlwaysOnTop(true, 'screen-saver');
  // macOS: follow the user across Spaces and fullscreen apps (no-op elsewhere).
  if (process.platform === 'darwin' && !SHOT && !SHEET) {
    try { win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch (e) { /* ignore */ }
  }
  // Default: whole overlay passes clicks through; move events still forwarded so
  // the renderer can detect hover. Main re-derives this each cursor tick (below).
  if (!SHOT) win.setIgnoreMouseEvents(true, { forward: true });

  const params = [];
  if (stateArg) params.push(`state=${stateArg}`);
  if (patternArg) params.push(`pattern=${patternArg}`);
  if (dirArg) params.push(`dir=${dirArg}`);
  if (process.argv.includes('--bfly')) params.push('bfly=1');   // force the butterfly visitor (QA shots)
  if (SHOT) params.push('shot=1');
  if (SHEET) params.push('sheet=1');
  win.loadFile(path.join(__dirname, 'index.html'), { search: params.join('&') });

  // Log GPU/renderer crashes - and, for the live pet, auto-recover by reloading
  // so a transparent-overlay GPU crash never leaves a dead, invisible window.
  win.webContents.on('render-process-gone', (_e, details) => {
    console.log('[render-process-gone]', JSON.stringify(details));
    if (!SHOT && win && !win.isDestroyed() && details.reason !== 'clean-exit') {
      setTimeout(() => { if (win && !win.isDestroyed()) win.reload(); }, 400);
    }
  });
  win.webContents.on('console-message', (_e, _l, message) => console.log('[r]', message));

  // Push current settings to the overlay as soon as (and every time) it loads,
  // so first paint already has the name / coat / sound+hunt flags.
  win.webContents.on('did-finish-load', () => { sendThemes(); if (!SHOT && !SHEET) { applyConfigToOverlay(); sendPomo(); sendGeom(); } });

  // System-wide keyboard hook so the cat reacts to typing in ANY app.
  // (Skipped for --shot previews - a screenshot has no need for a global hook,
  // which also avoids a macOS Accessibility prompt for the preview process.)
  if (!SHOT && !SHEET) {
    try {
      const { uIOhook } = require('uiohook-napi');
      uIOhook.on('keydown', () => { if (win && !win.isDestroyed()) win.webContents.send('keydown'); });
      // sign of rotation = scroll direction (-1 up / +1 down) so the cat can climb the right way
      uIOhook.on('wheel', (e) => { if (win && !win.isDestroyed()) win.webContents.send('scroll', Math.sign(e && e.rotation) || -1); });
      uIOhook.start();
      hookStarted = true;
    } catch (e) {
      console.log('[keyhook-error]', e.message);
    }
  }

  if (SHOT) {
    win.webContents.on('did-finish-load', () => {
      setTimeout(async () => {
        const img = await win.webContents.capturePage();
        fs.writeFileSync(path.join(__dirname, '..', '_render.png'), img.toPNG());
        console.log('[captured _render.png]');
        app.quit();
      }, shotAtMs);
    });
    return;
  }

  if (SHEET) return;   // sheet mode: no cursor loop / hooks / scheduler

  // Cursor loop: feed local cursor to the renderer AND drive the click-through
  // toggle from here (main's own loop) so a renderer stall can never leave the
  // screen stuck capturing clicks - we default back to pass-through whenever the
  // cursor isn't over the cat (and isn't mid-drag).
  let lastCurX = null, lastCurY = null;
  const cursorTick = () => {
    if (!win || win.isDestroyed()) return;
    const pt = screen.getCursorScreenPoint();
    const lx = pt.x - origin.x, ly = pt.y - origin.y;
    // Only forward the cursor when it actually moved - a still cursor carries no
    // new info, so an idle desktop costs zero cursor IPC.
    if (lx !== lastCurX || ly !== lastCurY) {
      win.webContents.send('cursor', { x: lx, y: ly });
      lastCurX = lx; lastCurY = ly;
    }
    if (settingArea) return;   // stay interactive while the user drags the play area
    const over = hot.dragging ||
      (lx >= hot.x && lx <= hot.x + hot.w && ly >= hot.y && ly <= hot.y + hot.h);
    const wantIgnore = !over;
    if (wantIgnore !== ignoring) {
      ignoring = wantIgnore;
      win.setIgnoreMouseEvents(wantIgnore, { forward: true });
    }
  };
  // Adaptive poll: ~30 Hz normally, ~20 Hz in low power. The renderer eases the
  // cursor->eyes, so a coarser sample still tracks smoothly while sparing the CPU.
  startCursorTimer(cursorTick);

  // Watch the AI-agent status file; forward changes to the renderer. Event-driven
  // via fs.watch (the filename filter skips unrelated temp churn); falls back to a
  // slow poll if watching the temp dir isn't available.
  let lastAgent = '';
  const pushAgent = () => {
    if (!win || win.isDestroyed()) return;
    let s;
    try { s = (fs.readFileSync(AGENT_FILE, 'utf8').trim() || 'idle'); } catch (e) { s = 'idle'; }
    if (s !== lastAgent) { lastAgent = s; win.webContents.send('agent', s); }
  };

  // Tail the message-bridge file. We baseline the offset to the current size so a
  // backlog from before launch isn't replayed; then forward only freshly-appended
  // lines, de-duped by id, through notify() (bubble + toast + meow).
  let notifyOffset = 0; const notifySeen = new Set(); let notifyTail = '';
  try { notifyOffset = fs.statSync(NOTIFY_FILE).size; } catch (e) { notifyOffset = 0; }
  const pushNotify = () => {
    if (!win || win.isDestroyed()) return;
    let size;
    try { size = fs.statSync(NOTIFY_FILE).size; } catch (e) { return; }
    if (size < notifyOffset) { notifyOffset = 0; notifyTail = ''; }   // truncated/rotated
    if (size === notifyOffset) return;
    let chunk;
    try {
      const fd = fs.openSync(NOTIFY_FILE, 'r');
      const buf = Buffer.alloc(size - notifyOffset);
      fs.readSync(fd, buf, 0, buf.length, notifyOffset);
      fs.closeSync(fd);
      chunk = buf.toString('utf8');
    } catch (e) { return; }
    notifyOffset = size;
    notifyTail += chunk;
    const lines = notifyTail.split('\n');
    notifyTail = lines.pop();   // keep any trailing partial line for next time
    if (notifyTail.length > 65536) notifyTail = '';   // a producer that never writes a newline can't grow memory unbounded
    for (const line of lines) {
      const t = line.trim(); if (!t) continue;
      let o; try { o = JSON.parse(t); } catch (e) { continue; }
      if (!o || typeof o !== 'object' || !o.message) continue;
      const id = String(o.id || (o.ts || '') + ':' + o.message);
      if (notifySeen.has(id)) continue;
      notifySeen.add(id);
      if (notifySeen.size > 500) { for (const k of notifySeen) { notifySeen.delete(k); if (notifySeen.size <= 250) break; } }
      // sanitize fields from the untrusted bridge file before they reach Notification + renderer IPC
      const level = ['info', 'success', 'warn', 'alert'].includes(o.level) ? o.level : 'info';
      const ttl = Math.max(500, Math.min(30000, Math.round(Number(o.ttl)) || 5000));
      const title = String(o.title || 'pixelcat').slice(0, 80);
      notify(String(o.message).slice(0, 300), { source: 'bridge', dedupeKey: 'bridge:' + id, title, level, ttl, sound: o.sound !== false });
    }
  };
  try { lastAgent = fs.readFileSync(AGENT_FILE, 'utf8').trim(); } catch (e) { /* none yet */ }
  try {
    agentWatcher = fs.watch(os.tmpdir(), (_ev, fname) => {
      if (!fname || fname === path.basename(AGENT_FILE)) pushAgent();
      if (!fname || fname === path.basename(NOTIFY_FILE)) pushNotify();
    });
  } catch (e) {
    agentTimer = setInterval(() => { pushAgent(); pushNotify(); }, 500);
  }

  // Keep the overlay matched to the primary (laptop) display on resolution/DPI changes,
  // so the cat never ends up clipped or with a broken cursor→canvas mapping.
  const refit = () => {
    if (!win || win.isDestroyed()) return;
    const d = screen.getPrimaryDisplay().bounds;
    origin = { x: d.x, y: d.y };
    win.setBounds({ x: d.x, y: d.y, width: d.width, height: d.height });
    sendGeom();   // resolution/DPI change -> re-send the true floor inset so the cat re-pins
  };
  screen.on('display-metrics-changed', refit);
  screen.on('display-added', refit);
  screen.on('display-removed', refit);

  // Keep the cat above EVERYTHING. alwaysOnTop at the highest level can still be
  // stolen by fullscreen apps / other topmost windows, so re-assert it on a timer
  // (and reclaim the very top with moveTop).
  const reassertTop = () => {
    if (!win || win.isDestroyed()) return;
    if (cfg && cfg.onTop === false) return;       // user turned "always on top" off
    try {
      win.setAlwaysOnTop(false);                  // toggle off->on forces a real re-raise on Windows
      win.setAlwaysOnTop(true, 'screen-saver');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      win.moveTop();
    } catch (e) { /* ignore */ }
  };
  reassertTop();                                  // claim the top immediately
  topTimer = setInterval(reassertTop, 700);       // and hold it (toggle re-raise each tick)
  win.webContents.on('did-finish-load', reassertTop);
  screen.on('display-metrics-changed', reassertTop);
  screen.on('display-added', reassertTop);
}

// ---- settings: load, broadcast, persist ------------------------------------
function applyConfigToOverlay() {
  if (win && !win.isDestroyed() && win.webContents) {
    try { win.setAlwaysOnTop(!cfg || cfg.onTop !== false, 'screen-saver'); } catch (e) { /* ignore */ }
    win.webContents.send('config', cfg);
    broadcastPower();   // keep the derived low-power flag + cursor cadence in sync with config
  }
}
// Send the authoritative bottom work-area inset (taskbar height) from Electron's screen
// API. The overlay's DOM window.screen is unreliable at non-100% DPI (it mixes physical
// and logical pixels), which lands the cat mid-screen; this is in DIP, matching the
// window's innerHeight, so the cat finds the true taskbar line.
function sendGeom() {
  if (!win || win.isDestroyed() || !win.webContents) return;
  const d = screen.getPrimaryDisplay(), b = d.bounds, wa = d.workArea;
  const bottomInset = Math.max(0, (b.y + b.height) - (wa.y + wa.height));   // 0 = no bottom taskbar (top/side/auto-hide) -> renderer rests at the true bottom
  const topInset = Math.max(0, wa.y - b.y), leftInset = Math.max(0, wa.x - b.x), rightInset = Math.max(0, (b.x + b.width) - (wa.x + wa.width));
  win.webContents.send('geom', { bottomInset, topInset, leftInset, rightInset });
}
function sendThemes() {
  if (win && !win.isDestroyed() && win.webContents) win.webContents.send('themes', themesCache);
}
function broadcastThemes() {
  sendThemes();
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('themes', themesCache);
}
function sendMood(cmd) {
  if (win && !win.isDestroyed() && win.webContents) win.webContents.send('mood', cmd);
}
// Single choke-point for every config change: persist, then push the new state to
// the overlay + the settings window + the tray menu so all surfaces stay in sync.
function persistAndBroadcast(next) {
  const prevBreak = cfg ? cfg.breakMinutes : 0;
  const prevPomo = cfg ? JSON.stringify(cfg.pomodoro) : '';
  const prevEmail = cfg ? JSON.stringify(cfg.email) : '';
  const prevCal = cfg ? JSON.stringify(cfg.calendar) : '';
  cfg = config.save(next);
  if (cfg.breakMinutes !== prevBreak) breakAnchor = Date.now();  // editing the interval restarts it
  if (JSON.stringify(cfg.pomodoro) !== prevPomo) syncPomodoro(); // toggling/retuning restarts the loop
  if (JSON.stringify(cfg.email) !== prevEmail) mail.sync(cfg);   // re-poll when email settings change
  if (JSON.stringify(cfg.calendar) !== prevCal) cal.sync(cfg);   // re-fetch when calendar settings change
  applyConfigToOverlay();
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('config', cfg);
  rebuildTrayMenu();
}

// ---- tray ------------------------------------------------------------------
function trayImage() {
  const p = path.join(APP_DIR, 'assets', 'tray.png');
  const img = nativeImage.createFromPath(p);
  if (img.isEmpty()) return nativeImage.createEmpty();
  // The tray icon is a colored tile (not a monochrome glyph), so it is NOT a template image.
  return img;
}
function createTray() {
  try {
    tray = new Tray(trayImage());
    tray.setToolTip('pixelcat');
    tray.on('double-click', openSettings);
    rebuildTrayMenu();
  } catch (e) { console.log('[tray-error]', e.message); }
}
function rebuildTrayMenu() {
  if (!tray) return;
  const allCoats = PATTERN_NAMES.concat(themesCache.map((t) => t.name));
  const coatItems = allCoats.map((name, i) => ({
    label: name, type: 'radio', checked: cfg && cfg.pattern === i,
    click: () => persistAndBroadcast({ ...cfg, pattern: i }),
  }));
  const recent = notifyHistory.slice(-10).reverse();
  const recentItems = recent.length
    ? recent.map((n) => ({
        label: relTime(n.ts) + ' - ' + String(n.message || '').replace(/\s+/g, ' ').slice(0, 48),
        click: () => notify(n.message, { source: 'recap', recap: true, dedupeMs: 0, os: false }),   // re-show as a bubble
      })).concat([{ type: 'separator' }, { label: 'Clear', click: () => { notifyHistory = []; saveNotifyHistorySoon(); rebuildTrayMenu(); } }])
    : [{ label: '(nothing yet)', enabled: false }];
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Settings…', click: openSettings },
    { label: 'Start break now', click: triggerBreak },
    { label: 'Recent notifications', submenu: recentItems },
    { label: 'Snooze last reminder', submenu: [
      { label: '5 minutes', click: () => snoozeLast(5) },
      { label: '10 minutes', click: () => snoozeLast(10) },
      { label: '30 minutes', click: () => snoozeLast(30) },
    ] },
    { type: 'separator' },
    { label: 'Coat', submenu: coatItems },
    { label: 'Follow cursor', type: 'checkbox', checked: !!(cfg && cfg.followCursor), click: () => persistAndBroadcast({ ...cfg, followCursor: !cfg.followCursor }) },
    { label: 'Mouse hunt', type: 'checkbox', checked: !!(cfg && cfg.huntOn), click: () => persistAndBroadcast({ ...cfg, huntOn: !cfg.huntOn }) },
    { label: 'Butterfly visits', type: 'checkbox', checked: !(cfg && cfg.butterflyOn === false), click: () => persistAndBroadcast({ ...cfg, butterflyOn: !(cfg && cfg.butterflyOn !== false) }) },
    { label: 'Mood reactions', type: 'checkbox', checked: !(cfg && cfg.moodOn === false), click: () => persistAndBroadcast({ ...cfg, moodOn: !(cfg && cfg.moodOn !== false) }) },
    { label: 'Startle at cursor', type: 'checkbox', checked: !(cfg && cfg.startleOn === false), click: () => persistAndBroadcast({ ...cfg, startleOn: !(cfg && cfg.startleOn !== false) }) },
    { label: 'Mood', submenu: [
      { label: 'Zoomies!', click: () => sendMood('zoomies') },
      { label: 'Calm down', click: () => sendMood('calm') },
    ] },
    { label: 'Pomodoro', type: 'checkbox', checked: !!(cfg && cfg.pomodoro && cfg.pomodoro.on), click: () => persistAndBroadcast({ ...cfg, pomodoro: { ...cfg.pomodoro, on: !(cfg.pomodoro && cfg.pomodoro.on) } }) },
    { label: 'Play area', submenu: [
      { label: 'Whole screen', type: 'radio', checked: !(cfg && cfg.playArea), click: () => persistAndBroadcast({ ...cfg, playArea: null }) },
      { label: 'Bottom strip', click: () => persistAndBroadcast({ ...cfg, playArea: { x: 0, y: 0.78, w: 1, h: 0.22 } }) },
      { label: 'Top strip', click: () => persistAndBroadcast({ ...cfg, playArea: { x: 0, y: 0, w: 1, h: 0.25 } }) },
      { label: 'Left third', click: () => persistAndBroadcast({ ...cfg, playArea: { x: 0, y: 0, w: 0.34, h: 1 } }) },
      { label: 'Right third', click: () => persistAndBroadcast({ ...cfg, playArea: { x: 0.66, y: 0, w: 0.34, h: 1 } }) },
      { label: 'Bottom-right', click: () => persistAndBroadcast({ ...cfg, playArea: { x: 0.6, y: 0.55, w: 0.4, h: 0.45 } }) },
      { type: 'separator' },
      { label: 'Set play area (drag)…', click: startSetArea },
    ] },
    { label: 'Always on top', type: 'checkbox', checked: !(cfg && cfg.onTop === false), click: () => persistAndBroadcast({ ...cfg, onTop: !(cfg && cfg.onTop !== false) }) },
    { label: 'Wander', type: 'checkbox', checked: !(cfg && cfg.roamOn === false), click: () => persistAndBroadcast({ ...cfg, roamOn: !(cfg && cfg.roamOn !== false) }) },
    { label: 'Rest corner', submenu: [
      { label: 'Bottom-left', type: 'radio', checked: !!(cfg && cfg.restSide === 'left'), click: () => persistAndBroadcast({ ...cfg, restSide: 'left' }) },
      { label: 'Bottom-right', type: 'radio', checked: !(cfg && cfg.restSide === 'left'), click: () => persistAndBroadcast({ ...cfg, restSide: 'right' }) },
    ] },
    { label: 'Stay on the floor', type: 'checkbox', checked: !(cfg && cfg.floorLock === false), click: () => persistAndBroadcast({ ...cfg, floorLock: !(cfg && cfg.floorLock !== false) }) },
    { label: onBattery ? 'Low power mode (on battery)' : 'Low power mode', type: 'checkbox', checked: effectiveLowPower(), click: () => persistAndBroadcast({ ...cfg, lowPower: !(cfg && cfg.lowPower) }) },
    { label: 'Sound', type: 'checkbox', checked: !!(cfg && cfg.soundOn), click: () => persistAndBroadcast({ ...cfg, soundOn: !cfg.soundOn }) },
    { label: '🎸 Lobby Jam', submenu: (() => {
      const lj = (cfg && cfg.lobbyJam) || { on: false, mood: 'cozy' };
      const MOODS = [['cozy', 'Cozy café'], ['dreamy', 'Dreamy'], ['upbeat', 'Upbeat lounge'], ['focus', 'Deep focus'], ['rain', 'Rainy study'], ['sleepy', 'Sleepy night']];
      return [
        { label: 'Play music', type: 'checkbox', checked: !!lj.on, click: () => persistAndBroadcast({ ...cfg, lobbyJam: { ...lj, on: !lj.on } }) },
        { type: 'separator' },
        ...MOODS.map(([id, label]) => ({ label, type: 'radio', checked: (lj.mood || 'cozy') === id,
          click: () => persistAndBroadcast({ ...cfg, lobbyJam: { mood: id, on: true } }) })),   // picking a mood also starts the jam
      ];
    })() },
    { type: 'separator' },
    { label: 'Quit pixelcat', click: () => app.quit() },
  ]));
}

// ---- settings window -------------------------------------------------------
function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 400, height: 560, resizable: false, fullscreenable: false, maximizable: false,
    title: 'pixelcat settings', skipTaskbar: false, alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),   // taskbar icon for the settings window
    show: false, backgroundColor: '#191b22',   // dark from the first paint - no white flash
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  hardenNav(settingsWin);
  settingsWin.setMenuBarVisibility(false);
  settingsWin.once('ready-to-show', () => { if (settingsWin && !settingsWin.isDestroyed()) settingsWin.show(); });
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ---- break timer + reminder scheduler (lives in MAIN; renderer may be paused) --
function snoozeLast(min) {
  if (!lastReminder) return;
  const lr = lastReminder;
  setTimeout(() => notify(lr.message, { source: 'reminder', dedupeKey: 'snz:' + lr.id + ':' + min }), min * 60000);
}
function triggerBreak() {
  if (win && !win.isDestroyed()) win.webContents.send('break');
  notify('Break time! Stretch with me~', { source: 'break', bubble: false, sound: false });
  breakAnchor = Date.now();
}

// ---- Pomodoro: focus/break loops. Main owns the phase clock (the renderer may
// throttle/pause); the renderer just draws a countdown from { phase, endsAt }.
// Phase flips ride the existing reactions: focus->break = the stretch break,
// break->focus = a "back to focus" reminder bubble.
let pomoPhase = 'focus', pomoEndsAt = 0, pomoTimer = null;
function sendPomo() {
  const on = !!(cfg && cfg.pomodoro && cfg.pomodoro.on);
  if (win && !win.isDestroyed()) win.webContents.send('pomo', { on, phase: pomoPhase, endsAt: pomoEndsAt });
}
function pomoFlip() {
  if (!cfg || !cfg.pomodoro || !cfg.pomodoro.on) return;
  if (pomoPhase === 'focus') {
    pomoPhase = 'break'; pomoEndsAt = Date.now() + cfg.pomodoro.breakMin * 60000;
    triggerBreak();                                              // big stretch + meow
  } else {
    pomoPhase = 'focus'; pomoEndsAt = Date.now() + cfg.pomodoro.focusMin * 60000;
    notify('Back to focus, {name}!', { source: 'pomo' });
  }
  sendPomo(); armPomoTimer();
}
function armPomoTimer() {
  if (pomoTimer) { clearTimeout(pomoTimer); pomoTimer = null; }
  if (!cfg || !cfg.pomodoro || !cfg.pomodoro.on) return;
  pomoTimer = setTimeout(pomoFlip, Math.max(250, pomoEndsAt - Date.now()));
}
// (Re)start or stop the loop whenever the pomodoro config changes.
function syncPomodoro() {
  if (cfg && cfg.pomodoro && cfg.pomodoro.on) { pomoPhase = 'focus'; pomoEndsAt = Date.now() + cfg.pomodoro.focusMin * 60000; }
  else { pomoEndsAt = 0; }
  sendPomo(); armPomoTimer();
}
// Single choke-point for every user-facing message: an in-overlay speech bubble
// (the renderer plays the meow) plus an optional Windows toast. Every producer -
// reminders, pomodoro, break, email, calendar, the external bridge - routes here.
const notifyRecent = new Map();   // dedupeKey -> last fire ms (drops rapid repeats)

// Rolling history of the cat's own notifications, so the user can recap what they
// missed (tray "Recent notifications"). Persisted so it survives a restart.
const NOTIFY_HISTORY_MAX = 50;
let notifyHistory = [];
let historySaveTimer = null;
function notifyHistoryPath() { return path.join(app.getPath('userData'), 'notify-history.json'); }
function loadNotifyHistory() {
  try { const a = JSON.parse(fs.readFileSync(notifyHistoryPath(), 'utf8')); if (Array.isArray(a)) notifyHistory = a.slice(-NOTIFY_HISTORY_MAX); }
  catch (e) { notifyHistory = []; }
}
function saveNotifyHistorySoon() {   // debounced: avoid a disk write per alert
  if (historySaveTimer) return;
  historySaveTimer = setTimeout(() => {
    historySaveTimer = null;
    try { fs.writeFileSync(notifyHistoryPath(), JSON.stringify(notifyHistory.slice(-NOTIFY_HISTORY_MAX))); } catch (e) { /* best effort */ }
  }, 1500);
}
function recordNotify(source, message) {
  notifyHistory.push({ ts: Date.now(), source: source || '', message });
  if (notifyHistory.length > NOTIFY_HISTORY_MAX) notifyHistory = notifyHistory.slice(-NOTIFY_HISTORY_MAX);
  saveNotifyHistorySoon();
  rebuildTrayMenu();   // refresh the "Recent notifications" submenu
}
function relTime(ts) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.round(s / 60); if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60); if (h < 24) return h + 'h ago';
  return Math.round(h / 24) + 'd ago';
}

function notify(message, opts) {
  opts = opts || {};
  const msg = fillPlaceholders(message, { name: cfg && cfg.name ? cfg.name : '', count: opts.count });
  if (!msg) return;
  const now = Date.now();
  const key = opts.dedupeKey || ('msg:' + msg);
  if (now - (notifyRecent.get(key) || 0) < (opts.dedupeMs == null ? 4000 : opts.dedupeMs)) return;
  notifyRecent.set(key, now);
  if (notifyRecent.size > 200) { for (const k of notifyRecent.keys()) { notifyRecent.delete(k); if (notifyRecent.size <= 100) break; } }
  if (!opts.recap) recordNotify(opts.source, msg);   // log it (but not when re-showing from the recap)
  if (opts.bubble !== false && win && !win.isDestroyed()) {
    win.webContents.send('notify', { message: msg, ttl: opts.ttl || 5000, level: opts.level || 'info', sound: opts.sound !== false });
  }
  const wantOs = opts.os !== undefined ? opts.os : !(cfg && cfg.notifyOn === false);
  if (wantOs) {
    try { if (Notification.isSupported()) new Notification({ title: opts.title || 'pixelcat', body: msg, silent: true }).show(); }
    catch (e) { /* toasts are best-effort */ }
  }
}

// Is this reminder scheduled to fire on date d? (recurrence gate.)
function reminderDueOn(r, d) {
  const recur = r.recur || 'daily';
  if (recur === 'daily') return true;
  const dow = d.getDay();   // 0 Sun .. 6 Sat
  if (recur === 'weekdays') return dow >= 1 && dow <= 5;
  if (recur === 'weekly') return Array.isArray(r.days) && r.days.includes(dow);
  if (recur === 'once') return !r.lastFired;   // fire a single time, then never again
  return true;
}
let lastTickAt = 0;
function tick() {
  if (!cfg || !win || win.isDestroyed()) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
  const hhmm = `${hh}:${mm}`;
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${hhmm}`;
  if (minuteKey !== lastMinuteKey) { lastMinuteKey = minuteKey; firedThisMinute = new Set(); }
  // Catch-up: after a sleep/resume or long stall, also fire any reminders whose
  // minute we skipped entirely (timers don't run while suspended).
  const skipped = new Map();   // 'HH:MM' -> the Date of that skipped minute, so the recurrence gate checks the RIGHT day
  if (lastTickAt) {
    for (let ms = lastTickAt + 60000; ms < now.getTime(); ms += 60000) {
      const d = new Date(ms);
      const k = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      if (!skipped.has(k)) skipped.set(k, d);
    }
  }
  lastTickAt = now.getTime();
  let onceFired = false;
  for (const r of cfg.reminders) {
    const skippedDate = skipped.get(r.hhmm);   // a minute we slept through (possibly on a different day)
    const hit = (r.hhmm === hhmm) || skippedDate !== undefined;
    if (!hit || firedThisMinute.has(r.id) || !reminderDueOn(r, skippedDate || now)) continue;
    firedThisMinute.add(r.id);
    lastReminder = { id: r.id, message: r.message };
    notify(r.message, { source: 'reminder', dedupeKey: 'rem:' + r.id });
    if ((r.recur || 'daily') === 'once') { r.lastFired = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate(); onceFired = true; }
  }
  if (onceFired) persistAndBroadcast({ ...cfg });
  if (cfg.breakMinutes > 0 && Date.now() - breakAnchor >= cfg.breakMinutes * 60000) triggerBreak();
  // Pomodoro catch-up: if the exact-time flip was lost to a sleep/stall, flip now.
  if (cfg.pomodoro && cfg.pomodoro.on && pomoEndsAt && Date.now() > pomoEndsAt + 1000) pomoFlip();
}
function startScheduler() {
  breakAnchor = Date.now();
  syncPomodoro();                            // resume the pomodoro loop if it's enabled
  tick();                                    // fire immediately (catch a launch late in the minute)
  scheduleTimer = setInterval(tick, 20000);  // sample each clock-minute ~3x; dedupe handles repeats
}

// ---- teardown --------------------------------------------------------------
let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return; cleanedUp = true;
  if (cursorTimer) clearInterval(cursorTimer);
  if (areaTimer) clearTimeout(areaTimer);
  if (topTimer) clearInterval(topTimer);
  if (agentTimer) clearInterval(agentTimer);
  if (scheduleTimer) clearInterval(scheduleTimer);
  if (pomoTimer) clearTimeout(pomoTimer);
  if (historySaveTimer) {   // flush any pending history write now, then cancel the debounce so it can't fire mid-teardown
    clearTimeout(historySaveTimer); historySaveTimer = null;
    try { fs.writeFileSync(notifyHistoryPath(), JSON.stringify(notifyHistory.slice(-NOTIFY_HISTORY_MAX))); } catch (e) { /* best effort */ }
  }
  if (agentWatcher) { try { agentWatcher.close(); } catch (e) { /* ignore */ } }
  if (hookStarted) { try { require('uiohook-napi').uIOhook.stop(); } catch (e) { /* ignore */ } }
  try { mail.stop(); } catch (e) { /* ignore */ }
  try { cal.stop(); } catch (e) { /* ignore */ }
  if (tray) { try { tray.destroy(); } catch (e) { /* ignore */ } tray = null; }
}

// Renderer reports the cat's interactive bbox (overlay-local px) + drag state.
ipcMain.on('hot', (_e, o) => {
  if (!o || typeof o !== 'object') return;
  const num = (v) => (Number.isFinite(v) ? v : 0);   // reject NaN/Infinity from a misbehaving/forged renderer (else the click-through bbox could become unbounded and capture all clicks)
  hot = { x: num(o.x), y: num(o.y), w: Math.max(0, num(o.w)), h: Math.max(0, num(o.h)), dragging: !!o.dragging };
});
function startSetArea() {
  if (!win || win.isDestroyed() || settingArea) return;   // ignore re-clicks while already setting
  settingArea = true;
  win.setIgnoreMouseEvents(false);
  win.webContents.send('setarea:start');
  clearTimeout(areaTimer);
  areaTimer = setTimeout(endSetArea, 30000);   // safety: never stay click-capturing forever
}
function endSetArea() {
  settingArea = false;
  clearTimeout(areaTimer); areaTimer = null;
  if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(true, { forward: true });
}
ipcMain.on('setarea:done', (_e, area) => { endSetArea(); if (area && cfg) persistAndBroadcast({ ...cfg, playArea: area }); });
ipcMain.on('quit', () => app.quit());
ipcMain.on('sheet:image', (_e, dataUrl) => {
  try {
    const b64 = String(dataUrl || '').replace(/^data:image\/png;base64,/, '');
    const dir = path.join(APP_DIR, 'previews');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'contact-sheet.png'), Buffer.from(b64, 'base64'));
    console.log('[wrote previews/contact-sheet.png]');
  } catch (e) { console.log('[sheet-error]', e.message); }
  app.quit();
});
ipcMain.on('settings:open', () => openSettings());
ipcMain.on('settings:save-pattern', (_e, i) => { if (cfg) persistAndBroadcast({ ...cfg, pattern: i }); });
ipcMain.on('settings:close', () => { if (settingsWin && !settingsWin.isDestroyed()) settingsWin.close(); });
ipcMain.on('settings:testSound', () => {
  notify('Hi {name}!', { source: 'test', dedupeMs: 0 });
});
ipcMain.handle('email:hasPassword', () => mail.hasPassword());
ipcMain.handle('email:setPassword', (_e, pw) => mail.setPassword(pw));
ipcMain.handle('email:test', (_e, pw) => mail.test(cfg, pw && String(pw).length ? String(pw) : null));
ipcMain.handle('calendar:test', () => cal.test(cfg));
ipcMain.handle('settings:get', () => cfg);
ipcMain.handle('settings:save', (_e, partial) => {
  // reject anything that isn't a small plain object before merging (normalize is the
  // real sanitizer, but this caps the in-flight allocation and drops junk payloads)
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) return cfg;
  try { if (JSON.stringify(partial).length > 65536) return cfg; } catch (e) { return cfg; }
  persistAndBroadcast({ ...cfg, ...partial });
  return cfg;
});
ipcMain.handle('themes:get', () => themesCache);
ipcMain.handle('themes:add', (_e, t) => { themesCache = themes.save([...themesCache, t]); broadcastThemes(); rebuildTrayMenu(); return themesCache; });
ipcMain.handle('themes:delete', (_e, name) => { themesCache = themes.save(themesCache.filter((x) => x.name !== name)); broadcastThemes(); rebuildTrayMenu(); return themesCache; });
ipcMain.handle('themes:export', async () => {
  const r = await dialog.showSaveDialog(settingsWin || win, { title: 'Export custom coats', defaultPath: 'pixelcat-coats.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return false;
  try { fs.writeFileSync(r.filePath, JSON.stringify({ themes: themesCache }, null, 2)); return true; } catch (e) { return false; }
});
ipcMain.handle('themes:import', async () => {
  const r = await dialog.showOpenDialog(settingsWin || win, { title: 'Import custom coats', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths || !r.filePaths[0]) return themesCache;
  try {
    const data = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8').replace(/^﻿/, ''));
    const incoming = themes.clean(Array.isArray(data) ? data : (data && data.themes));
    const have = new Set(themesCache.map((t) => t.name.toLowerCase()));
    themesCache = themes.save(themesCache.concat(incoming.filter((t) => !have.has(t.name.toLowerCase()))));
    broadcastThemes(); rebuildTrayMenu();
  } catch (e) { /* ignore bad file */ }
  return themesCache;
});

app.whenReady().then(() => {
  if (isSecondary) return;
  try { app.setAppUserModelId('com.johnsonkc.pixelcat'); } catch (e) { /* Windows toast identity */ }
  themesCache = themes.load();
  if (!SHOT && !SHEET) {
    setAutostart(!process.argv.includes('--autostart=off'));
    if (process.argv.includes('--autostart=off')) { console.log('[autostart disabled]'); return app.quit(); }
    cfg = config.load();
    loadNotifyHistory();   // restore the recent-notifications recap from last session
  }
  createWindow();
  if (!SHOT && !SHEET) {
    createTray(); startScheduler(); mail.init(notify, () => cfg); mail.sync(cfg); cal.init(notify, () => cfg); cal.sync(cfg);
    // Auto low-power on battery: track power state and re-derive the flag on change.
    try { onBattery = powerMonitor.isOnBatteryPower(); } catch (e) { onBattery = false; }
    try {
      powerMonitor.on('on-battery', () => { onBattery = true; broadcastPower(); rebuildTrayMenu(); });
      powerMonitor.on('on-ac', () => { onBattery = false; broadcastPower(); rebuildTrayMenu(); });
    } catch (e) { /* powerMonitor unavailable: manual control only */ }
  }
});

// Don't quit just because the settings window closed - the overlay is the app.
// We exit only via the tray's Quit (app.quit()), which fires 'before-quit'.
app.on('window-all-closed', () => {
  if (win && !win.isDestroyed()) return;  // overlay still alive: stay running
  app.quit();
});
app.on('before-quit', cleanup);
// If the user launches a second copy while the pet runs, surface Settings rather
// than silently doing nothing (the second copy quits via the single-instance lock).
app.on('second-instance', () => { if (!isSecondary && !SHOT) openSettings(); });
