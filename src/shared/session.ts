/**
 * What the coding assistant is doing, as seen by the game.
 *
 * - idle:      no activity known (also the state when no integration is enabled)
 * - working:   a turn is in progress
 * - attention: the assistant needs the user (e.g. a permission prompt)
 * - finished:  the last turn completed
 */
export const SESSION_STATES = ['idle', 'working', 'attention', 'finished'] as const;

export type SessionState = (typeof SESSION_STATES)[number];
