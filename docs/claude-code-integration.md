# Claude Code integration

Claude Code can run a command when lifecycle events happen ([hooks documentation](https://code.claude.com/docs/en/hooks)). Code Arcade uses that to know what Claude is doing. It is opt-in, observation-only and reversible.

> A hook script is not a way to control Claude's interface, and Code Arcade does not try to. It cannot show, hide or answer Claude's permission prompts, and it does not scrape the screen. You always respond to Claude in Claude's own panel.

## What is installed

**Enable Claude Code Integration** (after a confirmation dialog that names every path) does three things:

1. Copies `dist/hook.js` to `~/.code-arcade/hook.js`, a stable location that survives extension updates.
2. Saves a one-time backup of Claude Code's `settings.json` as `settings.json.code-arcade.bak`.
3. Adds hook entries to `settings.json` that run `node "<home>/.code-arcade/hook.js"` for these events: `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Stop`, `StopFailure`, `SessionEnd`. They are marked `async`, so they never block Claude.

The settings file used is `$CLAUDE_CONFIG_DIR/settings.json` if that variable is set, otherwise `~/.claude/settings.json`.

**Disable** removes only Code Arcade's entries (recognized by the `.code-arcade/hook.js` path) and leaves every other setting and hook untouched. If the settings file cannot be parsed, or its `hooks` section has an unexpected shape, Code Arcade refuses to modify it and says so.

Requirement: `node` must be on your `PATH`, since Claude Code runs the command through your shell.

## What is recorded

The hook receives the full event on stdin, which includes prompts, tool inputs and outputs and Claude's replies. **None of that is read.** It appends one line with these fields to `~/.code-arcade/events.jsonl`:

```json
{
  "ts": 1792344968220,
  "event": "PostToolUse",
  "session": "abc12345-…",
  "cwd": "C:\\work\\proj",
  "tool": "Bash"
}
```

Only the event name, session id, working folder and tool name are kept. The file is trimmed when it passes about 1 MB.

## How events become game state

| Hook event                                        | Assistant event   | Effect on state                                              |
| ------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `UserPromptSubmit`                                | `turnStarted`     | → `working`                                                  |
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure` | `working`         | → `working` (also ends `attention`); ignored once `finished` |
| `PermissionRequest`                               | `attentionNeeded` | → `attention`                                                |
| `Stop`                                            | `turnFinished`    | → `finished`                                                 |
| `StopFailure`                                     | `error`           | → `idle`                                                     |
| `SessionEnd`                                      | `sessionEnded`    | `finished` stays `finished`; anything else → `idle`          |

Rules that exist because of how hooks behave:

- **Tool events never pause the game.** They only keep `working` alive.
- **There is no "permission answered" event.** `attention` ends on the next event of any kind (typically the tool running after you approve), or manually when you press Space.
- **Stragglers are ignored.** Hooks run as separate processes, so the last tool event can be written after `Stop`; a tool event after `finished` does not revive `working`.
- **Silence expires.** `working` with no events for 2 minutes, or `attention` for 10 minutes, falls back to `idle`. This covers cases where no event is sent, such as an interrupt.
- **One state per window.** Events are filtered to the window's workspace folders, but two simultaneous conversations in the same folder share one state.

## What has been verified

Tested with Claude Code 2.1.287 on Windows, headless (`claude -p`) with the hooks supplied through a temporary `--settings` file:

| Event                                                                 | Observed                                                        |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SessionEnd` | Fire in the expected order                                      |
| `PermissionRequest`                                                   | Fires right after `PreToolUse` for a tool that needs permission |
| `PostToolUseFailure`, `StopFailure`                                   | Registered, **not observed** in testing                         |

Full pipeline (hook → file → mapper → state machine) was run against real sessions: a read-only task produced `working → finished`, and a task needing permission produced `working → attention → finished`.

**Not yet verified:** behavior in interactive VS Code, namely the permission dialog on screen, what happens after approving or denying, the Esc interrupt, whether hooks added mid-conversation apply to a running conversation (starting a new conversation is the safe option), and behavior in the standalone app.

Documentation and reality differed in places. For example, the documented `user_prompt`, `tool_output` and `end_reason` fields appeared as `prompt`, `tool_response` and `reason` in 2.1.287. That is one reason the hook trusts only `hook_event_name`, `session_id`, `cwd` and `tool_name`.

## Debugging

- Run **Code Arcade: Show Log**. Every event the extension receives is listed with how it was mapped, and every state change.
- If nothing appears: check that Node is on your `PATH`, start a new Claude Code conversation, and confirm the hooks exist in the settings file named in the confirmation dialog.
- The `CODE_ARCADE_DIR` environment variable moves the event file and hook script away from `~/.code-arcade` (useful for tests).

To reproduce the experiment without touching your real settings, generate a settings file with `addHooks` from `installer.ts`, then run `claude -p "<prompt>" --settings that-file.json` with `CODE_ARCADE_DIR` pointing at a temporary folder, and read the resulting `events.jsonl`.

## Adding another environment

Implement `IdeAdapter` (see [architecture.md](architecture.md#adapters)). Map only what the environment reliably exposes to `AssistantEvent`s, and document what you verified and what you did not, as above.
