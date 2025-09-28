// src/i18n.ts
/** Вспомогалки */
type Dict = Record<string, any>;

function isPlainObject(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Разворачивает плоские ключи с точками: { "a.b": 1 } -> { a: { b: 1 } } */
function expandDottedKeys(input: Dict): Dict {
  const result: Dict = {};
  for (const [flatKey, value] of Object.entries(input || {})) {
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

/** Главная функция загрузки сообщений */
export async function getMessages({ locale }: { locale: string }) {
  const base        = (await import(`@/app/[locale]/messages/${locale}.base.json`)).default;
  const header      = (await import(`@/app/[locale]/messages/${locale}.header.json`)).default;
  const pricing     = (await import(`@/app/[locale]/messages/${locale}.pricing.json`)).default;
  const donate      = (await import(`@/app/[locale]/messages/${locale}.donate.json`)).default;
  const thanks      = (await import(`@/app/[locale]/messages/${locale}.thanks.json`)).default;
  const supportRaw  = (await import(`@/app/[locale]/messages/${locale}.supportPage.json`).catch(() => ({ default: {} }))).default;

  // ВАЖНО: supportPage храним плоско с точками — разворачиваем его,
  // чтобы t({namespace:'supportPage'}) находил ключи вида 'goal.title'
  const supportPage = expandDottedKeys(supportRaw);

  return {
    ...base,
    ...header,
    ...pricing,
    ...donate,
    ...thanks,
    supportPage
  };
}

