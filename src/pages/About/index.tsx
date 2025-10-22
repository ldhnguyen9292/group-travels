import React, { useEffect } from 'react';
import { getOrCreateDeviceId } from '../../utils/device';

const translations = {
  en: {
    title: 'About Group Travels',
    desc: 'Group Travels is a simple app to help you organize, track, and manage group trips. You can create trips, add participants, and keep track of your travel plans with ease.',
    features: [
      'Create and manage trips',
      'Add and remove participants',
      'Switch between English and Vietnamese',
      'Data is stored securely and uniquely per device',
    ],
    version: 'Version 1.0.0 © 2025 Group Travels',
  },
  vn: {
    title: 'Giới thiệu Group Travels',
    desc: 'Group Travels là ứng dụng đơn giản giúp bạn tổ chức, theo dõi và quản lý các chuyến đi nhóm. Bạn có thể tạo chuyến đi, thêm thành viên và quản lý kế hoạch du lịch dễ dàng.',
    features: [
      'Tạo và quản lý chuyến đi',
      'Thêm và xóa thành viên',
      'Chuyển đổi giữa tiếng Anh và tiếng Việt',
      'Dữ liệu được lưu an toàn và duy nhất trên mỗi thiết bị',
    ],
    version: 'Phiên bản 1.0.0 © 2025 Group Travels',
  },
};

const About: React.FC = () => {
  const [lang, setLang] = React.useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    getOrCreateDeviceId();
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      setLang((customEvent.detail && customEvent.detail.lang) || 'en');
    };
    window.addEventListener('app:language-changed', handler);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler);
  }, []);

  const t = translations[lang as 'en' | 'vn'] || translations.en;

  return (
    <main className="min-h-[70vh] bg-[#0f172a] py-12 px-4">
      <section className="max-w-3xl mx-auto bg-[#1e293b] rounded-2xl shadow-lg p-8 border border-[#334155] text-gray-100">
        <h2 className="text-3xl font-semibold mb-4 text-center text-[#a5b4fc]">{t.title}</h2>
        <p className="mb-6 text-gray-300 text-center leading-relaxed">{t.desc}</p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2 mb-6">
          {t.features.map((f, i) => (
            <li key={i} className="hover:text-[#a5b4fc] transition-colors duration-200">
              {f}
            </li>
          ))}
        </ul>
        <div className="text-center text-gray-500 text-sm border-t border-[#334155] pt-4">{t.version}</div>
      </section>
    </main>
  );
};

export default About;
