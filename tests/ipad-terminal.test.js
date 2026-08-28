// The iPad terminal's job is to survive a tablet: Safari suspends the tab the moment
// you switch apps, and the shell on the other end must not die with it, lose the output
// it produced while you were away, or re-print what you already read. These drive the
// real server over real HTTP against a real shell - no mocks, so a pass means bytes
// actually made the round trip.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawn } = require('node:child_process');

const srv = require('../tools/ipad-terminal/server.js');
const SERVER = path.join(__dirname, '..', 'tools', 'ipad-terminal', 'server.js');
const WIN = process.platform === 'win32';

test('--lan is the one flag that opens the port to the network', () => {
  assert.equal(srv.parseArgs([]).host, '127.0.0.1');
  assert.equal(srv.parseArgs(['--lan']).host, '0.0.0.0');
  // An explicit --host wins, so --lan can't silently widen a deliberate bind.
  assert.equal(srv.parseArgs(['--lan', '--host=192.168.1.5']).host, '192.168.1.5');
  assert.equal(srv.parseArgs(['--port=9000']).port, 9000);
  assert.equal(srv.parseArgs(['--idle=30']).idle, 30);
  assert.deepEqual(srv.parseArgs(['--allow-host=a.ts.net', '--allow-host=b']).allowHost, ['a.ts.net', 'b']);
  assert.equal(srv.parseArgs(['--nope']).bad, '--nope');
});

test('the Host check lets the iPad in and keeps rebound DNS names out', () => {
  const ok = (host) => srv.hostOk({ headers: { host } });
  assert.ok(ok('192.168.1.5:7681'), 'the LAN IP the iPad actually dials');
  assert.ok(ok('127.0.0.1:7681'));
  assert.ok(ok('localhost:7681'));
  assert.ok(ok('johnsons-mac.local:7681'), 'Bonjour name a Mac answers to');
  assert.ok(ok('[::1]:7681'));
  // A name that resolves to this box is exactly the DNS-rebinding shape.
  assert.ok(!ok('evil.example.com:7681'));
  assert.ok(!ok(''));
});

test('scrollback keeps its offsets straight as it evicts', () => {
  const sess = { chunks: [], bytes: 0, base: 0, offset: 0, clients: new Set() };
  const chunk = Buffer.alloc(64 * 1024, 'x');
  for (let i = 0; i < 6; i += 1) srv.pushOut(sess, chunk);

  const total = 6 * chunk.length;
  assert.equal(sess.offset, total, 'offset counts every byte ever written');
  assert.ok(sess.bytes <= srv.SCROLLBACK, 'the buffer stays capped');
  assert.ok(sess.base > 0, 'the oldest output was dropped');
  assert.equal(sess.base + sess.bytes, sess.offset, 'base and length still meet the head');

  // Replaying from the head is a no-op: a client that is caught up gets nothing.
  let sent = '';
  srv.replay(sess, { write: (s) => { sent += s; } }, sess.offset);
  assert.equal(sent, '', 'a caught-up reconnect replays nothing');

  // Replaying from mid-buffer returns exactly the bytes past that point.
  const from = sess.base + 1000;
  let frame = '';
  srv.replay(sess, { write: (s) => { frame += s; } }, from);
  const payload = Buffer.from(frame.replace(/^event: out\ndata: /, '').trim(), 'base64');
  assert.equal(payload.length, sess.offset - from, 'replay length matches the gap exactly');
});

// ---- end to end, against a real shell over real HTTP

const TOKEN = 'test-token-for-the-suite';

async function withServer(fn) {
  const port = 7900 + Math.floor(Math.random() * 90);
  const proc = spawn(process.execPath, [SERVER, `--port=${port}`, `--token=${TOKEN}`, '--idle=2'], { stdio: 'pipe' });
  const base = `http://127.0.0.1:${port}`;
  try {
    await waitFor(async () => (await fetch(`${base}/?t=${TOKEN}`)).ok);
    await fn(base);
  } finally {
    proc.kill();
  }
}

async function waitFor(check, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try { if (await check()) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server never came up');
}

const auth = { 'x-term-token': TOKEN };

// Node's fetch silently drops a Host header, so the DNS-rebinding guard needs a raw
// request to be exercised at all.
function statusWithHost(base, host) {
  const url = new URL(`${base}/?t=${TOKEN}`);
  return new Promise((resolve, reject) => {
    const req = require('node:http').request(
      { host: url.hostname, port: url.port, path: url.pathname + url.search, headers: { host } },
      (res) => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
}

// The browser client, in miniature: read SSE frames, decode the base64 payloads, and
// keep an exact count of rendered bytes so a reconnect can ask for precisely the gap.
async function readStream(base, id, from, ms) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), ms);
  const res = await fetch(`${base}/api/stream?id=${id}&from=${from}`, { headers: auth, signal: stop.signal });
  assert.ok(res.ok, `stream returned ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let text = '';
  let rendered = from;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let cut;
      while ((cut = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        if (!frame.startsWith('event: out')) continue;
        const bytes = Buffer.from(frame.slice(frame.indexOf('data: ') + 6), 'base64');
        rendered += bytes.length;
        text += bytes.toString('utf8');
      }
    }
  } catch { /* aborted on purpose */ }
  clearTimeout(timer);
  return { text, rendered };
}

const type = (base, id, s) => fetch(`${base}/api/input?id=${id}`, { method: 'POST', headers: auth, body: s });

test('an unauthenticated request never reaches a shell', { skip: WIN && 'posix shell' }, async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/`)).status, 401);
    assert.equal((await fetch(`${base}/?t=wrong`)).status, 401);
    // A token of the wrong length must be rejected, not throw inside the comparison.
    assert.equal((await fetch(`${base}/?t=${'a'.repeat(200)}`)).status, 401);
    assert.equal((await fetch(`${base}/api/session`, { method: 'POST' })).status, 401);
    // fetch() refuses to set Host, so this one goes out over a raw request.
    assert.equal(await statusWithHost(base, 'evil.example.com'), 421);
    assert.equal(await statusWithHost(base, '127.0.0.1'), 200, 'the address the iPad dials still works');
  });
});

test('a backgrounded iPad loses no output and re-reads none', { skip: WIN && 'posix shell' }, async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/session`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ cols: 80, rows: 24 }),
    });
    const { id, mode } = await res.json();
    assert.ok(id);

    // Connection one: run something, then let the socket drop mid-session.
    await type(base, id, 'echo BEFORE-DROP\n');
    const first = await readStream(base, id, 0, 1200);
    assert.match(first.text, /BEFORE-DROP/);

    // Safari is suspended here. The shell keeps working and keeps producing output.
    await type(base, id, 'echo WHILE-AWAY\n');
    await new Promise((r) => setTimeout(r, 600));

    // Connection two asks for exactly what it has not rendered.
    await type(base, id, 'echo AFTER-RECONNECT\n');
    const second = await readStream(base, id, first.rendered, 1200);
    assert.match(second.text, /WHILE-AWAY/, 'output produced while away was replayed');
    assert.match(second.text, /AFTER-RECONNECT/, 'the session is live again');
    assert.ok(!second.text.includes('BEFORE-DROP'), 'already-rendered output was not repeated');
    if (mode === 'pty') assert.equal((await fetch(`${base}/api/resize?id=${id}&cols=120&rows=40`, { method: 'POST', headers: auth })).status, 204);
  });
});

test('a shell nobody is watching is reaped, not left running', { skip: WIN && 'posix shell' }, async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/session`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' },
      body: JSON.stringify({ cols: 80, rows: 24 }),
    });
    const { id } = await res.json();
    // --idle=2 above: still there right after the drop, gone once the window passes.
    assert.equal((await type(base, id, '')).status, 204);
    await new Promise((r) => setTimeout(r, 3500));
    assert.equal((await type(base, id, 'echo late\n')).status, 404);
  });
});

test('a bogus session id is a 404, not a crash', { skip: WIN && 'posix shell' }, async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/api/input?id=nope`, { method: 'POST', headers: auth, body: 'x' })).status, 404);
    assert.equal((await fetch(`${base}/api/stream?id=nope`, { headers: auth })).status, 404);
    assert.equal((await fetch(`${base}/nope`, { headers: auth })).status, 404);
  });
});
