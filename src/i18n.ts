import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  // База
  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default;

  // Экстры (подмешиваем без условий, если файлов нет — просто игнор)
  let extras: Record<string, unknown> = {};
  try {
    const p = (await import(`@/app/[locale]/messages/${current}.pricing.json`)).default;
    extras = {...extras, ...p};
  } catch {}
  try {
    const t = (await import(`@/app/[locale]/messages/${current}.thanks.json`)).default;
    extras = {...extras, ...t};
  } catch {}

  return {
    locale: current,
    messages: {...base, ...extras}
  };
});
