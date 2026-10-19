import { isAbsolute, relative, resolve } from 'node:path';

function normalize(path: string): string {
  const absolute = resolve(path);
  return process.platform === 'win32' ? absolute.toLowerCase() : absolute;
}

function isInside(child: string, parent: string): boolean {
  const rel = relative(normalize(parent), normalize(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

/**
 * Whether a Claude Code session working in `cwd` belongs to this VS Code window.
 * The event file is shared by every window, so each window keeps only its own sessions.
 * A window with no folder open accepts everything.
 */
export function belongsToWorkspace(cwd: string, workspaceFolders: readonly string[]): boolean {
  if (workspaceFolders.length === 0) return true;
  return workspaceFolders.some((folder) => isInside(cwd, folder) || isInside(folder, cwd));
}
