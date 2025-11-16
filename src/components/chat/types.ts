// src/components/chat/types.ts

export type ChatRole = 'user' | 'assistant' | 'bot';

export type ChatFeature =
  | 'default'       // обычный чат
  | 'goals'
  | 'habits'
  | 'reminders'
  | 'challenges'
  | 'sleep_sounds'
  | 'bedtime_stories'
  | 'daily_tasks'
  | 'modes'
  | 'points';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  ts: number;         // таймстемп, чтобы сортировать/сохранять
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};
