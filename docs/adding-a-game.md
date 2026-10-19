# Adding a game

A game is a small, self-contained TypeScript module. It holds its own state, advances it in fixed steps and draws itself. The engine handles the loop, keyboard, pause and game-over lifecycle, scores and UI.

## The contract

Defined in [`src/games/types.ts`](../src/games/types.ts):

```ts
interface Game {
  readonly width: number; // logical canvas size in pixels
  readonly height: number;
  readonly score: number; // whole number, 0 to 1,000,000
  readonly isGameOver: boolean;

  reset(): void; // back to the starting state; called before every run
  update(dt: number): void; // advance by dt seconds (always 1/60)
  render(ctx: CanvasRenderingContext2D): void; // draw the whole frame
  onInput(input: GameInput): void; // 'up' | 'down' | 'left' | 'right' | 'action'
}

interface GameDefinition {
  readonly meta: GameMeta; // id, title, description, controls
  readonly create: () => Game;
}
```

The engine never gives a game raw keys, and it pauses, resumes and restarts games by itself. `onInput` is called only while the game is running, and only with key presses (including key repeats), not key state.

## Steps

1. **Create a folder** `src/games/<id>/`. The id is lowercase letters, digits and dashes, at most 32 characters; it is also the key for saved scores.
2. **Write the game class** in `src/games/<id>/<id>-game.ts`, implementing `Game`.
3. **Export a definition** from `src/games/<id>/index.ts`.
4. **Register it** in [`src/games/registry.ts`](../src/games/registry.ts).
5. _(Optional)_ Add an icon case for the id in [`GameIcon.tsx`](../src/webview/components/GameIcon.tsx). Without one, a generic icon is shown.
6. Run `npm run check`, then try it with F5 or `npm run dev:web`.

## Example

`src/games/dodge/dodge-game.ts`:

```ts
import { PALETTE } from '../engine/palette';
import type { Game, GameInput } from '../types';

const WIDTH = 320;
const HEIGHT = 240;
const PLAYER_SIZE = 24;
const BLOCK_SIZE = 20;
const STEP = 20; // pixels per key press
const FALL_SPEED = 120; // pixels per second
const SPAWN_EVERY = 0.6; // seconds

interface Block {
  x: number;
  y: number;
}

export class DodgeGame implements Game {
  readonly width = WIDTH;
  readonly height = HEIGHT;
  score = 0;
  isGameOver = false;

  private playerX = 0;
  private blocks: Block[] = [];
  private sinceSpawn = 0;
  private survived = 0;

  /** `random` is injectable so behavior can be made deterministic in tests. */
  constructor(private readonly random: () => number = Math.random) {
    this.reset();
  }

  reset(): void {
    this.playerX = (WIDTH - PLAYER_SIZE) / 2;
    this.blocks = [];
    this.sinceSpawn = 0;
    this.survived = 0;
    this.score = 0;
    this.isGameOver = false;
  }

  onInput(input: GameInput): void {
    if (input === 'left') this.playerX = Math.max(0, this.playerX - STEP);
    if (input === 'right') this.playerX = Math.min(WIDTH - PLAYER_SIZE, this.playerX + STEP);
  }

  update(dt: number): void {
    this.survived += dt;
    this.score = Math.floor(this.survived * 10);

    this.sinceSpawn += dt;
    if (this.sinceSpawn >= SPAWN_EVERY) {
      this.sinceSpawn -= SPAWN_EVERY;
      this.blocks.push({ x: this.random() * (WIDTH - BLOCK_SIZE), y: -BLOCK_SIZE });
    }

    for (const block of this.blocks) block.y += FALL_SPEED * dt;
    this.blocks = this.blocks.filter((block) => block.y < HEIGHT);

    const playerY = HEIGHT - PLAYER_SIZE;
    this.isGameOver = this.blocks.some(
      (block) =>
        block.x < this.playerX + PLAYER_SIZE &&
        block.x + BLOCK_SIZE > this.playerX &&
        block.y < playerY + PLAYER_SIZE &&
        block.y + BLOCK_SIZE > playerY,
    );
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.background;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = PALETTE.danger;
    for (const block of this.blocks) ctx.fillRect(block.x, block.y, BLOCK_SIZE, BLOCK_SIZE);
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(this.playerX, HEIGHT - PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
  }
}
```

`src/games/dodge/index.ts`:

```ts
import type { GameDefinition } from '../types';
import { DodgeGame } from './dodge-game';

export const dodgeDefinition: GameDefinition = {
  meta: {
    id: 'dodge',
    title: 'Dodge',
    description: 'Slide left and right to avoid the falling blocks.',
    controls: 'Left / Right · P: pause',
  },
  create: () => new DodgeGame(),
};
```

`src/games/registry.ts`:

```ts
import { dodgeDefinition } from './dodge';
import { snakeDefinition } from './snake';
import type { GameDefinition } from './types';

/** Every game shown in the launcher, in display order. */
export const GAMES: readonly GameDefinition[] = [snakeDefinition, dodgeDefinition];

export function findGame(id: string): GameDefinition | undefined {
  return GAMES.find((game) => game.meta.id === id);
}
```

For a larger game, split it the way Snake is (`src/games/snake/`): constants, rules, rendering and the definition in separate small files.

## Rules for contributed games

- Plain TypeScript, no new dependencies, no network, no `eval` or dynamic imports.
- Do not import from `src/extension` or `src/webview`, and never from `vscode` (ESLint enforces this).
- Draw only with the `ctx` you are given, and use the colors in `PALETTE` so games match the theme.
- Keep `score` a non-negative whole number. Anything outside 0 to 1,000,000 is rejected when saving.
- Take randomness as an injectable `() => number` (default `Math.random`) so rules can be tested deterministically.
- Make the game finish: set `isGameOver` when the run ends so the score is saved and the overlay appears.

## Checklist for your pull request

- [ ] `npm run check` passes.
- [ ] You played it in the Extension Development Host: start, pause (P and click-away), game over, restart.
- [ ] The best score saves and shows on the launcher card.
- [ ] Controls are listed in `meta.controls`.
