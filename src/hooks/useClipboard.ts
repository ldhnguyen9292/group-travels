import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** True on phones and any browser exposing the native share sheet. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Opens the native share sheet. Returns false when it is unavailable or the user
 * dismissed it — dismissing is not an error worth surfacing.
 */
export async function nativeShare(title: string, text: string): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}

export function useClipboard() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(async (text: string) => {
    let ok = false;
    try {
      // Requires a secure context; falls through to the manual path otherwise.
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = false;
    }
    setStatus(ok ? 'copied' : 'failed');
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 2500);
    return ok;
  }, []);

  return { status, copy };
}
