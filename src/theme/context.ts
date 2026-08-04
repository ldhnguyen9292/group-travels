import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

export interface ThemeValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeValue | null>(null);

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <AppProviders>');
  return value;
}
