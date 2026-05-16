import { useCallback, useEffect, useState } from 'react';
import { HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import StarterRoomScene, {
  type FocusZoneId,
  type RoomInspectionSnapshot,
} from '@/components/scenes/StarterRoomScene';
import { RoomIntro } from '@/components/room/RoomIntro';
import { RoomAbout } from '@/components/room/RoomAbout';
import { ActiveCharacterProvider } from '@/data/active-character-context';
import { DEFAULT_CHARACTER_ID, resolveCharacterId } from '@/data/showcase-roster';

const ACTIVE_CHARACTER_STORAGE_KEY = 'looplings:active-character';

export default function StarterRoomPage() {
  const [cameraResetTick, setCameraResetTick] = useState(0);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspectCamera, setInspectCamera] = useState<RoomInspectionSnapshot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [focus, setFocus] = useState<FocusZoneId | null>(null);
  const [activeCharacterId, setActiveCharacterId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_CHARACTER_ID;
    const saved = window.localStorage.getItem(ACTIVE_CHARACTER_STORAGE_KEY);
    return resolveCharacterId(saved);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, activeCharacterId);
  }, [activeCharacterId]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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
    <ActiveCharacterProvider characterId={activeCharacterId} setCharacterId={setActiveCharacterId}>
    <main className="starter-room-page">
      <StarterRoomScene
        resetSignal={cameraResetTick}
        inspectMode={inspectMode}
        onInspectCameraChange={setInspectCamera}
        focus={focus}
        onFocusChange={setFocus}
        characterId={activeCharacterId}
        onCharacterChange={setActiveCharacterId}
      />
      <div className="starter-room-overlay starter-room-overlay--top">
        <span className="starter-room-mark">LOOPLINGS</span>
        <span className={`starter-room-status${inspectMode ? '' : ' is-preview'}`}>
          {inspectMode ? (
            'ROOM INSPECTION MODE'
          ) : (
            <>
              <i aria-hidden="true" />
              PREVIEW MODE
            </>
          )}
        </span>
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
          className="starter-room-control-button"
          onClick={() => setAboutOpen(true)}
          aria-label="How Looplings work"
          title="How Looplings work"
        >
          <HelpCircle size={16} strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          className={`starter-room-control-button${isFullscreen ? ' is-active' : ''}`}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 size={16} strokeWidth={2.4} aria-hidden />
          ) : (
            <Maximize2 size={16} strokeWidth={2.4} aria-hidden />
          )}
        </button>
      </div>
      <RoomIntro onOpenAbout={() => setAboutOpen(true)} />
      <RoomAbout open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </main>
    </ActiveCharacterProvider>
  );
}
