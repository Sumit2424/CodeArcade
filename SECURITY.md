# Security Policy

## Supported versions

Code Arcade is in early preview. Only the latest release receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report privately using GitHub's "Report a vulnerability" button on the repository's **Security** tab (private vulnerability reporting). <!-- TODO: enable private vulnerability reporting in the repository settings, or replace this line with a contact email. -->

Please include what you found, how to reproduce it, and the impact you expect. You can expect an acknowledgement within a few days. This is a volunteer project, so fix times vary, but security reports take priority.

## What the extension does and does not do

These are the properties we aim to keep, and the places where a bug would matter most:

- **No network access.** The extension makes no network requests and has no telemetry.
- **Local data only.** Scores are stored in VS Code's extension storage. The Claude Code integration writes minimal event records to `~/.code-arcade/events.jsonl`.
- **Minimal event records.** The hook script keeps only the event name, tool name, session id and working folder. It does not read or store prompts, code, tool inputs or outputs, or assistant replies.
- **Observation only.** The hooks cannot approve, deny or modify anything in Claude Code.
- **Safe settings changes.** Enabling the integration asks for confirmation, edits only Code Arcade's own hook entries in Claude Code's `settings.json`, refuses to touch files it cannot parse, and keeps a one-time backup.
- **Locked-down webview.** Strict Content Security Policy (`default-src 'none'`, scripts by nonce only), resources limited to `dist/webview`, and every message between the extension and the webview is validated.
- **No dynamic code.** Games are bundled TypeScript; nothing is loaded or evaluated at runtime.

Reports in these areas are especially welcome: the hook installer and the hook script, message validation, the webview CSP, and handling of the event file (which other local processes can write to).

## Known limitations

- The event file lives in your home folder and is writable by any process running as you. A local process could write fake events, which can only make the game pause or resume. It cannot affect Claude Code.
