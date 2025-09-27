'use client';

import {NextIntlClientProvider} from 'next-intl';
import type {AbstractIntlMessages} from 'next-intl';

export default function IntlProvider({
  locale,
  messages,
  children
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={() => {}}                 // глушим throw при MISSING_MESSAGE в проде
      getMessageFallback={({key}) => key} // показываем ключ, если перевода нет
    >
      {children}
    </NextIntlClientProvider>
  );
}
