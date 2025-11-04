// src/components/chat/Sidebar.tsx
'use client';

import type { ChatSession } from './types';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

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

  // берем текущую локаль из URL
  const params = useParams();
  const locale = String((params as any)?.locale ?? 'en');

  return (
    <aside className="w-72 shrink-0 border-r border-white/10 h-[calc(100dvh-4.5rem)] sticky top-[4.5rem] overflow-y-auto">
      <div className="p-3">
        {/* ...история чатов... */}

        <div className="mt-6 text-xs uppercase tracking-wider text-zinc-400">Account</div>
        <div className="mt-2">
          {authed ? (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => signOut({ callbackUrl: `/${locale}/chat` })}
            >
              Sign out
            </button>
          ) : (
            <button
              className="w-full border border-white/15 rounded-xl px-3 py-2 text-sm hover:bg-white/10"
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
