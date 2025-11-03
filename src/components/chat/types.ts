// src/components/chat/types.ts

export type ChatRole = 'user' | 'assistant' | 'bot';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  ts: number; // unix ms
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

// Нормализуем все бот-ролики к assistant в UI
export function asAssistant(role: ChatRole): 'user' | 'assistant' {
  return role === 'user' ? 'user' : 'assistant';
}
