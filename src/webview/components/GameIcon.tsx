interface GameIconProps {
  gameId: string;
}

/** Small inline SVG per game; falls back to a generic gamepad shape. */
export function GameIcon({ gameId }: GameIconProps) {
  return (
    <svg className="game-icon" viewBox="0 0 48 48" aria-hidden="true">
      {gameId === 'snake' ? (
        <>
          <path
            d="M8 36h20a6 6 0 0 0 0-12H20a6 6 0 0 1 0-12h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="38" cy="12" r="2" fill="var(--surface)" />
          <circle cx="8" cy="12" r="3.5" fill="var(--danger)" />
        </>
      ) : gameId === 'dino' ? (
        <g fill="currentColor">
          <rect x="22" y="8" width="18" height="11" rx="2" />
          <rect x="14" y="17" width="22" height="15" rx="2" />
          <rect x="5" y="20" width="10" height="6" rx="2" />
          <rect x="17" y="31" width="5" height="9" rx="1" />
          <rect x="28" y="31" width="5" height="9" rx="1" />
          <rect x="34" y="11" width="3" height="3" fill="var(--surface)" />
        </g>
      ) : (
        <rect x="6" y="14" width="36" height="20" rx="8" fill="currentColor" />
      )}
    </svg>
  );
}
