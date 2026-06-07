const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const config = require('./config');
const themes = require('./themes');
const { PATTERN_NAMES } = require('./patterns');

// AI-agent status file: hooks (e.g. Claude Code) write 'thinking' | 'done' here
// and the cat reacts. See README "AI agent reactions".
const AGENT_FILE = path.join(os.tmpdir(), 'pixelcat-agent.state');

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
let hookStarted = false;
let ignoring = true;                                   // current click-through state
let origin = { x: 0, y: 0 };                           // overlay top-left in screen px
let hot = { x: 0, y: 0, w: 0, h: 0, dragging: false }; // cat's interactive region

// Optional `--state=` / `--pattern=` force a pose/coat for --shot previews.
const stateArg = (process.argv.find((a) => a.startsWith('--state=')) || '').split('=')[1] || '';
const patternArg = (process.argv.find((a) => a.startsWith('--pattern=')) || '').split('=')[1] || '';
const SHOT = process.argv.includes('--shot');
const SHEET = process.argv.includes('--sheet');   // contact-sheet QA capture

// Single-instance: the pet is a singleton (login-launch + a manual start would
// otherwise spawn two overlays, two keyboard hooks, two cursor loops). Preview
// (--shot) runs are allowed to coexist with a running pet.
const isSecondary = !SHOT && !SHEET && !app.requestSingleInstanceLock();
if (isSecondary) app.quit();

// Launch-at-login (unpackaged): run `electron.exe <appDir>` on login.
const APP_DIR = path.resolve(__dirname, '..');
function setAutostart(enabled) {
  app.setLoginItemSettings({ openAtLogin: enabled, path: process.execPath, args: enabled ? [APP_DIR] : [] });
}

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const b = display.bounds; // full display, so the cat can stretch anywhere
  origin = { x: b.x, y: b.y };

  const opts = {
    transparent: true, frame: false, resizable: false, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false },
  };
  if (SHOT || SHEET) {
    // Small focusable window for previews (no overlay/click-through). The sheet
    // window stays hidden — it exports its canvas via IPC, not a screen capture.
    Object.assign(opts, { x: b.x + 80, y: b.y + 80, width: 240, height: 360, focusable: true, show: !SHEET });
  } else {
    // Full-display, click-through overlay; non-focusable so it never steals keys.
    Object.assign(opts, { x: b.x, y: b.y, width: b.width, height: b.height, focusable: false, enableLargerThanScreen: true });
  }
  win = new BrowserWindow(opts);
  win.setAlwaysOnTop(true, 'screen-saver');
  // Default: whole overlay passes clicks through; move events still forwarded so
  // the renderer can detect hover. Main re-derives this each cursor tick (below).
  if (!SHOT) win.setIgnoreMouseEvents(true, { forward: true });

  const params = [];
  if (stateArg) params.push(`state=${stateArg}`);
  if (patternArg) params.push(`pattern=${patternArg}`);
  if (SHOT) params.push('shot=1');
  if (SHEET) params.push('sheet=1');
  win.loadFile(path.join(__dirname, 'index.html'), { search: params.join('&') });

  // Log GPU/renderer crashes — and, for the live pet, auto-recover by reloading
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
  win.webContents.on('did-finish-load', () => { sendThemes(); if (!SHOT && !SHEET) applyConfigToOverlay(); });

  // System-wide keyboard hook so the cat reacts to typing in ANY app.
  // (Skipped for --shot previews — a screenshot has no need for a global hook,
  // which also avoids a macOS Accessibility prompt for the preview process.)
  if (!SHOT && !SHEET) {
    try {
      const { uIOhook } = require('uiohook-napi');
      uIOhook.on('keydown', () => { if (win && !win.isDestroyed()) win.webContents.send('keydown'); });
      uIOhook.on('wheel', () => { if (win && !win.isDestroyed()) win.webContents.send('scroll'); });
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
      }, 700);
    });
    return;
  }

  if (SHEET) return;   // sheet mode: no cursor loop / hooks / scheduler

  // Cursor loop: feed local cursor to the renderer AND drive the click-through
  // toggle from here (main's own loop) so a renderer stall can never leave the
  // screen stuck capturing clicks — we default back to pass-through whenever the
  // cursor isn't over the cat (and isn't mid-drag).
  let lastCurX = null, lastCurY = null;
  cursorTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const pt = screen.getCursorScreenPoint();
    const lx = pt.x - origin.x, ly = pt.y - origin.y;
    // Only forward the cursor when it actually moved — a still cursor carries no
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
  }, 16);

  // Watch the AI-agent status file; forward changes to the renderer. Event-driven
  // via fs.watch (the filename filter skips unrelated temp churn); falls back to a
  // slow poll if watching the temp dir isn't available.
  let lastAgent = '';
  const pushAgent = () => {
    if (!win || win.isDestroyed()) return;
    let s = 'idle';
    try { s = (fs.readFileSync(AGENT_FILE, 'utf8').trim() || 'idle'); } catch (e) { s = 'idle'; }
    if (s !== lastAgent) { lastAgent = s; win.webContents.send('agent', s); }
  };
  try { lastAgent = fs.readFileSync(AGENT_FILE, 'utf8').trim(); } catch (e) { /* none yet */ }
  try {
    agentWatcher = fs.watch(os.tmpdir(), (_ev, fname) => {
      if (!fname || fname === path.basename(AGENT_FILE)) pushAgent();
    });
  } catch (e) {
    agentTimer = setInterval(pushAgent, 500);
  }

  // Keep the overlay matched to the primary display on resolution/DPI/dock changes,
  // so the cat never ends up clipped or with a broken cursor→canvas mapping.
  const refit = () => {
    if (!win || win.isDestroyed()) return;
    const d = screen.getPrimaryDisplay().bounds;
    origin = { x: d.x, y: d.y };
    win.setBounds({ x: d.x, y: d.y, width: d.width, height: d.height });
  };
  screen.on('display-metrics-changed', refit);
  screen.on('display-added', refit);
  screen.on('display-removed', refit);

  // Keep the cat above EVERYTHING. alwaysOnTop at the highest level can still be
  // stolen by fullscreen apps / other topmost windows, so re-assert it on a timer
  // (and reclaim the very top with moveTop).
  const reassertTop = () => {
    if (!win || win.isDestroyed()) return;
    try {
      win.setAlwaysOnTop(true, 'screen-saver');
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      win.moveTop();
    } catch (e) { /* ignore */ }
  };
  reassertTop();                                  // claim the top immediately
  topTimer = setInterval(reassertTop, 800);       // and hold it aggressively
  win.on('blur', reassertTop);
  win.on('show', reassertTop);
  win.webContents.on('did-finish-load', reassertTop);
  screen.on('display-metrics-changed', reassertTop);
  screen.on('display-added', reassertTop);
}

// ---- settings: load, broadcast, persist ------------------------------------
function applyConfigToOverlay() {
  if (win && !win.isDestroyed() && win.webContents) win.webContents.send('config', cfg);
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
  cfg = config.save(next);
  if (cfg.breakMinutes !== prevBreak) breakAnchor = Date.now();  // editing the interval restarts it
  applyConfigToOverlay();
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('config', cfg);
  rebuildTrayMenu();
}

// ---- tray ------------------------------------------------------------------
function trayImage() {
  const p = path.join(APP_DIR, 'assets', 'tray.png');
  const img = nativeImage.createFromPath(p);
  return img.isEmpty() ? nativeImage.createEmpty() : img;
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
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Settings…', click: openSettings },
    { label: 'Start break now', click: triggerBreak },
    { type: 'separator' },
    { label: 'Coat', submenu: coatItems },
    { label: 'Follow cursor', type: 'checkbox', checked: !!(cfg && cfg.followCursor), click: () => persistAndBroadcast({ ...cfg, followCursor: !cfg.followCursor }) },
    { label: 'Mouse hunt', type: 'checkbox', checked: !!(cfg && cfg.huntOn), click: () => persistAndBroadcast({ ...cfg, huntOn: !cfg.huntOn }) },
    { label: 'Mood reactions', type: 'checkbox', checked: !(cfg && cfg.moodOn === false), click: () => persistAndBroadcast({ ...cfg, moodOn: !(cfg && cfg.moodOn !== false) }) },
    { label: 'Mood', submenu: [
      { label: 'Sleep now', click: () => sendMood('sleep') },
      { label: 'Zoomies!', click: () => sendMood('zoomies') },
      { label: 'Wake up', click: () => sendMood('wake') },
    ] },
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
    { label: 'Wander', type: 'checkbox', checked: !(cfg && cfg.roamOn === false), click: () => persistAndBroadcast({ ...cfg, roamOn: !(cfg && cfg.roamOn !== false) }) },
    { label: 'Sound', type: 'checkbox', checked: !!(cfg && cfg.soundOn), click: () => persistAndBroadcast({ ...cfg, soundOn: !cfg.soundOn }) },
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
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), contextIsolation: true, nodeIntegration: false },
  });
  settingsWin.setMenuBarVisibility(false);
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ---- break timer + reminder scheduler (lives in MAIN; renderer may be paused) --
function triggerBreak() {
  if (win && !win.isDestroyed()) win.webContents.send('break');
  breakAnchor = Date.now();
}
// Fill {name} in main (which always has cfg) so reminders are correct even if the
// overlay hasn't received its config copy yet (e.g. the immediate launch tick).
function nameFill(msg) {
  const n = cfg && cfg.name ? cfg.name : '';
  return String(msg || '').replace(/\{name\}/g, n).replace(/\s+([,!?.])/g, '$1').trim();
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
  const skipped = new Set();
  if (lastTickAt) {
    for (let ms = lastTickAt + 60000; ms < now.getTime(); ms += 60000) {
      const d = new Date(ms);
      skipped.add(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }
  }
  lastTickAt = now.getTime();
  for (const r of cfg.reminders) {
    if (r.hhmm === hhmm && !firedThisMinute.has(r.id)) {
      firedThisMinute.add(r.id);
      win.webContents.send('remind', { message: nameFill(r.message) });
    } else if (skipped.has(r.hhmm) && !firedThisMinute.has(r.id)) {
      firedThisMinute.add(r.id);
      win.webContents.send('remind', { message: nameFill(r.message) });   // missed during sleep/stall
    }
  }
  if (cfg.breakMinutes > 0 && Date.now() - breakAnchor >= cfg.breakMinutes * 60000) triggerBreak();
}
function startScheduler() {
  breakAnchor = Date.now();
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
  if (agentWatcher) { try { agentWatcher.close(); } catch (e) { /* ignore */ } }
  if (hookStarted) { try { require('uiohook-napi').uIOhook.stop(); } catch (e) { /* ignore */ } }
  if (tray) { try { tray.destroy(); } catch (e) { /* ignore */ } tray = null; }
}

// Renderer reports the cat's interactive bbox (overlay-local px) + drag state.
ipcMain.on('hot', (_e, o) => { if (o) hot = o; });
function startSetArea() {
  if (!win || win.isDestroyed()) return;
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
  if (win && !win.isDestroyed()) win.webContents.send('remind', { message: cfg && cfg.name ? `Hi ${cfg.name}!` : 'Meow!' });
});
ipcMain.handle('settings:get', () => cfg);
ipcMain.handle('settings:save', (_e, partial) => { persistAndBroadcast({ ...cfg, ...(partial || {}) }); return cfg; });
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
  themesCache = themes.load();
  if (!SHOT && !SHEET) {
    setAutostart(!process.argv.includes('--autostart=off'));
    if (process.argv.includes('--autostart=off')) { console.log('[autostart disabled]'); return app.quit(); }
    cfg = config.load();
  }
  createWindow();
  if (!SHOT && !SHEET) { createTray(); startScheduler(); }
});

// Don't quit just because the settings window closed — the overlay is the app.
// We exit only via the tray's Quit (app.quit()), which fires 'before-quit'.
app.on('window-all-closed', () => {
  if (win && !win.isDestroyed()) return;  // overlay still alive: stay running
  app.quit();
});
app.on('before-quit', cleanup);
// If the user launches a second copy while the pet runs, surface Settings rather
// than silently doing nothing (the second copy quits via the single-instance lock).
app.on('second-instance', () => { if (!isSecondary && !SHOT) openSettings(); });
