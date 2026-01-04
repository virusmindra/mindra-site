'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getTSync } from '@/lib/getT'; // или '@/lib/getTSync' — как у тебя реально называется файл
import type { Locale } from '@/i18n';

function navLinkClass(isActive: boolean) {
  return [
    'text-sm transition-colors',
    isActive ? 'text-[var(--accent)] font-medium' : 'text-[var(--muted)] hover:text-[var(--text)]',
  ].join(' ');
}

export default function SiteHeader({ locale }: { locale: Locale }) {
  const t = getTSync(locale);
  const pathname = usePathname();

  const hrefHome = `/${locale}`;
  const hrefPricing = `/${locale}/pricing`;
  const hrefChat = `/${locale}/chat`;
  const hrefDonate = `/${locale}/support`; // у тебя донат = support

  const isHome = pathname === hrefHome;
  const isPricing = pathname?.startsWith(hrefPricing);
  const isChat = pathname?.startsWith(hrefChat);
  const isDonate = pathname?.startsWith(hrefDonate);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="w-full px-6">
        <div className="h-14 max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href={hrefHome} className="font-semibold tracking-tight text-[var(--text)]">
            Mindra
          </Link>

          <nav className="flex items-center gap-5">
            <Link href={hrefHome} className={navLinkClass(isHome)}>
              {t('nav.home')}
            </Link>
            <Link href={hrefPricing} className={navLinkClass(!!isPricing)}>
              {t('nav.pricing')}
            </Link>
            <Link href={hrefChat} className={navLinkClass(!!isChat)}>
              {t('nav.chat')}
            </Link>
            <Link href={hrefDonate} className={navLinkClass(!!isDonate)}>
              {t('nav.donate')}
            </Link>

            <div className="ml-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
