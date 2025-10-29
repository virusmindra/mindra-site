'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {usePathname} from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import * as React from 'react';

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (pathname?.startsWith(href) && href !== '/'); // активен и для вложенных путей

  return (
    <Link
      href={href}
      className={[
        'px-3 py-1.5 rounded-xl text-sm transition',
        active ? 'bg-white text-zinc-900' : 'border border-white/15 hover:bg-white/10'
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

export default function AppHeader() {
  const t = useTranslations(); // берет ключи из твоих messages (ru.json и т.д.)
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Логотип → на главную выбранной локали */}
        <Link href={`/${locale}`} className="font-semibold tracking-wide">
          MINDRA
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink href={`/${locale}`}>Home</NavLink>
          <NavLink href={`/${locale}/pricing`}>{t('nav.pricing')}</NavLink>
          <NavLink href={`/${locale}/chat`}>Chat</NavLink>
          {/* Донат ведем на страницу доната сайта (там уже Stripe-кнопки) */}
          <NavLink href={`/${locale}/donate`}>{t('nav.donate')}</NavLink>

          {/* Переключатель языка справа */}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
