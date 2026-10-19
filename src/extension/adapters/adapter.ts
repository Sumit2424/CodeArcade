import type * as vscode from 'vscode';
import type { AssistantEvent } from '../../shared/events';

/**
 * The contract for connecting a coding assistant (Claude Code, Cursor, ...) to the game.
 * An adapter reports only the events it can detect reliably; it never controls the
 * assistant or its UI.
 */
export interface IdeAdapter {
  readonly id: string;
  readonly displayName: string;
  /** Starts listening. Dispose the result to stop. */
  start(listener: (event: AssistantEvent) => void): vscode.Disposable;
}
