import type { Game, GameInput } from '../types';
import {
  CELL,
  COLUMNS,
  INITIAL_LENGTH,
  MAX_QUEUED_TURNS,
  MIN_STEP_SECONDS,
  POINTS_PER_FOOD,
  ROWS,
  SPEEDUP_PER_FOOD,
  START_STEP_SECONDS,
} from './constants';
import { DIRECTION_VECTORS, isOpposite, samePoint, type Direction, type Point } from './grid';
import { drawBoard, type SnakeView } from './render';

function toDirection(input: GameInput): Direction | undefined {
  return input === 'action' ? undefined : input;
}

export class SnakeGame implements Game, SnakeView {
  readonly width = COLUMNS * CELL;
  readonly height = ROWS * CELL;
  score = 0;
  isGameOver = false;

  /** Head first. */
  snake: Point[] = [];
  food: Point | undefined;
  direction: Direction = 'right';

  private pendingTurns: Direction[] = [];
  private foodEaten = 0;
  private sinceLastStep = 0;

  /** `random` is injectable so food placement can be made deterministic. */
  constructor(private readonly random: () => number = Math.random) {
    this.reset();
  }

  reset(): void {
    const headX = Math.floor(COLUMNS / 2);
    const headY = Math.floor(ROWS / 2);
    this.snake = Array.from({ length: INITIAL_LENGTH }, (_, i) => ({ x: headX - i, y: headY }));
    this.direction = 'right';
    this.pendingTurns = [];
    this.score = 0;
    this.foodEaten = 0;
    this.sinceLastStep = 0;
    this.isGameOver = false;
    this.placeFood();
  }

  onInput(input: GameInput): void {
    const turn = toDirection(input);
    if (!turn) return;
    // Compare against the last queued turn so quick double-taps cannot reverse the snake.
    const reference = this.pendingTurns.at(-1) ?? this.direction;
    if (turn === reference || isOpposite(turn, reference)) return;
    if (this.pendingTurns.length < MAX_QUEUED_TURNS) this.pendingTurns.push(turn);
  }

  update(dt: number): void {
    this.sinceLastStep += dt;
    const interval = this.stepInterval();
    while (this.sinceLastStep >= interval && !this.isGameOver) {
      this.sinceLastStep -= interval;
      this.step();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBoard(ctx, this);
  }

  private stepInterval(): number {
    return Math.max(MIN_STEP_SECONDS, START_STEP_SECONDS - this.foodEaten * SPEEDUP_PER_FOOD);
  }

  private step(): void {
    const turn = this.pendingTurns.shift();
    if (turn) this.direction = turn;

    const head = this.snake[0];
    if (!head) return;
    const vector = DIRECTION_VECTORS[this.direction];
    const next: Point = { x: head.x + vector.x, y: head.y + vector.y };

    if (next.x < 0 || next.x >= COLUMNS || next.y < 0 || next.y >= ROWS) {
      this.isGameOver = true;
      return;
    }

    const ate = this.food !== undefined && samePoint(next, this.food);
    // The tail cell is vacated this move, unless the snake grows into it.
    const blockers = ate ? this.snake : this.snake.slice(0, -1);
    if (blockers.some((segment) => samePoint(segment, next))) {
      this.isGameOver = true;
      return;
    }

    this.snake.unshift(next);
    if (ate) {
      this.score += POINTS_PER_FOOD;
      this.foodEaten += 1;
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }

  /** Puts food on a random free cell. With no free cell left the board is full: a win. */
  private placeFood(): void {
    const free: Point[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        if (!this.snake.some((segment) => segment.x === x && segment.y === y)) {
          free.push({ x, y });
        }
      }
    }
    if (free.length === 0) {
      this.food = undefined;
      this.isGameOver = true;
      return;
    }
    this.food = free[Math.floor(this.random() * free.length)];
  }
}
