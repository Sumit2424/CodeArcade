import { useState } from 'react';
import { findGame } from '../games/registry';
import { bestScore } from '../shared/scores';
import type { SessionState } from '../shared/session';
import { GameScreen } from './components/GameScreen';
import { Header } from './components/Header';
import { IntegrationPrompt } from './components/IntegrationPrompt';
import { Launcher } from './components/Launcher';
import { SessionStrip } from './components/SessionStrip';
import { useHost } from './hooks/useHost';

export function App() {
  const { version, session, sessionSince, integrationEnabled, scores, settings } = useHost();
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const selectedGame = selectedGameId ? findGame(selectedGameId) : undefined;

  const shouldPauseFor = (state: SessionState): boolean =>
    ((state === 'attention' || state === 'question') && settings.pauseWhenClaudeNeedsAttention) ||
    ((state === 'finished' || state === 'stopped') && settings.pauseWhenClaudeFinishes);

  return (
    <div className="app">
      <Header onHome={() => setSelectedGameId(undefined)} />
      <SessionStrip
        session={session}
        since={sessionSince}
        integrationEnabled={integrationEnabled}
      />
      <main className="content">
        {selectedGame ? (
          <GameScreen
            game={selectedGame}
            best={bestScore(scores, selectedGame.meta.id)}
            pauseWhenAway={settings.pauseWhenPanelLosesFocus}
            session={session}
            shouldPauseFor={shouldPauseFor}
            onBack={() => setSelectedGameId(undefined)}
          />
        ) : (
          <>
            {!integrationEnabled && <IntegrationPrompt />}
            <Launcher scores={scores} onPlay={setSelectedGameId} />
          </>
        )}
      </main>
      <footer className="footer">
        {version ? `Code Arcade v${version}` : 'Connecting to extension…'}
      </footer>
    </div>
  );
}
