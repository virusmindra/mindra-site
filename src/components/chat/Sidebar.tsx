// src/components/chat/Sidebar.tsx
'use client';

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
  return (
    <aside className="w-72 border-r border-white/10 bg-zinc-950 flex flex-col h-[calc(100vh-4rem)]">
      {/* Новый чат */}
      <div className="p-3 border-b border-white/10">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      {/* Режимы (features) */}
      <div className="px-3 pt-3 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">
        Режимы
      </div>
      <div className="px-2 space-y-1">
        {featureList.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChangeFeature(f.id)}
            className={[
              'w-full text-left px-2 py-1.5 rounded-lg text-xs transition',
              activeFeature === f.id
                ? 'bg-white text-zinc-900 font-medium'
                : 'text-zinc-300 hover:bg-zinc-900/70',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Чаты */}
      <div className="px-3 pt-4 pb-2 text-[11px] uppercase tracking-wide text-zinc-500">
        Чаты
      </div>
      <div className="flex-1 overflow-auto pb-3">
        <ul className="px-2 space-y-1 text-xs text-zinc-300">
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
    </aside>
  );
}
