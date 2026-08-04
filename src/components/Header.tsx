import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { LANGS } from '../i18n/dictionary';
import { useTheme } from '../theme/context';
import Button from './ui/Button';
import { IconClose, IconMenu, IconMoon, IconSun } from './ui/Icons';
import { cx } from './ui/classes';

const NAV = [
  { to: '/', key: 'trips' },
  { to: '/about', key: 'about' },
  { to: '/help', key: 'help' },
] as const;

export default function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  // Navigating away should never leave the panel hanging open.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cx(
      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-brand-soft text-brand ring-1 ring-brand-border'
        : 'text-ink-muted hover:bg-sunken hover:text-ink',
    );

  const languageSwitch = (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border bg-sunken p-0.5"
      role="group"
      aria-label={t.nav.language}
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cx(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            lang === code
              ? 'bg-surface text-brand shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {code === 'en' ? 'EN' : 'VI'}
        </button>
      ))}
    </div>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/group-travel-logo.svg" alt="" className="h-9 w-9 shadow-glow rounded-xl" />
          <span className="text-base font-semibold tracking-tight">{t.app.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>
              {t.nav[item.key]}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">{languageSwitch}</div>

          <Button
            variant="secondary"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t.nav.switchToLight : t.nav.switchToDark}
            title={theme === 'dark' ? t.nav.switchToLight : t.nav.switchToDark}
          >
            {theme === 'dark' ? (
              <IconSun className="h-5 w-5" />
            ) : (
              <IconMoon className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
          >
            {menuOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Hairline of brand colour so the bar reads as part of the app, not a plain rule. */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/45 to-transparent" />

      {menuOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    isActive ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-sunken',
                  )
                }
              >
                {t.nav[item.key]}
              </NavLink>
            ))}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:hidden">
              <span className="text-sm text-ink-muted">{t.nav.language}</span>
              {languageSwitch}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
