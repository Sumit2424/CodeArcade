import * as vscode from 'vscode';
import { parseWebviewMessage, type HostToWebviewMessage } from '../shared/messages';
import type { SessionState } from '../shared/session';
import type { ClaudeCodeIntegration } from './adapters/claude-code/integration';
import { buildWebviewHtml } from './html';
import type { Logger } from './log';
import type { ScoreStore } from './score-store';
import { SessionController } from './session-controller';
import { SessionStatusBar } from './status-bar';
import { notifyWhenClaudeNeedsAttention, onSettingsChanged, readSettings } from './settings';

/** What the panel needs from the rest of the extension. */
export interface PanelServices {
  readonly scores: ScoreStore;
  readonly claude: ClaudeCodeIntegration;
  readonly session: SessionController;
  readonly log: Logger;
}

/** Owns the single game webview panel. */
export class GamePanel {
  private static current: GamePanel | undefined;

  static show(context: vscode.ExtensionContext, services: PanelServices): void {
    if (GamePanel.current) {
      // Keep keyboard focus where it is: the user may be typing to Claude.
      GamePanel.current.panel.reveal(undefined, true);
      return;
    }

    const webviewRoot = vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview');
    const panel = vscode.window.createWebviewPanel(
      'codeArcade.game',
      'Code Arcade',
      // Beside opens the game in a split next to the active editor, so Claude's panel stays in view.
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        // Keeps a paused game alive while its tab is in the background.
        retainContextWhenHidden: true,
        localResourceRoots: [webviewRoot],
      },
    );
    const { version } = context.extension.packageJSON as { version: string };
    GamePanel.current = new GamePanel(panel, webviewRoot, version, services);
  }

  static disposeCurrent(): void {
    GamePanel.current?.panel.dispose();
  }

  private readonly disposables: vscode.Disposable[] = [];
  private readonly session: SessionController;
  private readonly statusBar = new SessionStatusBar();

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    webviewRoot: vscode.Uri,
    private readonly version: string,
    private readonly services: PanelServices,
  ) {
    // The session outlives the panel: it is what opens the panel when Claude starts working.
    this.session = services.session;

    panel.webview.html = buildWebviewHtml(panel.webview, webviewRoot);
    this.disposables.push(
      this.statusBar,
      panel.webview.onDidReceiveMessage((raw: unknown) => this.handleMessage(raw)),
      panel.onDidDispose(() => this.dispose()),
      services.scores.onDidChange((all) => this.post({ type: 'scores', scores: all })),
      services.claude.onDidChangeEnabled((enabled) => {
        this.post({ type: 'integration', enabled });
        this.statusBar.update(this.session.state, enabled);
      }),
      this.session.onDidChange((state) => this.onSessionChanged(state)),
      onSettingsChanged(() => this.post({ type: 'settings', settings: readSettings() })),
    );
  }

  private handleMessage(raw: unknown): void {
    const message = parseWebviewMessage(raw);
    if (!message) {
      console.warn('[Code Arcade] Ignored an invalid message from the webview.');
      return;
    }
    switch (message.type) {
      case 'ready':
        this.post({ type: 'hello', version: this.version });
        this.post({ type: 'settings', settings: readSettings() });
        this.post({ type: 'scores', scores: this.services.scores.getAll() });
        this.post({ type: 'integration', enabled: this.services.claude.isEnabled() });
        this.post({ type: 'sessionState', state: this.session.state });
        this.statusBar.update(this.session.state, this.services.claude.isEnabled());
        break;
      case 'enableIntegration':
        void vscode.commands.executeCommand('codeArcade.enableClaudeCodeIntegration');
        break;
      case 'scoreSubmitted':
        void this.services.scores.record(message.gameId, message.score);
        break;
    }
  }

  private onSessionChanged(state: SessionState): void {
    this.post({ type: 'sessionState', state });
    this.statusBar.update(state, this.services.claude.isEnabled());
    // Only interrupt with a toast if the user is looking at the game and could miss the prompt.
    if (
      (state === 'attention' || state === 'question') &&
      this.panel.active &&
      notifyWhenClaudeNeedsAttention()
    ) {
      void vscode.window.showInformationMessage(
        state === 'question'
          ? 'Claude Code has a question for you.'
          : 'Claude Code needs your attention.',
      );
    }
  }

  private post(message: HostToWebviewMessage): void {
    void this.panel.webview.postMessage(message);
  }

  private dispose(): void {
    GamePanel.current = undefined;
    while (this.disposables.length > 0) {
      this.disposables.pop()?.dispose();
    }
  }
}
