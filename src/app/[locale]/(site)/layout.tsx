// src/app/[locale]/(site)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import { getTSync } from '@/lib/getT';
import Footer from '@/components/Footer';

export default function SiteLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  const t = getTSync(locale);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/${locale}`} className="font-semibold tracking-tight">
            Mindra
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link href={`/${locale}`} className="opacity-90 hover:opacity-100">
              {t('nav.home')}
            </Link>
            <Link href={`/${locale}/pricing`} className="opacity-90 hover:opacity-100">
              {t('nav.pricing')}
            </Link>
            <Link href={`/${locale}/chat`} className="opacity-90 hover:opacity-100">
              {t('nav.chat')}
            </Link>
            <Link href={`/${locale}/support`} className="opacity-90 hover:opacity-100">
              {t('nav.donate')}
            </Link>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="px-4 py-8">{children}</main>

      <Footer locale={locale} />
    </>
  );
}
