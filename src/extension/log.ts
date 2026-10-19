import * as vscode from 'vscode';

export type Logger = (message: string) => void;

/** Writes timestamped lines to the "Code Arcade" Output channel. */
export function createLogger(channel: vscode.OutputChannel): Logger {
  return (message) => {
    channel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
  };
}
