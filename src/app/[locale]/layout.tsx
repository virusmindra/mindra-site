// src/app/[locale]/layout.tsx
import '../globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import AuthProvider from '@/components/AuthProvider';
import { getTSync } from '@/lib/getT';
import Footer from '@/components/Footer';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function LocaleLayout({ children, params: { locale } }: Props) {
  const t = getTSync(locale);

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>
          <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
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

          {/* Больше НЕТ max-w здесь – каждая страница сама решает, какой контейнер ей нужен */}
          <main className="px-4 py-8">
            {children}
          </main>

          <Footer locale={locale} />
        </AuthProvider>
      </body>
    </html>
  );
}
