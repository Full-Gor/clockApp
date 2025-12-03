import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, loadLanguage, saveLanguage, t as translate, TranslationKeys } from '@/services/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof TranslationKeys) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    const savedLang = await loadLanguage();
    setLanguageState(savedLang);
    setIsLoading(false);
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await saveLanguage(lang);
  };

  const t = (key: keyof TranslationKeys): string => {
    return translate(key, language);
  };

  // Arabic is RTL
  const isRTL = language === 'ar';

  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
