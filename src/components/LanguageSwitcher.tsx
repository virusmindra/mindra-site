'use client';

import {useRouter, usePathname, useParams} from 'next/navigation';
import {useTransition} from 'react';
import {locales, localeLabels} from '@/locales';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as {locale: string};
  const [isPending, startTransition] = useTransition();

  const current = (params?.locale ?? 'ru') as keyof typeof localeLabels;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;

    // Меняем первый сегмент пути на новый locale и делаем навигацию.
    // Пример: /ru/pricing -> /en/pricing
    const segments = pathname.split('/');
    segments[1] = next;
    const nextPath = segments.join('/');

    startTransition(() => {
      // next-intl middleware поставит cookie NEXT_LOCALE автоматически
      router.push(nextPath);
    });
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
      <span className="sr-only">Language</span>
      <select
        onChange={onChange}
        defaultValue={current}
        disabled={isPending}
        className="bg-zinc-900/50 border border-white/10 rounded-md px-3 py-1.5 outline-none hover:bg-zinc-800/60"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
