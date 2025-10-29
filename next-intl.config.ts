export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type AppLocale = typeof locales[number];

export const defaultLocale: AppLocale = 'en';

export default { locales, defaultLocale };
