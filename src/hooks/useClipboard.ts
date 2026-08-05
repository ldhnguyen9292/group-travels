import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** True on phones and any browser exposing the native share sheet. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** True when this browser's share sheet accepts an attached file, not just text. */
export function canShareFiles(files: File[]): boolean {
  if (!canNativeShare() || typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Opens the native share sheet. Returns false when it is unavailable or the user
 * dismissed it — dismissing is not an error worth surfacing.
 *
 * A share with files and text is retried as text only: some targets reject the
 * combination outright, and losing the text is better than losing the share.
 */
export async function nativeShare(title: string, text: string, files?: File[]): Promise<boolean> {
  if (!canNativeShare()) return false;
  const withFiles = files && files.length > 0 && canShareFiles(files);
  try {
    await navigator.share(withFiles ? { title, text, files } : { title, text });
    return true;
  } catch (error) {
    if (!withFiles || (error instanceof DOMException && error.name === 'AbortError')) return false;
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }
}

/** Saves a blob to the user's downloads under `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoking straight away cancels the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
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
