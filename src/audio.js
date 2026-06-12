// Procedural sound (WebAudio; no asset files). Loaded as a classic <script> before
// renderer.js, sharing the overlay's global scope: it reads `config` (volume/soundOn)
// and `patternIndex`/`PATTERN_BUILD` (per-breed voice) and exposes audio()/playMeow()/
// startPurr()/stopPurr()/playChirp()/playMrrp() that renderer.js calls. Extracted from
// renderer.js to keep that file focused on drawing.
/* exported playMeow, startPurr, stopPurr, playChirp, playMrrp */
let actx = null, master = null;
function volNow() { return (config && typeof config.volume === 'number' ? config.volume : 100) / 100; }
function audio() {
  try {
    if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.connect(actx.destination); master.gain.value = volNow(); }
    if (actx.state === 'suspended') actx.resume();
  } catch (e) { actx = null; }
  return actx;
}
function voiceFor() {
  const build = (typeof PATTERN_BUILD !== 'undefined' && PATTERN_BUILD[patternIndex]) || 'standard';
  const base = build === 'slender' ? { pitch: 1.22, dur: 1.25, type: 'sawtooth', gain: 0.95 }
    : build === 'stocky' ? { pitch: 0.82, dur: 0.92, type: 'triangle', gain: 1.05 }
    : build === 'fluffy' ? { pitch: 1.0, dur: 1.06, type: 'sine', gain: 0.85 }
    : { pitch: 1.0, dur: 1.0, type: 'triangle', gain: 1.0 };
  base.pitch *= 1 + ((patternIndex * 37) % 7 - 3) * 0.012;   // small per-coat individuality
  return base;
}
function playMeow() {
  // A soft, cute "mew": a gentle triangle tone with a rise-then-fall pitch contour,
  // light vibrato, and a low-pass to keep it warm (not buzzy). Synthesized (no audio
  // files); voiceFor() gives each breed its own pitch/length.
  const ac = audio(); if (!ac) return;
  const v = voiceFor();
  const t0 = ac.currentTime, dur = 0.42 * v.dur, f = (hz) => hz * v.pitch;
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(f(500), t0);
  o.frequency.linearRampToValueAtTime(f(720), t0 + dur * 0.40);   // "mee"
  o.frequency.linearRampToValueAtTime(f(470), t0 + dur);          // "ow"
  const vib = ac.createOscillator(); vib.type = 'sine'; vib.frequency.value = 7;
  const vibGain = ac.createGain(); vibGain.gain.value = f(7);
  vib.connect(vibGain); vibGain.connect(o.frequency);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f(2600); lp.Q.value = 0.6;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.2, t0 + 0.05);
  amp.gain.setValueAtTime(0.18, t0 + dur * 0.55);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.06);
  o.connect(lp); lp.connect(amp); amp.connect(master);
  o.start(t0); vib.start(t0); o.stop(t0 + dur + 0.1); vib.stop(t0 + dur + 0.1);
  o.onended = () => { try { lp.disconnect(); amp.disconnect(); vibGain.disconnect(); } catch (e) { /* ignore */ } };
}
let purrNodes = null;
function startPurr() {
  const ac = audio(); if (!ac || purrNodes) return;
  const carrier = ac.createOscillator(); carrier.type = 'sawtooth'; carrier.frequency.value = 50;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
  const amp = ac.createGain(); amp.gain.value = 0.04;
  const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 22;
  const lfoGain = ac.createGain(); lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain); lfoGain.connect(amp.gain);
  carrier.connect(lp); lp.connect(amp); amp.connect(master);
  carrier.start(); lfo.start();
  purrNodes = { carrier, lfo, amp, lfoGain };
}
function stopPurr() {
  if (!purrNodes) return;
  try {
    purrNodes.carrier.stop(); purrNodes.lfo.stop();
    purrNodes.lfoGain.disconnect(); purrNodes.amp.disconnect();
  } catch (e) { /* ignore */ }
  purrNodes = null;
}
// Happy little chirp/trill (AI agent finished a task).
function playChirp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  const v = voiceFor();
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(780 * v.pitch, t0);
  o.frequency.linearRampToValueAtTime(1180 * v.pitch, t0 + 0.08);
  o.frequency.linearRampToValueAtTime(1020 * v.pitch, t0 + 0.2);
  o.connect(g); o.start(t0); o.stop(t0 + 0.24);
  o.onended = () => { try { g.disconnect(); } catch (e) { /* ignore */ } };
}
// Startled "mrrp" - a short falling growl (sudden jolt / agent error).
function playMrrp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  const v = voiceFor();
  const o = ac.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(520 * v.pitch, t0);
  o.frequency.linearRampToValueAtTime(300 * v.pitch, t0 + 0.16);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300;
  o.connect(lp); lp.connect(g); o.start(t0); o.stop(t0 + 0.2);
  o.onended = () => { try { g.disconnect(); lp.disconnect(); } catch (e) { /* ignore */ } };
}
