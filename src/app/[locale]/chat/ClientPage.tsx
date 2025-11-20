'use client';

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import Sidebar from '@/components/chat/Sidebar';
import type { ChatMessage, ChatSession } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

const DEFAULT_FEATURE = 'default'; // потом сюда сможем подставлять режимы

export default function ClientPage() {
  // ---- СЕССИИ ----
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const fromStorage = loadSessions();
    if (fromStorage.length > 0) return fromStorage;

    const now = Date.now();
    return [
      {
        id: uuidv4(),
        title: 'New chat',
        createdAt: now,
        updatedAt: now,
        messages: [],
      },
    ];
  });

  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    const fromStorage = loadSessions();
    return fromStorage[0]?.id;
  });

  // гарантируем, что currentId всегда валиден
  useEffect(() => {
    if (!currentId && sessions.length > 0) {
      setCurrentId(sessions[0].id);
    }
  }, [currentId, sessions]);

  // сохраняем сессии в localStorage
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId) ?? sessions[0],
    [sessions, currentId],
  );

  const [sending, setSending] = useState(false);

  const replaceSession = (updated: ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleNewChat = () => {
    const now = Date.now();
    const id = uuidv4();

    const next: ChatSession = {
      id,
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    setSessions((prev) => [next, ...prev]);
    setCurrentId(id);
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
  };

  // ---- ОТПРАВКА СООБЩЕНИЯ ----
  const handleSend = async (text: string) => {
    if (!text.trim() || !current) return;

    const session = current;
    const now = Date.now();

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts: now,
    };

    const withUser: ChatSession = {
      ...session,
      messages: [...session.messages, userMsg],
      title:
        session.messages.length === 0
          ? newSessionTitle([userMsg])
          : session.title,
      updatedAt: now,
    };

    replaceSession(withUser);
    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          sessionId: session.id,
          feature: DEFAULT_FEATURE,
        }),
      });

      let replyText = 'Sorry, the server is unavailable.';
      try {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply;
        }
      } catch {
        // оставляем дефолтный текст
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: replyText,
        ts: Date.now(),
      };

      replaceSession({
        ...withUser,
        messages: [...withUser.messages, botMsg],
        updatedAt: Date.now(),
      });
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз позже.',
        ts: Date.now(),
      };

      replaceSession({
        ...withUser,
        messages: [...withUser.messages, errMsg],
        updatedAt: Date.now(),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      <Sidebar
        sessions={sessions}
        currentId={current?.id}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
      />
      <main className="flex-1 flex flex-col">
        <ChatWindow messages={current ? current.messages : []} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
