import type { ChatSession } from './types';

const KEY = 'mindra:web:sessions';

function safeParse<T>(txt: string | null, fallback: T): T {
  try { return txt ? JSON.parse(txt) as T : fallback; } catch { return fallback; }
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  return safeParse<ChatSession[]>(localStorage.getItem(KEY), []);
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(sessions)); } catch {}
}

export function newSessionTitle(messages: ChatSession['messages']): string {
  const last = messages.find(m => m.role === 'user')?.content ?? 'New chat';
  return last.length > 40 ? last.slice(0, 40) + '…' : last || 'New chat';
}
