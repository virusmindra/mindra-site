'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';

import type { ChatSession, ChatFeature } from './types';

type Props = {
  sessions: ChatSession[];
  currentId?: string;

  activeFeature: ChatFeature;
  onChangeFeature: (f: ChatFeature) => void;

  onNewChat: () => void;
  onSelect: (id: string) => void;

  onDelete: (id: string) => void; 
};

function normLocale(raw: string) {
  const l = String(raw || 'en').toLowerCase();
  return l.startsWith('es') ? 'es' : 'en';
}

function t(locale: 'en' | 'es') {
  const EN = {
    backHome: '← Back to home',
    newChat: 'New chat',
    functions: 'Functions',
    yourChats: 'Your chats',
    settings: 'Settings',
    signIn: 'Sign in with Google',
    signOut: 'Sign out',
    hello: 'Hi',
    syncHint: 'Sign in later — we’ll sync chats & subscription.',
    loading: 'Checking session...',
    chat: 'Chat',
    goals: 'Goals',
    habits: 'Habits',
    reminders: 'Reminders',
  };

  const ES = {
    backHome: '← Volver al inicio',
    newChat: 'Nuevo chat',
    functions: 'Funciones',
    yourChats: 'Tus chats',
    settings: 'Ajustes',
    signIn: 'Entrar con Google',
    signOut: 'Salir',
    hello: 'Hola',
    syncHint: 'Entra luego — sincronizaremos chats y suscripción.',
    loading: 'Comprobando sesión...',
    chat: 'Chat',
    goals: 'Objetivos',
    habits: 'Hábitos',
    reminders: 'Recordatorios',
  };

  return locale === 'es' ? ES : EN;
}

const featureList: { id: ChatFeature; labelKey: keyof ReturnType<typeof t> }[] = [
  { id: 'default', labelKey: 'chat' },
  { id: 'goals', labelKey: 'goals' },
  { id: 'habits', labelKey: 'habits' },
  { id: 'reminders', labelKey: 'reminders' },
];

export default function Sidebar({
  sessions,
  currentId,
  activeFeature,
  onChangeFeature,
  onNewChat,
  onSelect,
  onDelete,
}: Props) {
  const { data: session, status } = useSession();
  const authed = !!session?.user;

  const isEmpty = (s: ChatSession) => (s.messages?.length ?? 0) === 0;

  // показываем только текущую фичу
  const displayedSessions = sessions
    .filter((s) => (s.feature ?? 'default') === activeFeature)
    // скрываем пустые “New chat”, кроме текущего открытого
    .filter((s) => !isEmpty(s) || s.id === currentId)
    // сортируем по обновлению
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  const params = useParams();
  const locale = normLocale(String((params as any)?.locale ?? 'en'));
  const L = t(locale);

  return (
    <aside className="w-80 flex flex-col border-r border-[var(--border)] bg-[var(--card)] h-full overflow-hidden">
      {/* TOP */}
      <div className="p-3 border-b border-[var(--border)] space-y-2">
        <Link
          href={`/${locale}`}
          className="block w-full text-left text-xs text-[var(--muted)] hover:text-[var(--text)] transition"
        >
          {L.backHome}
        </Link>

        <button
          type="button"
          onClick={onNewChat}
          className="w-full rounded-xl px-3 py-2 text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 transition"
        >
          {L.newChat}
        </button>
      </div>

      {/* FUNCTIONS */}
      <div className="p-3 border-b border-[var(--border)]">
        <div className="text-[11px] uppercase tracking-wide text-[var(--muted)] mb-2">
          {L.functions}
        </div>

        <div className="space-y-1 text-sm">
          {featureList.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChangeFeature(f.id)}
              className={[
                'w-full text-left px-3 py-2 rounded-xl transition border',
                activeFeature === f.id
                  ? 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10',
              ].join(' ')}
            >
              {L[f.labelKey]}
            </button>
          ))}
        </div>
      </div>

      {/* CHATS */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-3 pt-3 pb-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">
          {L.yourChats}
        </div>

        <ul className="flex-1 px-2 pb-3 space-y-1 text-sm overflow-auto">
  {displayedSessions.map((s) => (
    <li key={s.id} className="group">
      <button
        type="button"
        onClick={() => onSelect(s.id)}
        className={[
          'w-full text-left px-3 py-2 rounded-xl transition border flex items-center gap-2',
          s.id === currentId
            ? 'bg-[var(--bg)] text-[var(--text)] border-[var(--border)]'
            : 'border-transparent text-[var(--muted)] hover:text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10',
        ].join(' ')}
      >
        <span className="flex-1 min-w-0 truncate">
          {(s.feature ?? 'default') === 'goals' && '🎯 '}
          {(s.feature ?? 'default') === 'habits' && '🔁 '}
          {(s.feature ?? 'default') === 'reminders' && '⏰ '}
          {s.title || (locale === 'es' ? 'Sin título' : 'Untitled')}
        </span>

        {/* delete on hover */}
        <span
          className="opacity-0 group-hover:opacity-100 transition"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(s.id);
          }}
          title={locale === 'es' ? 'Eliminar chat' : 'Delete chat'}
        >
          ✕
        </span>
      </button>
    </li>
  ))}
</ul>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-[var(--border)] p-3 space-y-3 text-xs">
        <button
          type="button"
          onClick={() => onChangeFeature('settings')}
          className="w-full text-left px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          ⚙️ {L.settings}
        </button>

        <div className="pt-3 border-t border-[var(--border)]">
          {authed ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: `/${locale}/chat` })}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-[11px] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text)]"
            >
              {L.signOut}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: `/${locale}/chat` })}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-[11px] hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text)]"
            >
              {L.signIn}
            </button>
          )}

          <p className="text-[11px] mt-2 text-[var(--muted)]">
            {status === 'loading'
              ? L.loading
              : authed
              ? `${L.hello}, ${session?.user?.name ?? 'friend'}`
              : L.syncHint}
          </p>
        </div>
      </div>
    </aside>
  );
}
