// Small status indicators + hearts drawn over the cat (thinking dots, working
// spinner, "done!" burst, love heart). Classic <script> loaded before renderer.js,
// sharing the overlay global scope; draws on the shared canvas context `ctx`.
// Extracted from renderer.js to keep that file focused on the main loop.
/* exported drawThinkBubble, drawWorkBubble, drawDoneSpark, drawHeart */

// Thinking indicator: three dots that pulse near the head (AI agent working).
function drawThinkBubble(x, y, t) {
  // a little thought puff: two rising tail bubbles + three dots that fill in a wave.
  // Each dot has a light fill AND a dark rim so it reads on any desktop background.
  const dot = (dx, dy, r, alpha) => {
    ctx.globalAlpha = alpha; ctx.fillStyle = '#f3f6fb';
    ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alpha * 0.45; ctx.strokeStyle = '#3a3f4b'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2); ctx.stroke();
  };
  dot(-3, 7, 1.3, 0.5);                                  // tail bubbles trailing to the head
  dot(0, 4, 1.8, 0.7);
  for (let i = 0; i < 3; i++) {
    const a = (Math.sin(t / 240 - i * 0.9) + 1) / 2;     // brighten left-to-right
    dot(i * 6, -a * 1.5, 2.4, 0.35 + a * 0.6);
  }
  ctx.globalAlpha = 1;
}
// "Working" spinner near the head while an AI agent is editing/testing/building.
function drawWorkBubble(x, y, t) {
  const cx = x + 4, cy = y - 1, R = 5.2, a = t / 220;
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.18; ctx.strokeStyle = '#5a8f5a';   // faint full track
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.95; ctx.strokeStyle = '#7bc47b';   // bright sweeping arc reads as "loading"
  ctx.beginPath(); ctx.arc(cx, cy, R, a, a + Math.PI * 1.15); ctx.stroke();
  ctx.globalAlpha = 1;
}
// Little "!" + sparkles above the head when an AI agent finishes a task.
function drawDoneSpark(x, y, t) {
  ctx.fillStyle = '#ffd54a';
  ctx.fillRect(x - 1, y - 7, 2, 5); ctx.fillRect(x - 1, y - 1, 2, 2);   // exclamation
  ctx.fillStyle = '#fff3b0';
  // a few twinkling 4-point stars pulsing out of phase -> a celebratory little burst
  const star = (dx, dy, sp) => {
    const tw = (Math.sin(t / sp) + 1) / 2;
    const r = Math.round(1 + tw * 1.5);
    ctx.globalAlpha = 0.35 + tw * 0.65;
    const sx = Math.round(x + dx), sy = Math.round(y + dy);
    ctx.fillRect(sx, sy - r, 1, r * 2 + 1);                             // vertical spoke
    ctx.fillRect(sx - r, sy, r * 2 + 1, 1);                             // horizontal spoke
  };
  star(10, -5, 100); star(-11, -2, 135); star(6, -12, 168);
  ctx.globalAlpha = 1;
}
function drawHeart(x, y, color, alpha, s) {
  s = s || 1;
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  const r = (dx, dy, w, h) => ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)));
  r(-5, -4, 3, 3); r(2, -4, 3, 3);                          // two top bumps
  r(-5, -1, 10, 3);                                         // wide middle
  r(-4, 2, 8, 2); r(-2, 4, 4, 2); r(-1, 6, 2, 1);           // taper to a point
  ctx.globalAlpha = 1;
}
