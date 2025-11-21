// src/app/[locale]/chat/ClientPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatSession, ChatMessage, ChatFeature } from '@/components/chat/types';
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
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  // --- загрузка из localStorage при монтировании ---
  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentId(stored[0].id);
    } else {
      const first = createEmptySession();
      setSessions([first]);
      setCurrentId(first.id);
    }
  }, []);

  // --- автосохранение в localStorage при изменении сессий ---
  useEffect(() => {
    if (sessions.length) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const handleChangeSessions = (next: ChatSession[]) => {
    setSessions(next);
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
  };

  const handleNewChat = () => {
    const fresh = createEmptySession();
    setSessions((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
  };

  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === currentId ? updater(s) : s)),
    );
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // если по какой-то причине current ещё нет — создаём
    if (!current) {
      const fresh = createEmptySession();
      setSessions([fresh]);
      setCurrentId(fresh.id);
      return;
    }

    const ts = Date.now();
    const userMsg: ChatMessage = {
      role: 'user',
      content: trimmed,
      ts,
    };

    // сразу добавляем сообщение в текущую сессию
    updateCurrentSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      title:
        prev.title === 'New chat' ? newSessionTitle([...prev.messages, userMsg]) : prev.title,
      updatedAt: Date.now(),
    }));

    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: trimmed,
          sessionId: current.id,      // <--- ВАЖНО: правильный sessionId
          feature: activeFeature,     // <--- режим (чат/цели/привычки...)
        }),
      });

      let replyText = 'Извини, сервер сейчас недоступен.';

      try {
        const data = await res.json();
        if (data && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }
      } catch {
        // оставляем дефолт
      }

      const botMsg: ChatMessage = {
        role: 'assistant',
        content: replyText,
        ts: Date.now(),
      };

      updateCurrentSession((prev) => ({
        ...prev,
        messages: [...prev.messages, botMsg],
        updatedAt: Date.now(),
      }));
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз чуть позже 🙏',
        ts: Date.now(),
      };

      updateCurrentSession((prev) => ({
        ...prev,
        messages: [...prev.messages, errMsg],
        updatedAt: Date.now(),
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-zinc-950">
      {/* Левый столбец: чаты + режимы + тема/логин */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />

      {/* Основной чат */}
      <main className="flex-1 flex flex-col">
        <ChatWindow messages={current ? current.messages : []} />
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
