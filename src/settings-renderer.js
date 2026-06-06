// Settings window logic. Reads config from main, writes edits back (debounced),
// and renders the reminders list. Main normalizes + persists + broadcasts, so we
// just send intent and re-render from whatever main returns.
const $ = (id) => document.getElementById(id);
let cfg = null;

// Populate the coat dropdown from the shared name list.
(window.PATTERN_NAMES || []).forEach((name, i) => {
  const o = document.createElement('option'); o.value = String(i); o.textContent = name; $('pattern').appendChild(o);
});

function render() {
  if (!cfg) return;
  $('name').value = cfg.name || '';
  $('pattern').value = String(cfg.pattern || 0);
  $('breakMinutes').value = String(cfg.breakMinutes || 0);
  $('huntOn').checked = !!cfg.huntOn;
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
$('huntOn').addEventListener('change', () => save({ huntOn: $('huntOn').checked }));
$('soundOn').addEventListener('change', () => save({ soundOn: $('soundOn').checked }));

$('addReminder').addEventListener('click', () => {
  const hhmm = $('newTime').value, message = $('newMsg').value.trim();
  if (!/^\d{2}:\d{2}$/.test(hhmm) || !message) { $('newTime').focus(); return; }
  const id = `r${Date.now().toString(36)}${Math.floor(performance.now()).toString(36)}`;
  save({ reminders: [...cfg.reminders, { id, hhmm, message }] });
  $('newMsg').value = '';
});
$('newMsg').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('addReminder').click(); });

// "Test meow" is a real user gesture, so playing audio here always unlocks cleanly.
$('testSound').addEventListener('click', () => { playTestMeow(); window.settings.testSound(); });

// External changes (e.g. coat picked from the tray) reflect live.
window.settings.onConfig((c) => { cfg = c; render(); });

window.settings.get().then((c) => { cfg = c; render(); });

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
