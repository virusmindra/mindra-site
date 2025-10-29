// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';
import type {AbstractIntlMessages} from 'next-intl';

export const locales = ['en','ru','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type AppLocale = typeof locales[number];
export const defaultLocale: AppLocale = 'en';

// Все JSON лежат в: src/app/[locale]/messages/*
async function loadMessages(locale: AppLocale): Promise<AbstractIntlMessages> {
  const base       = (await import(`./app/[locale]/messages/${locale}.json`)).default;
  const header     = (await import(`./app/[locale]/messages/${locale}.header.json`)).default;
  const pricing    = (await import(`./app/[locale]/messages/${locale}.pricing.json`)).default;
  const donate     = (await import(`./app/[locale]/messages/${locale}.donate.json`)).default;
  const thanks     = (await import(`./app/[locale]/messages/${locale}.thanks.json`)).default;
  const supportPage= (await import(`./app/[locale]/messages/${locale}.supportPage.json`)).default;

  return { ...base, header, pricing, donate, thanks, supportPage };
}

// ВАЖНО: возвращаем { messages, locale }
export default getRequestConfig(async ({locale}) => {
  const supported = new Set(locales as readonly string[]);
  const chosen = (locale && supported.has(locale as AppLocale))
    ? (locale as AppLocale)
    : defaultLocale;

  const messages = await loadMessages(chosen);
  return { locale: chosen, messages };
});
