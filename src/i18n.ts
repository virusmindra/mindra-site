// src/i18n.ts
import {getRequestConfig} from 'next-intl/server';

const ALL = ['en','ru','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
type L = typeof ALL[number];

// ✅ Экспортируем, чтобы middleware мог импортировать
export const locales = ALL;
export type AppLocale = L;
export const defaultLocale: AppLocale = 'en';

async function loadMessages(locale: L) {
  const common      = (await import(`@/app/[locale]/messages/${locale}.json`)).default;
  const header      = (await import(`@/app/[locale]/messages/${locale}.header.json`)).default;
  const pricing     = (await import(`@/app/[locale]/messages/${locale}.pricing.json`)).default;
  const donate      = (await import(`@/app/[locale]/messages/${locale}.donate.json`)).default;
  const thanks      = (await import(`@/app/[locale]/messages/${locale}.thanks.json`)).default;
  const supportPage = (await import(`@/app/[locale]/messages/${locale}.supportPage.json`)).default;
  return {...common, header, pricing, donate, thanks, supportPage};
}

// ⚠️ Возвращаем и locale, и messages — это снимает типовую ошибку
export default getRequestConfig(async ({locale}) => {
  const chosen: L = (ALL as readonly string[]).includes(locale as string)
    ? (locale as L)
    : 'en';
  const messages = await loadMessages(chosen);
  return { locale: chosen, messages };
});
