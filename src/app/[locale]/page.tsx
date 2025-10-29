// src/app/[locale]/page.tsx
import Link from 'next/link';
import {getTranslations} from 'next-intl/server';

export default async function LocaleHome() {
  const t = await getTranslations();
  return (
    <section className="mx-auto max-w-5xl text-center space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{t('hero.title')}</h1>
        <p className="opacity-80">{t('hero.subtitle')}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="https://t.me/talktomindra_bot" target="_blank"
                className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:opacity-90">
            {t('cta.launch')}
          </Link>
          <Link href="./pricing" className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10">
            {t('cta.pricing')}
          </Link>
          <Link href="./donate" className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10">
            {t('nav.donate')}
          </Link>
        </div>
      </header>
    </section>
  );
}
