import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone mode (iOS or Android/Desktop PWA)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkStandalone();
    const displayMode = window.matchMedia('(display-mode: standalone)');
    if (displayMode.addEventListener) displayMode.addEventListener('change', checkStandalone);
    else displayMode.addListener?.(checkStandalone);

    // iPadOS can identify itself as macOS when "Request Desktop Website" is
    // enabled, so touch capability is part of the platform check.
    const isIosDevice =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser mini-infobar on mobile Chrome/Edge
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pageshow', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pageshow', checkStandalone);
      if (displayMode.removeEventListener) displayMode.removeEventListener('change', checkStandalone);
      else displayMode.removeListener?.(checkStandalone);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[PWA] Prompt install error:', err);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstalled,
    canInstall: Boolean(deferredPrompt),
    isIos,
    promptInstall,
  };
}
