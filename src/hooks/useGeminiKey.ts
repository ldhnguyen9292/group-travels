import { useSyncExternalStore } from 'react';
import { GEMINI_KEY_EVENT, GEMINI_KEY_STORAGE, loadGeminiKey } from '../lib/receiptAi';

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === GEMINI_KEY_STORAGE) onChange();
  };
  window.addEventListener(GEMINI_KEY_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(GEMINI_KEY_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** The Gemini API key saved on this device, or '' — kept current across tabs. */
export function useGeminiKey(): string {
  return useSyncExternalStore(subscribe, loadGeminiKey, () => '');
}
