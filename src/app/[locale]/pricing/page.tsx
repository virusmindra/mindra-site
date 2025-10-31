// src/app/[locale]/pricing/page.tsx
import {createTranslator, type AbstractIntlMessages} from 'next-intl';
import {getMessagesSync, type Locale} from '@/i18n';
import {TELEGRAM_URL} from '@/lib/links';

type Props = { params: { locale: Locale } };

export default function PricingPage({ params: { locale } }: Props) {
  // Берём объединённый словарь: base + pricing
  const messages = getMessagesSync(locale, 'pricing') as AbstractIntlMessages;

  // Подсказываем TS сигнатуру t, чтобы не было never
  const t = createTranslator({ locale, messages }) as (
    key: string,
    values?: Record<string, unknown>
  ) => string;

  // features.items может быть массивом или объектом — нормализуем в string[]
  const raw = (messages as any)['features.items'];
  const features: string[] =
    Array.isArray(raw) ? raw :
    raw && typeof raw === 'object' ? Object.values(raw as Record<string, string>) :
    [];

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t('pricing.title')}</h1>
      <p className="mt-3 text-zinc-300">{t('pricing.subtitle')}</p>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t('plan.free.name')}</h3>
          <p className="opacity-80 mt-2">{t('plan.free.desc')}</p>
          <a className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
             href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
            {t('cta.telegram')}
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t('plan.plus.name')}</h3>
          <p className="opacity-90 mt-1">{t('plan.plus.from')}</p>
          <p className="opacity-80 mt-2">{t('plan.plus.desc')}</p>
          <a className="inline-block mt-6 rounded-xl px-4 py-2 bg-white text-zinc-900"
             href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
            {t('cta.telegram')}
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t('plan.pro.name')}</h3>
          <p className="opacity-90 mt-1">{t('plan.pro.from')}</p>
          <p className="opacity-80 mt-2">{t('plan.pro.desc')}</p>
          <a className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
             href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
            {t('cta.telegram')}
          </a>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">{t('features.header')}</h2>
      <ul className="mt-3 space-y-1 opacity-90 list-disc pl-6">
        {features.map((f, i) => (<li key={i}>{f}</li>))}
      </ul>
    </section>
  );
}
