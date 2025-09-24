export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];

export const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
  pl: 'Polski',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  kk: 'Қазақша',
  hy: 'Հայերեն',
  ka: 'ქართული',
  md: 'Română'
};
