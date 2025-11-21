'use client';

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
  return (
    <aside className="w-80 border-r border-white/10 bg-zinc-950 flex flex-col h-[calc(100vh-64px)]">
      {/* Верх: кнопка нового чата */}
      <div className="p-3 border-b border-white/10">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      {/* Две колонки: слева чаты, справа режимы */}
      <div className="flex-1 flex overflow-hidden">
        {/* Левая колонка — чаты */}
        <div className="flex-1 flex flex-col border-r border-white/10 overflow-hidden">
          <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
            Чаты
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="px-2 pb-3 space-y-1 text-xs text-zinc-300">
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
        </div>

        {/* Правая колонка — режимы */}
        <div className="w-40 flex flex-col overflow-hidden">
          <div className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-wide text-zinc-500">
            Режимы
          </div>
          <div className="flex-1 overflow-auto">
            <ul className="px-2 pb-3 space-y-1 text-xs">
              {featureList.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onChangeFeature(f.id)}
                    className={[
                      'w-full text-left px-2 py-1.5 rounded-md transition',
                      activeFeature === f.id
                        ? 'bg-white text-zinc-900'
                        : 'text-zinc-300 hover:bg-zinc-900/70',
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

      {/* Низ: заглушка под настройки / тему (функционал добавим позже) */}
      <div className="border-t border-white/10 px-3 py-3 text-[11px] text-zinc-400 space-y-2">
        <div className="flex items-center justify-between">
          <span>Тема</span>
          <div className="inline-flex rounded-full bg-zinc-900 p-1">
            <button
              type="button"
              className="px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-900 cursor-default"
            >
              ☀️ Light
            </button>
            <button
              type="button"
              className="px-2 py-0.5 rounded-full text-xs text-zinc-400 cursor-default"
            >
              🌙 Dark
            </button>
          </div>
        </div>
        <button
          type="button"
          className="w-full text-left text-[11px] text-zinc-400 hover:text-zinc-100"
        >
          Настройки и подписка (скоро)
        </button>
      </div>
    </aside>
  );
}
