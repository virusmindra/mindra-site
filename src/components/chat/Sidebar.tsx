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
    <aside className="w-80 flex flex-col border-r border-white/10 bg-zinc-950 h-full overflow-hidden">
      {/* TOP */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <Link
          href={`/${locale}`}
          className="block w-full text-left text-xs text-zinc-400 hover:text-white transition"
        >
          ← На главную
        </Link>

        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      {/* MIDDLE */}
      <div className="flex-1 flex overflow-hidden">
        {/* CHATS */}
        <div className="w-1/2 flex flex-col border-r border-white/10 overflow-hidden">
          <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
            Чаты
          </div>

          <ul className="flex-1 px-2 pb-3 space-y-1 text-xs text-zinc-300 overflow-auto">
            {displayedSessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={[
                    'w-full text-left px-2 py-1.5 rounded-md transition',
                    s.id === currentId
                      ? 'bg-zinc-800 text-white'
                      : 'hover:bg-zinc-800/60',
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
          <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
            Режимы
          </div>

          <ul className="flex-1 px-2 pb-3 space-y-1 text-xs text-zinc-300 overflow-auto">
            {featureList.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => onChangeFeature(f.id)}
                  className={[
                    'w-full text-left px-2 py-1.5 rounded-md transition',
                    activeFeature === f.id
                      ? 'bg-white text-zinc-900'
                      : 'hover:bg-zinc-800/60',
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
      <div className="border-t border-white/10 p-3 space-y-3 text-xs">
        <button
          type="button"
          onClick={() => onChangeFeature('settings')}
          className="w-full text-left px-3 py-2 rounded-xl border border-white/15 text-zinc-100 hover:bg-white/10 transition"
        >
          ⚙️ Настройки
        </button>

        <div className="pt-3 border-t border-white/10">
          {authed ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/chat` })}
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-[11px] hover:bg-white/10 text-zinc-100"
            >
              Выйти из аккаунта
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: `/${locale}/chat` })}
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-[11px] hover:bg-white/10 text-zinc-100"
            >
              Войти через Google
            </button>
          )}

          <p className="text-[11px] mt-2 text-zinc-500">
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
