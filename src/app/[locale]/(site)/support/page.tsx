// src/app/[locale]/support/page.tsx
import type {Locale} from '@/i18n';
import {getMessagesSync} from '@/i18n';
import {getTSync} from '@/lib/getT';
import {dotToNested} from '@/lib/i18nShape';
import SafeIntlProvider from '@/components/SafeIntlProvider';
import PricingClient from './pricing-client';

type Props = {
  params: { locale: Locale };
  searchParams?: { founder?: string };
};

export const revalidate = 0;

export default async function SupportPage({ params: { locale }, searchParams }: Props) {
  // серверные заголовки/интро
  const t = getTSync(locale, 'donate');

  // КЛЮЧЕВОЕ: превращаем плоские ключи в nested перед провайдером
  const flat = getMessagesSync(locale, 'donate') as Record<string, unknown>;
  const messages = dotToNested(flat);

  const founder = Number(searchParams?.founder ?? 0) || 0;

  return (
    <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-5xl">
      <h1 className="text-4xl font-semibold">{t('donate.title')}</h1>
      <p className="mt-3 opacity-80">{t('donate.subtitle')}</p>

      <h2 className="mt-8 text-2xl font-semibold">{t('donate.goal.title')}</h2>
      <p className="opacity-80">{t('donate.goal.text')}</p>

      <ul className="mt-3 list-disc pl-6 space-y-1">
        <li>{t('donate.goal.points.1')}</li>
        <li>{t('donate.goal.points.2')}</li>
        <li>{t('donate.goal.points.3')}</li>
      </ul>

      <SafeIntlProvider locale={locale} messages={messages}>
        <PricingClient locale={locale} defaultFounder={founder} />
      </SafeIntlProvider>
    </section>
  );
}
