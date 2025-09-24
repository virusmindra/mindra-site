'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';

export default function Home() {
  const t = useTranslations('home');

  return (
    <main>
      <section className="border-b border-white/10 bg-gradient-to-b from-zinc-900/30 to-transparent">
        <div className="container py-20 md:py-28 text-center mx-auto px-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400">{t('badge')}</p>
          <h1 className="mt-3 text-4xl md:text-6xl font-semibold leading-tight">
            {t('title')}
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-zinc-300">{t('subtitle')}</p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <a className="btn btn-primary px-5 py-2 rounded-md bg-white text-black"
               href="https://t.me/talktomindra_bot" target="_blank" rel="noreferrer">
              {t('cta.telegram')}
            </a>
            <a className="btn btn-ghost px-5 py-2 rounded-md border border-white/10"
               href="#pricing">
              {t('cta.pricing')}
            </a>
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24 mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-semibold">{t('features.title')}</h2>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['support','coach','goals','reports','voice','challenges'].map((key) => (
            <div key={key} className="rounded-2xl border border-white/10 p-5 bg-gradient-to-br from-white/5 to-fuchsia-500/10">
              <h3 className="font-medium text-lg">{t(`features.items.${key}.title`)}</h3>
              <p className="mt-2 text-sm text-zinc-300">{t(`features.items.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
