// src/app/[locale]/chat/ClientPage.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatMessage } from '@/components/chat/types';

export default function ClientPage() {
  const t = useTranslations('chat');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const now = Date.now();

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts: now,
    };

    // сразу показываем сообщение пользователя
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          // простой случай — без sessionId и фич:
          sessionId: 'web-simple',
          feature: 'default',
        }),
      });

      const data = await res.json();
      const replyText: string = data.reply ?? '';

      const botMsg: ChatMessage = {
        role: 'assistant',
        content:
          replyText ||
          t('empty_reply', {
            defaultValue: 'Нет ответа.',
          }),
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: t('error_generic', {
          defaultValue: 'Ошибка сервера, попробуй ещё раз позже.',
        }),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      <main className="flex-1 flex flex-col border-l border-white/10">
        <ChatWindow messages={messages} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
