// src/components/chat/Sidebar.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import type { ChatSession, ChatFeature } from './types';

type SidebarProps = {
  // --- ЧАТЫ (опционально) ---
  sessions?: ChatSession[];
  currentId?: string;
  onSelectSession?: (id: string) => void;
  onChangeSessions?: (next: ChatSession[]) => void;
  onNew?: () => void;
  onPick?: (id: string) => void;
  onDelete?: (id: string) => void;

  // --- ФИЧИ (обязательно активная, колбэк любой из двух) ---
  activeFeature: ChatFeature;
  onSelectFeature?: (f: ChatFeature) => void;
  onChangeFeature?: (f: ChatFeature) => void;
};

const featureList: { id: ChatFeature; label: string }[] = [
  { id: 'default',         label: 'Чат' },
  { id: 'goals',           label: 'Цели' },
  { id: 'habits',          label: 'Привычки' },
  { id: 'reminders',       label: 'Напоминания' },
  { id: 'challenges',      label: 'Челленджи' },
  { id: 'sleep_sounds',    label: 'Звуки для сна' },
  { id: 'bedtime_stories', label: 'Сказки' },
  { id: 'daily_tasks',     label: 'Задания на день' },
  { id: 'modes',           label: 'Режим общения' },
  { id: 'points',          label: 'Очки и титулы' },
];

export default function Sidebar({
  sessions,
  currentId,
  onSelectSession,
  onChangeSessions,
  onNew,
  onPick,
  onDelete, // пока не используется, но оставим для совместимости

  activeFeature,
  onSelectFeature,
  onChangeFeature,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const authed = !!session?.user;
  const params = useParams();
  const locale = String((params as any)?.locale ?? 'en');

  // безопасный список сессий
  const list: ChatSession[] = sessions ?? [];

  // единый эмиттер для переключения фич
  const emitFeature = onSelectFeature ?? onChangeFeature ?? (() => {});

  const handleNewChat = () => {
    if (onNew) return onNew();
    if (!onChangeSessions) return;

    const now = Date.now();
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(now);

    const newSession: ChatSession = {
      id,
      title: 'Новый чат',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    onChangeSessions([newSession, ...list]);

    if (onSelectSession) onSelectSession(id);
    else if (onPick) onPick(id);
  };

  const handleSelect = (id: string) => {
    if (onSelectSession) onSelectSession(id);
    else if (onPick) onPick(id);
  };

  return (
    <aside className="w-72 flex flex-col border-r border-white/10 bg-zinc-950 h-[calc(100dvh-4.5rem)]">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
        <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
          <span className="text-sm font-semibold">M</span>
        </div>
        <span className="font-semibold text-sm">Mindra</span>
      </div>

      {/* New chat + search (кнопка покажется всегда; работать будет, если передан onChangeSessions) */}
      <div className="px-3 py-3 border-b border-white/5">
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 text-xs py-2 hover:bg-indigo-500"
          >
            <span>＋</span>
            <span>Новый чат</span>
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400">
          <span>🔍</span>
          <input
            className="flex-1 bg-transparent outline-none text-xs"
            placeholder="Найти чат..."
          />
        </div>
      </div>

      {/* Chats (рендерим секцию только если список не пустой) */}
      <div className="flex-1 overflow-auto">
        {list.length > 0 && (
          <>
            <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-zinc-500">
              Чаты
            </div>
            <ul className="px-2 space-y-1">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleSelect(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs ${
                      s.id === currentId
                        ? 'bg-zinc-900 text-zinc-50 border border-indigo-500/60'
                        : 'text-zinc-300 hover:bg-zinc-900/60'
                    }`}
                  >
                    {s.title || 'Без названия'}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Features */}
        <div className="px-3 py-3 text-[11px] uppercase tracking-wide text-zinc-500">
          Функции
        </div>
        <ul className="px-2 space-y-1 mb-2">
          {featureList.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => emitFeature(f.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition ${
                  activeFeature === f.id
                    ? 'bg-indigo-600/80 text-white'
                    : 'text-zinc-300 hover:bg-zinc-900/60'
                }`}
              >
                <span>{f.label}</span>
                {f.id === 'points' && <span>⭐</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom: settings + account */}
      <div className="border-t border-white/10 px-3 py-3 space-y-3 text-xs text-zinc-400">
        <div className="space-y-1">
          <button className="flex items-center gap-2 w-full text-left hover:text-zinc-100">
            <span>⚙️</span>
            <span>Настройки и подписка</span>
          </button>
          <button className="flex items-center gap-2 w-full text-left hover:text-zinc-100">
            <span>💬</span>
            <span>Оставить отзыв</span>
          </button>
          <button className="flex items-center gap-2 w-full text-left hover:text-zinc-100">
            <span>Поддержка: support@mindra.group</span>
          </button>
        </div>

        <div className="pt-2 border-t border-white/10">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">
            Account
          </div>
          {authed ? (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-[11px] hover:bg-white/10"
              onClick={() => signOut({ callbackUrl: `/${locale}/chat` })}
            >
              Sign out
            </button>
          ) : (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-[11px] hover:bg-white/10"
              onClick={() => signIn('google', { callbackUrl: `/${locale}/chat` })}
            >
              Sign in
            </button>
          )}
          <p className="text-[11px] mt-2 text-zinc-400">
            {status === 'loading'
              ? 'Checking session…'
              : authed
              ? `Hello, ${session?.user?.name ?? 'user'}`
              : 'Sign in to sync chats and manage your subscription.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
