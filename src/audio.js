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
  // A real cat's "meow" = a voiced source (rich in harmonics) shaped by the mouth
  // opening and closing on a vowel. We model that: a sawtooth "voice" + a soft
  // sub-octave for body, a moving formant filter (the mouth) sweeping up into the
  // open "ee" and back down through the closing "ow", a fixed vocal peak so it reads
  // as a voice (not a bleep), gentle vibrato, and a breath of air on the onset.
  // Each call randomly picks a short "mew", a two-syllable "meow", or a drawn-out
  // "meeow" — and detunes a hair — so repeated meows vary like a real cat.
  // Still 100% synthesized; voiceFor() keeps each breed's own pitch/length.
  const ac = audio(); if (!ac) return;
  const v = voiceFor();
  const t0 = ac.currentTime;
  const r = Math.random();
  const variant = r < 0.30 ? 'mew' : r < 0.85 ? 'meow' : 'long';
  const dur = (variant === 'mew' ? 0.34 : variant === 'long' ? 0.78 : 0.52) * v.dur;
  const f = (hz) => hz * v.pitch * (0.97 + Math.random() * 0.06);   // tiny per-call detune
  const trash = [];

  // ---- voice: harmonic-rich sawtooth + soft sine sub-octave for warmth ----
  const o = ac.createOscillator(); o.type = 'sawtooth';
  const sub = ac.createOscillator(); sub.type = 'sine';
  const p0 = f(variant === 'mew' ? 470 : 360), pPk = f(variant === 'mew' ? 700 : 600), pEnd = f(variant === 'long' ? 300 : 350);
  o.frequency.setValueAtTime(p0, t0);
  o.frequency.linearRampToValueAtTime(pPk, t0 + dur * 0.30);            // rise into the open "ee"
  if (variant === 'long') o.frequency.linearRampToValueAtTime(pPk * 0.95, t0 + dur * 0.62);   // a held wobble plateau
  o.frequency.linearRampToValueAtTime(pEnd, t0 + dur);                  // fall through the closing "ow"
  sub.frequency.setValueAtTime(p0 / 2, t0);
  sub.frequency.linearRampToValueAtTime(pPk / 2, t0 + dur * 0.30);
  sub.frequency.linearRampToValueAtTime(pEnd / 2, t0 + dur);
  const subG = ac.createGain(); subG.gain.value = 0.32; trash.push(subG);

  // ---- vibrato (a touch faster on the drawn-out meow) ----
  const vib = ac.createOscillator(); vib.type = 'sine'; vib.frequency.value = variant === 'long' ? 11 : 7;
  const vibGain = ac.createGain(); vibGain.gain.value = f(variant === 'long' ? 11 : 6); trash.push(vibGain);
  vib.connect(vibGain); vibGain.connect(o.frequency); vibGain.connect(sub.frequency);

  // ---- the "mouth": a lowpass that opens then closes + a fixed vocal formant peak ----
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.0; trash.push(lp);
  lp.frequency.setValueAtTime(f(700), t0);
  lp.frequency.linearRampToValueAtTime(f(2800), t0 + dur * 0.30);
  lp.frequency.linearRampToValueAtTime(f(900), t0 + dur);
  // two vocal formants (a real cat's voice has ~F1 1.5k + ~F2 2.7k) so it reads as a
  // voice rather than a single-resonance bleep; a hair of jitter per call for realism
  const fmt = ac.createBiquadFilter(); fmt.type = 'peaking'; fmt.frequency.value = f(1500); fmt.Q.value = 3; fmt.gain.value = 8; trash.push(fmt);
  const fmt2 = ac.createBiquadFilter(); fmt2.type = 'peaking'; fmt2.frequency.value = f(2700); fmt2.Q.value = 4; fmt2.gain.value = 6; trash.push(fmt2);

  // ---- amp envelope: quick attack, a tiny mid dip (the "me|ow" break), then release ----
  const amp = ac.createGain(); trash.push(amp);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.22, t0 + 0.04);
  if (variant !== 'mew') {
    amp.gain.linearRampToValueAtTime(0.12, t0 + dur * 0.46);            // dip between syllables
    amp.gain.linearRampToValueAtTime(0.20, t0 + dur * 0.62);            // swell back up on the "ow"
  }
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.07);

  o.connect(fmt); subG.connect(fmt); sub.connect(subG);
  fmt.connect(fmt2); fmt2.connect(lp); lp.connect(amp); amp.connect(master);

  // ---- a soft breath of air on the onset (the inhale before the cry) ----
  const blen = Math.max(1, (ac.sampleRate * 0.05) | 0), bbuf = ac.createBuffer(1, blen, ac.sampleRate), bd = bbuf.getChannelData(0);
  for (let i = 0; i < blen; i++) bd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / blen, 1.5);
  const bs = ac.createBufferSource(); bs.buffer = bbuf;
  const bbp = ac.createBiquadFilter(); bbp.type = 'bandpass'; bbp.frequency.value = f(1800); bbp.Q.value = 0.8; trash.push(bbp);
  const bg = ac.createGain(); bg.gain.value = 0.05; trash.push(bg);
  bs.connect(bbp).connect(bg).connect(master); bs.start(t0);

  const stopAt = t0 + dur + 0.12;
  o.start(t0); sub.start(t0); vib.start(t0);
  o.stop(stopAt); sub.stop(stopAt); vib.stop(stopAt);
  o.onended = () => { for (const n of trash) { try { n.disconnect(); } catch (e) { /* ignore */ } } };
}
let purrNodes = null;
// A real purr is a low rumble (~26 Hz) that swells on the exhale and eases on the
// inhale. We layer a sawtooth fundamental + a soft detuned overtone for warmth, a
// tremolo at the purr rate for the rumble, and a slow "breathing" swell so it never
// sits static - then fade in/out so it starts and stops without a click.
function startPurr() {
  const ac = audio(); if (!ac || purrNodes) return;
  const v = voiceFor();
  const base = 26 * v.pitch;                                   // purr fundamental per breed voice
  const carrier = ac.createOscillator(); carrier.type = 'sawtooth'; carrier.frequency.value = base;
  const over = ac.createOscillator(); over.type = 'triangle'; over.frequency.value = base * 2.01;   // warm overtone, slightly detuned
  const overG = ac.createGain(); overG.gain.value = 0.4;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
  const amp = ac.createGain(); amp.gain.setValueAtTime(0.0001, ac.currentTime);
  amp.gain.setTargetAtTime(0.045, ac.currentTime, 0.35);      // fade in (no click)
  const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = base;   // the rumble tremolo
  const lfoGain = ac.createGain(); lfoGain.gain.value = 0.03;
  lfo.connect(lfoGain); lfoGain.connect(amp.gain);
  const breath = ac.createOscillator(); breath.type = 'sine'; breath.frequency.value = 0.5;   // slow inhale/exhale swell
  const breathGain = ac.createGain(); breathGain.gain.value = 0.012;
  breath.connect(breathGain); breathGain.connect(amp.gain);
  carrier.connect(lp); over.connect(overG); overG.connect(lp); lp.connect(amp); amp.connect(master);
  carrier.start(); over.start(); lfo.start(); breath.start();
  purrNodes = { carrier, over, overG, lp, amp, lfo, lfoGain, breath, breathGain };
}
function stopPurr() {
  if (!purrNodes) return;
  const p = purrNodes; purrNodes = null;
  try {
    const now = actx ? actx.currentTime : 0;
    p.amp.gain.cancelScheduledValues(now);
    p.amp.gain.setTargetAtTime(0.0001, now, 0.12);            // short release
    const stopAt = now + 0.4;
    p.carrier.stop(stopAt); p.over.stop(stopAt); p.lfo.stop(stopAt); p.breath.stop(stopAt);
    p.carrier.onended = () => {
      for (const n of [p.carrier, p.over, p.overG, p.lp, p.amp, p.lfo, p.lfoGain, p.breath, p.breathGain]) {
        try { n.disconnect(); } catch (e) { /* ignore */ }
      }
    };
  } catch (e) { /* ignore */ }
}
// A happy cat "chirrup"/trill (tap, body-pet, playful beat, agent done): a short
// rising note with the fast rolled "r" flutter cats make — friendlier than a meow.
function playChirp() {
  const ac = audio(); if (!ac) return;
  const t0 = ac.currentTime, v = voiceFor();
  const g = ac.createGain(); g.connect(master);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.30);
  const o = ac.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(760 * v.pitch, t0);
  o.frequency.linearRampToValueAtTime(1120 * v.pitch, t0 + 0.10);
  o.frequency.linearRampToValueAtTime(1260 * v.pitch, t0 + 0.26);   // rises at the end (questioning chirrup)
  // the rolled "r": a fast tremolo flutter riding the amplitude envelope
  const roll = ac.createOscillator(); roll.type = 'sine'; roll.frequency.value = 33;
  const rollAmt = ac.createGain(); rollAmt.gain.value = 0.05;
  roll.connect(rollAmt); rollAmt.connect(g.gain);
  o.connect(g); o.start(t0); roll.start(t0); o.stop(t0 + 0.32); roll.stop(t0 + 0.32);
  o.onended = () => { try { g.disconnect(); rollAmt.disconnect(); } catch (e) { /* ignore */ } };
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
