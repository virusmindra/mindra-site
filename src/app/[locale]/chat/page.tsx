// src/app/[locale]/chat/page.tsx
import ClientChatPage from '@/components/chat/ClientChatPage';
import AuthProvider from '@/components/AuthProvider';

export default function ChatPage() {
  return (
    <AuthProvider>
      <ClientChatPage />
    </AuthProvider>
  );
}

