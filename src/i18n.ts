// src/i18n.ts
type Dict = Record<string, any>;

async function tryImport(path: string): Promise<Dict> {
  try {
    const mod = await import(/* @vite-ignore */ path);
    return (mod as any)?.default ?? {};
  } catch {
    return {};
  }
}

function deepMerge<A extends Dict, B extends Dict>(a: A, b: B): A & B {
  const out: Dict = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge((out[k] ?? {}) as Dict, v as Dict);
    } else {
      out[k] = v;
    }
  }
  return out as A & B;
}

async function loadBase(locale: string): Promise<Dict> {
  // Сначала пробуем *.base.json, если нет — обычный *.json
  const base = await tryImport(`@/app/[locale]/messages/${locale}.base.json`);
  if (Object.keys(base).length) return base;
  return await tryImport(`@/app/[locale]/messages/${locale}.json`);
}

export async function getMessages({ locale }: { locale: string }) {
  const fallback = "en";

  // 1) База с фолбэком
  let messages = deepMerge(
    await loadBase(fallback),
    await loadBase(locale)
  );

  // 2) Пакеты с фолбэком на en
  // ВАЖНО: supportPage должен лежать под ключом supportPage (отдельный namespace)
  const headerFb      = await tryImport(`@/app/[locale]/messages/${fallback}.header.json`);
  const headerCur     = await tryImport(`@/app/[locale]/messages/${locale}.header.json`);
  messages = deepMerge(messages, headerFb);
  messages = deepMerge(messages, headerCur);

  const pricingFb     = await tryImport(`@/app/[locale]/messages/${fallback}.pricing.json`);
  const pricingCur    = await tryImport(`@/app/[locale]/messages/${locale}.pricing.json`);
  messages = deepMerge(messages, pricingFb);
  messages = deepMerge(messages, pricingCur);

  const donateFb      = await tryImport(`@/app/[locale]/messages/${fallback}.donate.json`);
  const donateCur     = await tryImport(`@/app/[locale]/messages/${locale}.donate.json`);
  messages = deepMerge(messages, donateFb);
  messages = deepMerge(messages, donateCur);

  const thanksFb      = await tryImport(`@/app/[locale]/messages/${fallback}.thanks.json`);
  const thanksCur     = await tryImport(`@/app/[locale]/messages/${locale}.thanks.json`);
  messages = deepMerge(messages, thanksFb);
  messages = deepMerge(messages, thanksCur);

  const supportFb     = await tryImport(`@/app/[locale]/messages/${fallback}.supportPage.json`);
  const supportCur    = await tryImport(`@/app/[locale]/messages/${locale}.supportPage.json`);
  messages.supportPage = deepMerge(supportFb, supportCur);

  return messages;
}
