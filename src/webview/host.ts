import {
  parseHostMessage,
  type HostToWebviewMessage,
  type WebviewToHostMessage,
} from '../shared/messages';
import type { GameScore } from '../shared/scores';
import type { SessionState } from '../shared/session';
import { DEFAULT_SETTINGS } from '../shared/settings';

interface VsCodeApi {
  postMessage(message: unknown): void;
}

// Injected by VS Code inside a webview; absent in the browser preview.
declare function acquireVsCodeApi(): VsCodeApi;

// VS Code allows acquireVsCodeApi() to be called only once.
const vscodeApi: VsCodeApi | undefined =
  typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

function deliverLocally(message: HostToWebviewMessage): void {
  window.dispatchEvent(new MessageEvent('message', { data: message }));
}

// Browser preview only: stands in for the extension host's storage and integration.
const devScores: Record<string, GameScore> = {};
let devIntegrationEnabled = false;

function answerAsDevHost(message: WebviewToHostMessage): void {
  switch (message.type) {
    case 'ready':
      deliverLocally({ type: 'hello', version: 'dev' });
      deliverLocally({ type: 'settings', settings: DEFAULT_SETTINGS });
      deliverLocally({ type: 'scores', scores: { ...devScores } });
      deliverLocally({ type: 'integration', enabled: devIntegrationEnabled });
      break;
    case 'enableIntegration':
      devIntegrationEnabled = true;
      deliverLocally({ type: 'integration', enabled: true });
      break;
    case 'scoreSubmitted': {
      const previous = devScores[message.gameId];
      devScores[message.gameId] = {
        best: Math.max(previous?.best ?? 0, message.score),
        plays: (previous?.plays ?? 0) + 1,
      };
      deliverLocally({ type: 'scores', scores: { ...devScores } });
      break;
    }
  }
}

export function postToHost(message: WebviewToHostMessage): void {
  if (vscodeApi) {
    vscodeApi.postMessage(message);
    return;
  }
  // Browser preview (`npm run dev:web`): there is no extension host, so answer locally.
  console.info('[dev] webview -> host', message);
  answerAsDevHost(message);
}

/** Calls `handler` for every valid message from the host. Returns an unsubscribe function. */
export function subscribeToHost(handler: (message: HostToWebviewMessage) => void): () => void {
  const listener = (event: MessageEvent<unknown>): void => {
    const message = parseHostMessage(event.data);
    if (message) handler(message);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

if (!vscodeApi) {
  // Browser preview helper: run `simulateSession('attention')` in the dev console.
  Object.assign(window, {
    simulateSession: (state: SessionState) => deliverLocally({ type: 'sessionState', state }),
  });
}
