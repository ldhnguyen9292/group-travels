import type { Dictionary } from '../i18n/dictionary';

/** Whether the visitor last left the getting-started guide open ('1') or closed ('0'). */
export const GUIDE_STORAGE_KEY = 'group-travel:guide-open';

/**
 * Someone with no trips yet is exactly who the guide is for, so it starts open;
 * once they have trips it starts as one line. A choice they made themselves
 * wins over both, and anything unreadable counts as no choice.
 */
export function initialGuideOpen(stored: string | null, hasTrips: boolean): boolean {
  if (stored === '1') return true;
  if (stored === '0') return false;
  return !hasTrips;
}

export function loadGuidePreference(): string | null {
  try {
    return localStorage.getItem(GUIDE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveGuidePreference(open: boolean): void {
  try {
    localStorage.setItem(GUIDE_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // A convenience only: the guide still works, it just will not remember.
  }
}

/**
 * The app's front door, not the page the sharer happens to be on: a trip link
 * means nothing on someone else's device, because trips live on this one.
 */
export function buildAppShare(
  t: Dictionary,
  origin: string,
): { title: string; text: string; url: string } {
  return {
    title: t.app.name,
    text: `${t.app.name} — ${t.homeGuide.sharePitch}`,
    url: `${origin.replace(/\/+$/, '')}/`,
  };
}
