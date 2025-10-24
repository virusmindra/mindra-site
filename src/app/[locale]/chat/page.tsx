// ВАЖНО: это серверный компонент (без 'use client')
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ClientChatPage from './ClientPage';

export default function ChatPage() {
  return <ClientChatPage />;
}
