'use client';

import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import { getTSync } from '@/lib/getT'; // как у тебя

export default function SiteHeader({ locale }: { locale: Locale }) {
  const t = getTSync(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto h-14 w-full max-w-6xl px-6 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-semibold tracking-tight">
          Mindra
        </Link>

        <nav className="flex items-center gap-4 text-sm text-[var(--text)]">
          <Link href={`/${locale}`} className="opacity-80 hover:opacity-100">
            {t('nav.home')}
          </Link>
          <Link href={`/${locale}/pricing`} className="opacity-80 hover:opacity-100">
            {t('nav.pricing')}
          </Link>
          <Link href={`/${locale}/chat`} className="opacity-80 hover:opacity-100">
            {t('nav.chat')}
          </Link>
          <Link href={`/${locale}/support`} className="opacity-80 hover:opacity-100">
            {t('nav.donate')}
          </Link>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
