// src/app/[locale]/page.tsx
import Link from 'next/link';
import {getLocale, getTranslations} from 'next-intl/server';

export default async function Page() {
  const locale = (await getLocale())!;
  const t = await getTranslations(); // плоские ключи

  return (
    <section className="mx-auto max-w-5xl text-center space-y-8">
      <h1 className="text-3xl md:text-5xl font-semibold">{t('hero.title')}</h1>
      <p className="opacity-80">{t('hero.subtitle')}</p>

      <div className="flex justify-center gap-3">
        <Link
          href="https://t.me/talktomindra_bot"
          className="rounded-xl bg-white text-zinc-900 px-4 py-2 text-sm"
        >
          {t('cta.launch')}
        </Link>
        <Link
          href={`/${locale}/pricing`}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
        >
          {t('cta.pricing')}
        </Link>
      </div>
    </section>
  );
}

