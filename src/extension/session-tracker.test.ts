import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssistantEvent } from '../shared/events';
import type { SessionState } from '../shared/session';
import { nextState, SessionTracker } from './session-tracker';

const run = (state: SessionState, ...events: AssistantEvent['type'][]): SessionState =>
  events.reduce<SessionState>((current, type) => nextState(current, { type }), state);

describe('nextState', () => {
  it('follows a normal turn', () => {
    expect(run('idle', 'turnStarted')).toBe('working');
    expect(run('idle', 'turnStarted', 'working', 'turnFinished')).toBe('finished');
  });

  it('moves to attention and back to working on the next event', () => {
    expect(run('working', 'attentionNeeded')).toBe('attention');
    expect(run('attention', 'working')).toBe('working');
  });

  it('moves to question and back to working on the next event', () => {
    expect(run('working', 'questionAsked')).toBe('question');
    expect(run('question', 'working')).toBe('working');
  });

  it('ends in stopped when the turn fails', () => {
    expect(run('working', 'error')).toBe('stopped');
  });

  it('ignores late tool events once the turn has ended', () => {
    expect(run('finished', 'working')).toBe('finished');
    expect(run('stopped', 'working')).toBe('stopped');
  });

  it('starts a new turn from any end state', () => {
    expect(run('finished', 'turnStarted')).toBe('working');
    expect(run('stopped', 'turnStarted')).toBe('working');
  });

  it('keeps how the turn ended when the session closes right after', () => {
    expect(run('finished', 'sessionEnded')).toBe('finished');
    expect(run('stopped', 'sessionEnded')).toBe('stopped');
    expect(run('working', 'sessionEnded')).toBe('idle');
    expect(run('question', 'sessionEnded')).toBe('idle');
  });
});

describe('SessionTracker', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reports each change once', () => {
    const changes: SessionState[] = [];
    const tracker = new SessionTracker((state) => changes.push(state));
    tracker.handle({ type: 'turnStarted' });
    tracker.handle({ type: 'working' });
    tracker.handle({ type: 'questionAsked' });
    expect(changes).toEqual(['working', 'question']);
    tracker.dispose();
  });

  it('falls back to idle when a question is never answered', () => {
    const tracker = new SessionTracker(() => {}, { working: 1000, attention: 5000 });
    tracker.handle({ type: 'questionAsked' });
    vi.advanceTimersByTime(4999);
    expect(tracker.state).toBe('question');
    vi.advanceTimersByTime(1);
    expect(tracker.state).toBe('idle');
    tracker.dispose();
  });

  it('keeps stopped until the next turn, without a timer', () => {
    const tracker = new SessionTracker(() => {}, { working: 1000, attention: 5000 });
    tracker.handle({ type: 'error' });
    vi.advanceTimersByTime(60_000);
    expect(tracker.state).toBe('stopped');
    tracker.dispose();
  });
});
