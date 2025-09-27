import {getRequestConfig, type GetRequestConfigParams} from "next-intl/server";

type Dict = Record<string, unknown>;

function isPlainObject(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Глубокий мердж простых объектов */
function deepMerge(...parts: Dict[]): Dict {
  const out: Dict = {};
  for (const p of parts) {
    if (!isPlainObject(p)) continue;
    for (const [k, v] of Object.entries(p)) {
      if (isPlainObject(v) && isPlainObject(out[k])) {
        out[k] = deepMerge(out[k] as Dict, v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

/** Разворачивает плоские ключи с точками в вложенные объекты */
function expandDottedKeys(input: Dict): Dict {
  const result: Dict = {};
  for (const [flatKey, value] of Object.entries(input)) {
    if (!flatKey.includes(".")) {
      result[flatKey] = isPlainObject(value) ? expandDottedKeys(value) : value;
      continue;
    }
    const parts = flatKey.split(".");
    let cur: Dict = result;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]!;
      if (i === parts.length - 1) {
        cur[key] = value;
      } else {
        if (!isPlainObject(cur[key])) cur[key] = {};
        cur = cur[key] as Dict;
      }
    }
  }
  return result;
}

/** Аккуратная подгрузка доп. пакета, напр. `${locale}.pricing.json` */
async function tryLoad(locale: string, pack: string): Promise<Dict> {
  try {
    const mod = await import(`./app/[locale]/messages/${locale}.${pack}.json`);
    return (mod as any)?.default ?? {};
  } catch {
    return {};
  }
}

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  const current = (locale as string) || "ru";

  // База (ru.json / en.json / ...)
  const baseMod = await import(`./app/[locale]/messages/${current}.json`);
  const base = (baseMod as any)?.default ?? {};

  // Доп. пакеты
  const header  = await tryLoad(current, "header");
  const pricing = await tryLoad(current, "pricing");
  const donate  = await tryLoad(current, "donate");
  const thanks  = await tryLoad(current, "thanks");

  // Мерджим и разворачиваем плоские ключи с точками
  const merged   = deepMerge({}, base, header, pricing, donate, thanks);
  const messages = expandDottedKeys(merged);

  return { locale: current, messages };
});
