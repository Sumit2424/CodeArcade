# Architecture

Code Arcade is two programs that talk through a small, validated message channel, plus a small pipeline that turns coding-assistant events into a game-friendly state.

```
 VS Code extension host (Node.js)                      Webview (browser sandbox)
 ───────────────────────────────                       ─────────────────────────
 extension.ts  commands, activation                    main.tsx / App.tsx   React UI
 panel.ts      creates the panel, routes messages ───► hooks/useHost.ts     receives state
 score-store   best scores (globalState)          ◄─── host.ts              posts messages
 settings.ts   reads codeArcade.* settings             hooks/useGameRunner  owns the game loop
 session-*     assistant state machine                 games/*              Snake, ...
 adapters/*    IDE / assistant integrations
        ▲
        │ events (AssistantEvent)
 ~/.code-arcade/events.jsonl  ◄── hook.js ◄── Claude Code hooks
```

The extension host can use the VS Code API but cannot draw. The webview can draw (React, canvas) but cannot use the VS Code API. Games therefore live in the webview, and everything that needs VS Code or the file system lives in the host.

## Layers and dependency rules

| Folder          | Responsibility                                                                      | May import                                            |
| --------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `src/shared`    | Message contracts and validators, event and session types, score and settings types | nothing from other layers                             |
| `src/games`     | Game contract, engine (loop, input, canvas), and the games                          | `shared`                                              |
| `src/webview`   | React UI                                                                            | `shared`, `games` (never `extension`, never `vscode`) |
| `src/extension` | VS Code integration, storage, adapters                                              | `shared` (never `webview`, never `games`)             |

These rules are enforced by ESLint (`no-restricted-imports` in `eslint.config.mjs`), so a violation fails `npm run lint` and CI. They exist so that:

- a new game never needs to touch the extension host,
- a new IDE adapter never needs to touch the games or the UI,
- the games stay testable plain TypeScript.

## The message channel

`src/shared/messages.ts` is the only contract between host and webview.

| Direction      | Message             | Purpose                                      |
| -------------- | ------------------- | -------------------------------------------- |
| webview → host | `ready`             | The UI is listening; send the current state  |
| webview → host | `scoreSubmitted`    | A run ended with this score                  |
| webview → host | `enableIntegration` | The user clicked the Enable card             |
| host → webview | `hello`             | Extension version                            |
| host → webview | `settings`          | Current `codeArcade.*` settings              |
| host → webview | `scores`            | Best scores                                  |
| host → webview | `integration`       | Whether the Claude Code hooks are installed  |
| host → webview | `sessionState`      | `idle`, `working`, `attention` or `finished` |

Every incoming message passes a `parse…` function that checks each field and drops anything unexpected. Stored data (scores) is re-validated whenever it is read.

## The session pipeline

```
Claude Code hook  →  hook.js  →  events.jsonl  →  EventTail  →  event-mapper
                                                                     │ AssistantEvent
                       webview ◄── sessionState ◄── SessionTracker ◄─┘
```

1. **Hook script** (`adapters/claude-code/hook.ts`, bundled to `dist/hook.js`). Run by Claude Code for each lifecycle event. Writes one minimal JSON line and exits. It keeps only the event name, tool name, session id and working folder.
2. **Event tail** (`event-tail.ts`). Polls the event file (a 250 ms `stat` is cheaper and more reliable across platforms than file watchers) and reports complete new lines.
3. **Mapper** (`event-mapper.ts`). Turns a hook record into a conceptual `AssistantEvent` (`turnStarted`, `working`, `attentionNeeded`, `turnFinished`, `error`, `sessionEnded`), or ignores it. Only events we can interpret reliably are mapped.
4. **Workspace filter** (`workspace-filter.ts`). The event file is shared by every VS Code window, so each window keeps only sessions whose working folder belongs to it.
5. **Session tracker** (`session-tracker.ts`). The state machine. Tool events only keep the state alive; they never pause the game. See [claude-code-integration.md](claude-code-integration.md) for the rules.
6. The panel forwards state changes to the webview, which pauses the game according to the user's settings.

### Adapters

`src/extension/adapters/adapter.ts` defines the contract for connecting a coding assistant:

```ts
interface IdeAdapter {
  readonly id: string;
  readonly displayName: string;
  start(listener: (event: AssistantEvent) => void): vscode.Disposable;
}
```

An adapter reports only the events it can reliably detect; it never controls the assistant or its UI. To add one, create `adapters/<name>/`, implement `IdeAdapter`, and create it where `ClaudeCodeIntegration.createAdapter()` is used in `panel.ts`. Nothing in `games`, `webview` or the state machine changes.

## Key decisions

- **File-based event transport instead of a local server.** A server needs a port that changes between runs (so the configured hook would go stale), plus a listening socket to secure. A file in the home folder has neither problem and works across window reloads.
- **Hook script installed to a stable path.** The extension folder changes with every update, so the script is copied to `~/.code-arcade/hook.js` and refreshed on activation.
- **No auto-resume.** After Claude needs you or finishes, the game stays paused. Your keyboard focus is normally in Claude's chat then, so an auto-resumed game would run unattended.
- **Pause on state changes only.** A user who resumes manually is not paused again until the next change.
- **Native VS Code settings.** No custom settings UI; users get the standard Settings editor and `settings.json`.
- **Fixed-timestep engine.** Games update in 1/60 s steps, so speed does not depend on the display's refresh rate.
- **Games are bundled code, not plugins.** Nothing is loaded dynamically, which keeps the security model simple: contributions arrive as reviewed pull requests.

## License

MIT. It is short, permissive, widely understood and matches the licenses of the dependencies (React, Vite, esbuild, TypeScript and others are MIT-licensed), which keeps the project easy to adopt and contribute to.
