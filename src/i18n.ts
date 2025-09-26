import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default;

  let pricing: Record<string, unknown> = {};
  try {
    pricing = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
  } catch {}

  let thanksMsgs: Record<string, unknown> = {};
  try {
    thanksMsgs = (await import(`@/app/[locale]/messages/${current}.thanks.json`)).default;
  } catch {}

  return {
    locale: current,
    messages: {
      ...base,
      ...pricing,
      ...thanksMsgs
    }
  };
});
