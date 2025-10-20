export type ChatMessage = { role: 'user' | 'assistant'; content: string; ts: number };
export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};
