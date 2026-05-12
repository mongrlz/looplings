import { PrivyProvider } from '@privy-io/react-auth';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PRIVY_APP_ID, privyConfig } from '@/lib/privy-config';
import LogoLabPage from '@/components/pages/LogoLabPage';
import PrimePage from '@/components/pages/PrimePage';
import ScreenDeckPage from '@/components/pages/ScreenDeckPage';
import ScreenLabPage from '@/components/pages/ScreenLabPage';
import SpriteLabPage from '@/components/pages/SpriteLabPage';
import StarterRoomPage from '@/components/pages/StarterRoomPage';
import VariationsLabPage from '@/components/pages/VariationsLabPage';

const hasPrivyAppId = PRIVY_APP_ID.trim().length > 0 && !PRIVY_APP_ID.includes('your_app_id');

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StarterRoomPage />} />
        <Route path="/room" element={<StarterRoomPage />} />
        <Route path="/prime" element={<PrimePage />} />
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
  if (!hasPrivyAppId) {
    return <AppRoutes />;
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <AppRoutes />
    </PrivyProvider>
  );
}
