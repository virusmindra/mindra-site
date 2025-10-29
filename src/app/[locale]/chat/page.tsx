// src/app/[locale]/chat/page.tsx  (СЕРВЕРНЫЙ)
import ClientPage from './ClientPage';

export default async function ChatPage() {
  // Никаких useTranslations/useLocale здесь!
  return <ClientPage />; // внутри ClientPage уже 'use client' и useTranslations()
}
