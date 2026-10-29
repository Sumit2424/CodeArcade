import type { AssistantEvent } from '../shared/events';
import type { SessionState } from '../shared/session';

/** No events for this long while "working" means we have lost track (e.g. an interrupt). */
export const WORKING_STALE_MS = 2 * 60_000;
/** A permission prompt or question can legitimately wait a long time, but not forever. */
export const ATTENTION_STALE_MS = 10 * 60_000;

/** The pure transition rules. */
export function nextState(state: SessionState, event: AssistantEvent): SessionState {
  switch (event.type) {
    case 'turnStarted':
      return 'working';
    case 'working':
      // A tool event after "finished" or "stopped" is a late straggler: hooks run as separate
      // processes, so the last tool event can be written after Stop. A new turn starts with
      // turnStarted.
      return state === 'finished' || state === 'stopped' ? state : 'working';
    case 'attentionNeeded':
      return 'attention';
    case 'questionAsked':
      return 'question';
    case 'turnFinished':
      return 'finished';
    case 'sessionEnded':
      // Some environments end the session right after every turn. Keep "finished" and
      // "stopped" so the user still sees how the turn ended; end it only if it was cut short.
      return state === 'finished' || state === 'stopped' ? state : 'idle';
    case 'error':
      return 'stopped';
  }
}

/**
 * Tracks what the assistant is doing. Hooks give no "permission answered" or "interrupted"
 * signal, so "attention" and "question" end on the next event of any kind, and a stuck state
 * expires.
 */
export class SessionTracker {
  private current: SessionState = 'idle';
  private staleTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly onChange: (state: SessionState) => void,
    private readonly staleAfter = { working: WORKING_STALE_MS, attention: ATTENTION_STALE_MS },
  ) {}

  get state(): SessionState {
    return this.current;
  }

  handle(event: AssistantEvent): void {
    this.setState(nextState(this.current, event));
    this.armStaleTimer();
  }

  dispose(): void {
    this.clearStaleTimer();
  }

  private setState(next: SessionState): void {
    if (next === this.current) return;
    this.current = next;
    this.onChange(next);
  }

  /** Called after every event, so activity keeps pushing the expiry back. */
  private armStaleTimer(): void {
    this.clearStaleTimer();
    const delay =
      this.current === 'working'
        ? this.staleAfter.working
        : this.current === 'attention' || this.current === 'question'
          ? this.staleAfter.attention
          : undefined;
    if (delay === undefined) return;
    this.staleTimer = setTimeout(() => {
      this.staleTimer = undefined;
      this.setState('idle');
    }, delay);
  }

  private clearStaleTimer(): void {
    if (this.staleTimer) clearTimeout(this.staleTimer);
    this.staleTimer = undefined;
  }
}
