'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from '@/components/theme/ThemeProvider';

import type { ChatSession, ChatFeature } from './types';

type Props = {
  sessions: ChatSession[];
  currentId?: string;

  activeFeature: ChatFeature;
  onChangeFeature: (f: ChatFeature) => void;

  onNewChat: () => void;
  onSelect: (id: string) => void;
};

const featureList: { id: ChatFeature; label: string }[] = [
  { id: 'default',         label: 'Чат' },
  { id: 'goals',           label: 'Цели' },
  { id: 'habits',          label: 'Привычки' },
  { id: 'reminders',       label: 'Напоминания' },
  { id: 'challenges',      label: 'Челленджи' },
  { id: 'sleep_sounds',    label: 'Сон' },
  { id: 'bedtime_stories', label: 'Сказки' },
  { id: 'daily_tasks',     label: 'Задания на день' },
  { id: 'modes',           label: 'Режим общения' },
  { id: 'points',          label: 'Очки и титулы' },
];

export default function Sidebar({
  sessions,
  currentId,
  activeFeature,
  onChangeFeature,
  onNewChat,
  onSelect,
}: Props) {
  const { data: session, status } = useSession();
  const authed = !!session?.user;

  const params = useParams();
  const locale = String((params as any)?.locale ?? 'en');

  const { theme, setTheme } = useTheme();

  const displayedSessions = sessions.filter(
    (s) => (s.feature ?? 'default') === activeFeature,
  );

  return (
  <aside className="w-80 flex flex-col border-r border-[var(--border)] bg-[var(--card)] h-full overflow-hidden">
    {/* TOP */}
    <div className="p-3 border-b border-[var(--border)] space-y-2">
      <Link
        href={`/${locale}`}
        className="block w-full text-left text-xs text-[var(--muted)] hover:text-[var(--text)] transition"
      >
        ← На главную
      </Link>

      <button
        type="button"
        onClick={onNewChat}
        className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition"
      >
        Новый чат
      </button>
    </div>

    {/* MIDDLE */}
    <div className="flex-1 flex overflow-hidden">
      {/* CHATS */}
      <div className="w-1/2 flex flex-col border-r border-[var(--border)] overflow-hidden">
        <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-[var(--muted)]">
          Чаты
        </div>

        <ul className="flex-1 px-2 pb-3 space-y-1 text-xs overflow-auto">
          {displayedSessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={[
                  'w-full text-left px-2 py-1.5 rounded-md transition',
                  s.id === currentId
                    ? 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {(s.feature ?? 'default') === 'goals' && '🎯 '}
                {s.title || 'Без названия'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* MODES */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-[var(--muted)]">
          Режимы
        </div>

        <ul className="flex-1 px-2 pb-3 space-y-1 text-xs overflow-auto">
          {featureList.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onChangeFeature(f.id)}
                className={[
                  'w-full text-left px-2 py-1.5 rounded-md transition',
                  activeFeature === f.id
                    ? 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* BOTTOM */}
    <div className="border-t border-[var(--border)] p-3 space-y-3 text-xs">
      <button
        type="button"
        onClick={() => onChangeFeature('settings')}
        className="w-full text-left px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10 transition"
      >
        ⚙️ Настройки
      </button>

      <div className="pt-3 border-t border-[var(--border)]">
        {authed ? (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/${locale}/chat` })}
            className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-[11px] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text)]"
          >
            Выйти из аккаунта
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: `/${locale}/chat` })}
            className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-[11px] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text)]"
          >
            Войти через Google
          </button>
        )}

        <p className="text-[11px] mt-2 text-[var(--muted)]">
          {status === 'loading'
            ? 'Проверяем сессию...'
            : authed
            ? `Привет, ${session?.user?.name ?? 'пользователь'}`
            : 'Войдёшь позже — будем синкать чаты и подписку.'}
        </p>
      </div>
    </div>
  </aside>
);
}