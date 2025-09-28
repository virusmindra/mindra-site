import {getT} from '@/lib/getT';
import {DONATE_URL} from '@/lib/links';
import Link from 'next/link';

export default async function SupportPage({params}:{params:{locale:string}}) {
  const t = await getT({locale: params.locale, namespace: 'supportPage'});

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="mt-3 opacity-90 max-w-3xl">{t('intro')}</p>

      <h2 className="mt-8 text-2xl font-semibold">{t('goal.title')}</h2>
      <p className="mt-2 opacity-90 max-w-3xl">{t('goal.text')}</p>

      <ul className="mt-3 space-y-2 list-disc pl-6 opacity-90">
        <li>{t('features.1')}</li>
        <li>{t('features.2')}</li>
        <li>{t('features.3')}</li>
      </ul>

      {/* Прогресс (пока статичный текст) */}
      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold">{t('progress.title')}</h3>
        <p className="mt-2 opacity-90">{t('progress.subtitle')}</p>
      </div>

      {/* Тарифы/подписки — overview */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 p-6">
          <h4 className="text-lg font-semibold">{t('plans.free.name')}</h4>
          <p className="opacity-80 mt-2">{t('plans.free.desc')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h4 className="text-lg font-semibold">{t('plans.lite.name')}</h4>
          <p className="opacity-80 mt-2">{t('plans.lite.desc')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6">
          <h4 className="text-lg font-semibold">{t('plans.plus.name')}</h4>
          <p className="opacity-80 mt-2">{t('plans.plus.desc')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-6 md:col-span-3">
          <h4 className="text-lg font-semibold">{t('plans.pro.name')}</h4>
          <p className="opacity-80 mt-2">{t('plans.pro.desc')}</p>
        </div>
      </div>

      {/* Скидки основателям */}
      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold">{t('founders.title')}</h3>
        <ul className="mt-2 list-disc pl-6 opacity-90 space-y-1">
          <li>{t('founders.tier300')}</li>
          <li>{t('founders.tier500')}</li>
        </ul>
        <p className="mt-2 opacity-80">{t('founders.note')}</p>
      </div>

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
