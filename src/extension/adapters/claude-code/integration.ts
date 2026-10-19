import { execFile } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as vscode from 'vscode';
import type { Logger } from '../../log';
import { ClaudeCodeAdapter } from './adapter';
import {
  addHooks,
  backupOnce,
  hasOurHooks,
  hookCommand,
  InstallError,
  readSettingsFile,
  removeHooks,
  writeSettingsFile,
} from './installer';
import { claudeSettingsPath, dataDir, eventsFile, installedHookPath } from './paths';

function nodeIsAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    execFile('node', ['--version'], { timeout: 5000, windowsHide: true }, (error) =>
      resolve(!error),
    );
  });
}

/** Installs and removes the Claude Code hooks, and creates adapters that read their events. */
export class ClaudeCodeIntegration implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<boolean>();
  readonly onDidChangeEnabled = this.changed.event;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly log: Logger,
  ) {}

  createAdapter(): ClaudeCodeAdapter {
    return new ClaudeCodeAdapter(this.log);
  }

  isEnabled(): boolean {
    try {
      return hasOurHooks(readSettingsFile(claudeSettingsPath()));
    } catch {
      return false;
    }
  }

  /** Keeps the installed script in step with the extension version after an update. */
  refreshHookScript(): void {
    if (!this.isEnabled()) return;
    try {
      this.copyHookScript();
    } catch (error) {
      this.log(`Could not refresh the hook script: ${String(error)}`);
    }
  }

  async enable(): Promise<void> {
    if (!(await nodeIsAvailable())) {
      await vscode.window.showErrorMessage(
        'Code Arcade could not find Node.js on your PATH. Claude Code runs the hook with ' +
          'Node.js, so install it from nodejs.org and try again.',
      );
      return;
    }

    const settingsFile = claudeSettingsPath();
    const answer = await vscode.window.showInformationMessage(
      'Enable Claude Code integration?',
      {
        modal: true,
        detail: [
          `This adds hooks to ${settingsFile} (a one-time backup is saved next to it).`,
          '',
          `Each hook runs a small script that appends the event name, tool name, session id and ` +
            `working folder to ${eventsFile()}.`,
          '',
          'Your prompts, code and Claude’s replies are never recorded. The hooks only observe: ' +
            'they cannot approve, deny or change anything.',
          '',
          'You can remove them any time with “Code Arcade: Disable Claude Code Integration”.',
        ].join('\n'),
      },
      'Enable',
    );
    if (answer !== 'Enable') return;

    try {
      this.copyHookScript();
      backupOnce(settingsFile);
      writeSettingsFile(
        settingsFile,
        addHooks(readSettingsFile(settingsFile), hookCommand(installedHookPath())),
      );
    } catch (error) {
      await this.reportFailure('enable', error);
      return;
    }
    this.log('Claude Code integration enabled.');
    this.changed.fire(true);
    void vscode.window.showInformationMessage(
      'Claude Code integration enabled. If the game does not react, start a new Claude Code conversation.',
    );
  }

  async disable(): Promise<void> {
    try {
      const settingsFile = claudeSettingsPath();
      writeSettingsFile(settingsFile, removeHooks(readSettingsFile(settingsFile)));
    } catch (error) {
      await this.reportFailure('disable', error);
      return;
    }
    this.log('Claude Code integration disabled.');
    this.changed.fire(false);
    void vscode.window.showInformationMessage('Claude Code integration disabled.');
  }

  dispose(): void {
    this.changed.dispose();
  }

  private copyHookScript(): void {
    const source = vscode.Uri.joinPath(this.extensionUri, 'dist', 'hook.js').fsPath;
    mkdirSync(dataDir(), { recursive: true, mode: 0o700 });
    mkdirSync(dirname(installedHookPath()), { recursive: true });
    copyFileSync(source, installedHookPath());
  }

  private async reportFailure(action: string, error: unknown): Promise<void> {
    const message = error instanceof InstallError ? error.message : String(error);
    this.log(`Could not ${action} the integration: ${message}`);
    await vscode.window.showErrorMessage(
      `Code Arcade could not ${action} the integration. ${message}`,
    );
  }
}
