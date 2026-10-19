import { useEffect, useRef } from 'react';
import type { GameDefinition } from '../../games/types';
import type { SessionState } from '../../shared/session';
import { useGameRunner } from '../hooks/useGameRunner';
import { GameOverlay } from './GameOverlay';

interface GameCanvasProps {
  definition: GameDefinition;
  /** Best saved score for this game. */
  best: number;
  pauseWhenAway: boolean;
  session: SessionState;
  /** Whether entering this session state should pause the game (user settings). */
  shouldPauseFor: (session: SessionState) => boolean;
  onGameOver: (score: number) => void;
}

export function GameCanvas({
  definition,
  best,
  pauseWhenAway,
  session,
  shouldPauseFor,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { snapshot, activate, pause, togglePause } = useGameRunner(definition, canvasRef, {
    pauseWhenAway,
  });
  const canPause = snapshot.state === 'running' || snapshot.state === 'paused';

  // Pause when Claude needs the user or finishes. Only changes of state count, so a
  // game the user resumed manually is not paused again by an unrelated re-render.
  const shouldPauseForRef = useRef(shouldPauseFor);
  useEffect(() => {
    shouldPauseForRef.current = shouldPauseFor;
  }, [shouldPauseFor]);
  const previousSession = useRef(session);
  useEffect(() => {
    if (previousSession.current === session) return;
    previousSession.current = session;
    if (shouldPauseForRef.current(session)) pause();
  }, [session, pause]);

  // The saved best changes right after a run ends, so remember what it was when the run began.
  const bestAtRunStart = useRef(best);
  useEffect(() => {
    if (snapshot.state === 'running') bestAtRunStart.current = best;
  }, [snapshot.state, best]);

  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);
  const finalScore = snapshot.score;
  useEffect(() => {
    if (snapshot.state === 'gameOver') onGameOverRef.current(finalScore);
  }, [snapshot.state, finalScore]);

  const isNewBest = snapshot.score > bestAtRunStart.current;

  return (
    <div className="game-canvas-panel">
      <div className="game-toolbar">
        <span className="score">
          Score {snapshot.score}
          <span className="muted"> · Best {Math.max(best, bestAtRunStart.current)}</span>
        </span>
        {canPause && (
          <button className="ghost-button" type="button" onClick={togglePause}>
            {snapshot.state === 'running' ? 'Pause' : 'Resume'}
          </button>
        )}
      </div>
      <div className="canvas-wrap">
        <canvas ref={canvasRef} className="game-canvas" />
        <GameOverlay snapshot={snapshot} isNewBest={isNewBest} onActivate={activate} />
      </div>
    </div>
  );
}
