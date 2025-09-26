import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  // Базовые сообщения
  const base =
    (await import(`@/app/[locale]/messages/${current}.json`)).default;

  // Доп. неймспейсы (не обязательны) — подмешиваем, если есть
  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
  } catch {}

  let thanks: Record<string, unknown> = {};
  try {
    thanks = (await import(`@/app/[locale]/messages/${current}.thanks.json`)).default;
  } catch {}

  return {messages: {...base, ...pricing, ...thanks}};
});
