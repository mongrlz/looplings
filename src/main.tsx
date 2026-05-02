import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setupHtmlInCanvas } from '@/lib/html-in-canvas-polyfill';
import App from './App';
import './styles/globals.css';

setupHtmlInCanvas();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
