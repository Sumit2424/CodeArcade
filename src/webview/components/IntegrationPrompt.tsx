import { postToHost } from '../host';

/** Offered while the Claude Code hooks are not installed. */
export function IntegrationPrompt() {
  return (
    <aside className="integration-prompt">
      <div>
        <strong>Pause automatically when Claude needs you</strong>
        <p className="muted">
          Connect Claude Code so the game pauses on permission requests and when Claude finishes.
        </p>
      </div>
      <button
        className="primary-button"
        type="button"
        onClick={() => postToHost({ type: 'enableIntegration' })}
      >
        Enable
      </button>
    </aside>
  );
}
