'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatMessage, ChatSession, ChatFeature } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

function createSession(): ChatSession {
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(now);

  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initial = loadSessions();
    return initial.length ? initial : [createSession()];
  });

  const [currentId, setCurrentId] = useState<string | undefined>(() => {
    const initial = loadSessions();
    return initial[0]?.id;
  });

  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId) ?? sessions[0],
    [sessions, currentId],
  );

  // helper: обновить список сессий + сохранить в localStorage
  const updateSessions = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setSessions((prev) => {
      const next = updater(prev);
      saveSessions(next);
      return next;
    });
  };

  const handleNewChat = () => {
    const s = createSession();
    updateSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // гарантируем, что есть текущая сессия
    let target = current;
    if (!target) {
      target = createSession();
      updateSessions((prev) => [target!, ...prev]);
      setCurrentId(target.id);
    }

    const ts = Date.now();
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      ts,
    };

    // оптимистично добавляем сообщение пользователя
    updateSessions((prev) =>
      prev.map((s) =>
        s.id === target.id
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              title: newSessionTitle([...s.messages, userMsg]),
              updatedAt: ts,
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
          input: trimmed,
          sessionId: target.id,       // <--- важный момент
          feature: activeFeature,     // <--- какой режим выбран
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

      // добавляем ответ бота
      updateSessions((prev) =>
        prev.map((s) =>
          s.id === target.id
            ? {
                ...s,
                messages: [...s.messages, botMsg],
                updatedAt: botMsg.ts,
              }
            : s,
        ),
      );
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз позже.',
        ts: Date.now(),
      };

      updateSessions((prev) =>
        prev.map((s) =>
          s.id === target.id
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

  const messages = current ? current.messages : [];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      <Sidebar
        sessions={sessions}
        currentId={current?.id}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />

      <main className="flex-1 flex flex-col">
        <ChatWindow messages={messages} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
