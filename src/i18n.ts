import {getRequestConfig} from 'next-intl/server';

const SUPPORTED = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
type Locale = typeof SUPPORTED[number];

function normalizeLocale(input: string | undefined): Locale {
  const l = (input || '').toLowerCase();
  return (SUPPORTED as readonly string[]).includes(l) ? (l as Locale) : 'ru';
}

export default getRequestConfig(async ({locale}) => {
  const loc = normalizeLocale(locale);
  const messages = (await import(`@/app/[locale]/messages/${loc}.json`)).default;
  return {locale: loc, messages};
});
