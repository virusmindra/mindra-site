'use client';

import {useRouter, usePathname, useParams} from 'next/navigation';
import {useTransition} from 'react';

const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
const labels: Record<string,string> = {
  ru:'Русский', en:'English', uk:'Українська', pl:'Polski', es:'Español',
  fr:'Français', de:'Deutsch', kk:'Қазақша', hy:'Հայերեն', ka:'ქართული', md:'Română'
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as {locale?: string};
  const [isPending, startTransition] = useTransition();

  const current = (params?.locale ?? 'ru').toString();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    // меняем первый сегмент пути (/ru/..., /en/...)
    const segments = pathname.split('/');
    segments[1] = next; // первый сегмент после начального "/"
    const nextPath = segments.join('/');
    startTransition(() => router.push(nextPath));
  }

  return (
    <select
      className="bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
      value={current}
      onChange={onChange}
      disabled={isPending}
      aria-label="Choose language"
    >
      {locales.map(l => (
        <option key={l} value={l}>
          {labels[l] ?? l}
        </option>
      ))}
    </select>
  );
}
