// src/components/chat/Sidebar.tsx
'use client';

import { useState } from 'react';
import type { ChatSession, ChatFeature } from './types';

type Props = {
  sessions: ChatSession[];
  currentId?: string;

  onNewChat: () => void;
  onSelect: (id: string) => void;

  activeFeature: ChatFeature;
  onChangeFeature: (f: ChatFeature) => void;
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
  onNewChat,
  onSelect,
  activeFeature,
  onChangeFeature,
}: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // пока только визуально

  return (
    <aside className="w-80 flex flex-col border-r border-white/10 bg-zinc-950">
      {/* Верх: кнопка нового чата */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      {/* Два столбца: Чаты + Режимы */}
      <div className="flex-1 flex px-4 py-4 gap-4 overflow-hidden">
        {/* Чаты */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">
            Чаты
          </div>
          <div className="flex-1 overflow-auto rounded-lg bg-zinc-950/40 border border-white/10">
            {sessions.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-zinc-500">
                Нет чатов. Нажми «Новый чат».
              </div>
            ) : (
              <ul className="py-1 text-xs text-zinc-200">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={[
                        'w-full text-left px-3 py-1.5 truncate transition',
                        s.id === currentId
                          ? 'bg-zinc-800 text-white'
                          : 'hover:bg-zinc-900/70',
                      ].join(' ')}
                    >
                      {s.title || 'Без названия'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Режимы */}
        <div className="w-40 flex flex-col">
          <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-2">
            Режимы
          </div>
          <div className="flex-1 overflow-auto rounded-lg bg-zinc-950/40 border border-white/10">
            <ul className="py-1 text-xs text-zinc-200">
              {featureList.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onChangeFeature(f.id)}
                    className={[
                      'w-full text-left px-3 py-1.5 transition',
                      activeFeature === f.id
                        ? 'bg-indigo-600/80 text-white'
                        : 'hover:bg-zinc-900/70',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Низ: тема + вход/подписка */}
      <div className="border-t border-white/10 px-4 py-3 space-y-2 text-[11px] text-zinc-300">
        <div className="flex items-center justify-between">
          <span>Тема</span>
          <div className="inline-flex rounded-full border border-white/20 text-[11px] overflow-hidden">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={[
                'px-2 py-1',
                theme === 'light'
                  ? 'bg-white text-zinc-900'
                  : 'bg-transparent text-zinc-300',
              ].join(' ')}
            >
              ☀ Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={[
                'px-2 py-1',
                theme === 'dark'
                  ? 'bg-white text-zinc-900'
                  : 'bg-transparent text-zinc-300',
              ].join(' ')}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <button
          type="button"
          className="w-full border border-white/20 rounded-xl px-3 py-2 text-[11px] hover:bg-white/10 text-left"
        >
          Войти / аккаунт (скоро)
        </button>

        <p className="text-zinc-500">
          Настройки и подписка (скоро) — будут доступны здесь.
        </p>
      </div>
    </aside>
  );
}
