import type {Locale} from '@/i18n';
import {getMessagesSync} from '@/i18n';
import {getTSync} from '@/lib/getT';
import SafeIntlProvider from '@/components/SafeIntlProvider';
import ClientPage from './ClientPage';

export default function ChatPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const t = getTSync(locale, 'chat');
  const messages = getMessagesSync(locale, 'chat');

  return (
    <section className="py-10 mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold mb-6">{t('chat.title')}</h1>
      <SafeIntlProvider locale={locale} messages={messages}>
        <ClientPage />
      </SafeIntlProvider>
    </section>
  );
}
