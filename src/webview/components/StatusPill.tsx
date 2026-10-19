import type { SessionState } from '../../shared/session';

const LABELS: Record<SessionState, string> = {
  idle: 'Claude idle',
  working: 'Claude is working',
  attention: 'Claude needs you',
  finished: 'Claude finished',
};

interface StatusPillProps {
  session: SessionState;
  integrationEnabled: boolean;
}

export function StatusPill({ session, integrationEnabled }: StatusPillProps) {
  // Without the integration the session can never change, so say so instead of "idle".
  const shown: SessionState = integrationEnabled ? session : 'idle';
  const label = integrationEnabled ? LABELS[session] : 'Manual mode';
  return (
    <span className={`status-pill status-${shown}`} role="status">
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
