// Speech-bubble layout tests.
//
// The bubble is how every "stay on track" feature actually reaches you - reminders,
// the pinned note, calendar nudges, mail alerts, notify.js, the break nudge. It used
// to size its panel to at most 260px and then draw the whole string anyway, so a
// message longer than roughly 44 characters spilled white text onto the wallpaper
// where nothing is readable. config.js allows 80-character reminders and pinned
// notes, and calendar summaries are not length-capped at all, so this was the normal
// case rather than an edge case.
//
// These drive the pure layout with a deterministic measure function (6px per
// character), so a "line" is a known number of characters and the assertions are
// about behaviour, not about a font.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { wrapBubbleText, layoutBubble, bubbleInnerW, BUBBLE_MAX_W, BUBBLE_PAD_X, BUBBLE_MIN_W } =
  require(path.join(__dirname, '..', 'src', 'bubble.js'));

const CH = 6;
const measure = (s) => String(s).length * CH;
const INNER = BUBBLE_MAX_W - BUBBLE_PAD_X * 2;   // 244px -> 40 characters per line

const widest = (lines) => lines.reduce((m, l) => Math.max(m, measure(l)), 0);

test('every wrapped line fits the panel', () => {
  const text = 'Stand up and stretch, drink some water, and get back to the deploy when you are done.';
  const lines = wrapBubbleText(text, measure, INNER, 4);
  assert.ok(lines.length > 1, 'a long message should wrap onto more than one line');
  for (const l of lines) {
    assert.ok(measure(l) <= INNER, `line overflows the panel: ${measure(l)}px > ${INNER}px -> "${l}"`);
  }
});

test('an 80-character reminder (the length config.js allows) stays inside the box', () => {
  const text = 'x'.repeat(40) + ' ' + 'y'.repeat(39);   // 80 chars, two words
  const box = layoutBubble({ text, measure, cx: 500, topY: 400, viewW: 1920, viewH: 1080 });
  assert.ok(widest(box.lines) <= BUBBLE_MAX_W - BUBBLE_PAD_X * 2, 'text is wider than the panel it is drawn in');
  assert.ok(box.w <= BUBBLE_MAX_W, 'panel grew past its maximum');
  assert.ok(box.h > 20, 'a wrapped message needs a taller panel than a one-liner');
});

test('no text is lost when it fits exactly at the line cap', () => {
  const words = Array.from({ length: 8 }, () => 'abcd');   // 8 x 4 chars + spaces = well inside 4 lines
  const lines = wrapBubbleText(words.join(' '), measure, INNER, 4);
  assert.strictEqual(lines.join(' '), words.join(' '));
  assert.ok(!lines.some((l) => l.endsWith('…')), 'nothing was dropped, so nothing should be ellipsised');
});

test('past the line cap the last line is ellipsised instead of the text being silently cut', () => {
  const text = ('word '.repeat(200)).trim();
  const lines = wrapBubbleText(text, measure, INNER, 4);
  assert.strictEqual(lines.length, 4, 'must stop at the cap');
  assert.ok(lines[3].endsWith('…'), 'a truncated bubble should say so');
  assert.ok(measure(lines[3]) <= INNER, 'the ellipsis must not push the last line over the width');
});

test('a single word too wide for the panel is hard-broken, not left overflowing', () => {
  const url = 'https://example.com/' + 'a'.repeat(200);
  const lines = wrapBubbleText(url, measure, INNER, 4);
  for (const l of lines) assert.ok(measure(l) <= INNER, `unbroken over-wide chunk: "${l}"`);
  assert.ok(lines.length > 1, 'an over-wide word should span several lines');
});

test('explicit newlines start a new line', () => {
  const lines = wrapBubbleText('first\nsecond', measure, INNER, 4);
  assert.deepStrictEqual(lines, ['first', 'second']);
});

test('blank and missing text still produce a drawable one-line box', () => {
  for (const t of ['', null, undefined, '   ', '\n\n']) {
    const box = layoutBubble({ text: t, measure, cx: 100, topY: 200, viewW: 1920, viewH: 1080 });
    assert.strictEqual(box.lines.length, 1, `no line for ${JSON.stringify(t)}`);
    assert.ok(box.w >= BUBBLE_MIN_W && box.h > 0, 'degenerate box');
  }
});

test('a short message keeps the original single-line panel height', () => {
  const box = layoutBubble({ text: 'Meow!', measure, cx: 500, topY: 400, viewW: 1920, viewH: 1080 });
  assert.strictEqual(box.lines.length, 1);
  assert.strictEqual(box.h, 20, 'a one-line bubble should look exactly as it always has');
});

// --- edge clamping ---------------------------------------------------------
// The pet's DEFAULT resting spot is a screen corner, so an unclamped centred box
// hung off the edge in the most common position there is.

test('a bubble at the right edge is pulled fully on screen', () => {
  const viewW = 1920;
  const box = layoutBubble({ text: 'Time for a break, stretch with me', measure, cx: viewW - 20, topY: 400, viewW, viewH: 1080 });
  assert.ok(box.x + box.w <= viewW, `box runs off the right edge: ${box.x + box.w} > ${viewW}`);
  assert.ok(box.x >= 0, 'box runs off the left edge');
});

test('a bubble at the left edge is pulled fully on screen', () => {
  const box = layoutBubble({ text: 'Time for a break, stretch with me', measure, cx: 12, topY: 400, viewW: 1920, viewH: 1080 });
  assert.ok(box.x >= 0, `box runs off the left edge: ${box.x}`);
});

test('the tail keeps pointing at the pet when the box is edge-clamped', () => {
  const viewW = 1920;
  const box = layoutBubble({ text: 'A fairly long break reminder that has to wrap', measure, cx: viewW - 14, topY: 400, viewW, viewH: 1080 });
  assert.ok(box.tailX >= box.x && box.tailX <= box.x + box.w, 'tail floated outside the panel');
  assert.ok(box.tailX > box.x + box.w / 2, 'tail should stay on the pet side of a left-shifted box');
});

test('a pet dragged to the top of the screen still gets a visible bubble', () => {
  const box = layoutBubble({ text: 'Hello!', measure, cx: 500, topY: 4, viewW: 1920, viewH: 1080 });
  assert.ok(box.y >= 0, `bubble drawn above the top edge: y=${box.y}`);
});

test('on a viewport narrower than the panel the panel narrows, it does not just slide left', () => {
  const viewW = 260;   // the --shot preview canvas, which is exactly BUBBLE_MAX_W
  const box = layoutBubble({ text: 'Stand up and stretch, drink some water, then get back to it', measure, cx: 130, topY: 300, viewW, viewH: 320 });
  assert.ok(box.x >= 0, 'box starts off the left edge');
  assert.ok(box.x + box.w <= viewW, `box runs ${box.x + box.w - viewW}px off the right edge of a ${viewW}px screen`);
  for (const l of box.lines) {
    assert.ok(measure(l) <= box.w, `a line is wider than the panel it sits in: ${measure(l)}px in ${box.w}px`);
  }
});

test('bubbleInnerW matches the width layoutBubble actually wraps to', () => {
  // renderer.js caches the wrap keyed on bubbleInnerW(viewW). If that ever drifts
  // from the width layoutBubble uses internally, the cached lines would be wrapped
  // to one width and drawn into a panel sized for another - and it would only show
  // up as text poking out of the box again.
  const text = 'a reminder long enough that where it wraps depends on the exact width';
  for (const viewW of [1920, 1366, 800, 400, 260, 120]) {
    const viaCache = layoutBubble({
      text, measure, cx: viewW / 2, topY: 300, viewW, viewH: 800,
      lines: wrapBubbleText(text, measure, bubbleInnerW(viewW), undefined),
    });
    const direct = layoutBubble({ text, measure, cx: viewW / 2, topY: 300, viewW, viewH: 800 });
    assert.deepStrictEqual(viaCache.lines, direct.lines, `cached and direct wraps differ at viewW=${viewW}`);
    assert.strictEqual(viaCache.w, direct.w, `panel width differs at viewW=${viewW}`);
  }
});

test('the panel never exceeds its maximum width regardless of input', () => {
  for (const t of ['short', 'w'.repeat(500), 'many words '.repeat(50)]) {
    const box = layoutBubble({ text: t, measure, cx: 500, topY: 400, viewW: 1920, viewH: 1080 });
    assert.ok(box.w <= BUBBLE_MAX_W, `panel ${box.w}px exceeds ${BUBBLE_MAX_W}px for ${t.slice(0, 12)}…`);
  }
});
