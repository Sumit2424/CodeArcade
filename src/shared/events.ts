/**
 * Conceptual events a coding assistant can produce. These are not assumptions about what
 * every IDE exposes: each adapter maps only the events it can reliably detect.
 */
export type AssistantEvent =
  /** The user submitted a prompt, or the assistant started a turn on its own. */
  | { type: 'turnStarted' }
  /** The assistant is actively working (for example, running a tool). */
  | { type: 'working' }
  /** The assistant is blocked until the user acts (for example, a permission prompt). */
  | { type: 'attentionNeeded' }
  /** The turn completed normally. */
  | { type: 'turnFinished' }
  /** The turn ended abnormally. */
  | { type: 'error' }
  /** The coding session ended. */
  | { type: 'sessionEnded' };
