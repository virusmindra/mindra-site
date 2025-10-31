// src/components/LanguageSwitcher.tsx
'use client';

import {useMemo} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {locales, type Locale} from '@/i18n';

const LABELS: Record<string, string> = {
  ru:'Русский', en:'English', uk:'Українська', pl:'Polski', es:'Español',
  fr:'Français', de:'Deutsch', kk:'Қазақша', hy:'Հայերեն', ka:'ქართული', md:'Română'
};

export default function LanguageSwitcher() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Текущая локаль = первый сегмент пути, если он из списка
  const current: Locale = useMemo(() => {
    const seg = pathname.split('/')[1] as Locale | undefined;
    return (seg && (locales as readonly string[]).includes(seg)) ? seg : 'en';
  }, [pathname]);

  // Остаток пути после /{locale}
  const rest = useMemo(() => pathname.replace(/^\/(ru|en|uk|pl|es|fr|de|kk|hy|ka|md)/, ''), [pathname]);

  const changeLocale = (next: string) => {
    if (next === current) return;
    router.push(`/${next}${rest || ''}`);
  };

  return (
    <select
      value={current}
      onChange={(e) => changeLocale(e.target.value)}
      className="rounded-xl border border-white/20 bg-transparent px-3 py-1.5 text-sm"
      aria-label="Select language"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc} className="bg-zinc-900">
          {LABELS[loc] ?? loc.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
