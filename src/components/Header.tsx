import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const translations = {
  en: {
    groupTravel: 'Group Travel',
    trips: 'Trips',
    about: 'About',
    help: 'Help',
    language: 'Language',
    profile: 'Profile',
    settings: 'Settings',
    signOut: 'Sign out',
    member: 'Member',
    dark: 'Dark',
    light: 'Light',
    english: 'English',
    vietnamese: 'Tiếng Việt',
    show: 'Show',
    hide: 'Hide',
    account: 'Account',
  },
  vn: {
    groupTravel: 'Đi chung nhóm',
    trips: 'Chuyến đi',
    about: 'Giới thiệu',
    help: 'Trợ giúp',
    language: 'Ngôn ngữ',
    profile: 'Hồ sơ',
    settings: 'Cài đặt',
    signOut: 'Đăng xuất',
    member: 'Thành viên',
    dark: 'Tối',
    light: 'Sáng',
    english: 'English',
    vietnamese: 'Tiếng Việt',
    show: 'Hiện',
    hide: 'Ẩn',
    account: 'Tài khoản',
  },
};

type Translation = (typeof translations)['en'];

const Logo: React.FC<{ t: Translation }> = ({ t }) => (
  <span className="inline-flex items-center gap-2">
    <img src="/group-travel-logo.svg" alt="Group Travel Logo" className="w-10 h-10" />
    <span className="text-lg font-semibold">{t.groupTravel}</span>
  </span>
);

const NAV = [
  { to: '/', key: 'trips' },
  { to: '/about', key: 'about' },
  { to: '/help', key: 'help' },
];

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') || 'en');
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  // === Theme logic ===
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const mobileRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem('lang', lang);
    window.dispatchEvent(new CustomEvent('app:language-changed', { detail: { lang } }));
  }, [lang]);

  const closeMenus = useCallback(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (mobileRef.current && !mobileRef.current.contains(target) && mobileOpen) setMobileOpen(false);
      if (accountRef.current && !accountRef.current.contains(target) && accountOpen) setAccountOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenus();
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, accountOpen, closeMenus]);

  const t = translations[lang as 'en' | 'vn'] || translations.en;

  return (
    <header className="bg-header border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <Logo t={t} />
        </Link>

        <nav className="hidden md:flex gap-4 ml-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium px-2 py-1 rounded transition-colors ${
                  isActive ? 'text-primary' : 'text-secondary'
                } hover:text-primary`
              }
            >
              {t[item.key as keyof typeof t]}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-3">
          {/* === Theme toggle === */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t.dark : t.light}
            className="h-9 w-9 flex items-center justify-center rounded-full border border-border bg-surface text-primary! hover:bg-surface/80 hover:text-primary-hover! transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {theme !== 'light' ? (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 0111.21 3a1 1 0 00-1.13 1.32A7 7 0 1019.68 14.92a1 1 0 001.32-1.13z" />
              </svg>
            ) : (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <g stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </g>
              </svg>
            )}
          </button>

          {/* === Language selector === */}
          <div className="flex items-center gap-2">
            <label htmlFor="lang" className="sr-only">
              {t.language}
            </label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-8 text-sm rounded border border-surface bg-surface text-primary px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label={t.language}
            >
              <option value="en">{t.english}</option>
              <option value="vn">{t.vietnamese}</option>
            </select>
          </div>
        </div>
      </div>

      {/* === Mobile menu === */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden border-t border-surface bg-background">
          <div className="px-4 py-3 space-y-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-secondary hover:text-primary"
              >
                {t[item.key as keyof typeof t]}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-surface">
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="h-8 rounded border border-surface bg-surface text-sm text-primary px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="en">{t.english}</option>
                  <option value="vn">{t.vietnamese}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
