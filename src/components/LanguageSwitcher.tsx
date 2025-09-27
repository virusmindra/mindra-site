'use client';

import {usePathname, useRouter} from 'next/navigation';
import {useLocale} from 'next-intl';

const LOCALES = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || '/ru';
  const current = useLocale();

  // pathname вида /{locale}/...  — аккуратно подменяем первую часть
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const parts = pathname.split('/');
    if (parts.length > 1) {
      parts[1] = next;
      router.replace(parts.join('/'));
    } else {
      router.replace(`/${next}`);
    }
  };

  return (
    <select
      value={current}
      onChange={onChange}
      className="rounded-lg border border-white/20 bg-transparent px-2 py-1 text-sm"
      aria-label="Change language"
    >
      {LOCALES.map(l => (
        <option key={l} value={l}>{l.toUpperCase()}</option>
      ))}
    </select>
  );
}
