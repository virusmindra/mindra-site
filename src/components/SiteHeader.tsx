'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getTSync } from '@/lib/getT';

export default function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = getTSync(locale);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto max-w-7xl h-14 px-6 flex items-center justify-between">
        {/* LOGO — строго влево */}
        <Link
          href={`/${locale}`}
          className="font-semibold tracking-tight text-lg"
        >
          Mindra
        </Link>

        {/* NAV — строго вправо */}
        <nav className="flex items-center gap-6 text-sm">
          {[
            { href: `/${locale}`, label: t('nav.home') },
            { href: `/${locale}/pricing`, label: t('nav.pricing') },
            { href: `/${locale}/chat`, label: t('nav.chat') },
            { href: `/${locale}/support`, label: t('nav.donate') },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                'transition-colors',
                isActive(href)
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}

          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
