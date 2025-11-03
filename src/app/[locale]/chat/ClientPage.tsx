'use client'
import {useTranslations} from 'next-intl';

export default function ClientPage() {
  const t = useTranslations();

  return (
    <div className="p-4">
      {/* UI чата */}
      <p>{t('chat.title')}</p>
    </div>
  );
}
