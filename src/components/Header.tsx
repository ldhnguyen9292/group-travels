import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const Logo: React.FC = () => (
  <span className="inline-flex items-center gap-2">
    <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" className="text-indigo-100" fill="currentColor" />
      <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Travel</span>
  </span>
);

const NAV = [
  { to: '/', label: 'Trips' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<string>(() => localStorage.getItem('lang') || 'en');
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [accountOpen, setAccountOpen] = useState(false);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);

  const userName = localStorage.getItem('userName') || 'User';
  const initials = userName.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();

  useEffect(() => {
    localStorage.setItem('lang', lang);
    // broadcast language change for other parts of the app
    window.dispatchEvent(new CustomEvent('app:language-changed', { detail: { lang } }));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    // broadcast theme change if needed
    window.dispatchEvent(new CustomEvent('app:theme-changed', { detail: { theme: dark ? 'dark' : 'light' } }));
  }, [dark]);

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

  const handleSignOut = useCallback(() => {
    localStorage.removeItem('userName');
    // add other sign-out cleanup if required
    navigate('/');
    setAccountOpen(false);
  }, [navigate]);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <Logo />
        </Link>

        <nav className="hidden md:flex gap-4 ml-6">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium px-2 py-1 rounded ${isActive ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-200'} hover:text-indigo-600`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="lang" className="sr-only">Language</label>
            <select
              id="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-8 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2"
              aria-label="Select language"
            >
              <option value="en">EN</option>
              <option value="vn">VN</option>
            </select>
          </div>

          <button
            onClick={() => setDark((s) => !s)}
            aria-label="Toggle theme"
            aria-pressed={dark}
            className="w-9 h-9 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            title="Toggle light / dark"
          >
            {dark ? (
              <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            )}
          </button>

          {/* Account */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((s) => !s)}
              className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-medium hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-expanded={accountOpen}
              aria-haspopup="true"
              title="Account"
            >
              <span className="select-none">{initials}</span>
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded shadow-lg z-40">
                <div className="px-3 py-2 text-sm text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700">
                  <div className="font-medium truncate">{userName}</div>
                  <div className="text-xs text-gray-500">Member</div>
                </div>
                <div className="py-1">
                  <Link to="/profile" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Profile</Link>
                  <Link to="/settings" className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Settings</Link>
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div ref={mobileRef} className="md:hidden">
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="w-9 h-9 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-2">
            {NAV.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="h-8 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 px-2"
                >
                  <option value="en">English</option>
                  <option value="vn">Tiếng Việt</option>
                </select>
                <button
                  onClick={() => setDark((s) => !s)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
                >
                  {dark ? 'Dark' : 'Light'}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { setAccountOpen(false); handleSignOut(); }} className="w-full text-left text-sm text-red-600 px-2 py-2">Sign out</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
