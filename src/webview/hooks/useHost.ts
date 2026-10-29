import { useEffect, useState } from 'react';
import type { ScoreMap } from '../../shared/scores';
import type { SessionState } from '../../shared/session';
import { DEFAULT_SETTINGS, type Settings } from '../../shared/settings';
import { postToHost, subscribeToHost } from '../host';

export interface HostState {
  /** Extension version, or undefined until the host has answered. */
  version: string | undefined;
  session: SessionState;
  /** When the current session state began, in ms since the epoch. */
  sessionSince: number;
  /** Whether the Claude Code hooks are installed. Without them the session never changes. */
  integrationEnabled: boolean;
  scores: ScoreMap;
  settings: Settings;
}

/** Connects the UI to the extension host and exposes what the host reports. */
export function useHost(): HostState {
  const [version, setVersion] = useState<string>();
  const [session, setSession] = useState<SessionState>('idle');
  const [sessionSince, setSessionSince] = useState(() => Date.now());
  const [integrationEnabled, setIntegrationEnabled] = useState(false);
  const [scores, setScores] = useState<ScoreMap>({});
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Subscribe before announcing readiness so the reply cannot be missed.
    const unsubscribe = subscribeToHost((message) => {
      switch (message.type) {
        case 'hello':
          setVersion(message.version);
          break;
        case 'sessionState':
          // The host only reports changes (plus one reply to 'ready'), so each message starts a new state.
          setSession(message.state);
          setSessionSince(Date.now());
          break;
        case 'integration':
          setIntegrationEnabled(message.enabled);
          break;
        case 'scores':
          setScores(message.scores);
          break;
        case 'settings':
          setSettings(message.settings);
          break;
      }
    });
    postToHost({ type: 'ready' });
    return unsubscribe;
  }, []);

  return { version, session, sessionSince, integrationEnabled, scores, settings };
}
