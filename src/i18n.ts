import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async (ctx) => {
  const locale = (ctx?.locale as string) || 'ru';

  // Базовые сообщения (hero/навигация/и т.д.)
  const base = (await import(`@/app/[locale]/messages/${locale}.json`)).default;

  // Доп. неймспейсы — подмешиваем, если файлы существуют
  let thanks: Record<string, unknown> = {};
  try {
    thanks = (await import(`@/app/[locale]/messages/${locale}.thanks.json`)).default;
  } catch {}

  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${locale}.pricing.json`)).default;
  } catch {}

  return {
    messages: {
      ...base,
      ...thanks,
      ...pricing
    }
  };
});
