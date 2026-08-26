// src/jam.js - "Lobby Jam": a synthesized, improvising lo-fi study-music loop the cat
// plays. 100% Web Audio (no asset files): Karplus-Strong plucked guitar over lazy jazzy
// voicings + soft bass + brushed percussion, tape-warmed. Classic overlay <script>
// loaded after audio.js - it REUSES that file's shared AudioContext (audio()) and routes
// through the shared `master` gain, so it respects the Volume slider and mixes with
// meow/purr. Exposes window.jamStart(mood) / jamStop() / jamSetMood(mood) / jamBeatPhase().
(() => {
  'use strict';
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const chance = (p) => Math.random() < p;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // chord vocabulary (MIDI sets) + a loose ii-V-I "lobby jazz" progression graph
  const CHORDS = {
    Cmaj7: [60, 64, 67, 71], Am7: [57, 60, 64, 67], Dm7: [62, 65, 69, 72],
    G7: [55, 59, 62, 65], Fmaj7: [53, 57, 60, 64], Em7: [52, 55, 59, 62],
    A7: [57, 61, 64, 67], Bm7b5: [59, 62, 65, 69],
  };
  const NEXT = {
    Cmaj7: ['Am7', 'Dm7', 'Fmaj7', 'Em7'], Am7: ['Dm7', 'Fmaj7', 'A7', 'Em7'],
    Dm7: ['G7', 'Bm7b5', 'Fmaj7'], G7: ['Cmaj7', 'Em7', 'Am7'],
    Fmaj7: ['G7', 'Em7', 'Dm7', 'Bm7b5'], Em7: ['Am7', 'A7', 'Dm7'],
    A7: ['Dm7', 'Fmaj7'], Bm7b5: ['G7', 'Em7'],
  };
  const MEL = [0, 2, 4, 7, 9, 12, 14, 16, 11];   // C-major-ish melody pool
  const MOODS = {
    cozy: { bpm: 74, swing: 0.16, mel: 0.45, rev: 0.30, bright: 0.5 },
    dreamy: { bpm: 62, swing: 0.10, mel: 0.30, rev: 0.46, bright: 0.38 },
    upbeat: { bpm: 92, swing: 0.22, mel: 0.60, rev: 0.22, bright: 0.62 },
    // study/deep-work: a steady, minimal pulse with very few melodic flourishes so it
    // stays in the background and doesn't pull your attention off the work.
    focus: { bpm: 80, swing: 0.05, mel: 0.14, rev: 0.18, bright: 0.55 },
    // "study with rain": a cozy, slow loop laid over a soft rain bed (see rainBed).
    rain: { bpm: 70, swing: 0.13, mel: 0.32, rev: 0.40, bright: 0.42, rain: 0.9 },
    // wind-down/night: very slow, warm and dark, washed in reverb - for late study.
    sleepy: { bpm: 54, swing: 0.10, mel: 0.20, rev: 0.52, bright: 0.30 },
  };
  const MOOD_NAMES = Object.keys(MOODS);

  let ac = null, jamBus = null, busInput = null, wetGain = null, rainGain = null;
  let running = false, mood = MOODS.cozy, timer = null, stopTimer = null, graphNodes = [];
  let nextTime = 0, beat = 0, cur = 'Cmaj7', t0 = 0;
  const LOOKAHEAD = 0.12, TICK = 25, RAIN_ON = 0.34;   // rain bed level (trimmed for output headroom so the mix doesn't clip)
  const ksCache = new Map();

  function makeSatCurve(k) {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * (1 + k * 2)) / Math.tanh(1 + k * 2); }
    return c;
  }
  function makeImpulse(dur, decay) {
    const sr = ac.sampleRate, len = (sr * dur) | 0, buf = ac.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  // master FX chain: compressor -> lowpass(+wow) -> soft saturation -> dry + reverb -> jamBus -> shared master
  function buildGraph() {
    jamBus = ac.createGain(); jamBus.gain.value = 0.0001;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.4;
    const wow = ac.createOscillator(), wowAmt = ac.createGain();
    wow.frequency.value = 0.18; wowAmt.gain.value = 220; wow.connect(wowAmt).connect(lp.frequency); wow.start();
    const sat = ac.createWaveShaper(); sat.curve = makeSatCurve(0.6); sat.oversample = '2x';
    const dry = ac.createGain(); dry.gain.value = 0.82;
    wetGain = ac.createGain(); wetGain.gain.value = mood.rev;
    const conv = ac.createConvolver(); conv.buffer = makeImpulse(2.6, 2.4);
    comp.connect(lp); lp.connect(sat);
    sat.connect(dry); sat.connect(conv); conv.connect(wetGain);
    dry.connect(jamBus); wetGain.connect(jamBus);
    jamBus.connect(master);          // shared overlay master gain (Volume) from audio.js
    busInput = comp;
    // faint vinyl crackle (routes through jamBus so it mutes when the jam stops)
    const sr = ac.sampleRate, clen = sr * 2, cbuf = ac.createBuffer(1, clen, sr), cd = cbuf.getChannelData(0);
    for (let i = 0; i < clen; i++) cd[i] = chance(0.0012) ? (Math.random() * 2 - 1) * rnd(0.3, 1) : 0;
    const cs = ac.createBufferSource(); cs.buffer = cbuf; cs.loop = true;
    // Trimmed hard. chance(0.0012) per sample is roughly 50 clicks a second of
    // 1.4kHz-and-up noise running continuously under every mood - texture at a
    // glance, but the exact frequency band the ear treats as "something is wrong
    // with the speakers" when it never stops.
    const cg = ac.createGain(); cg.gain.value = 0.018;
    const chp = ac.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1400;
    cs.connect(chp).connect(cg).connect(jamBus); cs.start();
    // rain bed (only audible in the 'rain' mood): a soft gusting hiss. Always wired so
    // setRain() can fade it in/out; routes through jamBus so it mutes when the jam stops.
    rainGain = ac.createGain(); rainGain.gain.value = 0.0001;
    const rlen = sr * 3, rbuf = ac.createBuffer(1, rlen, sr), rd = rbuf.getChannelData(0);
    let rb = 0;                                                  // brown-ish noise = softer, less hissy rain
    for (let i = 0; i < rlen; i++) { rb = (rb + 0.02 * (Math.random() * 2 - 1)) / 1.02; rd[i] = rb * 3; }
    const rs = ac.createBufferSource(); rs.buffer = rbuf; rs.loop = true;
    const rhp = ac.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 420;
    const rlp = ac.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 3200; rlp.Q.value = 0.3;
    const rgust = ac.createGain(); rgust.gain.value = 0.7;        // slow "gusts" swell the rain in/out
    const gust = ac.createOscillator(), gustAmt = ac.createGain();
    gust.frequency.value = 0.08; gustAmt.gain.value = 0.3; gust.connect(gustAmt).connect(rgust.gain); gust.start();
    rs.connect(rhp).connect(rlp).connect(rgust).connect(rainGain).connect(jamBus); rs.start();
    graphNodes = [wow, cs, gust, rs];   // persistent oscillators + loop sources, stopped on teardown
  }
  // Fade the rain bed in/out for the active mood (m.rain is 0..1, undefined = no rain).
  function setRain(m) {
    if (!rainGain || !ac) return;
    rainGain.gain.setTargetAtTime((m && m.rain) ? RAIN_ON * m.rain : 0.0001, ac.currentTime, 0.4);
  }
  // Karplus-Strong plucked string rendered into a cached AudioBuffer
  function ksBuffer(freq, dur, bright) {
    const key = Math.round(freq) + ':' + dur.toFixed(2) + ':' + bright.toFixed(2);
    if (ksCache.has(key)) return ksCache.get(key);
    const sr = ac.sampleRate, N = Math.max(2, Math.round(sr / freq)), len = Math.floor(sr * dur);
    const buf = ac.createBuffer(1, len, sr), out = buf.getChannelData(0), line = new Float32Array(N);
    for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1;
    const decay = 0.49 + 0.009 * bright;     // loop gain stays < 0.5 -> stable; brighter = longer sustain
    let idx = 0;
    for (let i = 0; i < len; i++) { const a = line[idx], b = line[(idx + 1) % N]; out[i] = a; line[idx] = (a + b) * decay; idx = (idx + 1) % N; }
    const atk = (sr * 0.004) | 0, rel = (sr * 0.18) | 0;
    for (let i = 0; i < len; i++) { let e = 1; if (i < atk) e = i / atk; if (i > len - rel) e *= (len - i) / rel; out[i] *= e; }
    if (ksCache.size > 220) ksCache.clear();
    ksCache.set(key, buf);
    return buf;
  }
  function pluck(midi, when, gain, dur, bright, pan) {
    const s = ac.createBufferSource(); s.buffer = ksBuffer(mtof(midi), dur, bright);
    const g = ac.createGain(); g.gain.value = gain;
    const p = ac.createStereoPanner(); p.pan.value = pan;
    s.connect(g).connect(p).connect(busInput); s.start(when);
  }
  function bassNote(midi, when, dur) {
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(midi);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(0.16, when + 0.02); g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    o.connect(f).connect(g).connect(busInput); o.start(when); o.stop(when + dur + 0.05);
  }
  function brush(when) {
    const sr = ac.sampleRate, len = (sr * 0.09) | 0, b = ac.createBuffer(1, len, sr), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const s = ac.createBufferSource(); s.buffer = b;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 6000; f.Q.value = 0.6;
    const g = ac.createGain(); g.gain.value = 0.05;
    s.connect(f).connect(g).connect(busInput); s.start(when);
  }
  function voiced(name) { return CHORDS[name].map((m, i) => m + (i > 1 && chance(0.18) ? 12 : 0)); }
  function scheduleBeat(name, t, spb) {
    const ch = voiced(name), onBeat = beat % 2 === 0;
    if (onBeat || chance(0.6)) {
      const strum = onBeat ? rnd(0.012, 0.03) : rnd(0.006, 0.016);
      const notes = chance(0.3) ? [...ch].reverse() : ch;
      notes.forEach((m, i) => pluck(m, t + i * strum, (onBeat ? 0.12 : 0.07) * rnd(0.85, 1.05), rnd(1.1, 1.8), mood.bright * rnd(0.85, 1.1), rnd(-0.25, 0.25)));
    }
    if (onBeat) { const root = ch[0] - 12; bassNote(chance(0.7) ? root : root + pick([7, 5, 3]), t, spb * (chance(0.5) ? 2 : 1) * 0.95); }
    if (chance(0.8)) brush(t + spb * 0.5 + (chance(0.5) ? mood.swing * spb : 0));
    if (onBeat && chance(0.5)) brush(t);
    if (chance(mood.mel)) {
      const n = 1 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) { const note = ch[0] + pick(MEL) + (chance(0.4) ? 12 : 0); const off = (i / n) * spb + (chance(0.5) ? mood.swing * spb * 0.5 : 0); pluck(note, t + off, 0.085 * rnd(0.8, 1.1), rnd(0.5, 1.0), mood.bright * 1.15, rnd(-0.4, 0.4)); }
    }
  }
  function scheduler() {
    if (!ac || !running) return;
    const spb = 60 / mood.bpm;
    while (nextTime < ac.currentTime + LOOKAHEAD) {
      scheduleBeat(cur, nextTime, spb);
      beat++;
      if (beat % 4 === 0) cur = chance(0.82) ? pick(NEXT[cur]) : pick(Object.keys(CHORDS));
      nextTime += spb + ((beat % 2 === 1) ? mood.swing * spb : 0);   // lazy swing feel
    }
  }

  // Fully release the always-on graph nodes (modulator oscillators + vinyl/rain loop
  // sources) so a stopped jam costs nothing on the audio thread. jamStart rebuilds fresh.
  function teardownGraph() {
    for (const n of graphNodes) { try { n.stop(); } catch (e) { /* already stopped */ } try { n.disconnect(); } catch (e) { /* ignore */ } }
    graphNodes = [];
    try { if (jamBus) jamBus.disconnect(); } catch (e) { /* ignore */ }
    jamBus = null; busInput = null; wetGain = null; rainGain = null;
  }
  window.jamStart = function (m) {
    try {
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }   // re-toggled before teardown fired -> keep the live graph
      const ctx = audio(); if (!ctx) return;     // reuse + resume the shared AudioContext
      ac = ctx; mood = MOODS[m] || MOODS.cozy;
      if (!jamBus) buildGraph();
      running = true; t0 = ac.currentTime; nextTime = ac.currentTime + 0.15; beat = 0; cur = 'Cmaj7';
      setRain(mood);
      jamBus.gain.cancelScheduledValues(ac.currentTime);
      jamBus.gain.setValueAtTime(Math.max(0.0001, jamBus.gain.value), ac.currentTime);
      jamBus.gain.linearRampToValueAtTime(0.6, ac.currentTime + 1.2);   // gentle background level
      if (timer) clearInterval(timer);
      timer = setInterval(scheduler, TICK);
    } catch (e) { /* ignore */ }
  };
  window.jamStop = function () {
    try {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (jamBus && ac) { jamBus.gain.cancelScheduledValues(ac.currentTime); jamBus.gain.setTargetAtTime(0.0001, ac.currentTime, 0.18); }
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(teardownGraph, 700);          // after the fade, free the always-on nodes
      if (stopTimer && stopTimer.unref) stopTimer.unref();  // (node test env) don't keep the process alive
    } catch (e) { /* ignore */ }
  };
  window.jamSetMood = function (m) {
    mood = MOODS[m] || mood;
    try { if (running && wetGain && ac) { wetGain.gain.setTargetAtTime(mood.rev, ac.currentTime, 0.3); setRain(mood); } } catch (e) { /* ignore */ }
  };
  // expose the mood list so the UI/tray can build pickers from one source of truth
  window.jamMoods = MOOD_NAMES;
  // 0..1 phase within the current beat - lets the cat bob/strum in time with the music.
  window.jamBeatPhase = function () {
    if (!running || !ac) return 0;
    const spb = 60 / mood.bpm;
    return ((ac.currentTime - t0) / spb) % 1;
  };
})();
