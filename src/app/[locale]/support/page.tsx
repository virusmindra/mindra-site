import {getT} from '@/lib/getT';
import {DONATE_URL} from '@/lib/links';
import Link from 'next/link';
import {getProgress} from '@/lib/donations';
import PricingClient from './pricing-client';

export default async function SupportPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { founder?: string };
}) {
  const t = await getT({ locale: params.locale, namespace: 'supportPage' });

  // Живые цифры со Stripe
  const { raised, goal, backers } = await getProgress();

  // Дефолт переключателя скидок из URL (?founder=35|40)
  const founderPct = (() => {
    const raw = searchParams?.founder;
    const n = raw ? parseInt(raw, 10) : 0;
    return n === 35 || n === 40 ? n : 0;
  })();

  return (
    <section className="py-10">
      {/* Заголовок и интро */}
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="mt-3 opacity-90 max-w-3xl">{t('intro')}</p>

      {/* Цели и фичи */}
      <h2 className="mt-8 text-2xl font-semibold">{t('goal.title')}</h2>
      <p className="mt-2 opacity-90 max-w-3xl">{t('goal.text')}</p>
      <ul className="mt-3 space-y-2 list-disc pl-6 opacity-90">
        <li>{t('goal.features.1')}</li>
        <li>{t('goal.features.2')}</li>
        <li>{t('goal.features.3')}</li>
      </ul>

      {/* Прогресс кампании */}
      <div className="mt-8 rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold">{t('progress.title')}</h3>
        <p className="mt-2 opacity-90">
          {t('progress.line', { raised, goal, n: backers })}
        </p>
      </div>

      {/* Подписки/планы + тумблер «Founder» */}
      <div className="mt-8">
        <PricingClient locale={params.locale} defaultFounder={founderPct} />
      </div>

      {/* Кнопки действия */}
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

      {/* Контакты (добавлено из «старой» версии) */}
      <div className="mt-12 rounded-2xl border border-white/10 p-6">
        <h2 className="text-xl font-semibold">
          {/* если в переводах есть supportPage.contactsTitle — используем его; иначе простая подпись */}
          {t?.('contacts.title') ?? 'Contacts'}
        </h2>
        <p className="mt-2 opacity-90">
          {t?.('contacts.desc') ??
            'Reach us via email or Telegram. We reply as soon as possible.'}
        </p>
        <ul className="mt-3 space-y-1">
          <li>
            <span className="opacity-80">Email:</span>{' '}
            <a className="underline" href="mailto:mindra.group.llc@gmail.com">
              mindra.group.llc@gmail.com
            </a>
          </li>
          <li>
            <span className="opacity-80">Telegram:</span>{' '}
            <a
              className="underline"
              href="https://t.me/talktomindra_bot"
              target="_blank"
              rel="noopener"
            >
              @talktomindra_bot
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
