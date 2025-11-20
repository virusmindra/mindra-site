// src/components/chat/Sidebar.tsx
'use client';

import type { ChatSession } from './types';

type Props = {
  sessions: ChatSession[];
  currentId?: string;
  onNewChat: () => void;
  onSelect: (id: string) => void;
};

export default function Sidebar({
  sessions,
  currentId,
  onNewChat,
  onSelect,
}: Props) {
  return (
    <aside className="w-64 border-r border-white/10 bg-zinc-950/80 flex flex-col">
      <div className="p-3 border-b border-white/10">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-white text-zinc-900 hover:bg-zinc-200 transition"
        >
          Новый чат
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <ul className="px-2 py-2 space-y-1 text-xs text-zinc-300">
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
