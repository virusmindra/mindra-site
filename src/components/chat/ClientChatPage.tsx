'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import ChatWindow from './ChatWindow';
import type { ChatMessage } from './types';

const DIRECT_URL = process.env.NEXT_PUBLIC_BOT_URL; // прямой рендер URL (фоллбэк)

function now() { return Date.now(); }

function getOrCreateSessionId(key = 'mindra:web:session') {
  if (typeof window === 'undefined') return 'default';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function ClientChatPage() {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('chat.title'), ts: now() }
  ]);
  const sessionIdRef = useRef<string>('default');

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

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
        return (data?.reply ?? '').toString();
      }
      if (r.status === 504 || r.status === 502) throw new Error('upstream timeout');
    } catch {
      // проваливаемся в фоллбэк
    }

    // 2) прямой запрос на Render
    if (!DIRECT_URL) throw new Error('Bot URL is not configured');
    const r2 = await fetch(DIRECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ userId: 'web', ...body }),
    });
    const data2 = await r2.json().catch(() => ({ reply: 'Server error' }));
    if (!r2.ok) throw new Error(`Direct error: ${r2.status}`);
    return (data2?.reply ?? '').toString();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: 'user', content: text, ts: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const reply = await sendToBot(text);
      const botMsg: ChatMessage = { role: 'bot', content: reply, ts: now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = { role: 'assistant', content: err?.message || 'Network error', ts: now() };
      setMessages(prev => [...prev, errMsg]);
    }
  }

  return (
    <section className="mx-auto max-w-[1200px] w-full">
      {/* Хедер страницы */}
      <header className="px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">{t('chat.title')}</h1>
      </header>

      {/* Сообщения */}
      <ChatWindow messages={messages} />

      {/* Композер */}
      <form onSubmit={onSubmit} className="px-6 pb-6">
        <div className="mx-auto max-w-3xl flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder', { default: 'Type a message...' })}
            className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none"
          />
          <button className="rounded-xl border border-white/20 px-4 py-2">{t('chat.send', { default: 'Send' })}</button>
        </div>
      </form>
    </section>
  );
}

