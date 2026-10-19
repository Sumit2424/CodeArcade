import type { SessionState } from '../../shared/session';

interface SessionBannerProps {
  session: SessionState;
}

/** Tells the user what Claude is doing, so a paused game is never a mystery. */
export function SessionBanner({ session }: SessionBannerProps) {
  switch (session) {
    case 'attention':
      return (
        <div className="session-banner banner-attention" role="alert">
          Claude needs your attention. Switch to the Claude panel to respond.
        </div>
      );
    case 'finished':
      return (
        <div className="session-banner banner-finished" role="status">
          Claude finished its turn.
        </div>
      );
    case 'working':
      return (
        <div className="session-banner banner-working" role="status">
          Claude is working. A good time for a quick game.
        </div>
      );
    case 'idle':
      return null;
  }
}
