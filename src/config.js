// Settings store (main process). Owns settings.json in the per-user app data dir
// and is the single source of truth for name / coat / break-timer / sound / hunt /
// reminders. Reads are tolerant (missing or corrupt file -> DEFAULTS); writes are
// atomic (tmp + rename) so a crash mid-write can't leave a half-written file.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const { PATTERN_NAMES } = require('./patterns');
const MAX_PATTERN = PATTERN_NAMES.length - 1;

const DEFAULTS = {
  name: '',
  pattern: 0,
  breakMinutes: 0,     // 0 = break timer off
  soundOn: true,
  huntOn: true,        // Comnyang hunts the cursor by default; user-toggleable
  followCursor: true,  // eyes track the cursor; turn off to make the cat ignore it
  moodOn: true,        // energy/mood model (sleepy/calm/playful/zoomies + startle)
  reminders: [],       // [{ id, hhmm: 'HH:MM', message }]
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

// Coerce arbitrary input into the strict schema. Bad reminders are dropped.
function normalize(cfg) {
  const c = (cfg && typeof cfg === 'object') ? cfg : {};
  const seen = new Set();
  const reminders = Array.isArray(c.reminders) ? c.reminders : [];
  return {
    name: String(c.name == null ? '' : c.name).trim().slice(0, 24),
    pattern: clampInt(c.pattern, 0, MAX_PATTERN, 0),
    breakMinutes: clampInt(c.breakMinutes, 0, 240, 0),
    soundOn: c.soundOn === undefined ? true : !!c.soundOn,
    huntOn: c.huntOn === undefined ? true : !!c.huntOn,
    followCursor: c.followCursor === undefined ? true : !!c.followCursor,
    moodOn: c.moodOn === undefined ? true : !!c.moodOn,
    reminders: reminders.reduce((out, r) => {
      if (!r || typeof r !== 'object') return out;
      const hhmm = String(r.hhmm || '');
      const message = String(r.message == null ? '' : r.message).trim().slice(0, 80);
      if (!HHMM.test(hhmm) || !message) return out;
      let id = String(r.id || '');
      if (!id || seen.has(id)) id = makeId();
      seen.add(id);
      out.push({ id, hhmm, message });
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
