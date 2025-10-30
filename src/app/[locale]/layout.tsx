// src/app/[locale]/layout.tsx
import '../globals.css';
import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getLocale} from 'next-intl/server';

type Props = {children: ReactNode; params: {locale: string}};

export default async function RootLayout({children, params: {locale}}: Props) {
  await getLocale();             // фиксируем locale из middleware
  const messages = await getMessages(); // плоские ключи без namespace

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          onError={() => {}}
          getMessageFallback={({key}) => key}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
