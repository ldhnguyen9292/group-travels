import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const translations = {
  en: {
    groupTravel: 'Group Travel',
    desc: 'Plan group trips, track expenses and settle balances with ease. Small, privacy-friendly tool — data stays in your browser.',
    copyright: 'All rights reserved.',
  },
  vn: {
    groupTravel: 'Đi chung nhóm',
    desc: 'Lên kế hoạch chuyến đi nhóm, theo dõi chi phí và quyết toán dễ dàng. Dữ liệu riêng tư, chỉ lưu trên trình duyệt của bạn.',
    copyright: 'Đã đăng ký bản quyền.',
  },
};

type Translation = (typeof translations)['en'];

const Footer: React.FC = () => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const handler = (e: CustomEvent<{ lang: string }>) => setLang(e.detail?.lang || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);

  const t: Translation = translations[lang as 'en' | 'vn'] || translations.en;

  return (
    <footer className="bg-background border-t border-surface text-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center gap-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/group-travel-logo.svg" alt="Group Travel Logo" className="w-10 h-10" />
            <span className="text-lg font-semibold">{t.groupTravel}</span>
          </Link>

          <p className="max-w-md text-sm leading-relaxed">{t.desc}</p>

          <div className="text-xs text-muted mt-2">
            © {new Date().getFullYear()} {t.groupTravel}. {t.copyright}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
