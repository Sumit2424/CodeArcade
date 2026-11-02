import * as vscode from 'vscode';
import type { SessionState } from '../shared/session';
import type { IdeAdapter } from './adapters/adapter';
import type { Logger } from './log';
import { SessionTracker } from './session-tracker';

/**
 * Connects an adapter's events to the session state machine and reports state changes.
 * Listening can be switched on and off, because it only makes sense while the integration
 * is installed.
 */
export class SessionController implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<SessionState>();
  readonly onDidChange = this.changed.event;

  private tracker: SessionTracker;
  private subscription: vscode.Disposable | undefined;

  constructor(
    private readonly adapter: IdeAdapter,
    private readonly log: Logger,
  ) {
    this.tracker = this.createTracker();
  }

  get state(): SessionState {
    return this.tracker.state;
  }

  get listening(): boolean {
    return this.subscription !== undefined;
  }

  /** Starts or stops reading events. Stopping returns the session to idle. */
  setListening(on: boolean): void {
    if (on === this.listening) return;
    if (on) {
      this.subscription = this.adapter.start((event) => this.tracker.handle(event));
      this.log(`Listening for ${this.adapter.displayName} events.`);
      return;
    }
    this.subscription?.dispose();
    this.subscription = undefined;
    const wasIdle = this.tracker.state === 'idle';
    this.tracker.dispose();
    this.tracker = this.createTracker();
    if (!wasIdle) this.changed.fire('idle');
    this.log(`Stopped listening for ${this.adapter.displayName} events.`);
  }

  dispose(): void {
    this.subscription?.dispose();
    this.subscription = undefined;
    this.tracker.dispose();
    this.changed.dispose();
  }

  private createTracker(): SessionTracker {
    return new SessionTracker((state) => {
      this.log(`session state -> ${state}`);
      this.changed.fire(state);
    });
  }
}
