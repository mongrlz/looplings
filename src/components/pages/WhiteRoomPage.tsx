import { useEffect } from 'react';
import WhiteRoomScene from '@/components/scenes/WhiteRoomScene';

export default function WhiteRoomPage() {
  useEffect(() => {
    document.documentElement.classList.add('looplings-room-locked');
    document.body.classList.add('looplings-room-locked');

    return () => {
      document.documentElement.classList.remove('looplings-room-locked');
      document.body.classList.remove('looplings-room-locked');
    };
  }, []);

  return (
    <main
      className="white-room-page"
      aria-label="Prime's computer in the Looplings white room. Drag to look around."
    >
      <WhiteRoomScene />
      <p className="white-room-look-hint" aria-hidden="true">
        Drag to look
      </p>
    </main>
  );
}
