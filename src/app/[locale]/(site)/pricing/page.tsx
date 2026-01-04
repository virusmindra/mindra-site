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
    <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-6xl">
      <header className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold">{t('pricing.title')}</h1>
        <p className="text-zinc-300">{t('pricing.subtitle')}</p>
      </header>

      {/* блок тарифов + Included в одной сетке */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-start">
        {/* три карточки тарифов */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 p-6">
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

          <div className="rounded-2xl border border-white/10 p-6">
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

          <div className="rounded-2xl border border-white/10 p-6">
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

        {/* Included – теперь визуально “под первой карточкой” и левее */}
        <div className="lg:pl-4">
          <h2 className="text-2xl font-semibold mb-3">{t('features.header')}</h2>
          <ul className="space-y-1 opacity-90 list-disc pl-5">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
