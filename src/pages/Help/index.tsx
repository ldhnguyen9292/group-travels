import React, { useEffect } from 'react';
import { getOrCreateDeviceId } from '../../utils/device';

const translations = {
  en: {
    title: 'Help & FAQ',
    createTripQ: 'How do I create a new trip?',
    createTripA: 'Go to the Home page and click "Create new trip". Fill in the trip details and add participants.',
    dataQ: 'How is my data stored?',
    dataA: 'Your trip data is stored securely and uniquely per device. No account is required.',
    langQ: 'How do I switch language?',
    langA: 'Use the language toggle in the header to switch between English and Vietnamese.',
    moreQ: 'Need more help?',
    moreA: 'Contact the developer',
  },
  vn: {
    title: 'Trợ giúp & Câu hỏi thường gặp',
    createTripQ: 'Làm thế nào để tạo chuyến đi mới?',
    createTripA: 'Vào trang chủ và nhấn "Tạo chuyến đi mới". Điền thông tin chuyến đi và thêm thành viên.',
    dataQ: 'Dữ liệu của tôi được lưu như thế nào?',
    dataA: 'Dữ liệu chuyến đi của bạn được lưu an toàn và duy nhất trên mỗi thiết bị. Không cần tài khoản.',
    langQ: 'Làm thế nào để đổi ngôn ngữ?',
    langA: 'Sử dụng nút chuyển ngôn ngữ ở đầu trang để đổi giữa tiếng Anh và tiếng Việt.',
    moreQ: 'Cần thêm trợ giúp?',
    moreA: 'Liên hệ nhà phát triển',
  },
};

const Help: React.FC = () => {
  const [lang, setLang] = React.useState(localStorage.getItem('lang') || 'en');

  useEffect(() => {
    // Ensure device ID is set
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
    <main className="min-h-[60vh] bg-gray-50 py-8">
      <section className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">{t.title}</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{t.createTripQ}</h3>
          <p className="text-gray-700">{t.createTripA}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{t.dataQ}</h3>
          <p className="text-gray-700">{t.dataA}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{t.langQ}</h3>
          <p className="text-gray-700">{t.langA}</p>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{t.moreQ}</h3>
          <p className="text-gray-700">{t.moreA}</p>
        </div>
      </section>
    </main>
  );
};

export default Help;
