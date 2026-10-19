import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { prepareCanvas } from '../../games/engine/canvas';
import { keyToInput } from '../../games/engine/input';
import { GameRunner, type RunnerSnapshot } from '../../games/engine/runner';
import type { GameDefinition } from '../../games/types';

export interface GameControls {
  snapshot: RunnerSnapshot;
  /** Start, resume or restart, depending on the current state. */
  activate: () => void;
  /** Pauses a running game; does nothing otherwise. */
  pause: () => void;
  togglePause: () => void;
}

export interface GameRunnerOptions {
  /** Pause when the panel loses focus or is hidden. Can change while a game is running. */
  pauseWhenAway: boolean;
}

const INITIAL_SNAPSHOT: RunnerSnapshot = { state: 'ready', score: 0 };

/**
 * Creates a runner for the game and wires the keyboard to it. Optionally pauses it when the
 * panel loses focus, so the user can switch to Claude without losing a run.
 */
export function useGameRunner(
  definition: GameDefinition,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: GameRunnerOptions,
): GameControls {
  const [snapshot, setSnapshot] = useState<RunnerSnapshot>(INITIAL_SNAPSHOT);
  const runnerRef = useRef<GameRunner>(undefined);
  // Read through a ref so changing the setting does not restart the running game.
  const pauseWhenAwayRef = useRef(options.pauseWhenAway);
  useEffect(() => {
    pauseWhenAwayRef.current = options.pauseWhenAway;
  }, [options.pauseWhenAway]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = definition.create();
    const ctx = prepareCanvas(canvas, game.width, game.height);
    const runner = new GameRunner(game, ctx, setSnapshot);
    runnerRef.current = runner;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const input = keyToInput(event.code);
      if (!input) return;
      // Stop arrow keys and Space from scrolling the page.
      event.preventDefault();
      if (event.repeat && (input === 'action' || input === 'pause')) return;
      runner.handleInput(input);
    };
    const pauseIfAway = (): void => {
      if (pauseWhenAwayRef.current) runner.pause();
    };
    const onVisibilityChange = (): void => {
      if (document.hidden) pauseIfAway();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', pauseIfAway);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', pauseIfAway);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      runner.dispose();
      runnerRef.current = undefined;
      setSnapshot(INITIAL_SNAPSHOT);
    };
  }, [definition, canvasRef]);

  // Stable across renders (they only touch the ref), so they are safe effect dependencies.
  const actions = useMemo(
    () => ({
      activate: () => runnerRef.current?.handleInput('action'),
      pause: () => runnerRef.current?.pause(),
      togglePause: () => runnerRef.current?.handleInput('pause'),
    }),
    [],
  );

  return { snapshot, ...actions };
}
