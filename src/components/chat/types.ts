// src/components/chat/types.ts
export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  ts: number;
};

export type ChatFeature =
  | 'default'
  | 'goals'
  | 'habits'
  | 'reminders'
  | 'settings';

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;

  feature?: ChatFeature;
  goalId?: string;
  habitId?: string;

  // если ты используешь эти флаги — лучше добавить:
  goalDone?: boolean;
  habitDone?: boolean;
};
