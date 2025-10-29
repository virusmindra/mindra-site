// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import type {AbstractIntlMessages} from 'next-intl';

// какие локали реально есть в /app/[locale]/messages
export const locales = ['en','ru','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type AppLocale = typeof locales[number];
export const defaultLocale: AppLocale = 'en';

/** грузим пакеты сообщений одной локали */
async function loadMessages(locale: AppLocale) {
  // подправь пути, если у тебя другие
  const common      = (await import(`@/app/[locale]/messages/${locale}.json`)).default;
  const header      = (await import(`@/app/[locale]/messages/${locale}.header.json`)).default;
  const pricing     = (await import(`@/app/[locale]/messages/${locale}.pricing.json`)).default;
  const donate      = (await import(`@/app/[locale]/messages/${locale}.donate.json`)).default;
  const thanks      = (await import(`@/app/[locale]/messages/${locale}.thanks.json`)).default;
  const supportPage = (await import(`@/app/[locale]/messages/${locale}.supportPage.json`)).default;

  // объединяем в один объект (простое слияние по ключам)
  return {
    ...common,
    header,
    pricing,
    donate,
    thanks,
    supportPage
  };
}

/** typed-обёртка (удобно для TS) */
export async function getMessagesTyped(locale: AppLocale): Promise<AbstractIntlMessages> {
  return (await loadMessages(locale)) as AbstractIntlMessages;
}

/** главный конфиг для next-intl */
export default getRequestConfig(async ({locale}) => {
  const supported = new Set<string>(locales as readonly string[]);
  const chosen: AppLocale =
    (locale && supported.has(locale)) ? (locale as AppLocale) : defaultLocale;

  const messages = await getMessagesTyped(chosen);

  // Важно вернуть и locale, и messages
  return {
    locale: chosen,
    messages
  };
});
