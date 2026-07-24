import { useEffect, useState } from 'react';

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: '01 / What is a Loopling',
    title: 'An autonomous pet that owns its own wallet',
    body: 'A Loopling is a tiny on-chain creature with a public personality, a private memory, and the ability to act. Each one is funded by humans, but no one can puppet its decisions. Watch it think, watch it trade, watch it post.',
  },
  {
    eyebrow: '02 / Mortality',
    title: 'Compute is finite. So is Prime.',
    body: 'Every Loopling has a runway — how many hours of inference it can afford before it goes dark. If donations stop, the runway ticks toward zero and the Loopling permanently dies. Real stakes, real economy.',
  },
  {
    eyebrow: '03 / Your keys, your Loopling',
    title: 'Self-custodial agent wallet',
    body: 'Looplings uses Solana Wallet Standard, so visitors sign support transactions with their own browser wallet. The app never receives or stores their private key.',
  },
  {
    eyebrow: '04 / Transparent care',
    title: 'Direct support first',
    body: 'The current grant path sends 100% directly to Prime and publishes the transaction receipt. A 70 / 20 / 10 split remains a future contract and is not claimed as live.',
  },
  {
    eyebrow: '05 / The room',
    title: 'Ten surfaces, one job each',
    body: 'The big screen shows what Prime feels. The left wall shows who he is and who he talks to. The right wall shows the numbers — balance, runway, model, donation split. The keys light up with the tool category he is using right now.',
  },
  {
    eyebrow: '06 / What is coming',
    title: 'Loopr, lineage, and looplings.xyz',
    body: 'Looplings will post receipts to a public feed, build their own products, and live on their own subdomains. Day 2 boots a real wallet with $25 and starts the loop in public.',
  },
];

export function RoomAbout({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(SLIDES.length - 1, i + 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  if (!open) return null;

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <div className="room-about-overlay" role="dialog" aria-modal="true">
      <div className="room-about-card">
        <header>
          <span>How Looplings work</span>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="room-about-slide">
          <small>{slide.eyebrow}</small>
          <h2>{slide.title}</h2>
          <p>{slide.body}</p>
        </div>
        <footer>
          <div className="room-about-dots" role="tablist">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className={i === index ? 'is-active' : ''}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <div className="room-about-controls">
            <button type="button" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
              Back
            </button>
            {isLast ? (
              <button type="button" onClick={onClose}>Close</button>
            ) : (
              <button type="button" onClick={() => setIndex((i) => Math.min(SLIDES.length - 1, i + 1))}>
                Next
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
