// src/components/chat/storage.ts
import type { ChatSession, ChatMessage, ChatFeature } from './types';

const KEY = 'mindra.chat.sessions.v1';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];

  const stored = safeParse<ChatSession[]>(window.localStorage.getItem(KEY), []);

  // лёгкая миграция: если нет feature / updatedAt — добавляем
  return stored.map((s) => ({
    ...s,
    updatedAt: s.updatedAt ?? s.createdAt ?? Date.now(),
    feature: s.feature ?? 'default',
  }));
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // можно игнорировать, если localStorage переполнен / запрещён
  }
}

export function newSessionTitle(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const base = lastUser?.content.trim() || 'New chat';
  return base.length > 40 ? base.slice(0, 40) + '…' : base;
}

// хелпер на случай, если где-то ещё создаёшь сессию прямо из storage.ts
export function newSession(feature: ChatFeature = 'default'): ChatSession {
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(now);

  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
    feature,
  };
}
