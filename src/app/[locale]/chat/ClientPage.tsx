// src/app/[locale]/chat/ClientPage.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatMessage, ChatSession, ChatFeature } from '@/components/chat/types';
import { loadSessions, saveSessions } from '@/components/chat/storage';
import GoalsPanel from '@/components/chat/GoalsPanel';
import HabitsPanel from '@/components/chat/HabitsPanel';

function loadInitialSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    return loadSessions();
  } catch {
    return [];
  }
}

export default function ClientPage() {
  const t = useTranslations('chat');

  const initialSessions = loadInitialSessions();

  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [currentId, setCurrentId] = useState<string | undefined>(
    initialSessions[0]?.id,
  );
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  // если current отсутствует, но есть сессии — выбираем первую
  useEffect(() => {
    if (!current && sessions.length > 0) {
      setCurrentId(sessions[0].id);
    }
  }, [current, sessions]);

  const setAndSave = (next: ChatSession[]) => {
    setSessions(next);
    try {
      saveSessions(next);
    } catch {
      // игнорируем ошибки localStorage
    }
  };

  const handleChangeSessions = (next: ChatSession[]) => {
    setAndSave(next);
    if (!next.find((s) => s.id === currentId)) {
      setCurrentId(next[0]?.id);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const now = Date.now();
    let session = current;
    let others = sessions;

    // если ещё нет ни одной сессии — создаём первую
    if (!session) {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(now);

      session = {
        id,
        title: text.slice(0, 40) || 'New chat',
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      others = sessions;
      setCurrentId(id);
    } else {
      others = sessions.filter((s) => s.id !== (session as ChatSession).id);
      
    }

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      ts: now,
    };

    let updatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, userMsg],
      updatedAt: now,
    };

    setAndSave([updatedSession, ...others]);
    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: text,
          sessionId: updatedSession.id,
          feature: activeFeature,
        }),
      });

      const data = await res.json();
      const replyText: string = data.reply ?? '';

      const botMsg: ChatMessage = {
        role: 'assistant',
        content:
          replyText ||
          t('empty_reply', { defaultValue: 'Нет ответа.' }),
        ts: Date.now(),
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMsg],
        updatedAt: botMsg.ts,
      };

      setAndSave([updatedSession, ...others]);
    } catch (e) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: t('error_generic', {
          defaultValue: 'Ошибка сервера, попробуй ещё раз позже.',
        }),
        ts: Date.now(),
      };

      updatedSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errMsg],
        updatedAt: errMsg.ts,
      };

      setAndSave([updatedSession, ...others]);
    } finally {
      setSending(false);
    }
  };

  // === РЕНДЕР ===
  return (
    <div className="flex h-[calc(100vh-64px)] bg-zinc-950">
      {/* Sidebar слева */}
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelectSession={handleSelectSession}
        onChangeSessions={handleChangeSessions}
        activeFeature={activeFeature}
        onChangeFeature={setActiveFeature}
      />

      {/* Основное содержимое */}
      <main className="flex-1 flex border-l border-white/10">
        {activeFeature === 'goals' ? (
          <div className="flex flex-1">
            <div className="w-80 shrink-0">
              <GoalsPanel />
            </div>
            <div className="flex-1 flex flex-col">
              <ChatWindow messages={current ? current.messages : []} />
              <Composer onSend={handleSend} disabled={sending} />
            </div>
          </div>
        ) : activeFeature === 'habits' ? (
          <div className="flex flex-1">
            <div className="w-80 shrink-0">
              <HabitsPanel />
            </div>
            <div className="flex-1 flex flex-col">
              <ChatWindow messages={current ? current.messages : []} />
              <Composer onSend={handleSend} disabled={sending} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ChatWindow messages={current ? current.messages : []} />
            <Composer onSend={handleSend} disabled={sending} />
          </div>
        )}
      </main>
    </div>
  );
}
