// src/app/[locale]/layout.tsx
import '../globals.css';
import type {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessagesSync} from '@/i18n';
import type {Locale} from '@/i18n';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function RootLayout({children, params: {locale}}: Props) {
  // Берём наши JSON-сообщения синхронно (а не через next-intl/server)
  const messages = getMessagesSync(locale);

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          // Не валим рендер, если какого-то ключа нет:
          onError={() => {}}
          getMessageFallback={({key}) => key}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
