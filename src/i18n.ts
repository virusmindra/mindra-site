import {getRequestConfig, type GetRequestConfigParams} from 'next-intl/server';

type Dict = Record<string, unknown>;

async function loadJson(modulePath: string): Promise<Dict> {
  try {
    // ВАЖНО: динамический import должен возвращать plain object (default)
    const mod = await import(/* @vite-ignore */ modulePath);
    return (mod?.default ?? {}) as Dict;
  } catch {
    return {};
  }
}

function mergeObjects(...parts: Dict[]): Dict {
  return parts.reduce((acc, part) => Object.assign(acc, part || {}), {} as Dict);
}

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  const current = (locale as string) || 'ru';

  // База: ru.json / en.json / ...
  const base    = await loadJson(`@/app/[locale]/messages/${current}.json`);

  // Дополнительные “пакеты” (необязательны — грузим по возможности)
  const header  = await loadJson(`@/app/[locale]/messages/${current}.header.json`);
  const pricing = await loadJson(`@/app/[locale]/messages/${current}.pricing.json`);
  const donate  = await loadJson(`@/app/[locale]/messages/${current}.donate.json`);
  const thanks  = await loadJson(`@/app/[locale]/messages/${current}.thanks.json`);

  return {
    locale: current,
    messages: mergeObjects(base, header, pricing, donate, thanks)
  };
});
