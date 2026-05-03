import { useEffect, useState } from 'react';
import { Crosshair, RotateCcw } from 'lucide-react';
import StarterRoomScene, { type RoomInspectionSnapshot } from '@/components/scenes/StarterRoomScene';

export default function StarterRoomPage() {
  const [cameraResetTick, setCameraResetTick] = useState(0);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectCamera, setInspectCamera] = useState<RoomInspectionSnapshot | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('looplings-room-locked');
    document.body.classList.add('looplings-room-locked');

    return () => {
      document.documentElement.classList.remove('looplings-room-locked');
      document.body.classList.remove('looplings-room-locked');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'r') {
        setCameraResetTick((tick) => tick + 1);
      }
      if (key === 'i') {
        setInspectMode((enabled) => !enabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!inspectMode) setInspectCamera(null);
  }, [inspectMode]);

  return (
    <main className="starter-room-page">
      <StarterRoomScene
        resetSignal={cameraResetTick}
        inspectMode={inspectMode}
        onInspectCameraChange={setInspectCamera}
      />
      <div className="starter-room-overlay starter-room-overlay--top">
        <span className="starter-room-mark">LOOPLINGS</span>
        <span className="starter-room-status">{inspectMode ? 'ROOM INSPECTION MODE' : 'STARTER ROOM TEMPLATE'}</span>
      </div>
      {inspectMode ? (
        <div className="starter-room-inspect-panel">
          <span>INSPECT</span>
          <strong>
            X {inspectCamera?.x.toFixed(2) ?? '0.00'} / Y {inspectCamera?.y.toFixed(2) ?? '0.00'} / Z{' '}
            {inspectCamera?.z.toFixed(2) ?? '0.00'}
          </strong>
          <small>
            YAW {inspectCamera?.yaw.toFixed(1) ?? '0.0'} / PITCH {inspectCamera?.pitch.toFixed(1) ?? '0.0'} / WASD QE
          </small>
        </div>
      ) : null}
      <div className="starter-room-view-controls">
        <button
          type="button"
          className={`starter-room-control-button${inspectMode ? ' is-active' : ''}`}
          onClick={() => setInspectMode((enabled) => !enabled)}
          aria-label="Toggle room inspection mode"
          aria-pressed={inspectMode}
          title="Inspect room placement"
        >
          <Crosshair size={16} strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          className="starter-room-control-button"
          onClick={() => setCameraResetTick((tick) => tick + 1)}
          aria-label="Reset room view"
          title="Reset room view"
        >
          <RotateCcw size={16} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    </main>
  );
}
