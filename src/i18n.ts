import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const base = (await import(`@/app/[locale]/messages/${locale}.json`)).default;

  // Пытаемся подмешать переводы для страницы тарифов
  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${locale}.pricing.json`)).default;
  } catch (_) {}

  return {messages: {...base, ...pricing}};
});
