'use client';

import React, {useEffect, useRef, useState} from 'react';

const DIRECT_URL = process.env.NEXT_PUBLIC_BOT_URL; // https://mindra-wsxi.onrender.com/api/web-chat

function getOrCreateSessionId(key = 'mindra:web:session') {
  if (typeof window === 'undefined') return 'default';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'user', text: 'привет' },
  ]);
  const sessionIdRef = useRef<string>('default');

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  async function sendMessage(text: string) {
    const body = {
      input: text,
      sessionId: sessionIdRef.current ?? 'default',
    };

    // 1) пробуем локальный прокси (быстро, без CORS)
    try {
      const r = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body),
      });

      if (r.ok) {
        const data = await r.json();
        return data.reply as string;
      }
      // если 504/502 — идём во фоллбэк
      if (r.status === 504 || r.status === 502) throw new Error('upstream timeout');
    } catch {
      /* проваливаемся в фоллбэк */
    }

    // 2) прямой запрос на Render (CORS должен быть разрешён ALLOW_ORIGINS)
    if (!DIRECT_URL) throw new Error('Bot URL is not configured');
    const r2 = await fetch(DIRECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        userId: 'web', // НЕ отправляем чувствительные данные с клиента
        ...body,
      }),
    });
    const data2 = await r2.json().catch(() => ({ reply: 'Server error' }));
    if (!r2.ok) throw new Error(`Direct error: ${r2.status}`);
    return data2.reply as string;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');

    try {
      const reply = await sendMessage(text);
      setMsgs((m) => [...m, { role: 'bot', text: reply }]);
    } catch (err: any) {
      setMsgs((m) => [...m, { role: 'bot', text: err?.message || 'Network error' }]);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="text-xl font-semibold mb-4">Чат</h2>

      <div className="rounded-2xl border border-white/10 h-[420px] p-4 overflow-y-auto mb-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              'inline-block rounded-xl px-3 py-1 text-sm mb-2 ' +
              (m.role === 'user' ? 'float-right bg-white/10' : 'float-left bg-white/10')
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши сообщение..."
          className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 outline-none"
        />
        <button className="rounded-xl border border-white/20 px-4 py-2">Отправить</button>
      </form>
    </section>
  );
}
