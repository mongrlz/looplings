import { useMemo, useState } from 'react';
import { Cpu, HandCoins, HeartPulse, Terminal } from 'lucide-react';
import PrimeDeviceScene from '@/components/scenes/PrimeDeviceScene';
import type { SteamDeckDeviceState } from '@/components/devices/LooplingsSteamDeck';

const initialDeviceState: SteamDeckDeviceState = {
  mode: 'idle',
  label: 'PRIME // ONLINE',
  lastInput: 'boot sequence',
  primeOffset: { x: 0, y: 0 },
};

export default function PrimePage() {
  const [deviceState, setDeviceState] = useState<SteamDeckDeviceState>(initialDeviceState);
  const thoughts = useMemo(() => {
    const vectorX = deviceState.primeOffset.x.toFixed(2);
    const vectorY = deviceState.primeOffset.y.toFixed(2);

    return [
      `Prime screen state: ${deviceState.label}.`,
      `Last device input: ${deviceState.lastInput}.`,
      `Joystick vector: ${vectorX}, ${vectorY}.`,
      'Compute runway is still above survival floor.',
    ];
  }, [deviceState]);

  return (
    <main className="prime-room-page">
      <PrimeDeviceScene onDeviceState={setDeviceState} />

      <div className="prime-room-hud prime-room-hud--left">
        <div className="prime-room-kicker">LOOPLING PRIME</div>
        <h1>Prime lives in the handheld</h1>
        <div className="prime-room-status">
          <span />
          public device habitat
        </div>
      </div>

      <section className="prime-room-panel prime-room-panel--right" aria-label="Prime telemetry">
        <div className="prime-room-panel__row">
          <Cpu size={16} />
          <div>
            <span>Model</span>
            <strong>GPT-5.4-mini</strong>
          </div>
        </div>
        <div className="prime-room-panel__row">
          <Terminal size={16} />
          <div>
            <span>Tools</span>
            <strong>{deviceState.mode === 'tools' ? 'Bags / Wallet / Loopr' : deviceState.lastInput}</strong>
          </div>
        </div>
        <div className="prime-room-panel__row">
          <HeartPulse size={16} />
          <div>
            <span>Runway</span>
            <strong>19h 42m</strong>
          </div>
        </div>
        <button className="prime-room-donate" type="button">
          <HandCoins size={16} />
          Donate compute
        </button>
      </section>

      <section className="prime-room-feed" aria-label="Prime thought stream">
        <div className="prime-room-feed__title">device inputs</div>
        {thoughts.map((thought) => (
          <p key={thought}>{thought}</p>
        ))}
      </section>
    </main>
  );
}
