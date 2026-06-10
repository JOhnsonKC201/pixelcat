// Forked calendar worker. Receives { url } once, fetches + parses the .ics feed
// (node-ical), and reports upcoming events within a ~26h window back to the parent,
// then exits. Runs in its own process so a slow/large feed can't stall the overlay.
// The .ics URL is a secret (it grants read access to the calendar) — never logged.
function classify(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  if (m.includes('enotfound') || m.includes('getaddrinfo') || m.includes('econnrefused')) return 'Could not reach the calendar URL.';
  if (m.includes('timeout') || m.includes('timed out')) return 'The calendar took too long to load.';
  if (m.includes('404') || m.includes('403') || m.includes('401')) return 'The calendar URL was rejected (check the secret address).';
  return 'Could not read the calendar feed.';
}

process.once('message', async (msg) => {
  const send = (m) => { try { process.send(m); } catch (e) { /* parent gone */ } };
  try {
    const url = String((msg && msg.url) || '');
    if (!url) { send({ ok: false, error: 'No calendar URL.' }); process.exit(0); return; }
    const ical = require('node-ical');
    const data = await ical.async.fromURL(url);
    const now = Date.now();
    const horizon = now + 26 * 3600 * 1000;
    const floor = now - 60 * 1000;   // allow a 1-min grace for just-passed leads
    const out = [];
    for (const k in data) {
      const ev = data[k];
      if (!ev || ev.type !== 'VEVENT') continue;
      const summary = String(ev.summary || 'Event').slice(0, 80);
      const uid = String(ev.uid || k);
      if (ev.rrule) {
        let occ = [];
        try { occ = ev.rrule.between(new Date(floor), new Date(horizon), true) || []; } catch (e) { occ = []; }
        for (const d of occ) {
          const t = d.getTime();
          if (t >= floor && t <= horizon) out.push({ uid: uid + ':' + t, start: t, summary });
        }
      } else if (ev.start) {
        const t = new Date(ev.start).getTime();
        if (Number.isFinite(t) && t >= floor && t <= horizon) out.push({ uid, start: t, summary });
      }
    }
    out.sort((a, b) => a.start - b.start);
    send({ ok: true, events: out.slice(0, 100) });
  } catch (e) {
    send({ ok: false, error: classify(e) });
  } finally {
    process.exit(0);
  }
});

// Safety: never hang if no message arrives.
setTimeout(() => process.exit(0), 30000);
