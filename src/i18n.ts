// src/i18n.ts
type Dict = Record<string, unknown>;

async function tryImport(path: string): Promise<Dict> {
  try {
    const mod = await import(/* @vite-ignore */ path);
    return (mod as any)?.default ?? {};
  } catch {
    return {};
  }
}

export async function getMessages({ locale }: { locale: string }) {
  // База: сначала пробуем *.base.json, если нет — обычный *.json
  const base =
    Object.keys(
      await tryImport(`@/app/[locale]/messages/${locale}.base.json`)
    ).length > 0
      ? await tryImport(`@/app/[locale]/messages/${locale}.base.json`)
      : await tryImport(`@/app/[locale]/messages/${locale}.json`);

  const header      = await tryImport(`@/app/[locale]/messages/${locale}.header.json`);
  const pricing     = await tryImport(`@/app/[locale]/messages/${locale}.pricing.json`);
  const donate      = await tryImport(`@/app/[locale]/messages/${locale}.donate.json`);
  const thanks      = await tryImport(`@/app/[locale]/messages/${locale}.thanks.json`);
  const supportPage = await tryImport(`@/app/[locale]/messages/${locale}.supportPage.json`);

  // Возвращаем единый объект сообщений
  return {
    ...base,
    ...header,
    ...pricing,
    ...donate,
    ...thanks,
    supportPage
  };
}
