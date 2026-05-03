import { PrivyProvider } from '@privy-io/react-auth';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { PRIVY_APP_ID, privyConfig } from '@/lib/privy-config';
import PrimePage from '@/components/pages/PrimePage';
import SpriteLabPage from '@/components/pages/SpriteLabPage';
import StarterRoomPage from '@/components/pages/StarterRoomPage';
import VariationsLabPage from '@/components/pages/VariationsLabPage';

const hasPrivyAppId = PRIVY_APP_ID.trim().length > 0 && !PRIVY_APP_ID.includes('your_app_id');

function Home() {
  return (
    <div style={{ padding: 32, fontFamily: 'JetBrains Mono, monospace' }}>
      <h1>Looplings</h1>
      <p style={{ marginTop: 16, color: '#666' }}>
        Autonomous AI agent product. Watch Prime live in real time.
      </p>
      <nav style={{ marginTop: 24, display: 'flex', gap: 16 }}>
        <Link to="/prime">Visit Prime</Link>
        <Link to="/room">Starter Room</Link>
        <Link to="/lab/sprites">Sprite Lab</Link>
        <Link to="/lab/variations">Variation Lab</Link>
      </nav>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/prime" element={<PrimePage />} />
        <Route path="/room" element={<StarterRoomPage />} />
        <Route path="/lab/sprites" element={<SpriteLabPage />} />
        <Route path="/lab/variations" element={<VariationsLabPage />} />
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
