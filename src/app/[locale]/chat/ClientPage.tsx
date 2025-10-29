// src/app/[locale]/chat/ClientPage.tsx  (КЛИЕНТСКИЙ)
'use client';
import {useTranslations} from 'next-intl';

export default function ClientPage() {
  const t = useTranslations();
  return <div className="p-4">{t('chat.title')}</div>;
}
