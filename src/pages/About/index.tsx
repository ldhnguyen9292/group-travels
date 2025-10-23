import React, { useEffect } from 'react';
import { getOrCreateDeviceId } from '../../utils/device';

const translations = {
  en: {
    title: 'About Group Travel',
    desc: 'Group Travel is a simple app to help you organize, track, and manage group trips. You can create trips, add participants, and keep track of your travel plans with ease.',
    features: [
      'Create and manage trips',
      'Add and remove participants',
      'Switch between English and Vietnamese',
      'Switch between light and dark themes',
      'Data is stored securely and uniquely per device',
    ],
    developerTitle: 'About the Developer',
    developerDesc:
      'Group Travel is a personal project by Heo Cơ CTin, made for the community — completely free forever, with no ads or fees.',
    version: 'Version 1.0.0 © 2025 Group Travel',
  },
  vn: {
    title: 'Giới thiệu Group Travel',
    desc: 'Group Travel là ứng dụng đơn giản giúp bạn tổ chức, theo dõi và quản lý các chuyến đi nhóm. Bạn có thể tạo chuyến đi, thêm thành viên và quản lý kế hoạch du lịch dễ dàng.',
    features: [
      'Tạo và quản lý chuyến đi',
      'Thêm và xóa thành viên',
      'Chuyển đổi giữa tiếng Anh và tiếng Việt',
      'Chuyển đổi giữa chế độ sáng và tối',
      'Dữ liệu được lưu an toàn và duy nhất trên mỗi thiết bị',
    ],
    developerTitle: 'Về người phát triển',
    developerDesc:
      'Group Travel là dự án cá nhân của Heo Cơ CTin — làm vì cộng đồng, mãi mãi miễn phí và không đặt quảng cáo.',
    version: 'Phiên bản 1.0.0 © 2025 Group Travel',
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
    <main className="min-h-[70vh] bg-background py-12 px-4">
      <section className="max-w-3xl mx-auto bg-surface rounded-2xl shadow-lg p-8 border border-border">
        {/* App Info */}
        <h2 className="text-4xl font-bold mb-4 text-center text-text-h1">{t.title}</h2>
        <p className="mb-6 text-center text-text-body leading-relaxed">{t.desc}</p>

        {/* Features */}
        <ul className="list-disc pl-6 space-y-2 mb-8 text-text-body">
          {t.features.map((f, i) => (
            <li key={i} className="hover:text-primary transition-colors duration-200">
              {f}
            </li>
          ))}
        </ul>

        {/* Developer Info */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-xl font-semibold mb-2 text-text-h2">{t.developerTitle}</h3>
          <p className="text-text-muted leading-relaxed">{t.developerDesc}</p>
        </div>

        {/* Footer Info */}
        <div className="text-center text-text-muted text-sm border-t border-border pt-4 mt-6">{t.version}</div>
      </section>
    </main>
  );
};

export default About;
