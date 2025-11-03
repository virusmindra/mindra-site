export type ChatRole = 'user' | 'assistant' | 'bot';

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
