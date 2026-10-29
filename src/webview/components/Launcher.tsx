import { GAMES } from '../../games/registry';
import { bestScore, type ScoreMap } from '../../shared/scores';
import { GameCard } from './GameCard';

interface LauncherProps {
  scores: ScoreMap;
  onPlay: (gameId: string) => void;
}

export function Launcher({ scores, onPlay }: LauncherProps) {
  return (
    <section>
      <h1 className="page-title">Pick a game</h1>
      <p className="muted">Play while your coding assistant works.</p>
      <div className="game-grid">
        {GAMES.map((game) => (
          <GameCard
            key={game.meta.id}
            game={game.meta}
            best={bestScore(scores, game.meta.id)}
            onPlay={onPlay}
          />
        ))}
        <div className="game-card game-card-soon">
          <span className="game-title">Dino Runner</span>
          <span className="game-description">Jump the cacti. Coming soon.</span>
        </div>
      </div>
    </section>
  );
}
