import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import { getTSync } from '@/lib/getT'; // <-- проверь путь, где у тебя helper

export default function SiteHeader({ locale }: { locale: Locale }) {
  const t = getTSync(locale);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
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
  );
}
