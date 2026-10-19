import type { RunnerSnapshot } from '../../games/engine/runner';

interface GameOverlayProps {
  snapshot: RunnerSnapshot;
  isNewBest: boolean;
  onActivate: () => void;
}

/** Shown over the canvas whenever the game is not actively running. */
export function GameOverlay({ snapshot, isNewBest, onActivate }: GameOverlayProps) {
  if (snapshot.state === 'running') return null;

  const content = {
    ready: { title: 'Ready?', button: 'Play', hint: 'Press Space to start' },
    paused: { title: 'Paused', button: 'Resume', hint: 'Press Space to resume' },
    gameOver: {
      title: 'Game over',
      button: 'Play again',
      hint: `Score ${snapshot.score} · Press Space to play again`,
    },
  }[snapshot.state];

  return (
    <div className="game-overlay">
      <h2>{content.title}</h2>
      {snapshot.state === 'gameOver' && isNewBest && <p className="new-best">New best!</p>}
      <button className="primary-button" type="button" onClick={onActivate}>
        {content.button}
      </button>
      <p className="muted">{content.hint}</p>
    </div>
  );
}
