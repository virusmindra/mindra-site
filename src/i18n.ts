import type {GetRequestConfigParams, RequestConfig} from 'next-intl/server';

// Простой deep-merge без зависимостей
function merge<T extends Record<string, any>>(...objs: T[]): T {
  const out: any = {};
  for (const o of objs) {
    if (!o) continue;
    for (const k of Object.keys(o)) {
      const v = (o as any)[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out[k] = merge(out[k] || {}, v);
      } else {
        out[k] = v;
      }
    }
  }
  return out;
}

// Аккуратная подгрузка дополнительного пакета messages, например `${locale}.pricing.json`
async function tryLoad(locale: string, pack: string): Promise<Record<string, any>> {
  try {
    // ВАЖНО: относительный путь от src/i18n.ts к src/app/[locale]/messages/*
    const mod = await import(`./app/[locale]/messages/${locale}.${pack}.json`);
    return (mod as any).default || {};
  } catch {
    return {};
  }
}

export default async function getRequestConfig({locale}: GetRequestConfigParams): Promise<RequestConfig> {
  const current = (locale as string) || 'ru';

  // База (ru.json / en.json / …) с фолбэком на ru
  let base: Record<string, any> = {};
  try {
    const mod = await import(`./app/[locale]/messages/${current}.json`);
    base = (mod as any).default || {};
  } catch {
    const modRu = await import(`./app/[locale]/messages/ru.json`);
    base = (modRu as any).default || {};
  }

  // Дополнительные пакеты (необязательные)
  const header  = await tryLoad(current, 'header');
  const pricing = await tryLoad(current, 'pricing');
  const donate  = await tryLoad(current, 'donate');
  const thanks  = await tryLoad(current, 'thanks');

  return {
    locale: current,
    messages: merge(base, header, pricing, donate, thanks)
  };
}
