import React, { useEffect } from 'react';
import { getOrCreateDeviceId } from '../../utils/device';

const translations = {
  en: {
    title: 'Help & FAQ',
    intro: 'Find answers to the most common questions about using the app.',
    createTripQ: 'How do I create a new trip?',
    createTripA: 'Go to the Home page and click "Create new trip". Fill in the trip details and add participants.',
    dataQ: 'How is my data stored?',
    dataA: 'Your trip data is stored securely and uniquely per device. No account is required.',
    langQ: 'How do I switch language?',
    langA: 'Use the language toggle in the header to switch between English and Vietnamese.',
    themeQ: 'How do I switch themes?',
    themeA: 'Use the theme toggle in the header to switch between light and dark themes.',
    moreQ: 'Need more help?',
    moreA: 'Contact the developer',
  },
  vn: {
    title: 'Trợ giúp & Câu hỏi thường gặp',
    intro: 'Tìm câu trả lời cho các thắc mắc thường gặp khi sử dụng ứng dụng.',
    createTripQ: 'Làm thế nào để tạo chuyến đi mới?',
    createTripA: 'Vào trang chủ và nhấn "Tạo chuyến đi mới". Điền thông tin chuyến đi và thêm thành viên.',
    dataQ: 'Dữ liệu của tôi được lưu như thế nào?',
    dataA: 'Dữ liệu chuyến đi của bạn được lưu an toàn và duy nhất trên mỗi thiết bị. Không cần tài khoản.',
    langQ: 'Làm thế nào để đổi ngôn ngữ?',
    langA: 'Sử dụng nút chuyển ngôn ngữ ở đầu trang để đổi giữa tiếng Anh và tiếng Việt.',
    themeQ: 'Làm thế nào để đổi giao diện?',
    themeA: 'Sử dụng nút chuyển giao diện ở đầu trang để đổi giữa chế độ sáng và tối.',
    moreQ: 'Cần thêm trợ giúp?',
    moreA: 'Liên hệ nhà phát triển',
  },
};

const Help: React.FC = () => {
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
    <main className="min-h-[70vh] bg-background py-12 px-4 flex justify-center">
      <section className="w-full max-w-3xl bg-surface rounded-2xl shadow-lg p-8 border border-border">
        <h2 className="text-4xl font-bold text-center mb-3 text-text-h1">{t.title}</h2>
        <p className="text-center text-text-muted mb-10">{t.intro}</p>

        <div className="space-y-6">
          {[
            { q: t.createTripQ, a: t.createTripA },
            { q: t.dataQ, a: t.dataA },
            { q: t.langQ, a: t.langA },
            { q: t.themeQ, a: t.themeA },
          ].map((item, i) => (
            <div
              key={i}
              className="group bg-surface border border-border rounded-xl p-5 transition-all hover:border-primary hover:shadow-md"
            >
              <h3 className="text-lg font-semibold mb-2 text-text-h2 group-hover:text-primary transition-colors">
                {item.q}
              </h3>
              <p className="leading-relaxed text-text-body">{item.a}</p>
            </div>
          ))}

          <div className="border-t border-border pt-8 text-center">
            <h3 className="text-lg font-semibold mb-2 text-text-h2">{t.moreQ}</h3>
            <button
              className="px-5 py-2.5 rounded-lg bg-primary text-text-button hover:bg-primary-hover transition-all shadow-md"
              onClick={() => (window.location.href = 'mailto:developer@example.com')}
            >
              {t.moreA}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Help;
