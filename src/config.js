// Settings store (main process). Owns settings.json in the per-user app data dir
// and is the single source of truth for name / coat / break-timer / sound / hunt /
// reminders. Reads are tolerant (missing or corrupt file -> DEFAULTS); writes are
// atomic (tmp + rename) so a crash mid-write can't leave a half-written file.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const { PATTERN_NAMES } = require('./patterns');
const MAX_PATTERN = PATTERN_NAMES.length - 1;
const DEFAULT_PATTERN = Math.max(0, PATTERN_NAMES.indexOf('Tuxedo'));   // tuxedo is the out-of-box coat

const DEFAULTS = {
  name: '',
  pattern: DEFAULT_PATTERN,
  breakMinutes: 0,     // 0 = break timer off
  soundOn: true,
  huntOn: true,        // Comnyang hunts the cursor by default; user-toggleable
  followCursor: true,  // eyes track the cursor; turn off to make the cat ignore it
  moodOn: true,        // energy/mood model (calm/playful/zoomies + startle)
  startleOn: true,     // flinch/bolt when the cursor lunges at it; off = ignore sudden cursor moves
  playArea: null,      // { x,y,w,h } fractions of the screen the cat stays in; null = whole screen
  onTop: true,         // keep the cat above all other windows
  roamOn: true,        // the cat autonomously wanders its play area
  restSide: 'right',   // which bottom corner is home (spawn + where roaming drifts back to): 'left' | 'right'
  floorLock: true,     // pin the cat to the taskbar/Dock line: it strolls left/right but never wanders up the screen
  butterflyOn: true,   // a butterfly occasionally flits in and the cat plays with it; off = no visits
  workMode: false,     // "I'm working": park in the rest corner on the taskbar + hide the butterfly, roaming, cursor-chase, startle-bolt, and leaf-play
  volume: 100,         // master sound volume 0-100
  reducedMotion: false,// calm mode: no roaming/bouncing/screen-glow
  lowPower: false,     // fewer idle frames + slower cursor polling to spare CPU/GPU
  lowPowerOnBattery: true, // auto-enter low power while running on battery
  pinnedNote: '',      // fixed message pinned above the cat's head ('' = off)
  notifyOn: true,      // also pop a Windows toast for reminders/messages
  pomodoro: { on: false, focusMin: 25, breakMin: 5 },  // focus/break loops + floating pixel timer
  lobbyJam: { on: false, mood: 'cozy' },  // synthesized lo-fi "study music" the cat plays (cozy/dreamy/upbeat/focus/rain)
  reminders: [],       // [{ id, hhmm: 'HH:MM', message, recur, days, lastFired }]
  email: { on: false, host: '', port: 993, user: '', secure: true, intervalMin: 5 }, // IMAP unread alerts (app-password stored separately, encrypted)
  calendar: { on: false, icsUrl: '', leadMin: 10 }, // nudge before events from a secret .ics URL
};

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

let idSeq = 0;
function makeId() { idSeq += 1; return `r${idSeq.toString(36)}${(idSeq * 2654435761 % 0xffffff).toString(36)}`; }

function normArea(a) {
  if (!a || typeof a !== "object") return null;
  const f = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(1, +v)) : null);
  const x = f(a.x), y = f(a.y), w = f(a.w), h = f(a.h);
  if (x == null || y == null || w == null || h == null || w < 0.05 || h < 0.05) return null;
  return { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}
// Coerce arbitrary input into the strict schema. Bad reminders are dropped.
function normalize(cfg) {
  const c = (cfg && typeof cfg === 'object') ? cfg : {};
  const seen = new Set();
  const reminders = Array.isArray(c.reminders) ? c.reminders : [];
  return {
    name: String(c.name == null ? '' : c.name).trim().slice(0, 24),
    pattern: clampInt(c.pattern, 0, MAX_PATTERN, DEFAULT_PATTERN),
    breakMinutes: clampInt(c.breakMinutes, 0, 240, 0),
    soundOn: c.soundOn === undefined ? true : !!c.soundOn,
    huntOn: c.huntOn === undefined ? true : !!c.huntOn,
    followCursor: c.followCursor === undefined ? true : !!c.followCursor,
    moodOn: c.moodOn === undefined ? true : !!c.moodOn,
    startleOn: c.startleOn === undefined ? true : !!c.startleOn,
    playArea: normArea(c.playArea),
    onTop: c.onTop === undefined ? true : !!c.onTop,
    roamOn: c.roamOn === undefined ? true : !!c.roamOn,
    restSide: c.restSide === 'left' ? 'left' : 'right',
    floorLock: c.floorLock === undefined ? true : !!c.floorLock,
    butterflyOn: c.butterflyOn === undefined ? true : !!c.butterflyOn,
    workMode: !!c.workMode,
    volume: clampInt(c.volume, 0, 100, 100),
    reducedMotion: !!c.reducedMotion,
    lowPower: !!c.lowPower,
    lowPowerOnBattery: c.lowPowerOnBattery === undefined ? true : !!c.lowPowerOnBattery,
    pinnedNote: String(c.pinnedNote == null ? '' : c.pinnedNote).trim().slice(0, 80),
    notifyOn: c.notifyOn === undefined ? true : !!c.notifyOn,
    pomodoro: (() => {
      const p = (c.pomodoro && typeof c.pomodoro === 'object') ? c.pomodoro : {};
      return { on: !!p.on, focusMin: clampInt(p.focusMin, 5, 120, 25), breakMin: clampInt(p.breakMin, 1, 60, 5) };
    })(),
    lobbyJam: (() => {
      const lj = (c.lobbyJam && typeof c.lobbyJam === 'object') ? c.lobbyJam : {};
      return { on: !!lj.on, mood: ['cozy', 'dreamy', 'upbeat', 'focus', 'rain', 'sleepy'].includes(lj.mood) ? lj.mood : 'cozy' };
    })(),
    email: (() => {
      const e = (c.email && typeof c.email === 'object') ? c.email : {};
      const port = clampInt(e.port, 1, 65535, 993);
      // Enforce implicit TLS except on the STARTTLS port (143). This blocks a
      // plaintext downgrade (secure:false on 993) from a malformed/forged config.
      const secure = port === 143 ? !!e.secure : true;
      return {
        on: !!e.on,
        host: String(e.host == null ? '' : e.host).trim().slice(0, 120),
        port,
        user: String(e.user == null ? '' : e.user).trim().slice(0, 160),
        secure,
        intervalMin: clampInt(e.intervalMin, 1, 60, 5),
      };
    })(),
    calendar: (() => {
      const k = (c.calendar && typeof c.calendar === 'object') ? c.calendar : {};
      let url = String(k.icsUrl == null ? '' : k.icsUrl).trim().slice(0, 2000);
      if (/^webcal:\/\//i.test(url)) url = 'https://' + url.slice(9);
      if (url && !/^https?:\/\//i.test(url)) url = '';
      return { on: !!k.on, icsUrl: url, leadMin: clampInt(k.leadMin, 0, 1440, 10) };
    })(),
    reminders: reminders.reduce((out, r) => {
      if (!r || typeof r !== 'object') return out;
      const hhmm = String(r.hhmm || '');
      const message = String(r.message == null ? '' : r.message).trim().slice(0, 80);
      if (!HHMM.test(hhmm) || !message) return out;
      let id = String(r.id || '');
      if (!id || seen.has(id)) id = makeId();
      seen.add(id);
      const recur = ['once', 'daily', 'weekdays', 'weekly'].includes(r.recur) ? r.recur : 'daily';
      const days = Array.isArray(r.days)
        ? Array.from(new Set(r.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort((a, b) => a - b)
        : [];
      const lastFired = /^\d{4}-\d{1,2}-\d{1,2}$/.test(String(r.lastFired || '')) ? String(r.lastFired) : '';
      out.push({ id, hhmm, message, recur, days: recur === 'weekly' ? days : [], lastFired: recur === 'once' ? lastFired : '' });
      return out;
    }, []),
  };
}

// Fill any missing top-level key from DEFAULTS (forward-compatible loads).
function migrate(cfg) {
  return { ...DEFAULTS, ...(cfg && typeof cfg === 'object' ? cfg : {}) };
}

function load() {
  let raw;
  try {
    raw = fs.readFileSync(filePath(), 'utf8').replace(/^﻿/, ''); // tolerate editor BOM
  } catch (e) {
    // Missing file -> first run, write defaults. Any OTHER read error (EBUSY/EACCES
    // from an AV scanner or editor lock) is transient: return defaults but DON'T
    // overwrite the on-disk file, so real settings are never destroyed.
    const fresh = normalize(DEFAULTS);
    if (e && e.code === 'ENOENT') { try { save(fresh); } catch (e2) { /* best effort */ } }
    return fresh;
  }
  try {
    return normalize(migrate(JSON.parse(raw)));
  } catch (e) {
    // The file exists but is corrupt JSON -> safe to replace with defaults.
    const fresh = normalize(DEFAULTS);
    try { save(fresh); } catch (e2) { /* best effort */ }
    return fresh;
  }
}

function save(cfg) {
  const clean = normalize(cfg);
  const fp = filePath();
  try {
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const tmp = `${fp}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(clean, null, 2));
    fs.renameSync(tmp, fp);
  } catch (e) { /* keep the in-memory value even if disk write fails */ }
  return clean;
}

module.exports = { DEFAULTS, load, save, normalize, migrate, makeId, filePath };
