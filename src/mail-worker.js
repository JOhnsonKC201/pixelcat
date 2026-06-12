// Forked IMAP worker. Receives { host, port, user, pass, secure } once over the
// process channel, connects, counts unseen messages in INBOX, reports back, and
// exits. Runs in its own process so a hung socket or library crash can never
// freeze the overlay. The password is used in-memory only - never logged.
const { ImapFlow } = require('imapflow');

function classify(e) {
  const m = String((e && e.message) || e || '').toLowerCase();
  if (m.includes('auth') || m.includes('credential') || m.includes('login') || m.includes('password')) {
    return 'Authentication failed - check your email and app-password.';
  }
  if (m.includes('timeout') || m.includes('timed out')) return 'Connection timed out - check host and port.';
  if (m.includes('enotfound') || m.includes('getaddrinfo') || m.includes('econnrefused') || m.includes('ehostunreach')) {
    return 'Could not reach the mail server - check host and port.';
  }
  if (m.includes('certificate') || m.includes('self-signed') || m.includes('tls')) return 'TLS/certificate problem connecting to the server.';
  return 'Could not connect to the mailbox.';
}

process.once('message', async (creds) => {
  const send = (m) => { try { process.send(m); } catch (e) { /* parent gone */ } };
  let client = null;
  try {
    client = new ImapFlow({
      host: String((creds && creds.host) || ''),
      port: Number(creds && creds.port) || 993,
      secure: !creds || creds.secure !== false,
      auth: { user: String((creds && creds.user) || ''), pass: String((creds && creds.pass) || '') },
      logger: false,
      emitLogs: false,
    });
    await client.connect();
    const status = await client.status('INBOX', { unseen: true });
    send({ ok: true, unread: (status && status.unseen) | 0 });
  } catch (e) {
    send({ ok: false, error: classify(e) });
  } finally {
    try { if (client) await client.logout(); } catch (e) { /* ignore */ }
    process.exit(0);
  }
});

// Safety: if no creds arrive, don't hang forever.
setTimeout(() => process.exit(0), 30000);
