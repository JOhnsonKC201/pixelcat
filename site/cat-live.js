/* cat-live.js — a live, interactive pixel cat for the marketing site.
 *
 * Drives a single <canvas> with the real desktop-pet sprite geometry (from
 * cat-sprite.js, the single source of truth) and the cat's full repertoire,
 * re-creating the desktop triggers in the browser:
 *   - watch-the-cursor (eye/head follow), breathe, blink, tail flick   (always)
 *   - click  -> meow + hearts + nuzzle + cycle coat
 *   - type() -> keyboard-knead pose; fast typing overheats (red + steam)
 *   - climb(dir) -> hand-over-hand rope climb up/down
 *   - idle   -> auto-cycles a showcase reel: hunt / stretch / zoomies / groom / loaf
 * A caption callback names the live behaviour for the page to display.
 *
 * The animated paint functions are ported from src/renderer.js (pure canvas, no
 * Electron). Depends on cat-sprite.js globals: CELL, BODY, buildSprite, composeSit,
 * composeLoaf, PATTERNS, BUILDS, PATTERN_BUILD, TABBY, toRgb, rgbStr, shadeStr, HALO,
 * plus the grid primitives ellipse/triangle/setCell/G used by the composers below.
 */
(function () {
  'use strict';

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // ---- pose composers ported from renderer.js (use cat-sprite.js grid globals) --

  function composeHunt() {
    const CX = 15;
    ellipse(CX, 12, 11, 5.4, 'C');
    ellipse(CX, 8, 6.2, 5, 'C');
    triangle(9, 4, 6, 8, 13, 7, 'K'); triangle(21, 4, 17, 7, 24, 8, 'K');
    triangle(9, 5, 8, 8, 12, 7, 'I'); triangle(21, 5, 18, 7, 22, 8, 'I');
    [[26, 13], [27, 11]].forEach(([c, r]) => ellipse(c, r, 1.6, 1.6, 'C'));
    ellipse(CX, 12, 2.6, 1.7, 'W', ['C']);
    ellipse(CX, 15, 3.2, 2.4, 'W', ['C']);
    ellipse(13, 17, 1.8, 1.5, 'W', ['C']); ellipse(17, 17, 1.8, 1.5, 'W', ['C']);
    ellipse(27, 11, 1.2, 1.2, 'W', ['C']);
    ellipse(12, 8, 2.2, 2.4, 'E'); ellipse(18, 8, 2.2, 2.4, 'E');
    setCell(15, 11, 'N'); setCell(14, 11, 'N');
    [[13, 5], [14, 6], [15, 5], [16, 6], [17, 5]].forEach(([c, r]) => { if (G[r][c] === 'C') setCell(c, r, 'K'); });
    for (let r = 10; r < 16; r += 2) for (let c = 4; c < GC; c++) if (G[r][c] === 'C' && c % 2 === 0) G[r][c] = 'K';
    ellipse(9, 12, 2.4, 2.4, 'X', ['C', 'K']); ellipse(21, 13, 2.2, 2.2, 'X', ['C', 'K']);
  }

  function composeTypeFront(B) {
    B = B || {};
    const CX = 12, fluff = !!B.fluff;
    // tail sweeps low to the right (a resting tail) — NOT curled up beside the chest,
    // where its pale tip used to read as a third, raised paw.
    [[20.5, 20.4], [22.2, 20.9], [23.2, 21.8], [22.6, 22.8]].forEach(([c, r]) => ellipse(c, r, 1.5, 1.5, 'C'));
    ellipse(21.8, 23.2, 1.0, 1.0, 'W', ['C']);
    ellipse(CX, 16, 6.0, 5.4, 'C');
    ellipse(6.6, 20.2, 3.4, 3.2, 'C');
    ellipse(17.4, 20.2, 3.4, 3.2, 'C');
    ellipse(CX, 8.5, 6.3, 5.6, 'C');
    if (fluff) { ellipse(5.6, 10.8, 1.9, 2.3, 'C'); ellipse(18.4, 10.8, 1.9, 2.3, 'C'); }
    triangle(CX - 4.5, 1.2, CX - 6.4, 6.8, CX - 1.8, 5.6, 'K');
    triangle(CX + 4.5, 1.2, CX + 6.4, 6.8, CX + 1.8, 5.6, 'K');
    triangle(CX - 4.3, 3.0, CX - 5.4, 6.3, CX - 2.8, 5.6, 'I');
    triangle(CX + 4.3, 3.0, CX + 5.4, 6.3, CX + 2.8, 5.6, 'I');
    if (fluff) { ellipse(CX - 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); ellipse(CX + 4.5, 5.6, 0.9, 1.3, 'W', ['C', 'K']); }
    ellipse(9, 8.7, 2.0, 2.4, 'E'); ellipse(15, 8.7, 2.0, 2.4, 'E');
    ellipse(CX, 12.2, 3, 2, 'W', ['C']);
    setCell(12, 11, 'N'); setCell(11, 11, 'N');
    ellipse(CX, 17.8, 2.1, 3.2, 'W', ['C']);
    if (B.tabby) {
      [[11, 5], [12, 6], [13, 5]].forEach(([c, r]) => { if (G[r] && G[r][c] === 'C') setCell(c, r, 'K'); });
      for (let r = 13; r < 22; r += 2) for (let c = 3; c < 21; c++) if (G[r] && G[r][c] === 'C' && c % 2 === 0) setCell(c, r, 'K');
    }
    ellipse(7.5, 17.5, 2.2, 2.6, 'X', ['C', 'K']);
    ellipse(16.5, 20, 2.0, 2.0, 'X', ['C', 'K']);
  }

  // ---- ported paint functions (ctx passed explicitly as `g`) -----------------

  function drawCat(g, sp, palRGB, o) {
    const { bob = 0, blinking = false, look = { x: 0, y: 0 }, eyeMode = 'open', blush = false, dilate = 1 } = o;
    const closed = blinking || eyeMode === 'happy';
    const grid = sp.grid, COLS = sp.COLS, ROWS = sp.ROWS;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      if (ch === '.') continue;
      const base = ch === 'E' ? (closed ? palRGB.C : palRGB.E) : palRGB[ch];
      if (!base) continue;
      const f = BODY.has(ch) || (ch === 'E' && closed) ? 1.12 - (r / ROWS) * 0.34 : 1;
      g.fillStyle = f === 1 ? rgbStr(base) : shadeStr(base, f);
      g.fillRect(c * CELL, r * CELL + bob, CELL, CELL);
    }
    g.strokeStyle = 'rgba(245,245,245,0.6)'; g.lineWidth = 1; g.lineCap = 'round';
    const my = sp.muzzle.y + bob, cl = sp.muzzle.x - 4.5 * CELL, cr = sp.muzzle.x + 4.5 * CELL;
    for (const [sx, dir] of [[cl, -1], [cr, 1]]) for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(sx, my + i * 3 - 2); g.lineTo(sx + dir * 13, my + i * 5 - 1); g.stroke();
    }
    if (blush) {
      g.globalAlpha = 0.52; g.fillStyle = '#ffaab8';
      for (const e of sp.eyes) {
        if (e.w <= 0) continue;
        const bx = Math.round(e.cx - 2), by = Math.round(e.cy + e.h * 0.55 + bob);
        g.fillRect(bx, by, 5, 2); g.fillRect(bx + 1, by + 2, 3, 1);
      }
      g.globalAlpha = 1;
    }
    if (eyeMode === 'happy') {
      g.strokeStyle = rgbStr(palRGB.O); g.lineWidth = 2; g.lineCap = 'round';
      for (const e of sp.eyes) { if (e.w <= 0) continue; g.beginPath(); g.arc(e.cx, e.cy + bob - 1, e.w * 0.5, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
    } else if (!blinking) {
      for (const e of sp.eyes) {
        if (e.w <= 0) continue;
        const pw = Math.max(4, Math.round(e.w * 0.46 * dilate)), ph = Math.max(5, Math.round(e.h * 0.7 * Math.min(dilate, 1.12)));
        const cx = e.cx + look.x * (e.w * 0.30), cy = e.cy + look.y * (e.h * 0.26) + bob;
        const px = Math.round(cx - pw / 2), py = Math.round(cy - ph / 2);
        g.fillStyle = '#22242b';
        g.fillRect(px, py + 1, pw, ph - 2);
        g.fillRect(px + 1, py, pw - 2, ph);
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.fillRect(px + pw - 3, py + 1, 2, 2);
        g.fillStyle = 'rgba(255,255,255,0.4)';
        g.fillRect(px + 1, py + ph - 3, 2, 2);
      }
    }
  }

  function drawTail(g, footX, footY, t, pal, flickT0, petting, SW, SH) {
    const baseX = footX + SW * 0.20, baseY = footY - SH * 0.22, segLen = SH * 0.052;
    const REST = [1.30, 1.10, 0.85, 0.55, 0.28, 0.08, -0.05, -0.45, -0.85, -1.20];
    let flick = 0;
    if (flickT0 >= 0 && t - flickT0 < 650) { const e = (t - flickT0) / 650; flick = Math.sin(e * Math.PI * 3) * (1 - e) * 0.45; }
    const wag = Math.sin(t / 540) * 0.12 + (petting ? Math.sin(t / 120) * 0.08 : 0);
    const pts = [[baseX, baseY]];
    let x = baseX, y = baseY, dev = 0;
    for (let i = 0; i < REST.length; i++) {
      const w = (i + 1) / REST.length;
      dev += (wag + flick) * w * w + Math.sin(t / 430 + i * 0.6) * 0.03 * w;
      const ang = REST[i] - dev;
      x += Math.cos(ang) * segLen;
      y = Math.min(y + Math.sin(ang) * segLen, footY - 2.5);
      pts.push([x, y]);
    }
    let reach = 0; for (const p of pts) reach = Math.max(reach, p[0] - baseX);
    if (reach > 56) { const f = 56 / reach; for (const p of pts) p[0] = baseX + (p[0] - baseX) * f; }
    const sm = [pts[0]]; let px = pts[0][0], py = pts[0][1];
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      for (let k = 1; k <= 4; k++) {
        const u = k / 4, v = 1 - u;
        sm.push([v * v * px + 2 * v * u * pts[i][0] + u * u * mx,
                 v * v * py + 2 * v * u * pts[i][1] + u * u * my]);
      }
      px = mx; py = my;
    }
    sm.push(pts[pts.length - 1]);
    const n = sm.length - 1;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (let j = 0; j < n; j++) {
        const s = (j + 0.5) / n;
        g.strokeStyle = pass === 0 ? pal.O : (s > 0.82 ? pal.W : pal.C);
        g.lineWidth = 7 - 4 * s + (pass === 0 ? 3 : 0);
        g.beginPath(); g.moveTo(sm[j][0], sm[j][1]); g.lineTo(sm[j + 1][0], sm[j + 1][1]); g.stroke();
      }
    }
  }

  function drawShadow(g, cx, cy, alpha, rx) {
    g.fillStyle = `rgba(0,0,0,${alpha})`; g.beginPath(); g.ellipse(cx, cy + 2, rx || 24, 5, 0, 0, Math.PI * 2); g.fill();
  }

  function drawGroom(g, palRGB, cx, faceY, t) {
    const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W);
    const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const CYCLE = 2400;
    const c = (t % CYCLE) / CYCLE;
    let lift = c < 0.16 ? c / 0.16 : c > 0.80 ? (1 - c) / 0.20 : 1;
    lift = Math.max(0, Math.min(1, lift));
    lift = lift * lift * (3 - 2 * lift);
    const licking = c > 0.16 && c < 0.80;
    const lick = licking ? (Math.sin(t / 90) + 1) / 2 : 0;
    const shY = faceY + 32;
    const pawX = cx - 2, pawY = faceY + 12 - lift * 11 + lick * 1.2;
    const pwW = 13, pwH = 7;
    const pY = Math.round(pawY - pwH / 2);
    const aw = 10, ax = Math.round(pawX - aw / 2);
    const aTop = pY + pwH;
    const aH = Math.max(0, Math.round(shY) - aTop);
    if (aH > 0) { rect(ax, aTop, aw, aH, O); rect(ax + 2, aTop, aw - 4, aH, C); }
    rect(pawX - pwW / 2 - 2, pY - 2, pwW + 4, pwH + 4, O);
    rect(pawX - pwW / 2, pY, pwW, pwH, W);
    if (lift > 0.6) {
      rect(pawX - 3, pY + 3.5, 6, 3, '#ff8fa3');
      rect(pawX - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(pawX + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
    } else {
      rect(pawX - 1, pY + 2, 2, pwH - 2, O);
    }
    if (licking) {
      g.globalAlpha = 0.45 + lick * 0.55;
      const th = 2 + Math.round(lick * 3);
      rect(pawX - 2, pY + pwH - 1, 4, th, '#ff9aa8');
      rect(pawX - 1, pY + pwH - 1 + th, 2, 1, '#ff8090');
      g.globalAlpha = 1;
    }
  }

  function drawSteam(g, t, headCx, earTop) {
    for (let i = 0; i < 4; i++) {
      const ph = (((t + i * 240) % 960) / 960), x = Math.round(headCx + (i - 1.5) * 9), y = Math.round(earTop - 3 - ph * 12), h = Math.max(2, Math.round(5 - ph * 2));
      g.globalAlpha = (1 - ph) * 0.95; g.fillStyle = i % 2 === 0 ? '#ffd9de' : '#f4f0f2'; g.fillRect(x, y, 2, h);
    }
    const pph = ((t % 1100) / 1100); g.globalAlpha = (1 - pph) * 0.9; g.fillStyle = '#ffe2e6';
    const psz = Math.round(3 + pph * 3); g.fillRect(Math.round(headCx - psz / 2), Math.round(earTop - 6 - pph * 10), psz, psz);
    g.globalAlpha = 1;
  }

  function drawKey(g, cx, topY, w, h, lit, label) {
    const x0 = Math.round(cx - w / 2), y = Math.round(topY);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(cx, y + h + 4, w / 2 + 2, 4, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#565c6a'; g.fillRect(x0, y + h - 3, w, 7);
    g.fillStyle = lit ? '#f2f4f8' : '#cfd3da'; g.fillRect(x0, y, w, h - 2);
    g.fillStyle = lit ? '#ffffff' : '#e7eaef'; g.fillRect(x0 + 2, y, w - 4, 3);
    g.fillStyle = '#3a3f48';
    g.fillRect(x0 - 1, y, 1, h + 4); g.fillRect(x0 + w, y, 1, h + 4); g.fillRect(x0, y - 1, w, 1);
  }

  function drawKneadPaws(g, palRGB, lcx, rcx, keyTop, lp, rp, shY) {
    const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W), H = rgbStr(palRGB.H);
    const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const paw = (kx, side, press) => {
      const lift = Math.round((1 - press) * 2) * 2.5;
      const out = lift >= 2 ? side * 2 : 0;
      const cx = kx + out;
      const capTop = keyTop + Math.round(press * 3);
      const pwW = 13, pwH = 7;
      const pY = capTop - pwH + 2 - lift;
      const pX = cx - pwW / 2;
      const ax = cx - side * 2 - 6, aw = 11;
      const top = Math.round(shY), aH = pY - top + 3;
      rect(ax - 1, top - 1, aw + 2, aH + 1, H);   // pale halo: legs read on dark coats too
      rect(ax, top, aw, aH, O);
      rect(ax + 2.5, top, aw - 5, aH, C);
      rect(pX - 3, pY - 3, pwW + 6, pwH + 6, H);   // paw halo
      rect(pX - 2, pY - 2, pwW + 4, pwH + 4, O);
      rect(pX, pY, pwW, pwH, W);
      if (lift >= 2) {
        rect(cx - 3, pY + 3.5, 6, 3, '#ff8fa3');
        rect(cx - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(cx - 1.5, pY, 3, 3, '#ff8fa3'); rect(cx + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
      } else {
        rect(cx - 1, pY + 2, 2, pwH - 2, O);
      }
    };
    paw(lcx, -1, lp);
    paw(rcx, 1, rp);
  }

  function drawYarnBall(g, cx, cy) {
    const YARN_OUT = '#c8455a', YARN_DK = '#e0556e', YARN_MID = '#f2697f', YARN_LT = '#ff8fa3', YARN_HI = '#ffd0d8';
    const R = 12, bx = Math.round(cx), by = Math.round(cy);
    g.fillStyle = YARN_MID; g.beginPath(); g.ellipse(bx, by, R, R, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = YARN_DK; g.beginPath(); g.ellipse(bx, by + 4, R, R - 4, 0, 0, Math.PI * 2); g.fill();
    g.save();
    g.beginPath(); g.ellipse(bx, by, R, R, 0, 0, Math.PI * 2); g.clip();
    g.lineCap = 'round';
    g.strokeStyle = YARN_LT; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(bx - R, by - 7); g.lineTo(bx + R, by + 9); g.stroke();
    g.beginPath(); g.moveTo(bx - R, by - 1); g.lineTo(bx + R - 2, by + 11); g.stroke();
    g.strokeStyle = YARN_OUT;
    g.beginPath(); g.moveTo(bx + R, by - 9); g.lineTo(bx - R + 1, by + 9); g.stroke();
    g.restore();
    g.fillStyle = YARN_HI; g.fillRect(bx - 8, by - 9, 4, 3);
  }

  function drawGripPaw(g, palRGB, sx, sy, px, py, splay) {
    const O = rgbStr(palRGB.O), C = rgbStr(palRGB.C), W = rgbStr(palRGB.W), H = rgbStr(palRGB.H);
    const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const pwW = 12, pwH = 7, pY = Math.round(py - pwH / 2);
    const adx = px - sx, ady = py - sy, aLen = Math.hypot(adx, ady) || 1, aAng = Math.atan2(ady, adx);
    g.save(); g.translate(sx, sy); g.rotate(aAng);
    g.fillStyle = H; g.fillRect(-1, -6, aLen + 5, 12);   // pale halo: the arm reads on dark coats too
    g.fillStyle = O; g.fillRect(0, -5, aLen + 3, 10);
    g.fillStyle = C; g.fillRect(0, -3, aLen + 3, 6);
    g.restore();
    const pX = px - pwW / 2;
    rect(pX - 3, pY - 3, pwW + 6, pwH + 6, H);   // paw halo
    rect(pX - 2, pY - 2, pwW + 4, pwH + 4, O);
    rect(pX, pY, pwW, pwH, W);
    if (splay) {
      rect(px - 3, pY + 3.5, 6, 3, '#ff8fa3'); rect(px - 6.5, pY + 0.5, 3, 3, '#ff8fa3'); rect(px + 3.5, pY + 0.5, 3, 3, '#ff8fa3');
    } else {
      rect(px - 1, pY + 2, 2, pwH - 2, O);
    }
  }

  function ropeGeom(pos, t, energy, SH) {
    const ropeX = Math.round(pos.x - 26);
    const topY = Math.round(pos.y - SH - 55);
    const ballY = Math.round(pos.y - 6);
    const sway = Math.sin(t / 220) * (1 + energy / 40);
    const ropeAt = (y) => ropeX + Math.sin((y - topY) / 16 + t / 240) * sway;
    return { ropeX, topY, ballY, sway, ropeAt };
  }

  function drawRope(g, pos, t, climbing, dir, energy, SH) {
    const YARN_DK = '#e0556e', YARN_MID = '#f2697f', YARN_LT = '#ff8fa3';
    const geo = ropeGeom(pos, t, energy, SH), dirN = clamp(dir, -1, 1);
    const texOff = climbing ? t * 0.05 * dirN : 0;
    for (let y = geo.topY; y < geo.ballY; y++) {
      const x = Math.round(geo.ropeAt(y)), k = y - geo.topY;
      g.fillStyle = YARN_MID; g.fillRect(x, y, 3, 1);
      if ((((k + texOff) % 5) + 5) % 5 < 2) { g.fillStyle = YARN_DK; g.fillRect(x + 2, y, 1, 1); }
      else { g.fillStyle = YARN_LT; g.fillRect(x, y, 1, 1); }
    }
    const ballBob = climbing ? Math.round(Math.sin(t / 120) * 1.5) : 0;
    drawYarnBall(g, geo.ropeAt(geo.ballY), geo.ballY + ballBob);
  }

  function drawRopeClimb(g, palRGB, pos, t, climbing, dir, energy, bob, sway, SH) {
    const YARN_OUT = '#c8455a', YARN_LT = '#ff8fa3';
    const geo = ropeGeom(pos, t, energy, SH), dirN = clamp(dir, -1, 1);
    bob = bob || 0; sway = sway || 0;
    drawRope(g, pos, t, climbing, dir, energy, SH);
    const shX = pos.x - 6 + sway, shY = Math.round(pos.y - SH * 0.42 - bob);
    const gripBaseY = Math.round(pos.y - SH * 0.42), SPAN = 22;
    const ph = (t / (climbing ? 460 : 1100)) % 1;
    for (let i = 0; i < 2; i++) {
      const phi = (ph + i * 0.5) % 1;
      const yo = Math.cos(phi * Math.PI * 2) * (SPAN / 2);
      const reach = phi < 0.5 ? Math.sin((phi / 0.5) * Math.PI) : 0;
      const gy = gripBaseY + yo + (climbing ? reach * 6 * dirN : 0);
      drawGripPaw(g, palRGB, shX, shY, geo.ropeAt(gripBaseY + yo) + reach * 3.5, gy, climbing && reach > 0.55);
    }
    if (climbing && energy > 6) {
      const span = geo.ballY - geo.topY - 10;
      g.globalAlpha = 0.7;
      for (let i = 0; i < 3; i++) {
        const yy = ((t / 6 + i * 37) % span + span) % span;
        g.fillStyle = i === 1 ? YARN_OUT : YARN_LT;
        g.fillRect(Math.round(geo.ropeAt(geo.topY + yy) - 5 - i), Math.round(geo.topY + 8 + yy), 2, 2);
      }
      g.fillStyle = '#fff0d6';
      for (let i = 0; i < 2; i++) {
        const yy = ((-t / 5 * dirN + i * 50) % span + span) % span;
        g.fillRect(Math.round(geo.ropeAt(geo.topY + yy)), Math.round(geo.topY + 6 + yy), 2, 3);
      }
      g.globalAlpha = 1;
    }
  }

  // ---- the butterfly that annoys the cat -------------------------------------

  // Three wing styles the butterfly cycles through over time.
  var BFLY_STYLES = [
    { name: 'iridescent', halo: '#dfe9ff', main: '#5a3fa0', core: '#56cfe1', glint: '#bdecff', body: '#241f30', shimmer: true },
    { name: 'monarch',    halo: null,      main: '#e8943c', core: '#b5641d', veins: '#3a2412', dots: '#fff6e8', body: '#1c140c' },
    { name: 'pastel',     halo: '#ffe9f6', main: '#d98fc9', core: '#efb3df', core2: '#cdbcf2', glint: '#ffffff', body: '#2a2433' },
  ];

  // Draw a pixel-art butterfly centred at (bx,by), world space. `s` scales it,
  // `flap` is the wing-beat phase (wings open ↔ edge-on), `st` is a style palette.
  function drawButterfly(g, bx, by, s, st, flap, t) {
    const open = 0.30 + 0.70 * Math.abs(Math.cos(flap));            // 1 = wings flat to viewer, ~0.3 = edge-on
    let core = st.core;
    if (st.shimmer) core = lerpHex(st.core, '#9a6cff', 0.5 + 0.5 * Math.sin(t / 430));   // iridescent shimmer
    g.save(); g.translate(bx, by); g.scale(s, s);
    const E = (x, y, rx, ry, col) => { if (rx <= 0.2) return; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    for (const side of [-1, 1]) {
      const ux = side * 7 * open, lx = side * 5.5 * open;
      if (st.halo) { g.globalAlpha = 0.85; E(ux, -3, 6.2 * open + 1, 6.6, st.halo); E(lx, 5, 4.6 * open + 1, 4.8, st.halo); g.globalAlpha = 1; }
      E(ux, -3, 6.0 * open, 6.2, st.main); E(ux, -3.6, 4.0 * open, 4.4, core);            // upper wing
      E(lx, 5, 4.4 * open, 4.6, st.main); E(lx, 5, 2.8 * open, 3.0, st.core2 || core);    // lower wing
      if (st.veins) { g.strokeStyle = st.veins; g.lineWidth = 0.7; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(0, -2); g.lineTo(side * (8 * open + k), -7 + k); g.stroke(); } }
      if (st.dots) { E(side * 9 * open, -6, 0.8, 0.8, st.dots); E(side * 6 * open, 2, 0.8, 0.8, st.dots); }
      if (st.glint) { g.fillStyle = st.glint; g.fillRect(Math.round(side * 8 * open - 0.5), -6, 1, 1); }
    }
    // body + head + antennae
    E(0, 0, 1.4, 8, st.body); E(0, -7, 1.6, 1.9, st.body);
    g.strokeStyle = st.body; g.lineWidth = 0.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -8); g.lineTo(-2.6, -12.5); g.moveTo(0, -8); g.lineTo(2.6, -12.5); g.stroke();
    g.fillStyle = st.glint || core; g.fillRect(-3, -13, 1, 1); g.fillRect(2, -13, 1, 1);   // antenna tips
    g.restore();
  }

  // ---- the live controller ---------------------------------------------------

  function init(canvas, options) {
    options = options || {};
    if (typeof buildSprite !== 'function' || typeof composeSit !== 'function' || typeof PATTERNS === 'undefined') {
      console.error('[cat-live] cat-sprite.js globals missing — load cat-sprite.js before cat-live.js');
      return { start() {}, stop() {}, setCoat() {}, nextCoat() {}, destroy() {}, type() {}, climb() {}, setButterfly() {} };
    }

    const ctx = canvas.getContext('2d');
    const onMeow = typeof options.onMeow === 'function' ? options.onMeow : function () {};
    const onHearts = typeof options.onHearts === 'function' ? options.onHearts : function () {};
    const onBehavior = typeof options.onBehavior === 'function' ? options.onBehavior : function () {};
    const cycleCoatOnClick = options.cycleCoatOnClick !== false;
    const autoShow = options.autoShow !== false;
    let butterflyOn = options.butterfly !== false;
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
    let reducedMotion = options.reducedMotion != null ? options.reducedMotion : mq.matches;

    let coatIndex = Number(options.coatIndex);
    if (!(coatIndex >= 0 && coatIndex < PATTERNS.length)) {
      const stored = Number(localStorage.getItem('pixelcat.coat'));
      coatIndex = (stored >= 0 && stored < PATTERNS.length) ? stored : 0;
    }
    let sitSprite, loafSprite, huntSprite, typeSprite, palRGB, pal, SW, SH;
    function buildCoat(i) {
      const P = PATTERNS[i];
      const B = { ...BUILDS[PATTERN_BUILD[i]], tabby: !!TABBY[i] };
      sitSprite = buildSprite(24, 30, () => composeSit(B));
      try { loafSprite = buildSprite(24, 30, () => composeLoaf(B)); } catch (e) { loafSprite = sitSprite; }
      huntSprite = buildSprite(30, 20, () => composeHunt(B));
      typeSprite = buildSprite(24, 24, () => composeTypeFront(B));
      SW = sitSprite.SW; SH = sitSprite.SH;
      palRGB = {
        O: toRgb(P.outline), C: toRgb(P.coat), K: toRgb(P.mark),
        W: toRgb(P.white || P.coat), X: toRgb(P.patch || P.coat),
        I: toRgb(P.inner || P.mark), N: toRgb(P.nose), E: toRgb(P.eye), H: toRgb(HALO),
      };
      pal = { O: rgbStr(palRGB.O), C: rgbStr(palRGB.C), W: rgbStr(palRGB.W) };
    }
    buildCoat(coatIndex);

    // layout
    let cssW = 0, cssH = 0, scale = 1, footX = 0, footY = 0, rect = null;
    function resize() {
      rect = canvas.getBoundingClientRect();
      cssW = rect.width || canvas.clientWidth || 300;
      cssH = rect.height || canvas.clientHeight || 120;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      scale = Math.min((cssH * 0.80) / SH, (cssW * 0.42) / SW);
      footX = cssW / 2;
      footY = cssH * 0.93;
    }
    function relayout() { if (reducedMotion) paintStatic(); else resize(); }

    // input: page cursor + idle wander
    let curX = 0, curY = 0, lastMove = -1e9;
    const smoothLook = { x: 0, y: 0 };
    let idleTarget = { x: 0, y: 0 }, nextIdleLook = 0;
    let lookOverride = null;   // when set (butterfly nearby), the cat watches it instead of the cursor
    function onMove(e) { curX = e.clientX; curY = e.clientY; lastMove = now(); }
    function onScroll() { rect = canvas.getBoundingClientRect(); }
    function updateLook(t) {
      let tx, ty;
      if (lookOverride) {
        tx = lookOverride.x; ty = lookOverride.y;
      } else if (t - lastMove < 3500 && rect) {
        const fx = rect.left + footX, fy = rect.top + (footY - SH * 0.72 * scale);
        tx = clamp((curX - fx) / 220, -1, 1);
        ty = clamp((curY - fy) / 180, -0.7, 1);
      } else {
        if (t > nextIdleLook) { idleTarget = { x: (Math.random() * 2 - 1) * 0.6, y: (Math.random() * 2 - 1) * 0.3 }; nextIdleLook = t + 2200 + Math.random() * 2400; }
        tx = idleTarget.x; ty = idleTarget.y;
      }
      smoothLook.x += (tx - smoothLook.x) * 0.16;
      smoothLook.y += (ty - smoothLook.y) * 0.16;
    }

    // behaviour timers
    let blinkUntil = 0, nextBlink = 1500;
    let flickT0 = -1, nextFlick = 4000;
    let nuzzleUntil = 0;
    let typeUntil = 0, lastKeyAt = -1e9, heat = 0;
    let climbUntil = 0, climbDir = -1, paperLen = 0;
    let stretchT0 = -1;
    // auto-showcase reel
    const REEL = ['HUNT', 'STRETCH', 'ZOOMIES', 'GROOM', 'LOAF'];
    const REEL_MS = { HUNT: 2600, STRETCH: 1500, ZOOMIES: 3000, GROOM: 2600, LOAF: 4000 };
    let reelIdx = 0, autoState = null, autoUntil = 0, nextAuto = 9000;
    let lastBehavior = '';
    // butterfly entity (stage CSS-px space) + swat reaction
    let bf = { x: 0, y: 0, vx: 10, vy: 4, flap: 0, mode: 'wander', wpX: 0, wpY: 0, nextWp: 0, nextDive: 0, diveUntil: 0, dodgeUntil: 0, palIdx: 0, nextPalAt: 0, inited: false };
    let swatUntil = 0, swatTX = 0, swatTY = 0, swatCool = 0, prevT = 0;
    function bflyActive() { return butterflyOn && !reducedMotion; }

    function userBusy(t) { return t < nuzzleUntil || t < climbUntil || t < typeUntil; }
    function resolveState(t) {
      if (t < nuzzleUntil) return 'NUZZLE';
      if (t < climbUntil) return 'CLIMB';
      if (t < typeUntil) return 'TYPE';
      if (t < swatUntil) return 'SWAT';
      if (autoState && t < autoUntil) return autoState;
      return 'IDLE';
    }
    function schedule(t, state) {
      if (t > nextBlink) { blinkUntil = t + 110; nextBlink = t + 2500 + Math.random() * 3500; }
      if (state === 'IDLE') {
        if (t > nextFlick) { flickT0 = t; nextFlick = t + 4000 + Math.random() * 5000; }
        if (autoShow && t > nextAuto) {
          autoState = REEL[reelIdx % REEL.length]; reelIdx++;
          autoUntil = t + (REEL_MS[autoState] || 2600);
          nextAuto = autoUntil + 1600 + Math.random() * 1400;
          if (autoState === 'STRETCH') stretchT0 = t;
          if (autoState === 'HUNT' || autoState === 'ZOOMIES') flickT0 = t;
        }
      }
    }

    const CAPTION = { IDLE: '', NUZZLE: 'purr ♥', CLIMB: 'climbing!', TYPE: 'typing…', SWAT: 'annoyed!', HUNT: 'hunting!', STRETCH: 'big stretch~', ZOOMIES: 'zoomies!', GROOM: 'washing up', LOAF: 'loafing' };

    // body transform helper: foot anchored at (footX, footY+dy), scaled, optional squash/rotate
    function bodyXform(dyPush, rot, sx, sy) {
      ctx.translate(footX, footY - dyPush); ctx.rotate(rot || 0); ctx.scale(scale * (sx || 1), scale * (sy || 1));
    }

    function drawBfly(t) { drawButterfly(ctx, bf.x, bf.y, scale * 0.95, BFLY_STYLES[bf.palIdx], bf.flap, t); }

    function paint(t) {
      const state = resolveState(t);
      schedule(t, state);
      const dt = prevT ? t - prevT : 16; prevT = t;
      updateButterfly(t, dt, state);   // sets lookOverride / may trigger swat — run before updateLook
      updateLook(t);
      // heat decays unless actively typing
      if (t - lastKeyAt > 180) heat = Math.max(0, heat - 0.012);
      if (t > climbUntil) paperLen = Math.max(0, paperLen - 0.5);

      const cap = CAPTION[state] || '';
      if (cap !== lastBehavior) { lastBehavior = cap; onBehavior(cap); }

      const blinking = t < blinkUntil;
      // butterfly hides during the user-driven / cuddle poses
      const bflyVisible = bflyActive() && bf.inited && state !== 'TYPE' && state !== 'CLIMB' && state !== 'NUZZLE';
      ctx.clearRect(0, 0, cssW, cssH);

      // shadow (skip while climbing — feet leave the floor)
      if (state !== 'CLIMB') {
        ctx.save(); ctx.translate(footX, footY); ctx.scale(scale, scale);
        drawShadow(ctx, 0, 0, (state === 'NUZZLE' ? 0.14 + Math.sin(t / 800) * 0.05 : 0.17), SW * 0.30);
        ctx.restore();
      }

      if (state === 'TYPE') { paintType(t, blinking); return; }
      if (state === 'CLIMB') { paintClimb(t, blinking); return; }
      if (state === 'SWAT') { paintSwat(t, blinking); if (bflyVisible) drawBfly(t); return; }
      if (state === 'HUNT') { paintHunt(t, blinking); if (bflyVisible) drawBfly(t); return; }

      // sit/loaf family: IDLE, NUZZLE, GROOM, LOAF, STRETCH, ZOOMIES
      let petPush = 0, sqX = 1, sqY = 1, eyeMode = 'open', petting = false, lean = smoothLook.x * 0.05;
      let fx = footX;
      const sp = state === 'LOAF' ? loafSprite : sitSprite;

      if (state === 'NUZZLE') {
        const press = Math.max(0, Math.sin(t / 320));
        petPush = press * 4; sqY = 1 - press * 0.05; sqX = 1 + press * 0.04;
        eyeMode = 'happy'; petting = true; lean += smoothLook.x * 0.04;
      } else if (state === 'STRETCH') {
        const se = clamp((t - stretchT0) / (REEL_MS.STRETCH), 0, 1);
        let k; if (se < 0.16) k = -Math.sin(se / 0.16 * Math.PI) * 0.5; else { const r = (se - 0.16) / 0.84; k = Math.sin(r * Math.PI); }
        sqY = 1 + k * 0.42; sqX = 1 - k * 0.14; eyeMode = 'happy';
      } else if (state === 'ZOOMIES') {
        fx = footX + Math.sin(t / 165) * (cssW * 0.26);
        petting = true;
      }
      const bob = Math.round(Math.sin(t / 1500) * (state === 'LOAF' ? 0.8 : 1.6));
      const faceLeft = state === 'ZOOMIES' && Math.cos(t / 165) < 0;

      // tail behind (sit poses only; loaf has a baked wrapped tail)
      if (state !== 'LOAF') {
        ctx.save(); ctx.translate(fx, footY - petPush * scale); ctx.rotate(lean); ctx.scale(scale * (faceLeft ? -1 : 1), scale);
        drawTail(ctx, 0, 0, t, pal, flickT0, petting, SW, SH); ctx.restore();
      }
      ctx.save();
      ctx.translate(fx, footY - petPush * scale); ctx.rotate(lean); ctx.scale(scale * sqX * (faceLeft ? -1 : 1), scale * sqY);
      ctx.translate(-SW / 2, -SH);
      drawCat(ctx, sp, palRGB, { bob, blinking, look: faceLeft ? { x: -smoothLook.x, y: smoothLook.y } : smoothLook, eyeMode, blush: state === 'NUZZLE' });
      if (state === 'GROOM') {
        // lift the LEFT front paw to the mouth: paint over its planted white mitt so the
        // cat shows one planted + one raised paw (instead of three).
        ctx.fillStyle = rgbStr(palRGB.C); ctx.fillRect(34, 104, 16, 16);
        drawGroom(ctx, palRGB, sp.muzzle.x - 6, SH * 0.30, t);
      }
      ctx.restore();

      if (bflyVisible) drawBfly(t);
    }

    function paintType(t, blinking) {
      const overheat = heat > 0.7;
      const sp = overheat ? 36 : 60, wave = Math.sin(t / sp);
      const snap = (v) => Math.pow(Math.max(0, v), 0.6);
      const cyc = t % 4500, both = cyc > 3900 ? Math.sin(((cyc - 3900) / 600) * Math.PI) : 0;
      const lp = Math.max(snap(wave), both), rp = Math.max(snap(-wave), both);
      const dip = (lp + rp) * 1.6, leanA = (rp - lp) * 0.05 * (1 - both);
      const TW = typeSprite.SW, TH = typeSprite.SH;
      ctx.save();
      ctx.translate(footX, footY); ctx.scale(scale, scale);     // foot-anchored sprite space (pos = 0,0)
      ctx.save(); ctx.rotate(leanA); ctx.translate(-TW / 2, -TH + dip);
      drawCat(ctx, typeSprite, palRGB, { bob: 0, blinking, look: { x: (rp - lp) * 0.5, y: 0.6 } });
      ctx.restore();
      const lcx = -15, rcx = 15, keyTop = -12;
      drawKey(ctx, lcx, keyTop + Math.round(lp * 3), 24, 11, lp > 0.6);
      drawKey(ctx, rcx, keyTop + Math.round(rp * 3), 24, 11, rp > 0.6);
      drawKneadPaws(ctx, palRGB, lcx, rcx, keyTop, lp, rp, -29 + dip);
      if (overheat) drawSteam(ctx, t, 0, -TH + 2 * CELL);
      ctx.restore();
    }

    function paintClimb(t, blinking) {
      const climbing = t < climbUntil, energy = Math.max(paperLen, climbing ? 20 : 0);
      const stroke = (t / (climbing ? 460 : 1100)) % 1;
      const cbob = Math.sin(stroke * Math.PI * 2) * (climbing ? 2.2 : 1.1);
      const csway = Math.cos(stroke * Math.PI * 2) * (climbing ? 1.0 : 0.6);
      ctx.save();
      ctx.translate(footX, footY); ctx.scale(scale, scale);     // foot-anchored sprite space (pos = 0,0)
      const pos = { x: 0, y: 0 };
      // seated body rides the heave; rope + grips drawn over it
      ctx.save(); ctx.translate(csway, -cbob); ctx.translate(-SW / 2, -SH);
      drawCat(ctx, sitSprite, palRGB, { bob: 0, blinking, look: { x: -0.35, y: clamp(climbDir, -1, 1) * 0.6 } });
      ctx.restore();
      drawRopeClimb(ctx, palRGB, pos, t, climbing, climbDir, energy, cbob, csway, SH);
      ctx.restore();
    }

    function paintHunt(t, blinking) {
      const HW = huntSprite.SW, HH = huntSprite.SH;
      const pounce = (t % 1500) / 1500;
      const lunge = pounce < 0.22 ? Math.sin(pounce / 0.22 * Math.PI) : 0;   // quick forward stalk-pounce
      const crouch = 1 + lunge * 0.10;
      ctx.save();
      ctx.translate(footX, footY + lunge * 4 * scale); ctx.scale(scale * crouch, scale * (1 - lunge * 0.06));
      ctx.translate(-HW / 2, -HH);
      drawCat(ctx, huntSprite, palRGB, { bob: 0, blinking, look: smoothLook, dilate: 1.12 });
      ctx.restore();
    }

    // a single paw swipes up at the butterfly; the seated body leans toward it
    function paintSwat(t, blinking) {
      const prog = clamp((t - (swatUntil - 420)) / 420, 0, 1);
      const swing = Math.sin(prog * Math.PI);               // 0 -> 1 -> 0 swipe
      const dirX = clamp((swatTX - footX) / 90, -1, 1);
      ctx.save();
      ctx.translate(footX, footY); ctx.rotate(dirX * 0.10 * swing); ctx.scale(scale, scale);
      ctx.save(); ctx.translate(-SW / 2, -SH);
      drawCat(ctx, sitSprite, palRGB, { bob: 0, blinking, look: lookOverride || smoothLook, eyeMode: 'open', dilate: 1.1 });
      ctx.restore();
      // reaching paw: shoulder at upper chest, paw toward the butterfly (in cat-local space)
      const bxL = clamp((swatTX - footX) / scale, -SW * 0.8, SW * 0.8);
      const byL = clamp((swatTY - footY) / scale, -SH * 1.25, -SH * 0.4);
      drawGripPaw(ctx, palRGB, dirX * 5, -SH * 0.52, bxL * 0.7, byL - swing * 6, swing > 0.35);
      ctx.restore();
    }

    // butterfly flight + cat-reaction logic (stage CSS-px space)
    function updateButterfly(t, dt, state) {
      const busy = state === 'TYPE' || state === 'CLIMB' || state === 'NUZZLE';
      if (!bflyActive() || busy) { lookOverride = null; return; }
      if (!bf.inited) {
        bf.x = cssW * 0.25; bf.y = cssH * 0.30; bf.wpX = bf.x; bf.wpY = bf.y;
        bf.nextWp = t + 1200; bf.nextDive = t + 3000; bf.nextPalAt = t + 9000; bf.inited = true;
      }
      const dtf = Math.min(dt, 50) / 16.67;
      if (t > bf.nextPalAt) { bf.palIdx = (bf.palIdx + 1) % BFLY_STYLES.length; bf.nextPalAt = t + 8000 + Math.random() * 4000; }

      const headX = footX, headY = footY - SH * 0.72 * scale;
      // mode transitions
      if (bf.mode === 'dodge' && t > bf.dodgeUntil) bf.mode = 'wander';
      if (bf.mode === 'wander' && t > bf.nextDive) {
        bf.mode = 'dive'; bf.diveUntil = t + 1800; bf.nextDive = t + 4000 + Math.random() * 4000;
        if (Math.random() < 0.34 && autoState !== 'HUNT') { autoState = 'HUNT'; autoUntil = t + REEL_MS.HUNT; nextAuto = autoUntil + 1600; flickT0 = t; }   // stand-up bat
      }
      if (bf.mode === 'dive' && t > bf.diveUntil) bf.mode = 'wander';

      // steering target
      let tx, ty;
      if (bf.mode === 'dive') { tx = headX + Math.sin(t / 200) * 22; ty = headY - 6 + Math.cos(t / 170) * 10; }
      else if (bf.mode === 'dodge') { tx = bf.wpX; ty = bf.wpY; }
      else {
        if (t > bf.nextWp) { bf.wpX = cssW * (0.15 + Math.random() * 0.7); bf.wpY = cssH * (0.16 + Math.random() * 0.5); bf.nextWp = t + 1400 + Math.random() * 1800; }
        tx = bf.wpX; ty = bf.wpY;
      }
      const accel = bf.mode === 'dodge' ? 0.02 : (bf.mode === 'dive' ? 0.045 : 0.03);
      bf.vx += (tx - bf.x) * accel * dtf; bf.vy += (ty - bf.y) * accel * dtf;
      bf.vx += Math.sin(t / 130 + 1.3) * 0.5 * dtf; bf.vy += Math.sin(t / 90) * 0.6 * dtf;   // organic flutter

      // flee the visitor's cursor
      if (rect && t - lastMove < 4000) {
        const dx = bf.x - (curX - rect.left), dy = bf.y - (curY - rect.top), d = Math.hypot(dx, dy);
        if (d < 72 && d > 0.1) { const f = (72 - d) / 72 * 3.4; bf.vx += dx / d * f * dtf; bf.vy += dy / d * f * dtf; }
      }

      bf.vx *= 0.92; bf.vy *= 0.92;
      const sp = Math.hypot(bf.vx, bf.vy), maxv = bf.mode === 'dodge' ? 9.5 : 5.5;
      if (sp > maxv) { bf.vx *= maxv / sp; bf.vy *= maxv / sp; }
      bf.x += bf.vx * dtf; bf.y += bf.vy * dtf;

      const m = 14, lo = m, hiX = cssW - m, hiY = cssH * 0.82;
      if (bf.x < lo) { bf.x = lo; bf.vx = Math.abs(bf.vx); } if (bf.x > hiX) { bf.x = hiX; bf.vx = -Math.abs(bf.vx); }
      if (bf.y < m) { bf.y = m; bf.vy = Math.abs(bf.vy); } if (bf.y > hiY) { bf.y = hiY; bf.vy = -Math.abs(bf.vy); }
      bf.flap += (0.18 + sp * 0.03) * dtf;

      // cat watches the butterfly when it's in range
      const dxh = bf.x - headX, dyh = bf.y - headY, dh = Math.hypot(dxh, dyh);
      if (dh < cssW * 0.55) lookOverride = { x: clamp(dxh / 120, -1, 1), y: clamp(dyh / 90, -1, 1) };
      else lookOverride = null;

      // swat when it dive-bombs close to the head (cooldown-gated)
      if (dh < 46 && t > swatCool && t > swatUntil) {
        swatUntil = t + 420; swatTX = bf.x; swatTY = bf.y; swatCool = t + 1400;
        onBehavior('annoyed!');
        bf.mode = 'dodge'; bf.dodgeUntil = t + 520;
        const aw = Math.atan2(dyh, dxh) + (Math.random() - 0.5);
        bf.vx = Math.cos(aw) * 9.5; bf.vy = Math.sin(aw) * 9.5 - 2;
        bf.wpX = clamp(bf.x + Math.cos(aw) * 70, 20, cssW - 20); bf.wpY = clamp(bf.y + Math.sin(aw) * 45, 14, cssH * 0.7);
      }
    }

    // loop
    let running = false, rafId = 0, onScreen = true, lastDraw = 0, drewStatic = false;
    function now() { return performance.now(); }
    function frame() {
      rafId = 0;
      if (!running) return;
      if (document.hidden || !onScreen) return;
      const t = now();
      if (reducedMotion) { if (!drewStatic) { paintStatic(); drewStatic = true; } return; }
      const st = resolveState(t);
      const minFrame = ((st === 'IDLE' || st === 'LOAF') && !(bflyActive() && bf.inited)) ? 33 : 16;
      if (t - lastDraw >= minFrame) { paint(t); lastDraw = t; }
      rafId = requestAnimationFrame(frame);
    }
    function paintStatic() {
      resize();
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.save(); ctx.translate(footX, footY); ctx.scale(scale, scale); drawShadow(ctx, 0, 0, 0.17, SW * 0.30); ctx.restore();
      ctx.save(); ctx.translate(footX, footY); ctx.scale(scale, scale); drawTail(ctx, 0, 0, 0, pal, -1, false, SW, SH); ctx.restore();
      ctx.save(); ctx.translate(footX, footY); ctx.scale(scale, scale); ctx.translate(-SW / 2, -SH);
      drawCat(ctx, sitSprite, palRGB, { bob: 0, blinking: false, look: { x: 0, y: 0 }, eyeMode: 'open', blush: false });
      ctx.restore();
    }
    function kick() { if (running && !rafId && !document.hidden && onScreen && !reducedMotion) rafId = requestAnimationFrame(frame); }

    // coat control
    function setCoat(i) {
      coatIndex = ((i % PATTERNS.length) + PATTERNS.length) % PATTERNS.length;
      buildCoat(coatIndex);
      try { localStorage.setItem('pixelcat.coat', String(coatIndex)); } catch (e) {}
      resize(); drewStatic = false;
      if (reducedMotion) paintStatic();
    }
    function nextCoat() { setCoat(coatIndex + 1); }
    function setButterfly(on) { butterflyOn = !!on; if (!butterflyOn) lookOverride = null; kick(); }

    // interaction API
    function onClick(e) {
      onMeow(); onHearts(e.clientX, e.clientY);
      autoState = null; nuzzleUntil = now() + 700; nextAuto = now() + 9000;
      if (cycleCoatOnClick) nextCoat();
      kick();
    }
    function type() {
      lastKeyAt = now(); typeUntil = lastKeyAt + 480; heat = Math.min(1, heat + 0.11);
      autoState = null; nextAuto = lastKeyAt + 6000; kick();
    }
    function climb(dir) {
      climbDir = dir < 0 ? -1 : 1; climbUntil = now() + 1000; paperLen = Math.min(60, paperLen + 26);
      autoState = null; nextAuto = now() + 6000; kick();
    }

    // observers / listeners
    let ro = null, io = null;
    function bind() {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', relayout);
      canvas.addEventListener('pointerdown', onClick);
      document.addEventListener('visibilitychange', kick);
      if (window.ResizeObserver) { ro = new ResizeObserver(() => { relayout(); }); ro.observe(canvas); }
      if (window.IntersectionObserver) {
        io = new IntersectionObserver((es) => { es.forEach((x) => { onScreen = x.isIntersecting; if (onScreen) kick(); }); }, { threshold: 0.01 });
        io.observe(canvas);
      }
      if (mq.addEventListener) mq.addEventListener('change', (e) => { reducedMotion = e.matches; drewStatic = false; if (reducedMotion) paintStatic(); else kick(); });
    }
    function unbind() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', relayout);
      canvas.removeEventListener('pointerdown', onClick);
      document.removeEventListener('visibilitychange', kick);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
    }

    let bound = false;
    function start() { if (!bound) { bind(); bound = true; } running = true; resize(); if (reducedMotion) { paintStatic(); drewStatic = true; } else kick(); }
    function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
    function destroy() { stop(); if (bound) { unbind(); bound = false; } }

    start();
    return { start, stop, setCoat, nextCoat, destroy, type, climb, setButterfly };
  }

  window.PixelCatLive = { init };
})();
