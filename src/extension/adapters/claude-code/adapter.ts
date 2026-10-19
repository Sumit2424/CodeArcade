import * as vscode from 'vscode';
import type { AssistantEvent } from '../../../shared/events';
import type { Logger } from '../../log';
import type { IdeAdapter } from '../adapter';
import { EventTail } from './event-tail';
import { parseHookRecord, toAssistantEvent } from './event-mapper';
import { eventsFile } from './paths';
import { belongsToWorkspace } from './workspace-filter';

/** Reads Claude Code hook events from the event file written by hook.ts. */
export class ClaudeCodeAdapter implements IdeAdapter {
  readonly id = 'claude-code';
  readonly displayName = 'Claude Code';

  constructor(private readonly log: Logger) {}

  start(listener: (event: AssistantEvent) => void): vscode.Disposable {
    const tail = new EventTail(eventsFile(), (line) => {
      const record = parseHookRecord(line);
      if (!record) return;

      const folders = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? [];
      if (!belongsToWorkspace(record.cwd, folders)) return;

      const event = toAssistantEvent(record);
      this.log(
        `hook ${record.event}${record.tool ? ` (${record.tool})` : ''} -> ${event?.type ?? 'ignored'}`,
      );
      if (event) listener(event);
    });
    tail.start();
    return { dispose: () => tail.dispose() };
  }
}
