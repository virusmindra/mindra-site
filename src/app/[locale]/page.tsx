// src/app/[locale]/page.tsx
import Link from 'next/link';
import {getTranslations, getLocale} from 'next-intl/server';

type Card = {
  titleKey: string;
  textKey: string;
};

const CARDS: Card[] = [
  {titleKey: 'features.cards.chat.title',    textKey: 'features.cards.chat.text'},
  {titleKey: 'features.cards.coach.title',   textKey: 'features.cards.coach.text'},
  {titleKey: 'features.cards.goals.title',   textKey: 'features.cards.goals.text'},
  {titleKey: 'features.cards.reports.title', textKey: 'features.cards.reports.text'},
  {titleKey: 'features.cards.voice.title',   textKey: 'features.cards.voice.text'},
  {titleKey: 'features.cards.premium.title', textKey: 'features.cards.premium.text'},
];

export default async function HomePage() {
  const t = await getTranslations();   // серверный доступ к сообщениям
  const locale = await getLocale();    // текущая локаль для ссылок

  return (
    <section className="mx-auto max-w-5xl text-center space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="opacity-80">{t('hero.subtitle')}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="https://t.me/talktomindra_bot"
            target="_blank"
            className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:opacity-90"
          >
            {t('cta.launch')}
          </Link>

          <Link
            href={`/${locale}/pricing`}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10"
          >
            {t('cta.pricing')}
          </Link>

          <Link
            href={`/${locale}/donate`}
            className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10"
          >
            {t('nav.donate')}
          </Link>
        </div>
      </header>

      {/* Блок “Что умеет Mindra” */}
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold">{t('features.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CARDS.map((c) => (
            <Feature key={c.titleKey} title={t(c.titleKey)}>
              {t(c.textKey)}
            </Feature>
          ))}
        </div>
      </section>
    </section>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 text-left">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{children}</p>
    </div>
  );
}
