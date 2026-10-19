import type { Game } from '../types';
import type { RunnerInput } from './input';

export type RunnerState = 'ready' | 'running' | 'paused' | 'gameOver';

export interface RunnerSnapshot {
  readonly state: RunnerState;
  readonly score: number;
}

/** The simulation advances in fixed steps so games behave the same on any display. */
const STEP_SECONDS = 1 / 60;
/** Cap on time handled per frame, so a long stall does not cause a burst of updates. */
const MAX_FRAME_SECONDS = 0.25;

/**
 * Drives one game: fixed-timestep loop, pause/resume, and the ready/over lifecycle.
 * It has no knowledge of React, the DOM events, or VS Code.
 */
export class GameRunner {
  private state: RunnerState = 'ready';
  private frameId: number | undefined;
  private lastTime: number | undefined;
  private accumulator = 0;
  private reported: RunnerSnapshot | undefined;

  constructor(
    private readonly game: Game,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly onChange: (snapshot: RunnerSnapshot) => void,
  ) {
    this.game.reset();
    this.game.render(this.ctx);
    this.report();
  }

  /** Starts a new run from the ready or game-over state. */
  start(): void {
    if (this.state === 'running' || this.state === 'paused') return;
    this.game.reset();
    this.setState('running');
  }

  pause(): void {
    if (this.state === 'running') this.setState('paused');
  }

  resume(): void {
    if (this.state === 'paused') this.setState('running');
  }

  handleInput(input: RunnerInput): void {
    if (input === 'pause') {
      if (this.state === 'running') this.pause();
      else this.resume();
      return;
    }
    if (input === 'action' && this.state !== 'running') {
      if (this.state === 'paused') this.resume();
      else this.start();
      return;
    }
    if (this.state === 'running') this.game.onInput(input);
  }

  dispose(): void {
    this.cancelFrame();
  }

  private setState(next: RunnerState): void {
    this.state = next;
    if (next === 'running') {
      this.lastTime = undefined;
      this.accumulator = 0;
      this.frameId = requestAnimationFrame(this.frame);
    } else {
      this.cancelFrame();
    }
    this.report();
  }

  private readonly frame = (now: number): void => {
    this.frameId = undefined;
    if (this.state !== 'running') return;

    const elapsed =
      this.lastTime === undefined ? 0 : Math.min((now - this.lastTime) / 1000, MAX_FRAME_SECONDS);
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= STEP_SECONDS && this.state === 'running') {
      this.game.update(STEP_SECONDS);
      this.accumulator -= STEP_SECONDS;
      if (this.game.isGameOver) this.state = 'gameOver';
    }

    this.game.render(this.ctx);
    this.report();
    if (this.state === 'running') {
      this.frameId = requestAnimationFrame(this.frame);
    }
  };

  private cancelFrame(): void {
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }
  }

  /** Notifies the UI only when something it displays has changed. */
  private report(): void {
    const snapshot: RunnerSnapshot = { state: this.state, score: this.game.score };
    if (this.reported?.state === snapshot.state && this.reported.score === snapshot.score) return;
    this.reported = snapshot;
    this.onChange(snapshot);
  }
}
