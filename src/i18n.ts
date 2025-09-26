import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  // Базовые сообщения (hero/nav/brand/features)
  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default;

  // Доп. неймспейсы как опция (не обязательны)
  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
  } catch {}

  let thanks: Record<string, unknown> = {};
  try {
    thanks = (await import(`@/app/[locale]/messages/${current}.thanks.json`)).default;
  } catch {}

  return {
    locale: current,
    messages: {...base, ...pricing, ...thanks}
  };
});
