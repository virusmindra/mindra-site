import { ChatSession } from './types';

const KEY = 'mindra.chat.sessions.v1';

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function newSessionTitle(firstUserText?: string) {
  if (!firstUserText) return 'New chat';
  const s = firstUserText.trim().slice(0, 40);
  return s || 'New chat';
}
