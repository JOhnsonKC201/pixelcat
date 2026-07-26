# Security Policy

pixelcat runs as a desktop overlay with a global keyboard hook, and it can optionally hold an IMAP app-password (encrypted at rest via Electron `safeStorage`) and fetch a calendar URL. Security reports are taken seriously.

## Supported versions

Only the [latest release](https://github.com/JOhnsonKC201/pixelcat/releases/latest) is supported.

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/JOhnsonKC201/pixelcat/security/advisories/new) rather than a public issue, so a fix can ship before details are public. Include steps to reproduce and what an attacker gains. You should hear back within a week.

## What is already in place

- Renderer runs with context isolation and a sandbox; IPC handlers validate the sender.
- The keyboard/cursor hooks only detect activity locally; keystrokes are never logged, stored, or sent anywhere.
- Mail and calendar fetching run in isolated worker processes; the calendar fetcher pins DNS results to block rebinding and refuses private/loopback/metadata addresses.
- The IMAP app-password is stored OS-encrypted, never in `settings.json`.
