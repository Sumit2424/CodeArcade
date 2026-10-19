import { useState } from 'react';
import { findGame } from '../games/registry';
import { bestScore } from '../shared/scores';
import type { SessionState } from '../shared/session';
import { GameScreen } from './components/GameScreen';
import { Header } from './components/Header';
import { IntegrationPrompt } from './components/IntegrationPrompt';
import { Launcher } from './components/Launcher';
import { SessionBanner } from './components/SessionBanner';
import { useHost } from './hooks/useHost';

export function App() {
  const { version, session, integrationEnabled, scores, settings } = useHost();
  const [selectedGameId, setSelectedGameId] = useState<string>();
  const selectedGame = selectedGameId ? findGame(selectedGameId) : undefined;

  const shouldPauseFor = (state: SessionState): boolean =>
    (state === 'attention' && settings.pauseWhenClaudeNeedsAttention) ||
    (state === 'finished' && settings.pauseWhenClaudeFinishes);

  return (
    <div className="app">
      <Header
        session={session}
        integrationEnabled={integrationEnabled}
        onHome={() => setSelectedGameId(undefined)}
      />
      {integrationEnabled && <SessionBanner session={session} />}
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
