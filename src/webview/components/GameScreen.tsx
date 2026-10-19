import type { GameDefinition } from '../../games/types';
import type { SessionState } from '../../shared/session';
import { postToHost } from '../host';
import { GameCanvas } from './GameCanvas';

interface GameScreenProps {
  game: GameDefinition;
  best: number;
  pauseWhenAway: boolean;
  session: SessionState;
  shouldPauseFor: (session: SessionState) => boolean;
  onBack: () => void;
}

export function GameScreen({
  game,
  best,
  pauseWhenAway,
  session,
  shouldPauseFor,
  onBack,
}: GameScreenProps) {
  return (
    <section>
      <button className="back-button" type="button" onClick={onBack}>
        ← All games
      </button>
      <h1 className="page-title">{game.meta.title}</h1>
      <p className="muted">{game.meta.controls}</p>
      <GameCanvas
        definition={game}
        best={best}
        pauseWhenAway={pauseWhenAway}
        session={session}
        shouldPauseFor={shouldPauseFor}
        onGameOver={(score) => postToHost({ type: 'scoreSubmitted', gameId: game.meta.id, score })}
      />
    </section>
  );
}
