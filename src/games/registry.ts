import { snakeDefinition } from './snake';
import type { GameDefinition } from './types';

/** Every game shown in the launcher, in display order. */
export const GAMES: readonly GameDefinition[] = [snakeDefinition];

export function findGame(id: string): GameDefinition | undefined {
  return GAMES.find((game) => game.meta.id === id);
}
