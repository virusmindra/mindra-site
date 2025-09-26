import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  // Базовые сообщения
  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default;

  // Опциональные блоки (не падаем, если файла нет)
  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
  } catch {}

  let thanksMsgs: Record<string, unknown> = {};
  try {
    thanksMsgs = (await import(`@/app/[locale]/messages/${current}.thanks.json`)).default;
  } catch {}

  return {
    messages: {
      ...base,
      ...pricing,
      ...thanksMsgs
    }
  };
});
