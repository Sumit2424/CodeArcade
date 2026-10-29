import * as vscode from 'vscode';
import type { SessionState } from '../shared/session';

const TEXT: Record<SessionState, string> = {
  idle: '$(play-circle) Arcade',
  working: '$(play-circle) Arcade · Claude working',
  attention: '$(play-circle) Arcade · Needs you',
  question: '$(play-circle) Arcade · Question for you',
  finished: '$(play-circle) Arcade · Claude done',
  stopped: '$(play-circle) Arcade · Claude stopped',
};

/** States where Claude is blocked until the user answers. */
const NEEDS_USER: ReadonlySet<SessionState> = new Set(['attention', 'question']);

/** Status bar entry that mirrors the session. Only states that need you get the warning color. */
export class SessionStatusBar implements vscode.Disposable {
  private readonly item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  constructor() {
    this.item.command = 'codeArcade.open';
    this.update('idle', false);
    this.item.show();
  }

  update(state: SessionState, integrationEnabled: boolean): void {
    // Without the integration the state never changes, so do not claim anything about Claude.
    const shown: SessionState = integrationEnabled ? state : 'idle';
    this.item.text = TEXT[shown];
    const needsUser = NEEDS_USER.has(shown);
    this.item.tooltip = needsUser
      ? 'Claude Code needs you. Click to open Code Arcade.'
      : 'Open Code Arcade';
    this.item.backgroundColor = needsUser
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined;
  }

  dispose(): void {
    this.item.dispose();
  }
}
