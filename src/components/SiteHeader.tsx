'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {useLocale, useTranslations} from 'next-intl';
import AuthButton from '@/components/AuthButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const nav = [
  { slug: '', label: 'Home' },
  { slug: 'chat', label: 'Chat' },
  { slug: 'pricing', label: 'Pricing' },
  { slug: 'donate', label: 'Donate' },
];

export default function SiteHeader() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-lg font-semibold tracking-tight">
          Mindra
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => {
            const href = `/${locale}/${item.slug}`.replace(/\/$/, '');
            const active = pathname === href;
            return (
              <Link
                key={item.slug || 'home'}
                href={href}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
