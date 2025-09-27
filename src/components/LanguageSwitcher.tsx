'use client';

import {usePathname, useRouter} from 'next/navigation';
import {locales} from '@/locales';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname() || '/ru';

  function switchTo(next: string) {
    const parts = pathname.split('/');
    // ['', 'ru', 'pricing', ...] => заменить parts[1] на выбранный язык
    if (parts.length > 1) {
      parts[1] = next;
    }
    const target = parts.join('/') || `/${next}`;
    router.push(target);
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map(l => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded border border-white/10"
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
