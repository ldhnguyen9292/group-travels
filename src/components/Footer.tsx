import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const translations = {
  en: {
    groupTravel: 'Group Travel',
    desc: 'Plan group trips, track expenses and settle balances with ease. Small, privacy-friendly tool — data stays in your browser.',
  },
  vn: {
    groupTravel: 'Đi chung nhóm',
    desc: 'Lên kế hoạch chuyến đi nhóm, theo dõi chi phí và quyết toán dễ dàng. Dữ liệu riêng tư, chỉ lưu trên trình duyệt của bạn.',
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
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 items-center justify-center text-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="/group-travel-logo.svg" alt="Group Travel Logo" className="w-10 h-10" />
            <span className="text-lg font-semibold text-gray-900">{t.groupTravel}</span>
          </Link>
          <p className="mt-3 text-sm text-gray-600 max-w-md">{t.desc}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
