import {getRequestConfig, type GetRequestConfigParams} from 'next-intl/server';

type Dict = Record<string, unknown>;

/** Глубокий мердж простых объектов */
function deepMerge<T extends Dict>(...parts: T[]): T {
  const out: Dict = {};
  for (const p of parts) {
    if (!p || typeof p !== 'object') continue;
    for (const [k, v] of Object.entries(p)) {
      if (
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        typeof out[k] === 'object' &&
        out[k] !== null &&
        !Array.isArray(out[k])
      ) {
        // @ts-expect-error recursive
        out[k] = deepMerge(out[k] as Dict, v as Dict);
      } else {
        out[k] = v;
      }
    }
  }
  return out as T;
}

/** Разворачивает плоские ключи с точками в вложенные объекты */
function expandDottedKeys(input: Dict): Dict {
  const result: Dict = {};
  for (const [flatKey, value] of Object.entries(input)) {
    if (!flatKey.includes('.')) {
      // Если это уже объект – расширим рекурсивно
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // @ts-expect-error recursive
        result[flatKey] = expandDottedKeys(value as Dict);
      } else {
        result[flatKey] = value;
      }
      continue;
    }
    const parts = flatKey.split('.');
    let cur = result;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]!;
      if (i === parts.length - 1) {
        cur[key] = value;
      } else {
        if (!(key in cur) || typeof cur[key] !== 'object' || cur[key] === null || Array.isArray(cur[key])) {
          cur[key] = {};
        }
        cur = cur[key] as Dict;
      }
    }
  }
  return result;
}

/** Аккуратная подгрузка дополнительного пакета сообщений, например `${locale}.pricing.json` */
async function tryLoad(locale: string, pack: string): Promise<Dict> {
  try {
    // относительный путь от src/i18n.ts
    const mod = await import(`./app/[locale]/messages/${locale}.${pack}.json`);
    // @ts-expect-error default json
    return (mod?.default ?? {}) as Dict;
  } catch {
    return {};
  }
}

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  const current = (locale as string) || 'ru';

  // База (ru.json / en.json / ...)
  const baseMod = await import(`./app/[locale]/messages/${current}.json`);
  const base = (baseMod?.default ?? {}) as Dict;

  // Доп. пакеты по страницам/секциям
  const header  = await tryLoad(current, 'header');
  const pricing = await tryLoad(current, 'pricing');
  const donate  = await tryLoad(current, 'donate');
  const thanks  = await tryLoad(current, 'thanks');

  // Мерджим → разворачиваем плоские ключи с точками
  const merged = deepMerge({}, base, header, pricing, donate, thanks);
  const messages = expandDottedKeys(merged);

  return {
    locale: current,
    messages
  };
});
