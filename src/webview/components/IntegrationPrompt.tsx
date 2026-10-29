import { postToHost } from '../host';

/** Offered while the Claude Code hooks are not installed. */
export function IntegrationPrompt() {
  return (
    <aside className="integration-prompt">
      <div>
        <strong>Pause automatically when Claude needs you</strong>
        <p className="muted">
          Adds small Claude Code hooks that record only event names and tool names. Never your
          prompts or code. You can remove them any time.
        </p>
      </div>
      <button
        className="primary-button"
        type="button"
        onClick={() => postToHost({ type: 'enableIntegration' })}
      >
        Turn on
      </button>
    </aside>
  );
}
