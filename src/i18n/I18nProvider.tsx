import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, LANG_STORAGE_KEY, type I18nValue } from './context';
import { DICTIONARIES, LOCALES, resolveLang, type Lang } from './dictionary';

function readStoredLang(): Lang {
  try {
    return resolveLang(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return 'en';
  }
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // A stored preference is a nicety; ignore private-mode failures.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'vn' ? 'vi' : 'en';
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: DICTIONARIES[lang], locale: LOCALES[lang] }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
