// Settings window logic. Reads config from main, writes edits back (debounced),
// and renders the reminders list. Main normalizes + persists + broadcasts, so we
// just send intent and re-render from whatever main returns.
const $ = (id) => document.getElementById(id);
let cfg = null;

// Populate the coat dropdown from the built-in names plus any custom coats.
let themes = [];
function populateCoats() {
  const sel = $('pattern'); const cur = sel.value;
  sel.innerHTML = '';
  const names = (window.PATTERN_NAMES || []).concat(themes.map((t) => t.name));
  names.forEach((name, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = name; sel.appendChild(o); });
  if (cfg) sel.value = String(cfg.pattern || 0); else if (cur) sel.value = cur;
  drawPreview();
}
function drawPreview() {
  const P = window.PixelcatPreview, cv = $('coatPreview');
  if (!P || !cv) return;
  const i = Number($('pattern').value) || 0;
  let pal, build, tabby;
  if (i < P.PATTERNS.length) { pal = P.PATTERNS[i]; build = P.PATTERN_BUILD[i]; tabby = P.TABBY[i]; }
  else { const t = themes[i - P.PATTERNS.length]; if (!t) return; pal = t; build = t.build; tabby = t.tabby; }
  P.draw(cv, pal, build, tabby);
}
function renderThemes() {
  const ul = $('themes'); if (!ul) return; ul.innerHTML = '';
  if (!themes.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'No custom coats yet.'; ul.appendChild(li); return; }
  for (const t of themes) {
    const li = document.createElement('li');
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = t.coat; sw.style.borderColor = t.outline;
    const m = document.createElement('span'); m.className = 'm'; m.textContent = t.name + ' · ' + t.build + (t.tabby ? ' · tabby' : '');
    const x = document.createElement('span'); x.className = 'x'; x.textContent = '✕'; x.title = 'Remove';
    x.onclick = async () => { themes = await window.settings.deleteTheme(t.name); populateCoats(); renderThemes(); };
    li.append(sw, m, x); ul.appendChild(li);
  }
}
populateCoats();

function render() {
  if (!cfg) return;
  // Don't stomp the name field while the user is typing in it (a broadcast config
  // echo would otherwise overwrite it with the normalized value and jump the caret).
  if (document.activeElement !== $('name')) $('name').value = cfg.name || '';
  $('pattern').value = String(cfg.pattern || 0);
  $('breakMinutes').value = String(cfg.breakMinutes || 0);
  $('followCursor').checked = !!cfg.followCursor;
  $('huntOn').checked = !!cfg.huntOn;
  $('moodOn').checked = cfg.moodOn === undefined ? true : !!cfg.moodOn;
  $('soundOn').checked = !!cfg.soundOn;
  $('notifyOn').checked = cfg.notifyOn === undefined ? true : !!cfg.notifyOn;
  $('volume').value = cfg.volume === undefined ? 100 : cfg.volume;
  $('volumeVal').textContent = ($('volume').value | 0) + '%';
  $('onTop').checked = cfg.onTop === undefined ? true : !!cfg.onTop;
  $('roamOn').checked = cfg.roamOn === undefined ? true : !!cfg.roamOn;
  $('reducedMotion').checked = !!cfg.reducedMotion;
  const pomo = cfg.pomodoro || { on: false, focusMin: 25, breakMin: 5 };
  $('pomoOn').checked = !!pomo.on;
  $('pomoFocus').value = String(pomo.focusMin || 25);
  $('pomoBreak').value = String(pomo.breakMin || 5);
  if (document.activeElement !== $('pinnedNote')) $('pinnedNote').value = cfg.pinnedNote || '';
  const em = cfg.email || {};
  $('emailOn').checked = !!em.on;
  if (document.activeElement !== $('emailUser')) $('emailUser').value = em.user || '';
  if (document.activeElement !== $('emailHost')) $('emailHost').value = em.host || 'imap.gmail.com';
  if (document.activeElement !== $('emailPort')) $('emailPort').value = String(em.port || 993);
  if (document.activeElement !== $('emailInterval')) $('emailInterval').value = String(em.intervalMin || 5);
  refreshEmailPassState();
  renderReminders();
  drawPreview();
}
function recurLabel(r) {
  const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const recur = r.recur || 'daily';
  if (recur === 'daily') return '  \u00b7 daily';
  if (recur === 'weekdays') return '  \u00b7 weekdays';
  if (recur === 'once') return '  \u00b7 once';
  if (recur === 'weekly') return '  \u00b7 ' + ((r.days || []).map((d) => dn[d]).join(' ') || 'weekly');
  return '';
}
function renderReminders() {
  const ul = $('reminders'); ul.innerHTML = '';
  if (!cfg.reminders.length) {
    const li = document.createElement('li'); li.className = 'empty';
    li.textContent = 'No reminders yet.'; ul.appendChild(li); return;
  }
  for (const r of cfg.reminders) {
    const li = document.createElement('li');
    const t = document.createElement('span'); t.className = 't'; t.textContent = r.hhmm;
    const m = document.createElement('span'); m.className = 'm'; m.textContent = r.message + recurLabel(r);
    const x = document.createElement('span'); x.className = 'x'; x.textContent = '✕'; x.title = 'Remove';
    x.onclick = () => save({ reminders: cfg.reminders.filter((q) => q.id !== r.id) });
    li.append(t, m, x); ul.appendChild(li);
  }
}

// Send a partial update; main returns the normalized, persisted config.
async function save(partial) { cfg = await window.settings.save({ ...cfg, ...partial }); render(); }

let nameTimer = null;
$('name').addEventListener('input', () => {
  clearTimeout(nameTimer);
  nameTimer = setTimeout(() => save({ name: $('name').value }), 300);
});
$('pattern').addEventListener('change', () => { save({ pattern: Number($('pattern').value) }); drawPreview(); });
$('breakMinutes').addEventListener('change', () => save({ breakMinutes: Number($('breakMinutes').value) }));
$('followCursor').addEventListener('change', () => save({ followCursor: $('followCursor').checked }));
$('huntOn').addEventListener('change', () => save({ huntOn: $('huntOn').checked }));
$('moodOn').addEventListener('change', () => save({ moodOn: $('moodOn').checked }));
$('soundOn').addEventListener('change', () => save({ soundOn: $('soundOn').checked }));
$('notifyOn').addEventListener('change', () => save({ notifyOn: $('notifyOn').checked }));
$('volume').addEventListener('input', () => { $('volumeVal').textContent = ($('volume').value | 0) + '%'; });
$('volume').addEventListener('change', () => save({ volume: Number($('volume').value) }));
$('onTop').addEventListener('change', () => save({ onTop: $('onTop').checked }));
$('roamOn').addEventListener('change', () => save({ roamOn: $('roamOn').checked }));
$('reducedMotion').addEventListener('change', () => save({ reducedMotion: $('reducedMotion').checked }));
$('clearArea').addEventListener('click', () => save({ playArea: null }));
const pomoSave = () => save({ pomodoro: { on: $('pomoOn').checked, focusMin: Number($('pomoFocus').value), breakMin: Number($('pomoBreak').value) } });
$('pomoOn').addEventListener('change', pomoSave);
$('pomoFocus').addEventListener('change', pomoSave);
$('pomoBreak').addEventListener('change', pomoSave);
let noteTimer = null;
$('pinnedNote').addEventListener('input', () => {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => save({ pinnedNote: $('pinnedNote').value }), 300);
});

const selectedDays = new Set([1, 2, 3, 4, 5]);
function paintDays() {
  const dp = $('dayPicker'); if (!dp) return;
  for (const b of dp.children) { const on = selectedDays.has(Number(b.dataset.dow)); b.style.opacity = on ? '1' : '0.4'; b.style.fontWeight = on ? '700' : '400'; }
}
function buildDayPicker() {
  const dp = $('dayPicker'); if (!dp || dp.childElementCount) return;
  const dn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let d = 0; d < 7; d++) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = dn[d]; b.dataset.dow = String(d);
    b.style.cssText = 'width:24px;height:24px;padding:0;border-radius:6px;font-size:11px;cursor:pointer;';
    b.onclick = () => { const dow = Number(b.dataset.dow); if (selectedDays.has(dow)) selectedDays.delete(dow); else selectedDays.add(dow); paintDays(); };
    dp.appendChild(b);
  }
  paintDays();
}
function syncRecurUI() { const wk = $('newRecur').value === 'weekly'; $('dayPicker').style.display = wk ? 'flex' : 'none'; if (wk) buildDayPicker(); }
$('newRecur').addEventListener('change', syncRecurUI);
syncRecurUI();
$('addReminder').addEventListener('click', () => {
  const hhmm = $('newTime').value, message = $('newMsg').value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm) || !message) { $('newTime').focus(); return; }
  const id = `r${Date.now().toString(36)}${Math.floor(performance.now()).toString(36)}`;
  const recur = $('newRecur').value;
  const days = recur === 'weekly' ? Array.from(selectedDays).sort((a, b) => a - b) : [];
  save({ reminders: [...cfg.reminders, { id, hhmm, message, recur, days }] });
  $('newMsg').value = '';
});
$('newMsg').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('addReminder').click(); });

function emailSave() {
  save({ email: { on: $('emailOn').checked, user: $('emailUser').value.trim(), host: $('emailHost').value.trim(), port: Number($('emailPort').value) || 993, secure: true, intervalMin: Number($('emailInterval').value) || 5 } });
}
['emailOn', 'emailUser', 'emailHost', 'emailPort', 'emailInterval'].forEach((id) => $(id).addEventListener('change', emailSave));
async function refreshEmailPassState() {
  try { const has = await window.settings.emailHasPassword(); $('emailPassState').textContent = has ? '\u00b7 saved \u2713' : ''; }
  catch (e) { /* ignore */ }
}
let emailPassTimer = null;
$('emailPass').addEventListener('input', () => {
  clearTimeout(emailPassTimer);
  emailPassTimer = setTimeout(async () => {
    const pw = $('emailPass').value; if (!pw) return;
    await window.settings.emailSetPassword(pw);
    $('emailPass').value = ''; refreshEmailPassState();
    $('emailStatus').textContent = 'Password saved (encrypted).';
  }, 600);
});
$('emailTest').addEventListener('click', async () => {
  $('emailStatus').textContent = 'Testing\u2026'; emailSave();
  const pw = $('emailPass').value || null;
  const r = await window.settings.emailTest(pw);
  $('emailStatus').textContent = r && r.ok ? ('Connected \u2014 ' + r.unread + ' unread.') : ('Failed: ' + ((r && r.error) || 'unknown error'));
  if (pw) { await window.settings.emailSetPassword(pw); $('emailPass').value = ''; refreshEmailPassState(); }
});

// "Test meow" is a real user gesture, so playing audio here always unlocks cleanly.
$('testSound').addEventListener('click', () => { playTestMeow(); window.settings.testSound(); });

// Esc closes the settings window.
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.settings.close(); });

// External changes (e.g. coat picked from the tray) reflect live.
window.settings.onConfig((c) => { cfg = c; render(); });

window.settings.get().then((c) => { cfg = c; render(); });

// Custom coats: load + live updates from main.
window.settings.onThemes((list) => { themes = list || []; populateCoats(); renderThemes(); });
window.settings.getThemes().then((list) => { themes = list || []; populateCoats(); renderThemes(); });
$('addTheme').addEventListener('click', async () => {
  const name = $('tName').value.trim();
  if (!name) { $('tName').focus(); return; }
  const t = {
    name, build: $('tBuild').value, tabby: $('tTabby').checked,
    coat: $('c_coat').value, mark: $('c_mark').value, white: $('c_white').value, patch: $('c_patch').value,
    eye: $('c_eye').value, nose: $('c_nose').value, inner: $('c_inner').value, outline: $('c_outline').value,
  };
  themes = await window.settings.addTheme(t);
  $('tName').value = '';
  populateCoats(); renderThemes();
});
$('exportThemes').addEventListener('click', () => window.settings.exportThemes());
$('importThemes').addEventListener('click', async () => { themes = await window.settings.importThemes(); populateCoats(); renderThemes(); });

// --- local meow preview (same synthesis the overlay uses) -------------------
let actx = null;
function playTestMeow() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime, g = actx.createGain();
    g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30);
    const o = actx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(620, t0);
    o.frequency.linearRampToValueAtTime(720, t0 + 0.10);
    o.frequency.linearRampToValueAtTime(520, t0 + 0.28);
    const o2 = actx.createOscillator(); o2.type = 'sine'; o2.detune.value = 6;
    o2.frequency.setValueAtTime(620, t0);
    o2.frequency.linearRampToValueAtTime(720, t0 + 0.10);
    o2.frequency.linearRampToValueAtTime(520, t0 + 0.28);
    o.connect(g); o2.connect(g);
    o.start(t0); o2.start(t0); o.stop(t0 + 0.32); o2.stop(t0 + 0.32);
  } catch (e) { /* ignore */ }
}
