// src/app/[locale]/chat/ClientPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatFeature, ChatMessage, ChatSession } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

function createEmptySession(): ChatSession {
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(now);

  return {
    id,
    title: 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  // загрузка из localStorage
  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length) {
      setSessions(loaded);
      setCurrentId(loaded[0].id);
    } else {
      const first = createEmptySession();
      setSessions([first]);
      setCurrentId(first.id);
      saveSessions([first]);
    }
  }, []);

  // текущая сессия
  const current = useMemo(
    () => sessions.find((s) => s.id === currentId) ?? sessions[0],
    [sessions, currentId],
  );

  const currentMessages: ChatMessage[] = current?.messages ?? [];

  const updateSessions = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setSessions((prev) => {
      const next = updater(prev);
      saveSessions(next);
      return next;
    });
  };

  const handleNewChat = () => {
    updateSessions((prev) => {
      const nextSession = createEmptySession();
      setCurrentId(nextSession.id);
      return [nextSession, ...prev];
    });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!current) return;

    const ts = Date.now();
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts,
    };

    const sessionId = current.id;

    // сразу добавляем сообщение пользователя
    updateSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              updatedAt: ts,
              title: newSessionTitle([...s.messages, userMsg]),
            }
          : s,
      ),
    );

    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          sessionId,          // <-- реальный id чата
          feature: activeFeature,
        }),
      });

      let reply = 'Извини, сервер сейчас недоступен.';

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

      updateSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, botMsg],
                updatedAt: botMsg.ts,
              }
            : s,
        ),
      );
    } catch (e) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз чуть позже 🙏',
        ts: Date.now(),
      };

      updateSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, errMsg],
                updatedAt: errMsg.ts,
              }
            : s,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-64px)] bg-zinc-950">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={setCurrentId}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />
      <main className="flex-1 flex flex-col">
        <ChatWindow messages={currentMessages} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
