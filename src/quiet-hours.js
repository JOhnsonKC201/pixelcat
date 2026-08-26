// Quiet Hours: a daily do-not-disturb window during which the pet stays silent -
// no meow/purr and no OS toast. This is purely a clock check, so it lives apart
// from Electron and both config.js (the schema) and main.js (the notify choke
// point) can share the exact same window maths.
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 'HH:MM' -> minutes since midnight (0..1439), or null if it isn't a valid time.
function toMinutes(hhmm) {
  const m = HHMM.exec(String(hhmm == null ? '' : hhmm));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

// Is `date` inside the quiet window `q` ({ on, start, end } in 'HH:MM')?
// Handles a window that wraps past midnight (start > end, e.g. 22:00 -> 08:00).
// start === end is treated as an EMPTY window ("never"), not "always", so a
// mis-set pair can never silence the pet around the clock. The window is closed
// at the start and open at the end: [start, end), matching how a 22:00 -> 08:00
// night ends the moment the clock reads 08:00.
function inQuietHours(q, date) {
  if (!q || !q.on) return false;
  const s = toMinutes(q.start);
  const e = toMinutes(q.end);
  if (s == null || e == null || s === e) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  return s < e ? (now >= s && now < e) : (now >= s || now < e);
}

module.exports = { inQuietHours, toMinutes, HHMM };
