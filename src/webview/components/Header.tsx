import type { SessionState } from '../../shared/session';
import { StatusPill } from './StatusPill';

interface HeaderProps {
  session: SessionState;
  integrationEnabled: boolean;
  onHome: () => void;
}

export function Header({ session, integrationEnabled, onHome }: HeaderProps) {
  return (
    <header className="header">
      <button className="brand" type="button" onClick={onHome}>
        <span className="brand-mark" aria-hidden="true">
          ▶
        </span>
        Code Arcade
      </button>
      <StatusPill session={session} integrationEnabled={integrationEnabled} />
    </header>
  );
}
