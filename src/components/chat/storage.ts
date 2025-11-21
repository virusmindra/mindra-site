// src/components/chat/storage.ts
import type { ChatSession } from './types';

const KEY = 'mindra:web:sessions';

function safeParse<T>(txt: string | null, fallback: T): T {
  try {
    return txt ? (JSON.parse(txt) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  return safeParse<ChatSession[]>(window.localStorage.getItem(KEY), []);
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // молча игнорируем, если переполнено
  }
}

export function newSessionTitle(messages: ChatSession['messages']): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const base = lastUser?.content?.trim() || 'New chat';
  return base.length > 40 ? base.slice(0, 40) + '…' : base;
}
