# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Session strip that always shows what Claude is doing, with a timer.
- Status bar entry for Code Arcade that turns to the warning color when Claude needs you.
- `question` state, for when Claude asks you something, and `stopped` state, for a turn that ends with an error.
- Pause card that says why Claude paused the game, instead of covering the board.
- Unit tests for the session state machine and the hook event mapper.

### Changed

- The game panel opens in the main editor area so Claude's panel stays in view.
- A failed turn (`StopFailure`) now shows as `stopped` instead of `idle`.

## [0.0.1] - 2026-10-18

Initial preview.

### Added

- Game panel that opens beside the editor without taking focus.
- Snake, with queued turns, increasing speed and game over/restart.
- Game engine: fixed-timestep loop, keyboard mapping, pause/resume, HiDPI canvas.
- Local best scores and the `codeArcade.*` settings.
- Opt-in Claude Code integration: hook script, reversible installer, session state machine, status pill and banner, and an Output log.
- Strict webview Content Security Policy and validated host/webview messages.
