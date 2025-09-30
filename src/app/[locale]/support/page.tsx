import {getT} from '@/lib/getT';
import {DONATE_URL} from '@/lib/links';
import Link from 'next/link';
import {getProgress} from '@/lib/donations';
import PricingClient from './pricing-client';

export default async function SupportPage({
  params,
  searchParams
}: {
  params: {locale: string};
  searchParams?: { founder?: string };
}) {
  const t = await getT({locale: params.locale, namespace: 'supportPage'});

  // живые цифры со Stripe
  const {raised, goal, backers} = await getProgress();

  // дефолт переключателя скидок из URL (?founder=35|40)
  const founderPct = (() => {
    const raw = searchParams?.founder;
    const n = raw ? parseInt(raw, 10) : 0;
    return (n === 35 || n === 40) ? n : 0;
  })();

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="mt-3 opacity-90 max-w-3xl">{t('intro')}</p>

      <h2 className="mt-8 text-2xl font-semibold">{t('goal.title')}</h2>
      <p className="mt-2 opacity-90 max-w-3xl">{t('goal.text')}</p>

      <ul className="mt-3 space-y-2 list-disc pl-6 opacity-90">
        <li>{t('goal.features.1')}</li>
        <li>{t('goal.features.2')}</li>
        <li>{t('goal.features.3')}</li>
      </ul>

      {/* Прогресс (живой, локализованный) */}
      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold">{t('progress.title')}</h3>
        <p className="mt-2 opacity-90">
          {t('progress.line', {raised, goal, n: backers})}
        </p>
      </div>

      {/* Интерактивные подписки + тумблер фаундеров */}
      <div className="mt-8">
        <PricingClient locale={params.locale} defaultFounder={founderPct} />
      </div>

      {/* Кнопки */}
      <div className="mt-8 flex gap-3">
        <a
          className="rounded-xl px-4 py-2 bg-white text-zinc-900"
          href={DONATE_URL}
          target="_blank"
          rel="noopener"
        >
          {t('cta.stripe')}
        </a>

        <Link
          className="rounded-xl px-4 py-2 border border-white/20"
          href={`/${params.locale}`}
        >
          {t('cta.back')}
        </Link>
      </div>
    </section>
  );
}
