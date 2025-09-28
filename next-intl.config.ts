// next-intl.config.ts
import {getRequestConfig, type GetRequestConfigParams} from 'next-intl/server';

type AnyDict = Record<string, unknown>;

async function safeImport<T = AnyDict>(path: string): Promise<T> {
  try {
    const mod = await import(path);
    // @ts-ignore
    return (mod?.default ?? {}) as T;
  } catch {
    return {} as T;
  }
}

async function getMessages({locale}: {locale: string}) {
  const base        = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.base.json`);
  const header      = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.header.json`);
  const pricing     = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.pricing.json`);
  const donate      = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.donate.json`);
  const thanks      = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.thanks.json`);
  const supportPage = await safeImport<AnyDict>(`./src/app/[locale]/messages/${locale}.supportPage.json`);

  return {
    ...base,
    ...header,
    ...pricing,
    ...donate,
    ...thanks,
    supportPage
  };
}

export default getRequestConfig(async ({locale}: GetRequestConfigParams) => {
  const current = (locale as string) || 'ru';
  const messages = await getMessages({locale: current});
  return {locale: current, messages};
});
