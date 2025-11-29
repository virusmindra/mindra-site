// src/app/[locale]/pricing/page.tsx
import {getTSync} from '@/lib/getT';
import {getMessagesSync, type Locale} from '@/i18n';
import {TELEGRAM_URL} from '@/lib/links';

export default function PricingPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = getTSync(locale, 'pricing');

  const messages = getMessagesSync(locale, 'pricing') as Record<string, unknown>;
  const raw = (messages['features.items'] ?? []) as unknown;
  const features = Array.isArray(raw)
    ? (raw as string[])
    : raw && typeof raw === 'object'
      ? Object.values(raw as Record<string, string>)
      : [];

  return (
    <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-5xl">
      {/* Заголовок страницы */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold">
          {t('pricing.title')}
        </h1>
        <p className="mt-3 text-sm md:text-base text-zinc-300">
          {t('pricing.subtitle')}
        </p>
      </header>

      {/* Карточки тарифов по центру */}
      <div className="mt-10 flex flex-col items-center gap-4 md:flex-row md:justify-center md:gap-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <h3 className="text-xl font-semibold">{t('plan.free.name')}</h3>
          <p className="opacity-80 mt-2">{t('plan.free.desc')}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20 hover:bg-white/10"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('cta.telegram')}
          </a>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <h3 className="text-xl font-semibold">{t('plan.plus.name')}</h3>
          <p className="opacity-90 mt-1">{t('plan.plus.from')}</p>
          <p className="opacity-80 mt-2">{t('plan.plus.desc')}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 bg-white text-zinc-900 hover:opacity-90"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('cta.telegram')}
          </a>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/60 p-6">
          <h3 className="text-xl font-semibold">{t('plan.pro.name')}</h3>
          <p className="opacity-90 mt-1">{t('plan.pro.from')}</p>
          <p className="opacity-80 mt-2">{t('plan.pro.desc')}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20 hover:bg-white/10"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('cta.telegram')}
          </a>
        </div>
      </div>

      {/* Included — тоже чуть сузим и выровняем */}
      <section className="mt-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold">{t('features.header')}</h2>
        <ul className="mt-3 space-y-1 opacity-90 list-disc pl-6">
          {features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
