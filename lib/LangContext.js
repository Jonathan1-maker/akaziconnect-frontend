'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import en from './i18n/en';
import rw from './i18n/rw';
import fr from './i18n/fr';

const LangContext = createContext();

const translations = { en, rw, fr };

export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
];

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && translations[saved]) setLang(saved);
  }, []);

  const switchLang = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('lang', newLang);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    // fallback to English if key missing in current lang
    if (value === undefined) {
      let fallback = translations['en'];
      for (const k of keys) { fallback = fallback?.[k]; }
      return fallback ?? key;
    }
    return value;
  };

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useT = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useT must be used within LangProvider');
  return ctx.t;
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return { lang: ctx.lang, switchLang: ctx.switchLang };
};
