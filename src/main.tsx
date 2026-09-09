import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic favicon cache buster to force Chrome/Safari to refresh tab icon immediately
if (typeof window !== 'undefined') {
  try {
    const buildTs = '20260909c';
    const iconLinks = document.querySelectorAll<HTMLLinkElement>(
      "link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='shortcut icon']"
    );
    iconLinks.forEach((link) => {
      const rawHref = link.getAttribute('href');
      if (rawHref && !rawHref.includes('v=')) {
        link.href = `${rawHref}?v=${buildTs}`;
      }
    });
  } catch {
    // Non-blocking fallback
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
