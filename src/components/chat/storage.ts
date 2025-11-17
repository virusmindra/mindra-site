// src/components/chat/storage.ts
'use client';

import type { ChatMessage, ChatSession } from './types';

const KEY = 'mindra:web:sessions';

function safeParse<T>(txt: string | null, fallback: T): T {
  try {
    return txt ? (JSON.parse(txt) as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSessions(raw: any): ChatSession[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any): ChatSession => {
    const now = Date.now();

    const id: string =
      typeof item?.id === 'string'
        ? item.id
        : (typeof crypto !== 'undefined' &&
           'randomUUID' in crypto &&
           // @ts-ignore
           crypto.randomUUID()) ||
          String(now);

    const messages: ChatMessage[] = Array.isArray(item?.messages)
      ? item.messages
          .filter((m: any) => m && typeof m.content === 'string')
          .map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content),
            ts: typeof m.ts === 'number' ? m.ts : now,
          }))
      : [];

    return {
      id,
      title:
        typeof item?.title === 'string' && item.title.trim().length > 0
          ? item.title
          : 'New chat',
      messages,
      createdAt:
        typeof item?.createdAt === 'number' ? item.createdAt : now,
      updatedAt:
        typeof item?.updatedAt === 'number' ? item.updatedAt : now,
    };
  });
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  const raw = safeParse<any[]>(localStorage.getItem(KEY), []);
  return normalizeSessions(raw);
}

export function saveSessions(sessions: ChatSession[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // localStorage может быть недоступен — просто молча игнорим
  }
}

export function newSessionTitle(messages: ChatSession['messages']): string {
  const last = messages.find((m) => m.role === 'user')?.content ?? 'New chat';
  return last.length > 40 ? last.slice(0, 40) + '…' : last || 'New chat';
}
