import { PALETTE } from '../engine/palette';
import { CELL, COLUMNS, ROWS } from './constants';
import type { Direction, Point } from './grid';

/** The read-only state the renderer needs. */
export interface SnakeView {
  readonly snake: readonly Point[];
  readonly food: Point | undefined;
  readonly direction: Direction;
}

const INSET = 2;
const RADIUS = 6;

export function drawBoard(ctx: CanvasRenderingContext2D, view: SnakeView): void {
  drawBackground(ctx);
  if (view.food) drawFood(ctx, view.food);
  drawSnake(ctx, view);
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.background;
  ctx.fillRect(0, 0, COLUMNS * CELL, ROWS * CELL);
  ctx.fillStyle = PALETTE.grid;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLUMNS; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }
}

function drawFood(ctx: CanvasRenderingContext2D, food: Point): void {
  ctx.fillStyle = PALETTE.danger;
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake(ctx: CanvasRenderingContext2D, view: SnakeView): void {
  // Draw tail first so the head ends up on top.
  for (let i = view.snake.length - 1; i >= 0; i--) {
    const segment = view.snake[i];
    if (!segment) continue;
    ctx.fillStyle = i === 0 ? PALETTE.accent : fade(i, view.snake.length);
    ctx.beginPath();
    ctx.roundRect(
      segment.x * CELL + INSET,
      segment.y * CELL + INSET,
      CELL - INSET * 2,
      CELL - INSET * 2,
      RADIUS,
    );
    ctx.fill();
  }
  const head = view.snake[0];
  if (head) drawEyes(ctx, head, view.direction);
}

/** Body segments get slightly darker towards the tail. */
function fade(index: number, length: number): string {
  const lightness = 62 - Math.round((index / Math.max(length - 1, 1)) * 22);
  return `hsl(172 70% ${lightness}%)`;
}

function drawEyes(ctx: CanvasRenderingContext2D, head: Point, direction: Direction): void {
  const cx = head.x * CELL + CELL / 2;
  const cy = head.y * CELL + CELL / 2;
  const forward = 4;
  const side = 4;
  const eyes: Record<Direction, [Point, Point]> = {
    up: [
      { x: cx - side, y: cy - forward },
      { x: cx + side, y: cy - forward },
    ],
    down: [
      { x: cx - side, y: cy + forward },
      { x: cx + side, y: cy + forward },
    ],
    left: [
      { x: cx - forward, y: cy - side },
      { x: cx - forward, y: cy + side },
    ],
    right: [
      { x: cx + forward, y: cy - side },
      { x: cx + forward, y: cy + side },
    ],
  };
  ctx.fillStyle = PALETTE.background;
  for (const eye of eyes[direction]) {
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
