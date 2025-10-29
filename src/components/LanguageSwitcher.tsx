'use client';

import * as React from 'react';
import {useLocale} from 'next-intl';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';

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

// Порядок языков в выпадающем списке
const LOCALES = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const changeLocale = (next: string) => {
    if (!pathname || next === locale) return;

    // Разбиваем путь и меняем только первый сегмент после корня
    const parts = pathname.split('/'); // ['', 'ru', '...']
    const currentFirst = parts[1];

    if (currentFirst && LOCALES.includes(currentFirst as (typeof LOCALES)[number])) {
      parts[1] = next; // /ru/... -> /en/...
    } else {
      // путь был без локали, вставляем
      parts.splice(1, 0, next); // '/' -> '/en'
    }

    let url = parts.join('/') || '/';

    const qs = searchParams?.toString();
    if (qs) url += `?${qs}`;

    // Сохраняем hash, если был
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    router.push(url + hash);
  };

  return (
    <select
      value={locale}
      onChange={(e) => changeLocale(e.target.value)}
      className="rounded-xl border border-white/20 bg-transparent px-3 py-1.5 text-sm"
      aria-label="Select language"
    >
      {LOCALES.map((loc) => (
        <option key={loc} value={loc} className="bg-zinc-900">
          {LABELS[loc] ?? loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
