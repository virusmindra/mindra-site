// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';

export const locales = ['en','ru','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type AppLocale = typeof locales[number];
export const defaultLocale: AppLocale = 'en';

// Подгружаем все бандлы сообщений для локали (с запасом по именам файлов)
async function loadMessages(locale: AppLocale) {
  // Если каких-то файлов нет — спокойно возвращаем {}
  const safeImport = async (path: string) => {
    try {
      const mod = await import(/* @vite-ignore */ path);
      return (mod as any).default ?? {};
    } catch {
      return {};
    }
  };

  const base        = await safeImport(`@/app/locales/messages/${locale}.json`);
  const header      = await safeImport(`@/app/locales/messages/${locale}.header.json`);
  const pricing     = await safeImport(`@/app/locales/messages/${locale}.pricing.json`);
  const donate      = await safeImport(`@/app/locales/messages/${locale}.donate.json`);
  const thanks      = await safeImport(`@/app/locales/messages/${locale}.thanks.json`);
  const supportPage = await safeImport(`@/app/locales/messages/${locale}.supportPage.json`);

  // Один объект сообщений
  return {
    ...base,
    header,
    pricing,
    donate,
    thanks,
    supportPage
  } as Record<string, unknown>;
}

// Конфиг для next-intl/server
export default getRequestConfig(async ({locale}) => {
  const supported = new Set(locales as readonly string[]);
  const chosen = (locale && supported.has(locale as AppLocale))
    ? (locale as AppLocale)
    : defaultLocale;

  const messages = await loadMessages(chosen);
  // ВАЖНО: вернуть обе части
  return { locale: chosen, messages };
});
