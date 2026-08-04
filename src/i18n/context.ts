import { createContext, useContext } from 'react';
import type { Dictionary, Lang } from './dictionary';

export const LANG_STORAGE_KEY = 'lang';

export interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The active dictionary. */
  t: Dictionary;
  /** BCP 47 locale for Intl formatting. */
  locale: string;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <AppProviders>');
  return value;
}
