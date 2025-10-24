'use client';

import { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatMessage, ChatSession } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';
import { ssePost } from '@/lib/sse';

// отключаем SSG, чтобы не было ошибок с клиентскими хуками/стримом
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentId, setCurrentId] = useState<string | undefined>(() => loadSessions()[0]?.id);
  const [sending, setSending] = useState(false);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const setAndSave = (next: ChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  };

  const upsert = (up: ChatSession) => {
    const next = [up, ...sessions.filter((s) => s.id !== up.id)].sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
    setAndSave(next);
  };

  const onNew = () => {
    const id = uuidv4();
    const s: ChatSession = {
      id,
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsert(s);
    setCurrentId(id);
  };

  const onPick = (id: string) => setCurrentId(id);

  const onDelete = (id: string) => {
    const next = sessions.filter((s) => s.id !== id);
    setAndSave(next);
    if (currentId === id) setCurrentId(next[0]?.id);
  };

  // добавляем user-сообщение и черновик assistant-сообщения
  const appendUserAndAssistantDraft = (text: string) => {
    let s = sessions.find((ss) => ss.id === currentId);
    if (!s) {
      const id = uuidv4();
      s = {
        id,
        title: newSessionTitle(text),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      upsert(s);
      setCurrentId(id);
    }

    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    const assistantDraft: ChatMessage = { role: 'assistant', content: '', ts: Date.now() };

    const draft: ChatSession = {
      ...s!,
      title: s!.messages.length ? s!.title : newSessionTitle(text),
      messages: [...s!.messages, userMsg, assistantDraft],
      updatedAt: Date.now(),
    };

    upsert(draft);
    return draft.id;
  };

  // прибавляем чанки к последнему assistant-сообщению
  const appendToLastAssistant = (sessionId: string, chunk: string) => {
    setSessions((prev) => {
      const idx = prev.findIndex((ss) => ss.id === sessionId);
      if (idx === -1) return prev;

      const s = prev[idx];
      const lastAssistantIndexFromEnd = [...s.messages].reverse().findIndex((m) => m.role === 'assistant');
      if (lastAssistantIndexFromEnd === -1) return prev;

      const realIdx = s.messages.length - 1 - lastAssistantIndexFromEnd;
      const updatedMessages = s.messages.slice();
      updatedMessages[realIdx] = {
        ...updatedMessages[realIdx],
        content: updatedMessages[realIdx].content + chunk,
      };

      const next = prev.slice();
      next[idx] = { ...s, messages: updatedMessages, updatedAt: Date.now() };
      saveSessions(next);
      return next;
    });
  };

  const onSend = async (text: string) => {
    const sessionId = appendUserAndAssistantDraft(text);
    setSending(true);
    try {
      await ssePost(
        '/api/web-chat-stream',
        { userId: 'web-anon', sessionId, input: text },
        (chunk) => appendToLastAssistant(sessionId, chunk),
      );
    } catch {
      appendToLastAssistant(sessionId, '\n[Ошибка стрима]');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex gap-0">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNew={onNew}
        onPick={onPick}
        onDelete={onDelete}
      />
      <div className="flex-1 flex flex-col">
        <ChatWindow messages={current?.messages ?? []} />
        <Composer onSend={onSend} disabled={sending} />
      </div>
    </div>
  );
}
