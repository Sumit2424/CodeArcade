/** Display information every game provides. */
export interface GameMeta {
  /** Stable identifier, also used as the key for saved scores. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Short controls hint shown on the launcher card, e.g. "Arrow keys / WASD". */
  readonly controls: string;
}

/** Device-independent input. The engine maps keys to these; games never see raw keys. */
export type GameInput = 'up' | 'down' | 'left' | 'right' | 'action';

/**
 * The contract every game implements. A game is plain TypeScript: it holds its own
 * state, advances it in fixed steps, and draws itself. It does not run its own loop,
 * read the keyboard, or manage pausing; the engine does that.
 */
export interface Game {
  /** Logical canvas size in pixels. The engine scales it to the screen. */
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly isGameOver: boolean;

  /** Return to the starting state. Called before every run. */
  reset(): void;
  /** Advance the simulation by `dt` seconds (always a fixed step). */
  update(dt: number): void;
  /** Draw the whole frame, background included. */
  render(ctx: CanvasRenderingContext2D): void;
  /** Called only while the game is running (never while paused or over). */
  onInput(input: GameInput): void;
}

/** What the registry holds for each playable game. */
export interface GameDefinition {
  readonly meta: GameMeta;
  readonly create: () => Game;
}
