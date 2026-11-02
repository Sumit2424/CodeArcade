import * as vscode from 'vscode';
import { ClaudeCodeIntegration } from './adapters/claude-code/integration';
import { createLogger } from './log';
import { GamePanel, type PanelServices } from './panel';
import { ScoreStore } from './score-store';
import { SessionController } from './session-controller';
import { openWhenClaudeStarts } from './settings';

export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel('Code Arcade');
  const log = createLogger(channel);
  const scores = new ScoreStore(context.globalState);
  const claude = new ClaudeCodeIntegration(context.extensionUri, log);
  const session = new SessionController(claude.createAdapter(), log);
  const services: PanelServices = { scores, claude, session, log };

  claude.refreshHookScript();
  session.setListening(claude.isEnabled());

  context.subscriptions.push(
    channel,
    scores,
    claude,
    session,
    claude.onDidChangeEnabled((enabled) => session.setListening(enabled)),
    session.onDidChange((state) => {
      // Open without taking focus, so the user can keep typing to Claude.
      if (state === 'working' && openWhenClaudeStarts()) GamePanel.show(context, services);
    }),
    vscode.commands.registerCommand('codeArcade.open', () => {
      GamePanel.show(context, services);
    }),
    vscode.commands.registerCommand('codeArcade.enableClaudeCodeIntegration', () =>
      claude.enable(),
    ),
    vscode.commands.registerCommand('codeArcade.disableClaudeCodeIntegration', () =>
      claude.disable(),
    ),
    vscode.commands.registerCommand('codeArcade.showLog', () => channel.show(true)),
    vscode.commands.registerCommand('codeArcade.resetScores', async () => {
      const confirm = 'Reset Scores';
      const answer = await vscode.window.showWarningMessage(
        'Reset all Code Arcade scores? This cannot be undone.',
        { modal: true },
        confirm,
      );
      if (answer === confirm) await scores.reset();
    }),
    { dispose: () => GamePanel.disposeCurrent() },
  );
}

export function deactivate(): void {
  // Everything is released through context.subscriptions.
}
