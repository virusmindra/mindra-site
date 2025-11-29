import { getTSync } from '@/lib/getT';
import { getMessagesSync, type Locale } from '@/i18n';
import { TELEGRAM_URL } from '@/lib/links';

export default function PricingPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = getTSync(locale, 'pricing');

  const messages = getMessagesSync(locale, 'pricing') as Record<string, unknown>;
  const raw = (messages['features.items'] ?? []) as unknown;

  const features = Array.isArray(raw)
    ? (raw as string[])
    : raw && typeof raw === 'object'
      ? Object.values(raw as Record<string, string>)
      : [];

  return (
    <section className="pt-16 md:pt-24 pb-16">
      <div className="mx-auto max-w-4xl">
        {/* Заголовок */}
        <header className="text-center">
          <h1 className="text-4xl font-semibold">{t('pricing.title')}</h1>
          <p className="mt-3 text-zinc-300">{t('pricing.subtitle')}</p>
        </header>

        {/* Тарифы – компактный «остров» по центру */}
        <div className="mt-10 flex flex-wrap justify-center gap-6">
          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-950/60 px-6 py-6">
            <h3 className="text-xl font-semibold">{t('plan.free.name')}</h3>
            <p className="opacity-80 mt-2">{t('plan.free.desc')}</p>
            <a
              className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cta.telegram')}
            </a>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-950/60 px-6 py-6">
            <h3 className="text-xl font-semibold">{t('plan.plus.name')}</h3>
            <p className="opacity-90 mt-1">{t('plan.plus.from')}</p>
            <p className="opacity-80 mt-2">{t('plan.plus.desc')}</p>
            <a
              className="inline-block mt-6 rounded-xl px-4 py-2 bg-white text-zinc-900"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cta.telegram')}
            </a>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-zinc-950/60 px-6 py-6">
            <h3 className="text-xl font-semibold">{t('plan.pro.name')}</h3>
            <p className="opacity-90 mt-1">{t('plan.pro.from')}</p>
            <p className="opacity-80 mt-2">{t('plan.pro.desc')}</p>
            <a
              className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('cta.telegram')}
            </a>
          </div>
        </div>

        {/* Included – тоже по центру под блоком тарифов */}
        <h2 className="mt-10 text-2xl font-semibold text-center">
          {t('features.header')}
        </h2>
        <ul className="mt-4 space-y-1 opacity-90 list-disc pl-5 max-w-lg mx-auto text-left">
          {features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
