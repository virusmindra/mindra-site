'use client';

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import { ChatMessage, ChatSession } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

const API = '/api/web-chat';

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);

  const current = useMemo(
    () => sessions.find(s => s.id === currentId),
    [sessions, currentId]
  );

  // initial load
  useEffect(() => {
    const all = loadSessions();
    setSessions(all);
    if (all.length) setCurrentId(all[0].id);
  }, []);

  // helpers
  const upsert = (up: ChatSession) => {
    const next = [up, ...sessions.filter(s => s.id !== up.id)].sort((a,b) => b.updatedAt - a.updatedAt);
    setSessions(next);
    saveSessions(next);
  };

  const onNew = () => {
    const id = uuidv4();
    const s: ChatSession = { id, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    upsert(s);
    setCurrentId(id);
  };

  const onPick = (id: string) => setCurrentId(id);

  const onDelete = (id: string) => {
    const next = sessions.filter(s => s.id !== id);
    setSessions(next);
    saveSessions(next);
    if (currentId === id) setCurrentId(next[0]?.id);
  };

  const onSend = async (text: string) => {
    let s = current;
    if (!s) {
      const id = uuidv4();
      s = { id, title: newSessionTitle(text), messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      setCurrentId(id);
    }

    const userMsg: ChatMessage = { role: 'user', content: text, ts: Date.now() };
    const draft = { ...s!, messages: [...s!.messages, userMsg], title: s!.messages.length ? s!.title : newSessionTitle(text), updatedAt: Date.now() };
    upsert(draft);

    setSending(true);
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, sessionId: s!.id }),
      });
      const data = await r.json().catch(() => ({ reply: 'Upstream error' }));
      const botMsg: ChatMessage = { role: 'assistant', content: data?.reply ?? '…', ts: Date.now() };
      upsert({ ...draft, messages: [...draft.messages, botMsg], updatedAt: Date.now() });
    } catch {
      const botMsg: ChatMessage = { role: 'assistant', content: 'Network error', ts: Date.now() };
      upsert({ ...draft, messages: [...draft.messages, botMsg], updatedAt: Date.now() });
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
        onLoginClick={() => alert('TODO: Sign in')}
        isAuthed={false}
      />

      <div className="flex-1 flex flex-col">
        <ChatWindow messages={current?.messages ?? []} />
        <Composer onSend={onSend} disabled={sending} />
      </div>
    </div>
  );
}
