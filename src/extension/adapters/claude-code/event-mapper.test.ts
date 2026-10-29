import { describe, expect, it } from 'vitest';
import { parseHookRecord, toAssistantEvent, type HookRecord } from './event-mapper';

const record = (event: string, tool?: string): HookRecord => ({
  ts: 1,
  event,
  session: 's',
  cwd: '/work',
  tool,
});

describe('toAssistantEvent', () => {
  it('maps the turn lifecycle', () => {
    expect(toAssistantEvent(record('UserPromptSubmit'))).toEqual({ type: 'turnStarted' });
    expect(toAssistantEvent(record('Stop'))).toEqual({ type: 'turnFinished' });
    expect(toAssistantEvent(record('StopFailure'))).toEqual({ type: 'error' });
    expect(toAssistantEvent(record('SessionEnd'))).toEqual({ type: 'sessionEnded' });
  });

  it('treats ordinary tool events as working', () => {
    expect(toAssistantEvent(record('PreToolUse', 'Bash'))).toEqual({ type: 'working' });
    expect(toAssistantEvent(record('PostToolUse', 'Bash'))).toEqual({ type: 'working' });
  });

  it('maps a permission request to attention', () => {
    expect(toAssistantEvent(record('PermissionRequest', 'Bash'))).toEqual({
      type: 'attentionNeeded',
    });
  });

  it('maps the question tool to a question, whichever hook reports it', () => {
    expect(toAssistantEvent(record('PreToolUse', 'AskUserQuestion'))).toEqual({
      type: 'questionAsked',
    });
    expect(toAssistantEvent(record('PermissionRequest', 'AskUserQuestion'))).toEqual({
      type: 'questionAsked',
    });
  });

  it('resumes working once the question has been answered', () => {
    expect(toAssistantEvent(record('PostToolUse', 'AskUserQuestion'))).toEqual({
      type: 'working',
    });
  });

  it('ignores events it cannot interpret', () => {
    expect(toAssistantEvent(record('Notification'))).toBeUndefined();
  });
});

describe('parseHookRecord', () => {
  it('reads a well-formed line', () => {
    const line = JSON.stringify({ ts: 5, event: 'Stop', session: 'a', cwd: '/w', tool: 'Bash' });
    expect(parseHookRecord(line)).toEqual({
      ts: 5,
      event: 'Stop',
      session: 'a',
      cwd: '/w',
      tool: 'Bash',
    });
  });

  it('ignores malformed lines', () => {
    expect(parseHookRecord('not json')).toBeUndefined();
    expect(parseHookRecord('{"event":"Stop"}')).toBeUndefined();
  });
});
