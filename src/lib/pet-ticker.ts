import { useEffect, useState } from 'react';

const FRAME_COUNT = 7;
const FRAME_MS = 180;

let currentFrame = 0;
let intervalId: number | null = null;
const subscribers = new Set<() => void>();

function ensureRunning() {
  if (intervalId !== null) return;
  if (typeof window === 'undefined') return;
  intervalId = window.setInterval(() => {
    currentFrame = (currentFrame + 1) % FRAME_COUNT;
    for (const cb of subscribers) cb();
  }, FRAME_MS);
}

function subscribe(cb: () => void) {
  ensureRunning();
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function getPetFrame(): number {
  return currentFrame;
}

export function usePetFrame(initialOffset = 0): number {
  const [frame, setFrame] = useState(() => (currentFrame + initialOffset) % FRAME_COUNT);
  useEffect(() => {
    const unsub = subscribe(() => setFrame((currentFrame + initialOffset) % FRAME_COUNT));
    return unsub;
  }, [initialOffset]);
  return frame;
}

export const PET_FRAME_COUNT = FRAME_COUNT;
