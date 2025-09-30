// src/app/[locale]/support/page.tsx
import {getT} from '@/lib/getT';
import {DONATE_URL} from '@/lib/links';
import {getProgress} from '@/lib/donations';
import Link from 'next/link';

export default async function SupportPage({params}:{params:{locale:string}}) {
  const t = await getT({locale: params.locale, namespace: 'supportPage'});
  const p = await getProgress();

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

      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold">{t('progress.title')}</h3>
        <p className="mt-2 opacity-90">
          {/* если хочешь интернационализировать фразу — добавь шаблон в donate.json */}
          Собрано: {p.raised} • Цель: {p.goal} • Уже поддержали: {p.backers}
        </p>
      </div>

      {/* …дальше как у тебя */}
      <div className="mt-8 flex gap-3">
        <a className="rounded-xl px-4 py-2 bg-white text-zinc-900" href={DONATE_URL} target="_blank" rel="noopener">
          {t('cta.stripe')}
        </a>
        <Link className="rounded-xl px-4 py-2 border border-white/20" href={`/${params.locale}`}>
          {t('cta.back')}
        </Link>
      </div>
    </section>
  );
}
