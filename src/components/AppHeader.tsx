'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import * as React from 'react';

export default function AppHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) => pathname?.startsWith(href);

  const Nav = ({href, children}:{href:string; children:React.ReactNode}) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-xl text-sm transition
        ${isActive(href) ? 'bg-white text-zinc-900' : 'border border-white/15 hover:bg-white/10'}`}
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href={`/${locale}`} className="font-semibold tracking-wide">MINDRA</Link>

        <nav className="ml-auto flex items-center gap-2">
          <Nav href={`/${locale}`}>Home</Nav>
          <Nav href={`/${locale}/chat`}>Chat</Nav>
          <Nav href={`/${locale}/pricing`}>{t('nav.pricing')}</Nav>
          <Nav href={`/${locale}/donate`}>{t('nav.donate')}</Nav>
          <LanguageSwitcher/>
        </nav>
      </div>
    </header>
  );
}
