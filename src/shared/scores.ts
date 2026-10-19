export interface GameScore {
  readonly best: number;
  /** Number of finished runs. */
  readonly plays: number;
}

/** Scores keyed by game id. */
export type ScoreMap = Readonly<Record<string, GameScore>>;

export const MAX_SCORE = 1_000_000;
export const MAX_TRACKED_GAMES = 50;

const GAME_ID_PATTERN = /^[a-z0-9-]{1,32}$/;
const MAX_PLAYS = 1_000_000_000;

export function isValidGameId(value: unknown): value is string {
  return typeof value === 'string' && GAME_ID_PATTERN.test(value);
}

export function isValidScore(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SCORE;
}

/**
 * Keeps only well-formed entries from untrusted data (stored state or a message),
 * so corrupted or hand-edited data can never break the UI.
 */
export function sanitizeScores(raw: unknown): ScoreMap {
  const result: Record<string, GameScore> = {};
  if (typeof raw !== 'object' || raw === null) return result;

  for (const [gameId, entry] of Object.entries(raw)) {
    if (Object.keys(result).length >= MAX_TRACKED_GAMES) break;
    if (!isValidGameId(gameId) || typeof entry !== 'object' || entry === null) continue;
    const { best, plays } = entry as Record<string, unknown>;
    if (isValidScore(best) && Number.isInteger(plays) && (plays as number) >= 0) {
      result[gameId] = { best, plays: Math.min(plays as number, MAX_PLAYS) };
    }
  }
  return result;
}

export function bestScore(scores: ScoreMap, gameId: string): number {
  return Object.hasOwn(scores, gameId) ? (scores[gameId]?.best ?? 0) : 0;
}
