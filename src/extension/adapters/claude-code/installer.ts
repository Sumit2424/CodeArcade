import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';

type JsonObject = Record<string, unknown>;

/** Raised when settings cannot be changed safely. The message is shown to the user. */
export class InstallError extends Error {}

/** Hook events we register. Each one only records that it happened. */
export const HOOK_EVENTS = [
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PermissionRequest',
  'Stop',
  'StopFailure',
  'SessionEnd',
] as const;

const TOOL_EVENTS: ReadonlySet<string> = new Set([
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PermissionRequest',
]);

/** Our hook commands are recognized by this fragment, so we only ever touch our own. */
const MARKER = '.code-arcade/hook.js';

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The command Claude Code runs. Forward slashes work on every platform, quoted for spaces. */
export function hookCommand(hookScriptPath: string): string {
  return `node "${hookScriptPath.replaceAll('\\', '/')}"`;
}

function isOurHook(hook: unknown): boolean {
  return isObject(hook) && typeof hook.command === 'string' && hook.command.includes(MARKER);
}

function hooksSection(settings: JsonObject): JsonObject {
  const section = settings.hooks;
  if (section === undefined) return {};
  if (!isObject(section)) {
    throw new InstallError('The "hooks" entry in your Claude settings has an unexpected format.');
  }
  return section;
}

function groupsOf(section: JsonObject, event: string): unknown[] {
  const groups = section[event];
  if (groups === undefined) return [];
  if (!Array.isArray(groups)) {
    throw new InstallError(
      `The "${event}" hooks in your Claude settings have an unexpected format.`,
    );
  }
  return groups as unknown[];
}

/** Removes our hooks from a list of hook groups and leaves everything else untouched. */
function withoutOurs(groups: unknown[]): unknown[] {
  const result: unknown[] = [];
  for (const group of groups) {
    if (!isObject(group) || !Array.isArray(group.hooks)) {
      result.push(group);
      continue;
    }
    const remaining = group.hooks.filter((hook) => !isOurHook(hook));
    if (remaining.length === group.hooks.length) result.push(group);
    else if (remaining.length > 0) result.push({ ...group, hooks: remaining });
  }
  return result;
}

function ourGroup(event: string, command: string): JsonObject {
  const group: JsonObject = { hooks: [{ type: 'command', command, async: true }] };
  if (TOOL_EVENTS.has(event)) group.matcher = '*';
  return group;
}

/** Returns a copy of `settings` with our hooks added. Safe to apply repeatedly. */
export function addHooks(settings: JsonObject, command: string): JsonObject {
  const section = hooksSection(settings);
  const updated: JsonObject = { ...section };
  for (const event of HOOK_EVENTS) {
    updated[event] = [...withoutOurs(groupsOf(section, event)), ourGroup(event, command)];
  }
  return { ...settings, hooks: updated };
}

/** Returns a copy of `settings` with only our hooks removed. */
export function removeHooks(settings: JsonObject): JsonObject {
  const section = hooksSection(settings);
  const updated: JsonObject = {};
  for (const [event, groups] of Object.entries(section)) {
    if (!Array.isArray(groups)) {
      updated[event] = groups;
      continue;
    }
    const remaining = withoutOurs(groups as unknown[]);
    if (remaining.length > 0) updated[event] = remaining;
  }

  if (Object.keys(updated).length > 0) return { ...settings, hooks: updated };
  const withoutHooks = { ...settings };
  delete withoutHooks.hooks;
  return withoutHooks;
}

export function hasOurHooks(settings: JsonObject): boolean {
  const section = isObject(settings.hooks) ? settings.hooks : {};
  return Object.values(section).some(
    (groups) =>
      Array.isArray(groups) &&
      groups.some(
        (group) => isObject(group) && Array.isArray(group.hooks) && group.hooks.some(isOurHook),
      ),
  );
}

/** Reads a JSON settings file. A missing file counts as empty. */
export function readSettingsFile(file: string): JsonObject {
  if (!existsSync(file)) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    throw new InstallError(
      `${file} is not valid JSON, so it was left untouched. Fix it first, then try again.`,
    );
  }
  if (!isObject(parsed)) {
    throw new InstallError(`${file} does not contain a JSON object, so it was left untouched.`);
  }
  return parsed;
}

/** Writes via a temporary file and rename, so a crash cannot leave a half-written file. */
export function writeSettingsFile(file: string, settings: JsonObject): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.code-arcade.tmp`;
  writeFileSync(temporary, JSON.stringify(settings, null, 2) + '\n');
  renameSync(temporary, file);
}

/** Copies the file once, before our first change. Returns the backup path if one was made. */
export function backupOnce(file: string): string | undefined {
  const backup = `${file}.code-arcade.bak`;
  if (!existsSync(file) || existsSync(backup)) return undefined;
  copyFileSync(file, backup);
  return backup;
}
