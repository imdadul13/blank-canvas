import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic favicon cache buster to force Chrome/Safari to refresh tab icon immediately
if (typeof window !== 'undefined') {
  try {
    const buildTs = '20260929_apple_blue';
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

// Expose platform/standalone state before React mounts so the shell can apply
// iOS-specific viewport behavior without waiting for a component render.
if (typeof window !== 'undefined') {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true;
  document.documentElement.classList.toggle('pwa-ios', isIos);
  document.documentElement.classList.toggle('pwa-standalone', isStandalone);
}

// Service Worker registration for the iOS and browser application shell.
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (window.location.protocol.startsWith('http')) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          // iOS can leave a PWA suspended for days. Check whenever it resumes
          // instead of waiting for the browser's next periodic update pass.
          const update = () => registration.update().catch(() => undefined);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') update();
          });
          update();
        })
        .catch((err) => {
          console.warn('[SW] Registration failed (non-fatal):', err);
        });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
