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
  | 'challenges'
  | 'sleep_sounds'
  | 'bedtime_stories'
  | 'daily_tasks'
  | 'modes'
  | 'points'
  | 'settings';

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;

  feature?: ChatFeature; // ✅ добавили
  goalId?: string;       // ✅ для дневника цели
};
