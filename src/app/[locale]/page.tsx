import Link from 'next/link';

export default async function Page() {
  // 1) по-минимуму выясним локаль без next-intl
  const locale = 'en'; // временно жёстко, чтобы исключить импорт next-intl/server

  // 2) пробуем next-intl в try/catch, чтобы не уронить рендер
  let t = (k: string) => k; // дефолт: возвращаем ключ
  try {
    // ДИНАМИЧЕСКИЕ ИМПОРТЫ, чтобы не грузить модуль на старте
    const {getMessages} = await import('next-intl/server');
    const {createTranslator} = await import('next-intl');

    const raw = await getMessages({ locale });
    const messages = JSON.parse(JSON.stringify(raw)); // гарантия JSON
    t = createTranslator({ locale, messages });
  } catch (e) {
    console.error('next-intl failed on server Page():', e);
    // остаёмся на t(k) => k
  }

  return (
    <section className="mx-auto max-w-5xl text-center space-y-8 p-6">
      <h1 className="text-3xl md:text-5xl font-semibold">{t('hero.title')}</h1>
      <p className="opacity-80">{t('hero.subtitle')}</p>
      <div className="flex justify-center gap-3">
        <Link href="https://t.me/talktomindra_bot" className="rounded-xl bg-white text-zinc-900 px-4 py-2 text-sm" target="_blank" rel="noopener">
          {t('cta.launch')}
        </Link>
        <Link href={`/${locale}/pricing`} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10">
          {t('cta.pricing')}
        </Link>
      </div>
    </section>
  );
}
