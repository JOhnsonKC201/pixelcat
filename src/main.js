const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// AI-agent status file: hooks (e.g. Claude Code) write 'thinking' | 'done' here
// and the cat reacts. See README "AI agent reactions".
const AGENT_FILE = path.join(os.tmpdir(), 'comnyang-agent.state');

let win;
let cursorTimer;
let agentTimer;
let hookStarted = false;
let ignoring = true;                                   // current click-through state
let origin = { x: 0, y: 0 };                           // overlay top-left in screen px
let hot = { x: 0, y: 0, w: 0, h: 0, dragging: false }; // cat's interactive region

// Optional `--state=` / `--pattern=` force a pose/coat for --shot previews.
const stateArg = (process.argv.find((a) => a.startsWith('--state=')) || '').split('=')[1] || '';
const patternArg = (process.argv.find((a) => a.startsWith('--pattern=')) || '').split('=')[1] || '';
const SHOT = process.argv.includes('--shot');

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
  if (SHOT) {
    // Small focusable window for screenshot previews (no overlay/click-through).
    Object.assign(opts, { x: b.x + 80, y: b.y + 80, width: 240, height: 360, focusable: true });
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
  win.loadFile(path.join(__dirname, 'index.html'), { search: params.join('&') });

  win.webContents.on('render-process-gone', (_e, details) =>
    console.log('[render-process-gone]', JSON.stringify(details)));
  win.webContents.on('console-message', (_e, _l, message) => console.log('[r]', message));

  // System-wide keyboard hook so the cat reacts to typing in ANY app.
  try {
    const { uIOhook } = require('uiohook-napi');
    uIOhook.on('keydown', () => { if (win && !win.isDestroyed()) win.webContents.send('keydown'); });
    uIOhook.on('wheel', () => { if (win && !win.isDestroyed()) win.webContents.send('scroll'); });
    uIOhook.start();
    hookStarted = true;
  } catch (e) {
    console.log('[keyhook-error]', e.message);
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

  // Cursor loop: feed local cursor to the renderer AND drive the click-through
  // toggle from here (main's own loop) so a renderer stall can never leave the
  // screen stuck capturing clicks — we default back to pass-through whenever the
  // cursor isn't over the cat (and isn't mid-drag).
  cursorTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    const pt = screen.getCursorScreenPoint();
    const lx = pt.x - origin.x, ly = pt.y - origin.y;
    win.webContents.send('cursor', { x: lx, y: ly });
    const over = hot.dragging ||
      (lx >= hot.x && lx <= hot.x + hot.w && ly >= hot.y && ly <= hot.y + hot.h);
    const wantIgnore = !over;
    if (wantIgnore !== ignoring) {
      ignoring = wantIgnore;
      win.setIgnoreMouseEvents(wantIgnore, { forward: true });
    }
  }, 16);

  // Watch the AI-agent status file; forward changes to the renderer.
  let lastAgent = '';
  try { lastAgent = fs.readFileSync(AGENT_FILE, 'utf8').trim(); } catch (e) { /* none yet */ }
  agentTimer = setInterval(() => {
    if (!win || win.isDestroyed()) return;
    let s = 'idle';
    try { s = (fs.readFileSync(AGENT_FILE, 'utf8').trim() || 'idle'); } catch (e) { s = 'idle'; }
    if (s !== lastAgent) { lastAgent = s; win.webContents.send('agent', s); }
  }, 300);
}

// Renderer reports the cat's interactive bbox (overlay-local px) + drag state.
ipcMain.on('hot', (_e, o) => { if (o) hot = o; });
ipcMain.on('quit', () => app.quit());

app.whenReady().then(() => {
  if (!SHOT) {
    setAutostart(!process.argv.includes('--autostart=off'));
    if (process.argv.includes('--autostart=off')) { console.log('[autostart disabled]'); return app.quit(); }
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (cursorTimer) clearInterval(cursorTimer);
  if (agentTimer) clearInterval(agentTimer);
  if (hookStarted) { try { require('uiohook-napi').uIOhook.stop(); } catch (e) { /* ignore */ } }
  app.quit();
});
