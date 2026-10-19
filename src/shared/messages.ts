import { isValidGameId, isValidScore, sanitizeScores, type ScoreMap } from './scores';
import { SESSION_STATES, type SessionState } from './session';
import type { Settings } from './settings';

/**
 * The only channel between the extension host and the webview.
 * Every incoming message is untrusted data and must pass a parse function
 * before use.
 */

export type HostToWebviewMessage =
  | { type: 'hello'; version: string }
  | { type: 'sessionState'; state: SessionState }
  /** Whether the Claude Code integration (hooks) is installed. */
  | { type: 'integration'; enabled: boolean }
  | { type: 'scores'; scores: ScoreMap }
  | { type: 'settings'; settings: Settings };

export type WebviewToHostMessage =
  | { type: 'ready' }
  | { type: 'enableIntegration' }
  | { type: 'scoreSubmitted'; gameId: string; score: number };

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isSessionState(value: unknown): value is SessionState {
  return SESSION_STATES.some((state) => state === value);
}

function parseSettings(value: unknown): Settings | undefined {
  if (!isRecord(value)) return undefined;
  const { pauseWhenPanelLosesFocus, pauseWhenClaudeNeedsAttention, pauseWhenClaudeFinishes } =
    value;
  if (
    typeof pauseWhenPanelLosesFocus !== 'boolean' ||
    typeof pauseWhenClaudeNeedsAttention !== 'boolean' ||
    typeof pauseWhenClaudeFinishes !== 'boolean'
  ) {
    return undefined;
  }
  return { pauseWhenPanelLosesFocus, pauseWhenClaudeNeedsAttention, pauseWhenClaudeFinishes };
}

/** Returns the message if it is well-formed, otherwise undefined. */
export function parseHostMessage(data: unknown): HostToWebviewMessage | undefined {
  if (!isRecord(data)) return undefined;
  switch (data.type) {
    case 'hello':
      return typeof data.version === 'string' && data.version.length <= 32
        ? { type: 'hello', version: data.version }
        : undefined;
    case 'sessionState':
      return isSessionState(data.state) ? { type: 'sessionState', state: data.state } : undefined;
    case 'integration':
      return typeof data.enabled === 'boolean'
        ? { type: 'integration', enabled: data.enabled }
        : undefined;
    case 'scores':
      return { type: 'scores', scores: sanitizeScores(data.scores) };
    case 'settings': {
      const settings = parseSettings(data.settings);
      return settings ? { type: 'settings', settings } : undefined;
    }
    default:
      return undefined;
  }
}

/** Returns the message if it is well-formed, otherwise undefined. */
export function parseWebviewMessage(data: unknown): WebviewToHostMessage | undefined {
  if (!isRecord(data)) return undefined;
  switch (data.type) {
    case 'ready':
      return { type: 'ready' };
    case 'enableIntegration':
      return { type: 'enableIntegration' };
    case 'scoreSubmitted':
      return isValidGameId(data.gameId) && isValidScore(data.score)
        ? { type: 'scoreSubmitted', gameId: data.gameId, score: data.score }
        : undefined;
    default:
      return undefined;
  }
}
