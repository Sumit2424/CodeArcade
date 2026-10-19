import * as vscode from 'vscode';
import type { SessionState } from '../shared/session';
import type { IdeAdapter } from './adapters/adapter';
import type { Logger } from './log';
import { SessionTracker } from './session-tracker';

/** Connects an adapter's events to the session state machine and reports state changes. */
export class SessionController implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<SessionState>();
  readonly onDidChange = this.changed.event;

  private readonly tracker: SessionTracker;
  private readonly subscription: vscode.Disposable;

  constructor(adapter: IdeAdapter, log: Logger) {
    this.tracker = new SessionTracker((state) => {
      log(`session state -> ${state}`);
      this.changed.fire(state);
    });
    this.subscription = adapter.start((event) => this.tracker.handle(event));
    log(`Listening for ${adapter.displayName} events.`);
  }

  get state(): SessionState {
    return this.tracker.state;
  }

  dispose(): void {
    this.subscription.dispose();
    this.tracker.dispose();
    this.changed.dispose();
  }
}
