import {getRequestConfig} from 'next-intl/server';

type Dict = Record<string, unknown>;

const baseLoaders: Record<string, () => Promise<{default: Dict}>> = {
  ru: () => import('@/app/[locale]/messages/ru.json'),
  en: () => import('@/app/[locale]/messages/en.json'),
  uk: () => import('@/app/[locale]/messages/uk.json'),
  pl: () => import('@/app/[locale]/messages/pl.json'),
  es: () => import('@/app/[locale]/messages/es.json'),
  fr: () => import('@/app/[locale]/messages/fr.json'),
  de: () => import('@/app/[locale]/messages/de.json'),
  kk: () => import('@/app/[locale]/messages/kk.json'),
  hy: () => import('@/app/[locale]/messages/hy.json'),
  ka: () => import('@/app/[locale]/messages/ka.json'),
  md: () => import('@/app/[locale]/messages/md.json')
};

async function tryLoad(current: string, suffix: string): Promise<Dict> {
  try {
    const mod = await import(`@/app/[locale]/messages/${current}.${suffix}.json`);
    return mod.default as Dict;
  } catch {
    return {};
  }
}

function merge(...objs: Dict[]): Dict {
  return objs.reduce((acc, obj) => Object.assign(acc, obj), {} as Dict);
}

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';
  const load = baseLoaders[current] ?? baseLoaders['ru'];
  const base = (await load()).default as Dict;

  const header  = await tryLoad(current, 'header');
  const pricing = await tryLoad(current, 'pricing');
  const donate  = await tryLoad(current, 'donate');
  const thanks  = await tryLoad(current, 'thanks');

  // ВАЖНО: возвращаем только plain-object
  const messages = merge(base, header, pricing, donate, thanks);
  return {
    locale: current,
    messages
  };
});
