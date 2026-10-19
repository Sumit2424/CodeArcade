import type { GameDefinition } from '../types';
import { SnakeGame } from './snake-game';

export const snakeDefinition: GameDefinition = {
  meta: {
    id: 'snake',
    title: 'Snake',
    description: 'Eat, grow, and do not bite yourself.',
    controls: 'Arrow keys / WASD · P: pause',
  },
  create: () => new SnakeGame(),
};
