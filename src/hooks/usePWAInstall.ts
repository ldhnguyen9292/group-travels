import { useCallback, useEffect, useState } from 'react';

/**
 * Chromium fires this instead of showing its own install bar, and hands us the
 * right to show it later. It is not in lib.dom, so it is spelled out here.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const INSTALL_DISMISSED_KEY = 'install-prompt-dismissed';

/**
 * How the app can be installed on the current browser.
 * - `prompt`  — Chromium handed us a deferred prompt; one tap does it.
 * - `ios`     — WebKit has no install API at all, so the only route is the
 *               system share sheet and we can only tell the user where it is.
 * - `none`    — already installed, or a browser with no install path.
 */
export type InstallMethod = 'prompt' | 'ios' | 'none';

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; the touch points give it away.
  const iPadMasqueradingAsMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadMasqueradingAsMac;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // `navigator.standalone` is the iOS-only, pre-display-mode way of asking.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
  } catch {
    // Private mode: treat it as not dismissed rather than hiding the feature.
    return false;
  }
}

export interface PWAInstall {
  /** How this browser can install, once installability is actually known. */
  method: InstallMethod;
  /** True while the banner should be on screen. */
  visible: boolean;
  /** Runs the native prompt. No-op on iOS, which has no such API. */
  install: () => Promise<void>;
  /** Hides the banner for good on this device. */
  dismiss: () => void;
}

export default function usePWAInstall(): PWAInstall {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(wasDismissed);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Without this Chromium shows its own mini-infobar and never gives us
      // the event to replay later.
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // Launching the installed copy does not fire `appinstalled`, so also watch
    // the display mode — it flips if the user opens the app from the home screen.
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = (event: MediaQueryListEvent) => setInstalled(event.matches);
    standaloneQuery.addEventListener('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      standaloneQuery.removeEventListener('change', onDisplayModeChange);
    };
  }, []);

  const method: InstallMethod = installed
    ? 'none'
    : deferred
      ? 'prompt'
      : isIosDevice()
        ? 'ios'
        : 'none';

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The event is single-use whichever way it went; a second `prompt()` throws.
    setDeferred(null);
    if (outcome === 'dismissed') setDismissed(true);
  }, [deferred]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
    } catch {
      // Remembering the dismissal is a nicety; the banner still closes now.
    }
  }, []);

  return { method, visible: method !== 'none' && !dismissed, install, dismiss };
}
