// src/app/[locale]/page.tsx
import Link from 'next/link';
import { getTSync } from '@/lib/getT';
import type { Locale } from '@/i18n';

type Props = { params: { locale: Locale } };

export default function Page({ params: { locale } }: Props) {
  const t = getTSync(locale);

  const featureItems = [
    { title: t('features.cards.chat.title'),    text: t('features.cards.chat.text') },
    { title: t('features.cards.coach.title'),   text: t('features.cards.coach.text') },
    { title: t('features.cards.goals.title'),   text: t('features.cards.goals.text') },
    { title: t('features.cards.reports.title'), text: t('features.cards.reports.text') },
    { title: t('features.cards.voice.title'),   text: t('features.cards.voice.text') },
    { title: t('features.cards.premium.title'), text: t('features.cards.premium.text') },
  ];

  return (
    <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-6xl space-y-14">
      {/* HERO */}
      <header className="text-center space-y-6">
        <p className="text-sm uppercase tracking-wider text-white/60">
          {t('brand.tagline')}
        </p>

        <h1 className="text-3xl md:text-5xl font-semibold">
          {t('hero.title')}
        </h1>

        <p className="opacity-80 max-w-3xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <div className="flex justify-center gap-3">
          <Link
            href="https://t.me/talktomindra_bot"
            className="rounded-xl bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90"
            target="_blank"
            rel="noopener"
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
      </header>

      {/* FEATURES */}
      <section className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">
          {t('features.title')}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((f, i) => (
            <article
              key={i}
              className="rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-colors"
            >
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm opacity-80">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Link
          href={`/${locale}/support`}
          className="inline-block rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
        >
          {t('nav.donate')}
        </Link>
      </section>
    </section>
  );
}
