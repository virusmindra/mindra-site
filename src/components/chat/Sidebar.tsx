'use client';

import type { ChatSession, ChatFeature } from './types';
import { useParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

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

  return (
    <aside className="w-72 flex flex-col border-r border-white/10 bg-zinc-950">
      {/* верх: новый чат */}
      <div className="p-3 border-b border-white/10">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      {/* середина: ЧАТЫ + РЕЖИМЫ в две колонки */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          {/* Чаты */}
          <div className="w-1/2 flex flex-col border-r border-white/10">
            <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
              Чаты
            </div>
            <ul className="flex-1 px-2 space-y-1 text-xs text-zinc-300 overflow-auto">
              {sessions.map((s) => (
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
                    {s.title || 'Без названия'}
                  </button>
                </li>
              ))}

              {sessions.length === 0 && (
                <li className="px-2 py-1.5 text-zinc-500">
                  Нет чатов. Нажми «Новый чат».
                </li>
              )}
            </ul>
          </div>

          {/* Режимы */}
          <div className="w-1/2 flex flex-col">
            <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
              Режимы
            </div>
            <ul className="flex-1 px-2 space-y-1 text-xs text-zinc-300 overflow-auto">
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

        {/* низ: тема + настройки + вход */}
        <div className="border-t border-white/10 px-3 py-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
              Тема
            </span>
            <div className="inline-flex rounded-full bg-zinc-900 p-1 text-[11px]">
              <button className="px-2 py-0.5 rounded-full bg-white text-zinc-900">
                ☀️ Light
              </button>
              <button className="px-2 py-0.5 rounded-full text-zinc-300">
                🌙 Dark
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500">
            Настройки и подписка (скоро)
          </p>

          <div className="pt-2 border-t border-white/10">
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
      </div>
    </aside>
  );
}
