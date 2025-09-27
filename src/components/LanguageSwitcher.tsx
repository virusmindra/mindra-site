'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import * as React from 'react';

const LABELS: Record<string, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
  pl: 'Polski',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  kk: 'Қазақша',
  hy: 'Հայերեն',
  ka: 'ქართული',
  md: 'Română'
};

const ORDER = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  // текущий путь вида /{locale}/... → меняем только 1-й сегмент
  const changeLocale = (next: string) => {
    if (!pathname) return;
    const parts = pathname.split('/');
    parts[1] = next; // /ru/... → /en/...
    router.push(parts.join('/'));
  };

  return (
    <select
      value={locale}
      onChange={(e) => changeLocale(e.target.value)}
      className="rounded-xl border border-white/20 bg-transparent px-3 py-1.5 text-sm"
      aria-label="Select language"
    >
      {ORDER.map((loc) => (
        <option key={loc} value={loc} className="bg-zinc-900">
          {LABELS[loc] ?? loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
