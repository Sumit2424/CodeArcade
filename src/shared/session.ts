/**
 * What the coding assistant is doing, as seen by the game.
 *
 * - idle:      no activity known (also the state when no integration is enabled)
 * - working:   a turn is in progress
 * - attention: the assistant needs the user to approve or deny something (a permission prompt)
 * - question:  the assistant is asking the user a question
 * - finished:  the last turn completed
 * - stopped:   the last turn ended with an error
 */
export const SESSION_STATES = [
  'idle',
  'working',
  'attention',
  'question',
  'finished',
  'stopped',
] as const;

export type SessionState = (typeof SESSION_STATES)[number];
