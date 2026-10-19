# Contributing to Code Arcade

Thanks for helping. This project is small on purpose: keep changes focused and easy to review.

## Ways to contribute

- **Add a game.** Follow [docs/adding-a-game.md](docs/adding-a-game.md).
- **Report what the Claude Code integration does on your setup** (interactive VS Code, other OS). Attach the output of _Code Arcade: Show Log_.
- **Add an adapter** for another IDE or assistant. See "Adapters" in [docs/architecture.md](docs/architecture.md).
- **Write tests.** Vitest is configured, but there are few tests so far. The game rules and the session state machine are good places to start.
- Fix bugs and improve the docs.

For anything larger than a small fix, please open an issue first so we can agree on the approach.

## Development setup

Requirements: Node.js 22+ and VS Code 1.90+.

```bash
npm ci
code .        # then press F5 to launch the Extension Development Host
```

| Script              | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `npm run build`     | Build the extension (esbuild) and the webview (Vite) into `dist/`    |
| `npm run dev:web`   | Serve the webview in a browser for quick UI work (no VS Code needed) |
| `npm run lint`      | ESLint, including the import-boundary rules                          |
| `npm run typecheck` | TypeScript, strict mode                                              |
| `npm test`          | Vitest                                                               |
| `npm run format`    | Prettier                                                             |
| `npm run check`     | Lint, typecheck, test and build in one go                            |
| `npm run package`   | Build a `.vsix`                                                      |

After changing code, press `Ctrl+R` in the Extension Development Host to reload it (run `npm run build` first).

In the browser preview (`npm run dev:web`) there is no extension host. The UI answers locally, and you can run `simulateSession('attention')` in the console (also `'working'`, `'finished'`, `'idle'`) to see how it reacts.

## Code guidelines

- **Respect the layer boundaries** (enforced by `npm run lint`). Notably, `shared` imports nothing from the other layers, `games` never import `vscode`, and `extension` and `webview` never import each other. They communicate only through the validated messages in `src/shared/messages.ts`.
- **Treat every message as untrusted.** New message types need a parser that validates every field.
- **Keep files small and focused**, with one clear responsibility.
- **No new dependencies without discussion.** The extension ships no runtime dependencies; keep it that way.
- **No network access, no telemetry, no collection of personal data.**
- **Games must be plain, self-contained TypeScript.** No dynamic code loading, no `eval`.
- Prefer clear names over comments, and add a comment only where the reason is not obvious.

## Before you open a pull request

1. `npm run check` passes.
2. You tried the change in the Extension Development Host (or the browser preview for UI-only changes).
3. The relevant docs and the README status table still say what is true.
4. The PR description says what changed, why, and how you tested it.

Keep commits focused. Conventional-style messages (`feat:`, `fix:`, `docs:`, `refactor:`) are appreciated.

## Manual test checklist

Until there is broader automated coverage, please run through this when your change touches the area:

- [ ] Panel opens beside the editor without taking keyboard focus; running the command again reuses it.
- [ ] A game starts, pauses (P, button, and by clicking away), resumes and restarts.
- [ ] Best score persists after closing the panel and reloading the window.
- [ ] With the integration enabled: the status pill and banner follow a real Claude Code turn, a permission prompt pauses the game, and _Disable_ removes the hooks cleanly.

## Code of conduct and security

Be kind: see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in public issues.

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
