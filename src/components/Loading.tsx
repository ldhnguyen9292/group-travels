import React from 'react';

const translations = {
  en: 'Loading...',
  vn: 'Đang tải...',
};

const Loading: React.FC = () => {
  const lang = localStorage.getItem('lang') || 'en';
  const text = translations[lang as 'en' | 'vn'] || translations.en;
  return (
    <div className="flex justify-center items-center py-8">
      <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mr-2"></span>
      <span className="text-indigo-600 font-medium">{text}</span>
    </div>
  );
};

export default Loading;
