import type { SessionState } from '../../shared/session';
import { formatElapsed, useElapsed } from '../hooks/useElapsed';

interface StripContent {
  label: string;
  detail: string;
}

const CONTENT: Record<SessionState, StripContent> = {
  idle: { label: 'No Claude session', detail: 'Start a task and the game follows along' },
  working: { label: 'Claude is working', detail: 'A good time for a quick game' },
  attention: { label: 'Claude needs you', detail: 'Answer in the Claude panel on the right' },
  question: { label: 'Claude has a question', detail: 'Answer in the Claude panel on the right' },
  finished: { label: 'Claude finished', detail: 'Review the changes when you are ready' },
  stopped: { label: 'Claude stopped', detail: 'The turn ended with an error. Check Claude Code' },
};

const MANUAL: StripContent = {
  label: 'Manual mode',
  detail: 'Claude Code is not connected, so the game will not pause for you',
};

interface SessionStripProps {
  session: SessionState;
  /** When the current state began, in ms since the epoch. */
  since: number;
  integrationEnabled: boolean;
}

/** Always-visible line that says what Claude is doing, so a paused game is never a mystery. */
export function SessionStrip({ session, since, integrationEnabled }: SessionStripProps) {
  const timed =
    integrationEnabled &&
    (session === 'working' || session === 'attention' || session === 'question');
  const elapsed = useElapsed(since, timed);
  const content = integrationEnabled ? CONTENT[session] : MANUAL;
  const tone = integrationEnabled ? session : 'manual';

  return (
    <div
      className={`session-strip strip-${tone}`}
      role={tone === 'attention' || tone === 'question' ? 'alert' : 'status'}
    >
      <span className="strip-dot" aria-hidden="true" />
      <span className="strip-label">{content.label}</span>
      <span className="strip-detail">{content.detail}</span>
      {timed && <span className="strip-time">{formatElapsed(elapsed)}</span>}
    </div>
  );
}
