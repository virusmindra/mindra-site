// src/components/chat/Sidebar.tsx
'use client';

import type { ChatSession } from './types';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function Sidebar({
  sessions,
  currentId,
  onNew,
  onPick,
  onDelete,
}: {
  sessions: ChatSession[];
  currentId?: string;
  onNew: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { data: session, status } = useSession();
  const authed = !!session?.user;

  return (
    <aside className="w-72 shrink-0 border-r border-white/10 h-[calc(100dvh-4.5rem)] sticky top-[4.5rem] overflow-y-auto">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full rounded-xl bg-white text-zinc-900 px-3 py-2 text-sm font-medium hover:opacity-90"
        >
          + New chat
        </button>

        <div className="mt-3 text-xs uppercase tracking-wider text-zinc-400">History</div>
        <ul className="mt-2 space-y-1">
          {sessions.length === 0 && (
            <li className="text-zinc-400 text-sm px-2 py-1">No chats yet</li>
          )}
          {sessions.map((s) => (
            <li key={s.id} className="group flex items-center gap-2">
              <button
                onClick={() => onPick(s.id)}
                className={`flex-1 truncate text-left px-2 py-1 rounded-lg hover:bg-white/5 ${
                  s.id === currentId ? 'bg-white/10' : ''
                }`}
                title={s.title}
              >
                {s.title}
              </button>
              <button
                onClick={() => onDelete(s.id)}
                className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg hover:bg-white/10"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-6 text-xs uppercase tracking-wider text-zinc-400">Account</div>
        <div className="mt-2">
          {authed ? (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => signOut()}
            >
              Sign out
            </button>
          ) : (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => signIn('google')}
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
