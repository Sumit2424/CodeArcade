import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Folder holding the installed hook script and the event file.
 * CODE_ARCADE_DIR overrides it, which keeps tests away from the real home folder.
 */
export function dataDir(): string {
  return process.env.CODE_ARCADE_DIR || join(homedir(), '.code-arcade');
}

export function eventsFile(): string {
  return join(dataDir(), 'events.jsonl');
}

/** Stable location for the hook script: the extension folder changes with every update. */
export function installedHookPath(): string {
  return join(dataDir(), 'hook.js');
}

/** Claude Code's user-level settings file, where hooks are registered. */
export function claudeSettingsPath(): string {
  const configDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  return join(configDir, 'settings.json');
}
