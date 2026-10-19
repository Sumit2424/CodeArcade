import * as vscode from 'vscode';
import { MAX_TRACKED_GAMES, sanitizeScores, type GameScore, type ScoreMap } from '../shared/scores';

const STORAGE_KEY = 'codeArcade.scores';

/** Best scores, kept in the extension's local storage. Nothing leaves the machine. */
export class ScoreStore {
  private readonly changed = new vscode.EventEmitter<ScoreMap>();
  readonly onDidChange = this.changed.event;

  constructor(private readonly storage: vscode.Memento) {}

  getAll(): ScoreMap {
    // Stored data is re-validated on every read in case it was corrupted or edited.
    return sanitizeScores(this.storage.get<unknown>(STORAGE_KEY));
  }

  async record(gameId: string, score: number): Promise<void> {
    const all: Record<string, GameScore> = { ...this.getAll() };
    const previous = Object.hasOwn(all, gameId) ? all[gameId] : undefined;
    if (!previous && Object.keys(all).length >= MAX_TRACKED_GAMES) return;

    all[gameId] = {
      best: Math.max(previous?.best ?? 0, score),
      plays: (previous?.plays ?? 0) + 1,
    };
    await this.storage.update(STORAGE_KEY, all);
    this.changed.fire(all);
  }

  async reset(): Promise<void> {
    await this.storage.update(STORAGE_KEY, undefined);
    this.changed.fire({});
  }

  dispose(): void {
    this.changed.dispose();
  }
}
