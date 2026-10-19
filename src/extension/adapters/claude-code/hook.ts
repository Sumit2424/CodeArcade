/**
 * Claude Code hook script. Claude Code runs it for each lifecycle event and pipes the
 * event JSON to stdin. It appends ONE minimal line to the event file and exits.
 *
 * Privacy: the payload also carries prompts, tool inputs/outputs and assistant text.
 * None of that is read or written; only the whitelisted fields below are kept.
 *
 * It never writes to stdout, never blocks Claude, and always exits successfully.
 */
import { appendFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dataDir, eventsFile } from './paths';

const MAX_FILE_BYTES = 1_000_000;

function text(value: unknown, maxLength = 512): string | undefined {
  return typeof value === 'string' ? value.slice(0, maxLength) : undefined;
}

/** Returns the line to write, or undefined when the input is not a hook event. */
function record(raw: string): string | undefined {
  const payload = JSON.parse(raw) as Record<string, unknown> | null;
  if (typeof payload?.hook_event_name !== 'string') return undefined;
  return JSON.stringify({
    ts: Date.now(),
    event: text(payload.hook_event_name, 64),
    session: text(payload.session_id, 64),
    cwd: text(payload.cwd, 1024),
    tool: text(payload.tool_name, 128),
    reason: text(payload.reason, 64),
  });
}

function append(line: string): void {
  const file = eventsFile();
  mkdirSync(dataDir(), { recursive: true, mode: 0o700 });
  try {
    // Keep the file small: it is only a short-lived channel, not a log.
    if (statSync(file).size > MAX_FILE_BYTES) writeFileSync(file, '');
  } catch {
    // The file does not exist yet.
  }
  appendFileSync(file, line + '\n');
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const line = record(input);
    if (line) append(line);
  } catch {
    // Never disturb Claude Code, whatever happens.
  }
});
