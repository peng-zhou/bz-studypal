'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors border border-white/20 hover:border-white/40"
      title={t('settings.language')}
    >
      🌐 {i18n.language === 'en' ? '中文' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;
