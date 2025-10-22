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
    <span className="text-lg font-semibold text-gray-900">{t.groupTravel}</span>
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

  // close on outside click
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
    <header className="bg-white border-b border-gray-200">
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
                `text-sm font-medium px-2 py-1 rounded ${isActive ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600`
              }
            >
              {t[item.key as keyof typeof t]}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="lang" className="sr-only">
              {t.language}
            </label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-8 text-sm rounded border border-gray-200 bg-white text-gray-700 px-2"
              aria-label={t.language}
            >
              <option value="en">{t.english}</option>
              <option value="vn">{t.vietnamese}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-700"
              >
                {t[item.key as keyof typeof t]}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="h-8 rounded border border-gray-200 bg-white text-sm text-gray-700 px-2"
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
