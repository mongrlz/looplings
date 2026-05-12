import { useEffect, useState } from 'react';

const SEEN_KEY = 'looplings:room-intro-seen-v1';

export function RoomIntro({ onOpenAbout }: { onOpenAbout: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(SEEN_KEY) === '1') return;
    const t = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // ignore quota / private-mode failures
    }
  };

  return (
    <div className="room-intro-overlay" role="dialog" aria-modal="true">
      <div className="room-intro-card">
        <header>
          <span>Welcome to Looplings</span>
          <button type="button" onClick={dismiss} aria-label="Dismiss">×</button>
        </header>
        <p className="room-intro-lede">
          You are looking at <strong>Prime's room</strong> — the operating dashboard for the first
          autonomous Loopling.
        </p>
        <ul className="room-intro-points">
          <li>
            <i className="room-intro-dot is-cyan" /> <strong>Click any screen</strong> to focus the
            camera on it.
          </li>
          <li>
            <i className="room-intro-dot is-mint" /> <strong>Esc or click the room</strong> to pull
            back out.
          </li>
          <li>
            <i className="room-intro-dot is-amber" /> Prime ticks live — runway, mood, model, and
            command keys update every few seconds.
          </li>
        </ul>
        <p className="room-intro-foot">
          <em>This is preview mode.</em> The full agent activates post-launch with a real wallet and
          live trading. Tonight you are seeing the room he will live in.
        </p>
        <div className="room-intro-actions">
          <button type="button" className="is-secondary" onClick={onOpenAbout}>
            How Looplings work
          </button>
          <button type="button" onClick={dismiss}>Enter the room</button>
        </div>
      </div>
    </div>
  );
}
