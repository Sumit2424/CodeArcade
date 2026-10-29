import type { RunnerSnapshot } from '../../games/engine/runner';
import type { SessionState } from '../../shared/session';

/** The session states that can pause a game. */
export type ClaudePause = Extract<SessionState, 'attention' | 'question' | 'finished' | 'stopped'>;

interface GameOverlayProps {
  snapshot: RunnerSnapshot;
  isNewBest: boolean;
  /** Set when Claude, not the player, paused the running game. */
  claudePause?: ClaudePause;
  onActivate: () => void;
}

interface OverlayContent {
  title: string;
  text?: string;
  button: string;
  hint: string;
  tone?: ClaudePause;
}

function contentFor(
  snapshot: RunnerSnapshot,
  claudePause: ClaudePause | undefined,
): OverlayContent {
  switch (snapshot.state) {
    case 'ready':
      return { title: 'Ready?', button: 'Play', hint: 'Press Space to start' };
    case 'gameOver':
      return {
        title: 'Game over',
        button: 'Play again',
        hint: `Score ${snapshot.score} · Press Space to play again`,
      };
    case 'paused':
      if (claudePause === 'attention') {
        return {
          title: 'Paused. Claude needs you',
          text: `Answer in the Claude panel on the right. Your run is saved at ${snapshot.score} points.`,
          button: 'Resume',
          hint: 'Press Space to resume',
          tone: 'attention',
        };
      }
      if (claudePause === 'question') {
        return {
          title: 'Paused. Claude has a question',
          text: `Answer in the Claude panel on the right. Your run is saved at ${snapshot.score} points.`,
          button: 'Resume',
          hint: 'Press Space to resume',
          tone: 'question',
        };
      }
      if (claudePause === 'finished') {
        return {
          title: 'Paused. Claude is done',
          text: `Review the changes now, or keep playing. Score so far: ${snapshot.score}.`,
          button: 'Resume',
          hint: 'Press Space to resume',
          tone: 'finished',
        };
      }
      if (claudePause === 'stopped') {
        return {
          title: 'Paused. Claude stopped',
          text: `The turn ended with an error. Check Claude Code. Score so far: ${snapshot.score}.`,
          button: 'Resume',
          hint: 'Press Space to resume',
          tone: 'stopped',
        };
      }
      return { title: 'Paused', button: 'Resume', hint: 'Press Space to resume' };
    case 'running':
      return { title: '', button: '', hint: '' };
  }
}

/** Shown over the canvas whenever the game is not actively running. */
export function GameOverlay({ snapshot, isNewBest, claudePause, onActivate }: GameOverlayProps) {
  if (snapshot.state === 'running') return null;

  const content = contentFor(snapshot, claudePause);

  return (
    <div className="game-overlay">
      <div className={`overlay-card${content.tone ? ` card-${content.tone}` : ''}`}>
        <h2>{content.title}</h2>
        {content.text && <p className="overlay-text">{content.text}</p>}
        {snapshot.state === 'gameOver' && isNewBest && <p className="new-best">New best!</p>}
        <button className="primary-button" type="button" onClick={onActivate}>
          {content.button}
        </button>
        <p className="muted">{content.hint}</p>
      </div>
    </div>
  );
}
