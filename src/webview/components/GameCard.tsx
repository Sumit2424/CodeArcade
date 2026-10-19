import type { GameMeta } from '../../games/types';
import { GameIcon } from './GameIcon';

interface GameCardProps {
  game: GameMeta;
  best: number;
  onPlay: (gameId: string) => void;
}

export function GameCard({ game, best, onPlay }: GameCardProps) {
  return (
    <button className="game-card" type="button" onClick={() => onPlay(game.id)}>
      <GameIcon gameId={game.id} />
      <span className="game-title">{game.title}</span>
      <span className="game-description">{game.description}</span>
      <span className="game-controls">{game.controls}</span>
      {best > 0 && <span className="game-best">Best {best}</span>}
    </button>
  );
}
