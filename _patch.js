// One-shot patcher for the remaining renderer.js mood edits. Deleted after running.
const fs = require('fs');
const p = 'src/renderer.js';
let s = fs.readFileSync(p, 'utf8');
const subs = [];
function rep(name, from, to) {
  const i = s.indexOf(from);
  if (i < 0) throw new Error('ANCHOR NOT FOUND: ' + name);
  if (s.indexOf(from, i + 1) >= 0) throw new Error('ANCHOR NOT UNIQUE: ' + name);
  s = s.slice(0, i) + to + s.slice(i + from.length);
  subs.push(name);
}

// A) idle cadence scaled by intensity
rep('idle-cadence',
`      if (nextIdleAt === 0) nextIdleAt = t + 4000 + Math.random() * 6000;
      if (t > nextIdleAt) {
        nextIdleAt = t + 5000 + Math.random() * 9000;`,
`      const idleScale = 2 - intensity;   // zoomies -> more frequent darts, calm -> rarer
      if (nextIdleAt === 0) nextIdleAt = t + (4000 + Math.random() * 6000) * idleScale;
      if (t > nextIdleAt) {
        nextIdleAt = t + (5000 + Math.random() * 9000) * idleScale;`);

// B) hop height scaled by intensity (two identical tails)
s = s.split('* Math.PI) * 22; hopActive = true; }').join('* Math.PI) * 22 * intensity; hopActive = true; }');
subs.push('hop-intensity x2');

// C) sleep branch inserted ahead of the typing/sit chain
rep('sleep-branch',
`    if (typing || FORCED_STATE === 'typing' || FORCED_STATE === 'overheat') {`,
`    const sleeping = moodOn && band === 'sleepy' && calm && !petting && !typing && !grabbing
      && !stretching && !thinking && !hopActive && !paperActive && FORCED_STATE !== 'mochi';

    if (FORCED_STATE === 'sleep' || sleeping) {
      // ---- SLEEP: curled loaf, eyes closed, "z z z" drifting up -------------
      const breath = Math.sin(t / 1700);
      const oy = Math.round(pos.y - SLH);
      drawShadow(pos.x, pos.y, 0.16, 30);
      octx.clearRect(0, 0, oc.width, oc.height);
      drawCat(octx, spriteSleep, t, palRGB, { bob: Math.round(breath * 1.2), blinking: true, look: { x: 0, y: 0 }, eyeMode: 'open' });
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.scale(1, 1 + breath * 0.02);
      ctx.drawImage(oc, 0, 0, SLW, SLH, -SLW / 2, -SLH, SLW, SLH);
      ctx.restore();
      // soft closed-eye curve on the tucked head
      ctx.strokeStyle = rgbStr(palRGB.O); ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(pos.x - 37, pos.y - 29 + Math.round(breath * 1.2), 4, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      drawZzz(pos.x + SLW * 0.16, oy + 2, t);
      wantHighFps = false;   // napping renders at the idle frame rate
      sendHot(pos.x - SLW / 2 - 6, oy - 6, SLW + 12, SLH + 12, false);
    } else if (typing || FORCED_STATE === 'typing' || FORCED_STATE === 'overheat') {`);

fs.writeFileSync(p, s);
console.log('applied:', subs.join(' | '));
