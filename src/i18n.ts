import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = locale ?? 'ru';

  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default;

  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
  } catch {}

  return {
    // 👇 это важно для твоей сборки — явно возвращаем locale
    locale: current,
    messages: {
      ...base,
      ...pricing
    }
  };
});
