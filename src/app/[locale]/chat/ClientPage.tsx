'use client';

import { useState } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatMessage } from '@/components/chat/types';

export default function ClientPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const ts = Date.now();
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          sessionId: 'web-local',
          feature: 'default',
        }),
      });

      let reply = 'Нет ответа.';
      try {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply) {
          reply = data.reply;
        }
      } catch {
        // оставляем дефолтный reply
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз позже.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      <main className="flex-1 flex flex-col">
        <ChatWindow messages={messages} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
