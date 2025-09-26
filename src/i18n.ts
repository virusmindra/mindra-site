import {getRequestConfig} from 'next-intl/server';

type Dict = Record<string, unknown>;
const merge = (...objs: Dict[]) => Object.assign({}, ...objs);

// Пытаемся грузить доп. пакеты сообщений по имени (header/pricing/donate/thanks),
// если файла нет — возвращаем пустой объект
async function tryLoad(current: string, suffix: string): Promise<Dict> {
  try {
    const mod = await import(`@/app/[locale]/messages/${current}.${suffix}.json`);
    return mod.default as Dict;
  } catch {
    return {};
  }
}

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';

  // База (ru.json / en.json / ...)
  const base = (await import(`@/app/[locale]/messages/${current}.json`)).default as Dict;

  // Дополнительные "пакеты"
  const header  = await tryLoad(current, 'header');
  const pricing = await tryLoad(current, 'pricing');
  const donate  = await tryLoad(current, 'donate');
  const thanks  = await tryLoad(current, 'thanks');

  return {
    locale: current,
    messages: merge(base, header, pricing, donate, thanks)
  };
});
