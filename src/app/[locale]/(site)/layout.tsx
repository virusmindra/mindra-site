import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import { getTSync } from '@/lib/getT';
import Footer from '@/components/Footer';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function SiteLayout({ children, params: { locale } }: Props) {
  const t = getTSync(locale);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        {/* ВАЖНО: убираем max-w-6xl чтобы Mindra была впритык слева, а меню — вправо */}
        <div className="h-14 w-full flex items-center justify-between px-6">
          <Link href={`/${locale}`} className="font-semibold tracking-tight">
            Mindra
          </Link>

          <nav className="flex items-center gap-4 text-sm">
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
