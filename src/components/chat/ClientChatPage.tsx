'use client';

import { useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatWindow from './ChatWindow';
import Sidebar from './Sidebar';
import type { ChatMessage, ChatSession } from './types';
import { loadSessions, saveSessions, newSessionTitle } from './storage';

const DIRECT_URL = process.env.NEXT_PUBLIC_BOT_URL; // можно оставить пустым — мы ловим ошибки

function getOrCreateSessionId(key = 'mindra:web:session') {
  if (typeof window === 'undefined') return 'default';
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'default';
  }
}

export default function ClientChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentId, setCurrentId] = useState<string | undefined>(() => sessions[0]?.id);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const sessionIdRef = useRef<string>('default');
  if (sessionIdRef.current === 'default') sessionIdRef.current = getOrCreateSessionId();

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const setAndSave = (next: ChatSession[]) => {
    setSessions(next);
    try { saveSessions(next); } catch {}
  };

  const upsert = (up: ChatSession) => {
    const next = [up, ...sessions.filter((s) => s.id !== up.id)];
    setAndSave(next);
  };

  const onNew = () => {
    const id = uuidv4();
    const empty: ChatSession = {
      id,
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsert(empty);
    setCurrentId(id);
  };

  const onPick = (id: string) => setCurrentId(id);
  const onDelete = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setAndSave(next);
    if (currentId === id) setCurrentId(next[0]?.id);
  };

  async function sendToBot(text: string): Promise<string> {
    const body = { input: text, sessionId: sessionIdRef.current ?? 'default' };

    // 1) локальный прокси
    try {
      const r = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });
      if (r.ok) {
        const data = await r.json();
        return data?.reply ?? '';
      }
      if (r.status === 504 || r.status === 502) throw new Error('upstream timeout');
    } catch {
      // игнор — пойдём на прямой url
    }

    // 2) прямой url (может быть undefined)
    if (!DIRECT_URL) return 'Server is not configured.';
    const r2 = await fetch(DIRECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ userId: 'web', ...body }),
    });
    const data2 = await r2.json().catch(() => ({ reply: 'Server error' }));
    if (!r2.ok) throw new Error(`Direct error: ${r2.status}`);
    return data2?.reply ?? '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    try {
      setSending(true);

      // гарантируем текущую сессию
      let cur = current;
      if (!cur) {
        cur = {
          id: uuidv4(),
          title: 'New chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentId(cur.id);
      }

      const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
      upsert({ ...cur, messages: [...cur.messages, userMsg], updatedAt: Date.now() });
      setInput('');

      const reply = await sendToBot(text).catch((err: any) => {
        return err?.message || 'Network error';
      });

      const botMsg: ChatMessage = { role: 'assistant', content: reply ?? '', ts: Date.now() };
      const updated = {
        ...cur,
        title: cur.messages.length === 0 ? newSessionTitle([userMsg]) : cur.title,
        messages: [...cur.messages, userMsg, botMsg],
        updatedAt: Date.now(),
      };
      upsert(updated);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl flex gap-4">
      {/* Sidebar слева */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNew={onNew}
        onPick={onPick}
        onDelete={onDelete}
      />

      {/* Контент справа */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="px-6 py-4 border-b border-white/10">
          <h1 className="text-xl font-semibold">Chat with Mindra</h1>
        </header>

        <ChatWindow messages={current?.messages ?? []} />

        <form onSubmit={onSubmit} className="border-t border-white/10 px-6 py-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none"
          />
          <button
            disabled={sending}
            className="rounded-xl border border-white/20 px-4 py-2 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
