import type { AssistantEvent } from '../../../shared/events';

/** One line of the event file, as written by hook.ts. */
export interface HookRecord {
  readonly ts: number;
  readonly event: string;
  readonly session: string;
  readonly cwd: string;
  readonly tool?: string;
}

/** The tool Claude Code uses to ask the user a multiple-choice question. */
const QUESTION_TOOL = 'AskUserQuestion';

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Parses one line of the event file. Anything malformed is ignored. */
export function parseHookRecord(line: string): HookRecord | undefined {
  let data: unknown;
  try {
    data = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (typeof data !== 'object' || data === null) return undefined;
  const { ts, event, session, cwd, tool } = data as Record<string, unknown>;
  if (typeof ts !== 'number' || typeof event !== 'string' || typeof cwd !== 'string') {
    return undefined;
  }
  return { ts, event, session: optionalString(session) ?? '', cwd, tool: optionalString(tool) };
}

/**
 * Maps Claude Code hook events to conceptual assistant events.
 * Events we cannot interpret reliably return undefined and are ignored.
 */
export function toAssistantEvent(record: HookRecord): AssistantEvent | undefined {
  // Questions arrive as a tool call. Whether Claude Code also raises a permission request for
  // it is not verified, so both routes lead to the same event.
  const isQuestion = record.tool === QUESTION_TOOL;
  switch (record.event) {
    case 'UserPromptSubmit':
      return { type: 'turnStarted' };
    case 'PreToolUse':
      return isQuestion ? { type: 'questionAsked' } : { type: 'working' };
    case 'PostToolUse':
    case 'PostToolUseFailure':
      return { type: 'working' };
    case 'PermissionRequest':
      return isQuestion ? { type: 'questionAsked' } : { type: 'attentionNeeded' };
    case 'Stop':
      return { type: 'turnFinished' };
    case 'StopFailure':
      return { type: 'error' };
    case 'SessionEnd':
      return { type: 'sessionEnded' };
    default:
      return undefined;
  }
}
