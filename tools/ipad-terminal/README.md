# ipad-terminal

A terminal for **this machine**, driven from an iPad.

```
npm run ipad:lan          # from the repo root
```

It prints a URL. Open it in Safari on the iPad. You get a real shell.

---

## What this is not

It is worth being blunt about the limit, because it is the whole reason this tool is
shaped the way it is.

**Nothing running on an iPad can control other iPad apps.** iPadOS sandboxes every app:
it cannot read another app's data, send it input, or drive its UI. Apple exposes no API
for it, and no terminal - this one or any on the App Store - can get around that. The
only sanctioned cross-app automation on an iPad is the **Shortcuts** app, and it only
reaches apps that publish App Intents.

So this does the thing that *is* possible: it puts a shell on the computer where a shell
is worth having, and lets the iPad be the screen and the keyboard.

## Running it

| | |
|---|---|
| `npm run ipad` | loopback only - this machine, for a smoke test |
| `npm run ipad:lan` | bound to `0.0.0.0`, so the iPad can reach it over your Wi-Fi |

Options: `--port=N` (default 7681), `--token=STR`, `--shell=PATH`, `--idle=SECONDS`,
`--allow-host=NAME`, `--help`.

A fresh random token is generated each run and baked into the printed URL. The page
strips it out of the address bar as soon as it loads, so it is not sitting in a
screenshot or a synced tab, and hands the tab a `SameSite=Strict` cookie for its own
stylesheet and script - the API itself never accepts that cookie.

On the iPad, **Share → Add to Home Screen** gives it an icon and a full-screen window
with no Safari chrome.

## Two modes

Run `npm install` in this directory to get the good one.

**Full tty** (with `node-pty` installed) - a real pty. `vim`, `top`, tab completion,
job control, Ctrl-C, colours, the works. The terminal's size is pushed to the shell, so
`tput cols` is honest.

**Line mode** (nothing installed) - the shell is spawned over pipes, so there is no tty.
The browser does the line editing and ships whole lines. Commands run and output comes
back; interactive full-screen programs do not work. This exists so the tool starts with
plain `node` on a fresh clone.

`npm install` here also vendors xterm.js locally. Without it the page pulls xterm from
jsdelivr with a pinned integrity hash - fine on a normal network, but install it if you
want the thing to work with no internet at all.

## Surviving an iPad

Safari suspends a backgrounded tab, which would ordinarily mean switching apps kills
whatever you were running. Two things prevent that:

- The shell outlives the connection by `--idle` seconds (default 120). Coming back
  inside that window resumes the *same* shell, not a new one.
- The client counts the bytes it has rendered and asks for exactly the gap on reconnect,
  so output produced while you were away is replayed and output you already read is not.

`tests/ipad-terminal.test.js` drives that path against a real shell over real HTTP.

## Long-running jobs

The shell outlives a dropped connection by `--idle` seconds and no longer. That is the
right behaviour for a terminal, and the wrong behaviour for a six-hour training run: put
the iPad down, and two minutes later the reaper kills the shell and the job goes with it.

So start anything long inside `tmux` (or `screen`):

```
tmux new -s train        # then run the job
# detach with ctrl-b d, close the iPad, come back later:
tmux attach -t train
```

A tmux session is not a child of the shell, so it survives the reaper, a Wi-Fi drop, and
restarting this server. Verified: a bare background job is killed with its shell once the
idle window passes; the same job inside tmux is untouched.

`--idle=86400` also works and is worse - it leaves an abandoned shell alive for a day.

## The key bar

The iPad soft keyboard has no Esc, no Tab, no Ctrl and no arrows, which is most of what
a shell is driven with. The row along the bottom puts them back. `ctrl` is sticky: tap
it, then the next letter becomes a control code.

## Security

This is a shell running as you. Take it as seriously as that sounds.

- The token is required on every request; ten bad ones and the caller is locked out for
  a minute.
- The `Host` header is checked, so a hostname that resolves to this box cannot be used
  to probe the port.
- `--lan` is the only thing that opens it to the network, and it is never the default.
- It is plain HTTP. That is fine on your own Wi-Fi and **not** fine anywhere else - to
  reach it from outside, put it behind a tunnel that terminates TLS (Tailscale,
  Cloudflare Tunnel, `ssh -L`) rather than forwarding a port on your router.
- Stop it with Ctrl-C when you are done. It is not a service; do not leave it running.
