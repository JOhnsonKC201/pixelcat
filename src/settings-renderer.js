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
  renderReminders();
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
    const m = document.createElement('span'); m.className = 'm'; m.textContent = r.message;
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
$('pattern').addEventListener('change', () => save({ pattern: Number($('pattern').value) }));
$('breakMinutes').addEventListener('change', () => save({ breakMinutes: Number($('breakMinutes').value) }));
$('followCursor').addEventListener('change', () => save({ followCursor: $('followCursor').checked }));
$('huntOn').addEventListener('change', () => save({ huntOn: $('huntOn').checked }));
$('moodOn').addEventListener('change', () => save({ moodOn: $('moodOn').checked }));
$('soundOn').addEventListener('change', () => save({ soundOn: $('soundOn').checked }));

$('addReminder').addEventListener('click', () => {
  const hhmm = $('newTime').value, message = $('newMsg').value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm) || !message) { $('newTime').focus(); return; }
  const id = `r${Date.now().toString(36)}${Math.floor(performance.now()).toString(36)}`;
  save({ reminders: [...cfg.reminders, { id, hhmm, message }] });
  $('newMsg').value = '';
});
$('newMsg').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('addReminder').click(); });

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
