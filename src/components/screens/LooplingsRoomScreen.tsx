import { useEffect, useState, type CSSProperties } from 'react';

const ATLAS_VERSION = 'loopling-state-atlas-2026-05-02';
const ATLAS_COLS = 8;
const ATLAS_ROWS = 12;

const atlasUrl = (pet: string) => `/pets/${pet}/state-atlas.png?v=${ATLAS_VERSION}`;

const states = {
  idle: { row: 0, fps: 5, frames: 8 },
  thinking: { row: 1, fps: 5, frames: 8 },
  acting: { row: 2, fps: 8, frames: 8 },
  trading: { row: 3, fps: 9, frames: 8 },
  posting: { row: 6, fps: 6, frames: 8 },
} as const;

type RoomLooplingState = keyof typeof states;

const pets = [
  {
    id: 'PRIME-00',
    name: 'Prime',
    state: 'Thinking',
    atlas: atlasUrl('prime-test'),
    visualState: 'thinking',
    accent: '#78d7ff',
  },
  {
    id: 'PINK-01',
    name: 'Pink',
    state: 'Posting',
    atlas: atlasUrl('pink'),
    visualState: 'posting',
    accent: '#ff79b7',
  },
  {
    id: 'BLUE-02',
    name: 'Blue',
    state: 'Scanning',
    atlas: atlasUrl('blue'),
    visualState: 'trading',
    accent: '#77bfff',
  },
  {
    id: 'SPARK-03',
    name: 'Spark',
    state: 'Charging',
    atlas: atlasUrl('spark'),
    visualState: 'acting',
    accent: '#ffd15c',
  },
] satisfies Array<{
  id: string;
  name: string;
  state: string;
  atlas: string;
  visualState: RoomLooplingState;
  accent: string;
}>;

function useScreenClock() {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const interval = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 1000 / 12);
    return () => window.clearInterval(interval);
  }, []);

  return elapsedMs;
}

function getAtlasFrame(visualState: RoomLooplingState, elapsedMs: number) {
  const meta = states[visualState];
  if (meta.fps <= 0 || meta.frames <= 1) return 0;
  return Math.floor((elapsedMs / 1000) * meta.fps) % meta.frames;
}

function AtlasLoopling({
  atlas,
  visualState,
  size,
  label,
  elapsedMs,
}: {
  atlas: string;
  visualState: RoomLooplingState;
  size: number;
  label: string;
  elapsedMs: number;
}) {
  const frame = getAtlasFrame(visualState, elapsedMs);
  const meta = states[visualState];

  return (
    <div
      className="looplings-os__atlas-pet"
      style={{
        width: size,
        ['--atlas-cols' as string]: ATLAS_COLS,
        ['--atlas-rows' as string]: ATLAS_ROWS,
        ['--pet-frame' as string]: frame,
        ['--pet-row' as string]: meta.row,
      }}
      aria-label={label}
    >
      <img src={atlas} alt="" />
    </div>
  );
}

export default function LooplingsRoomScreen() {
  const elapsedMs = useScreenClock();

  return (
    <div className="looplings-os">
      <header className="looplings-os__header">
        <div>
          <span className="looplings-os__eyebrow">LOOPLINGS OS</span>
          <strong>Starter Habitat</strong>
        </div>
        <span className="looplings-os__pill">LIVE</span>
      </header>

      <section className="looplings-os__hero">
        <div className="looplings-os__sprite-stage">
          <AtlasLoopling atlas={atlasUrl('prime-test')} visualState="idle" size={108} label="Prime idle sprite" elapsedMs={elapsedMs} />
        </div>
        <div className="looplings-os__readout">
          <span>PRIME-00</span>
          <strong>alive</strong>
          <p>Scanning market conditions and keeping the loop warm.</p>
        </div>
      </section>

      <section className="looplings-os__stats" aria-label="Loopling status">
        <div>
          <span>Runway</span>
          <strong>19h 42m</strong>
        </div>
        <div>
          <span>Credits</span>
          <strong>$2.47</strong>
        </div>
        <div>
          <span>Next Tick</span>
          <strong>01:47</strong>
        </div>
      </section>

      <section className="looplings-os__grid" aria-label="Loopling roster">
        {pets.map((pet) => (
          <article key={pet.id} style={{ '--pet-accent': pet.accent } as CSSProperties}>
            <AtlasLoopling
              atlas={pet.atlas}
              visualState={pet.visualState}
              size={42}
              label={`${pet.name} ${pet.state} sprite`}
              elapsedMs={elapsedMs}
            />
            <div>
              <span>{pet.id}</span>
              <strong>{pet.state}</strong>
            </div>
          </article>
        ))}
      </section>

      <footer className="looplings-os__footer">
        <span>current task</span>
        <strong>Evaluating $VIRTUAL on Base</strong>
      </footer>
    </div>
  );
}
