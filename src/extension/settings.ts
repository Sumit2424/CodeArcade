import * as vscode from 'vscode';
import { DEFAULT_SETTINGS, type Settings } from '../shared/settings';

const SECTION = 'codeArcade';

export function readSettings(): Settings {
  const config = vscode.workspace.getConfiguration(SECTION);
  return {
    pauseWhenPanelLosesFocus: config.get<boolean>(
      'pauseWhenPanelLosesFocus',
      DEFAULT_SETTINGS.pauseWhenPanelLosesFocus,
    ),
    pauseWhenClaudeNeedsAttention: config.get<boolean>(
      'pauseWhenClaudeNeedsAttention',
      DEFAULT_SETTINGS.pauseWhenClaudeNeedsAttention,
    ),
    pauseWhenClaudeFinishes: config.get<boolean>(
      'pauseWhenClaudeFinishes',
      DEFAULT_SETTINGS.pauseWhenClaudeFinishes,
    ),
  };
}

/** Host-only setting: whether to show a toast when the assistant needs the user. */
export function notifyWhenClaudeNeedsAttention(): boolean {
  return vscode.workspace
    .getConfiguration(SECTION)
    .get<boolean>('notifyWhenClaudeNeedsAttention', true);
}

/** Host-only setting: whether to open the game panel when Claude Code starts working. */
export function openWhenClaudeStarts(): boolean {
  return vscode.workspace.getConfiguration(SECTION).get<boolean>('openWhenClaudeStarts', true);
}

/** Calls `listener` when any Code Arcade setting changes. */
export function onSettingsChanged(listener: () => void): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(SECTION)) listener();
  });
}
