// серверный компонент
import SafeIntlProvider from '@/components/SafeIntlProvider';
import {getMessagesSync, type Locale} from '@/i18n';
import ClientPage from './ClientPage';

export default function ChatPage({ params: { locale } }:{ params:{ locale: Locale }}) {
  const messages = getMessagesSync(locale);      // базовые сообщения для страницы
  return (
    <SafeIntlProvider locale={locale} messages={messages}>
      <ClientPage />
    </SafeIntlProvider>
  );
}
