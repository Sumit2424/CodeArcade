import type { GameInput } from '../types';

/** Game inputs plus the one control the engine handles itself. */
export type RunnerInput = GameInput | 'pause';

const KEY_MAP: Readonly<Record<string, RunnerInput>> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'action',
  Enter: 'action',
  KeyP: 'pause',
  Escape: 'pause',
};

/** Maps a KeyboardEvent.code to an input, or undefined for keys the games ignore. */
export function keyToInput(code: string): RunnerInput | undefined {
  return KEY_MAP[code];
}
