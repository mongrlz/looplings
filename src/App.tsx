import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LogoLabPage from '@/components/pages/LogoLabPage';
import PrimePage from '@/components/pages/PrimePage';
import ScreenDeckPage from '@/components/pages/ScreenDeckPage';
import ScreenLabPage from '@/components/pages/ScreenLabPage';
import SpriteLabPage from '@/components/pages/SpriteLabPage';
import StarterRoomPage from '@/components/pages/StarterRoomPage';
import VariationsLabPage from '@/components/pages/VariationsLabPage';
import WhiteRoomPage from '@/components/pages/WhiteRoomPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WhiteRoomPage />} />
        <Route path="/room" element={<WhiteRoomPage />} />
        <Route path="/prime" element={<PrimePage />} />
        <Route path="/lab/starter-room" element={<StarterRoomPage />} />
        <Route path="/lab/sprites" element={<SpriteLabPage />} />
        <Route path="/lab/variations" element={<VariationsLabPage />} />
        <Route path="/lab/screens" element={<ScreenLabPage />} />
        <Route path="/lab/screen-deck" element={<ScreenDeckPage />} />
        <Route path="/lab/logos" element={<LogoLabPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppRoutes />;
}
