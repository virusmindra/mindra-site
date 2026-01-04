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
    <header className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* LOGO — строго слева */}
        <Link
          href={`/${locale}`}
          className="font-semibold text-[var(--text)] tracking-tight"
        >
          Mindra
        </Link>

        {/* NAV — строго справа */}
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link
            href={`/${locale}`}
            className="hover:text-[var(--text)] transition"
          >
            Home
          </Link>

          <Link
            href={`/${locale}/pricing`}
            className="hover:text-[var(--text)] transition"
          >
            Pricing
          </Link>

          <Link
            href={`/${locale}/chat`}
            className="hover:text-[var(--text)] transition"
          >
            Chat
          </Link>

          <Link
            href={`/${locale}/support`}
            className="hover:text-[var(--text)] transition"
          >
            Donate
          </Link>

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}