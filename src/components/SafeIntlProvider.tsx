'use client';

import {NextIntlClientProvider} from 'next-intl';

export default function SafeIntlProvider({
  children,
  locale,
  messages
}: {
  children: React.ReactNode;
  locale: string;
  messages: any;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={() => {}}
      getMessageFallback={({key}) => key}
    >
      {children}
    </NextIntlClientProvider>
  );
}
