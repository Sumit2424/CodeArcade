# Code Arcade

Play a quick game in a VS Code panel while your AI coding assistant works, without losing sight of the assistant itself.

Code Arcade opens in the main editor area, so Claude's panel stays in view next to it. With the optional Claude Code integration enabled, it knows when Claude is working, when it needs you (for example a permission request) and when it has finished, and pauses the game accordingly. It never touches Claude's interface or its approval prompts.

<!-- TODO: add a screenshot or GIF of the launcher here -->
<!-- TODO: add a GIF of the game pausing when Claude asks for permission -->

> **Status: early preview (0.1.0).** See [What works today](#what-works-today) for exactly what has been tested.

## Features

- **Snake**, fully playable, with speed that increases as you eat.
- **Game launcher** with a dark UI and a small game contract for adding more games.
- **Local best scores** per game, kept in VS Code's own extension storage.
- **Always-visible Claude status** strip (working, needs you, question, finished, stopped) with a timer, plus a status bar entry that turns amber when Claude is waiting for you.
- **Auto-pause** when the panel loses focus, when Claude needs you or asks a question, and when a turn ends (each can be turned off).
- **Claude Code integration** (opt-in, reversible) using Claude Code's lifecycle hooks.
- **No accounts, no backend, no network requests, no telemetry.**

## What works today

| Area                                                                                                   | Status                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Snake, pause/resume, game over, restart                                                                | Built. Game rules were checked with simulated scenarios; play-feel needs your judgement.                                       |
| Best scores and settings                                                                               | Built. Validation and storage logic checked in simulation.                                                                     |
| Claude Code hooks → game state                                                                         | Checked with real headless Claude Code runs (v2.1.287, Windows): the events fire, are mapped and drive the state machine.      |
| Behavior inside interactive VS Code (permission dialog on screen, approving or denying, Esc interrupt) | **Not yet verified.** Use _Code Arcade: Show Log_ to see what your setup reports, and please open an issue with your findings. |
| Automated unit tests                                                                                   | The session state machine and hook mapper are covered. Game rules and UI are not yet.                                          |
| Dino Runner, Cursor and standalone-app support                                                         | Not built. See the [roadmap](#roadmap).                                                                                        |

## Quick start (from source)

Requirements: Node.js 22 or newer and VS Code 1.90 or newer.

```bash
git clone <your-fork-or-this-repo-url>
cd code-arcade
npm ci
code .
```

Press **F5**. A second VS Code window (the Extension Development Host) opens. In it, open the command palette and run **Code Arcade: Open Game Panel**.

## Install the packaged extension

```bash
npm ci
npm run package        # produces code-arcade-<version>.vsix
code --install-extension code-arcade-0.1.0.vsix
```

## Supported editors

Code Arcade is built on the VS Code extension API, so it runs in VS Code and in editors based on it, such as Cursor, Windsurf and VSCodium (the last three install from [Open VSX](https://open-vsx.org) once the extension is published there). Editors with a different extension system, such as JetBrains IDEs, are not supported yet. The Claude Code integration has been checked in VS Code; other editors may need the [adapters](#roadmap) described below.

## Using it

| Control           | Action                      |
| ----------------- | --------------------------- |
| Arrow keys / WASD | Move                        |
| Space / Enter     | Start, resume or play again |
| P / Esc           | Pause or resume             |

The game pauses automatically when the panel loses focus. After Claude needs you or finishes, the game stays paused until you press Space. It deliberately does not resume by itself: your keyboard focus is usually in Claude's chat at that moment, so an unattended game would just crash.

### Commands

| Command                                      | What it does                                |
| -------------------------------------------- | ------------------------------------------- |
| Code Arcade: Open Game Panel                 | Opens the game in the main editor area      |
| Code Arcade: Enable Claude Code Integration  | Installs the Claude Code hooks (asks first) |
| Code Arcade: Disable Claude Code Integration | Removes only Code Arcade's hooks            |
| Code Arcade: Show Log                        | Shows the events the extension received     |
| Code Arcade: Reset Scores                    | Clears saved scores (asks first)            |

### Settings

| Setting                                     | Default | Effect                                                           |
| ------------------------------------------- | ------- | ---------------------------------------------------------------- |
| `codeArcade.openWhenClaudeStarts`           | on      | Open the panel when Claude starts working, without taking focus  |
| `codeArcade.pauseWhenPanelLosesFocus`       | on      | Pause when the panel loses focus or is hidden                    |
| `codeArcade.pauseWhenClaudeNeedsAttention`  | on      | Pause when Claude needs you                                      |
| `codeArcade.pauseWhenClaudeFinishes`        | on      | Pause when Claude finishes its turn                              |
| `codeArcade.notifyWhenClaudeNeedsAttention` | on      | Show a notification if you are in the game when Claude needs you |

## Claude Code integration

Claude Code can run a command when lifecycle events happen ([hooks](https://code.claude.com/docs/en/hooks)). Code Arcade registers a tiny observer for a handful of them:

- It adds hook entries to your Claude Code `settings.json` (the confirmation dialog shows the exact file) and saves a one-time backup next to it.
- Each hook runs `~/.code-arcade/hook.js`, which appends the **event name, tool name, session id and working folder** to `~/.code-arcade/events.jsonl`.
- **Your prompts, code, tool inputs and outputs, and Claude's replies are never read or stored.**
- The hooks only observe. They cannot approve, deny or change anything, and they do not interact with Claude's permission prompts.
- _Disable_ removes only Code Arcade's entries.

Requirements: Node.js must be on your `PATH`, because Claude Code runs the hook with `node`.

Details, the event mapping and known limitations are in [docs/claude-code-integration.md](docs/claude-code-integration.md).

## Project structure

```
src/
  shared/      message and event contracts (imports nothing from the other layers)
  games/       game contract, engine (loop, input, canvas) and the games themselves
  extension/   VS Code side: panel, commands, storage, settings, adapters/
  webview/     React UI that runs inside the panel
docs/          architecture, adding a game, Claude Code integration
```

The layers are kept apart by ESLint import rules. Read [docs/architecture.md](docs/architecture.md) for the details.

## Contributing

Contributions are welcome, especially new games and IDE adapters. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/adding-a-game.md](docs/adding-a-game.md).

## Roadmap

- [ ] Verify and refine behavior in interactive VS Code (permission approve/deny, interrupts)
- [ ] Dino Runner
- [ ] Unit tests for the game rules (the session state machine is covered)
- [ ] More games
- [ ] Marketplace and Open VSX publishing
- [ ] Adapters for other environments (Cursor, standalone Claude Code app) where it is technically possible
- [ ] A floating window outside the IDE (needs a separate desktop app; a VS Code webview cannot do this)

## Security and privacy

See [SECURITY.md](SECURITY.md). In short: no network requests, scores stay on your machine, the webview has a strict Content Security Policy, and all messages between the extension and the webview are validated.

## License

[MIT](LICENSE). The choice is documented in [docs/architecture.md](docs/architecture.md#license).
